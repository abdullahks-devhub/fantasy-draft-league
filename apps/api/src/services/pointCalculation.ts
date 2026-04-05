import prisma from '../lib/db';
import { Match, MatchParticipant, PointRule, RosterSlot, PlayerSeason, Wrestler } from '@prisma/client';

export class PointCalculationService {
  /**
   * Calculates points for a specific player for the given matches in a week.
   */
  async calculatePlayerPoints(playerSeasonId: string, weekNumber: number, matches: (Match & { participants: MatchParticipant[], show: any })[]) {
    // 1. Get active roster slots with their wrestlers
    const activeSlots = await prisma.rosterSlot.findMany({
      where: { playerSeasonId, status: 'ACTIVE' },
      include: { wrestlers: true }
    }) as any[];

    // 2. Get season rules
    const season = await prisma.playerSeason.findUnique({
      where: { id: playerSeasonId },
      select: { seasonId: true }
    });
    if (!season) return;

    const rules = await prisma.pointRule.findMany({
      where: { seasonId: season.seasonId }
    });

    let totalPoints = 0;
    const pointsBreakdown: any[] = [];

    // 3. Iterate over matches 
    for (const match of matches) {
      // For each match, we check which roster slots were "involved"
      for (const slot of activeSlots) {
        const wrestlerIdsInSlot = slot.wrestlers.map((w: any) => w.id);
        
        // Find which participants in this match are in this specific roster slot
        const slotParticipants = match.participants.filter(p => wrestlerIdsInSlot.includes(p.wrestlerId));
        
        if (slotParticipants.length > 0) {
          // Rule evaluation: A slot earns points once based on its "best" participant or generic match rules
          // We pick the primary participant (e.g. winner or just the first one if it's an appearance rule)
          const primaryParticipant = slotParticipants.find(p => p.result === 'WIN') || slotParticipants[0];
          
          let slotMatchPoints = 0;
          let matchSpecificBreakdown: any[] = [];

          for (const rule of rules) {
            let ruleMatches = true;

            // 1. Show Type
            if (rule.showType && rule.showType !== match.show.showType) ruleMatches = false;

            // 2. Match Type
            if (rule.matchType && rule.matchType !== match.matchType) ruleMatches = false;

            // 3. Result
            if (rule.result && rule.result !== primaryParticipant.result) ruleMatches = false;

            // 4. Main Event
            if (rule.isMainEvent !== null && rule.isMainEvent !== match.isMainEvent) ruleMatches = false;

            // 5. Tournament
            if (rule.isTournament !== null && rule.isTournament !== (match as any).isTournament) ruleMatches = false;
            if (rule.isFinals !== null && rule.isFinals !== (match as any).isFinals) ruleMatches = false;
            if (rule.tournamentName && rule.tournamentName !== (match as any).tournamentName) ruleMatches = false;

            // 6. Title / World Title / Defense
            if (rule.isTitleMatch !== null && rule.isTitleMatch !== (primaryParticipant as any).isTitleMatch) ruleMatches = false;
            if (rule.isWorldTitle !== null && rule.isWorldTitle !== (primaryParticipant as any).isWorldTitle) ruleMatches = false;
            if (rule.isDefense !== null && rule.isDefense !== (primaryParticipant as any).isDefense) ruleMatches = false;

            if (ruleMatches) {
              slotMatchPoints += rule.points;
              matchSpecificBreakdown.push({
                ruleId: rule.id,
                points: rule.points,
                description: `${rule.showType || ''} ${rule.matchType || ''} ${rule.isMainEvent ? 'Main Event' : ''} ${rule.isFinals ? 'Finals' : ''} ${rule.result || 'Appearance'}`.trim()
              });
            }
          }

          if (slotMatchPoints > 0) {
            totalPoints += slotMatchPoints;
            pointsBreakdown.push({
              matchId: match.id,
              slotId: slot.id,
              wrestlers: wrestlerIdsInSlot,
              points: slotMatchPoints,
              details: matchSpecificBreakdown
            });
          }
        }
      }
    }

    // 4. Save to DB
    await prisma.playerPoint.upsert({
      where: {
        playerSeasonId_weekNumber: {
          playerSeasonId,
          weekNumber
        }
      },
      update: {
        points: totalPoints,
        pointsBreakdown: pointsBreakdown as any
      },
      create: {
        playerSeasonId,
        weekNumber,
        points: totalPoints,
        pointsBreakdown: pointsBreakdown as any
      }
    });

    return totalPoints;
  }
}
