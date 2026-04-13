import prisma from '../lib/db';
import { WaiverAction, WaiverMove, RosterStatus } from '@prisma/client';

export class WaiverService {
  /**
   * Processes all pending waivers for a given season, resolving conflicts based on current standings.
   * Standings-based priority: Last place (lowest points) gets 1st priority.
   */
  async processWeeklyWaivers(seasonId: string) {
    // 1. Fetch all pending waiver moves for this season
    const pendingMoves = await prisma.waiverMove.findMany({
      where: {
        status: 'PENDING',
        playerSeason: { seasonId }
      },
      include: { 
        playerSeason: {
          include: {
            rosterSlots: {
              include: { wrestlers: true }
            }
          }
        } 
      }
    });

    if (pendingMoves.length === 0) return { processed: 0, approvals: 0, denials: 0 };

    // 2. Determine standings (Total points per playerSeason)
    const pointsData = await prisma.playerPoint.groupBy({
      by: ['playerSeasonId'],
      _sum: { points: true },
      where: { playerSeason: { seasonId } }
    });

    const standingMap = new Map<string, number>();
    for (const data of pointsData) {
      standingMap.set(data.playerSeasonId, data._sum.points || 0);
    }

    // 3. Sort moves based on Waiver Order (Reverse Standings) and then Move Priority
    // If Points A < Points B, A has HIGHER priority (comes first in list)
    pendingMoves.sort((a: any, b: any) => {
      const pointsA = standingMap.get(a.playerSeasonId) || 0;
      const pointsB = standingMap.get(b.playerSeasonId) || 0;

      if (pointsA !== pointsB) {
        return pointsA - pointsB; // Lowest points first
      }
      
      // Secondary: User specifies priority (1, 2, 3...)
      return a.priority - b.priority;
    });

    let approvals = 0;
    let denials = 0;

    // 4. Process moves serially to handle conflicts (e.g. 2 players want same wrestler)
    for (const move of pendingMoves) {
      await prisma.$transaction(async (tx: any) => {
        // Re-check current roster state for this player in this transaction
        const currentRoster = await tx.rosterSlot.findMany({
          where: { playerSeasonId: move.playerSeasonId },
          include: { wrestlers: true }
        });

        const activeBenchCount = currentRoster.filter((s: any) => s.status !== 'IR').length;
        const irCount = currentRoster.filter((s: any) => s.status === 'IR').length;

        if (move.action === 'ADD') {
          // A. Conflict Check: Is the wrestler still available?
          const isTaken = await tx.rosterSlot.findFirst({
            where: {
              playerSeason: { seasonId },
              wrestlers: { some: { id: move.wrestlerId } }
            }
          });

          if (isTaken) {
            await tx.waiverMove.update({
              where: { id: move.id },
              data: { status: 'DENIED', reason: 'Wrestler already claimed by higher priority player.' }
            });
            denials++;
            return;
          }

          // B. Roster Limit Check (15 active/bench)
          if (activeBenchCount >= 15) {
            await tx.waiverMove.update({
              where: { id: move.id },
              data: { status: 'DENIED', reason: 'Roster full (15/15). Must drop a player to add.' }
            });
            denials++;
            return;
          }

          // C. Success
          await tx.rosterSlot.create({
            data: {
              playerSeasonId: move.playerSeasonId,
              status: 'ACTIVE',
              wrestlers: { connect: { id: move.wrestlerId } }
            }
          });
          await tx.waiverMove.update({
            where: { id: move.id },
            data: { status: 'APPROVED' }
          });
          approvals++;
        } 
        else if (move.action === 'DROP') {
          // Check ownership
          const slot = currentRoster.find((s: any) => s.wrestlers.some((w: any) => w.id === move.wrestlerId));
          
          if (!slot) {
            await tx.waiverMove.update({
              where: { id: move.id },
              data: { status: 'DENIED', reason: 'Wrestler not on roster.' }
            });
            denials++;
            return;
          }

          if (slot.status === 'IR') {
            await tx.waiverMove.update({
              where: { id: move.id },
              data: { status: 'DENIED', reason: 'Cannot drop wrestler while in IR status.' }
            });
            denials++;
            return;
          }

          // Execute drop
          // If it was a multi-man slot (Tag Team unit), we need to decide if they drop INDIVIDUALLY.
          // Spec says: "Drop the tag team = frees up 1 slot". 
          // So if they are in a slot together, we drop the whole slot.
          await tx.rosterSlot.delete({
            where: { id: slot.id }
          });
          await tx.waiverMove.update({
            where: { id: move.id },
            data: { status: 'APPROVED' }
          });
          approvals++;
        }
      });
    }
    
    return {
      processed: pendingMoves.length,
      approvals,
      denials
    };
  }
}
