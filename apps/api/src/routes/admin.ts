import { FastifyInstance } from 'fastify';
import prisma from '../lib/db';
import { CagematchService } from '../services/cagematch';
import { PointCalculationService } from '../services/pointCalculation';

export async function adminRoutes(fastify: FastifyInstance) {
  const cagematchService = new CagematchService();
  const pointCalcService = new PointCalculationService();

  /**
   * POST /admin/trigger-scraper
   * Triggers the scraper and calculations for the current week.
   */
  fastify.post('/trigger-scraper', async (request, reply) => {
    try {
      const activeSeason = await prisma.season.findFirst({ where: { isActive: true } });
      if (!activeSeason) return reply.code(404).send({ error: 'No active season' });

      // Trigger GitHub Action to run the scraper via workflow_dispatch
      const GITHUB_TOKEN = process.env.GH_PAT;
      const GITHUB_REPO = 'abdullahks-devhub/fantasy-draft-league'; 
      
      if (!GITHUB_TOKEN) {
         return reply.code(500).send({ error: 'GitHub Personal Access Token (GH_PAT) is missing. Cannot trigger scraper.' });
      }

      const axios = require('axios');
      await axios.post(
        `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/scraper.yml/dispatches`,
        { ref: 'main' },
        {
          headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      return { success: true, message: `Scraping process initiated via GitHub Actions successfully.` };
    } catch (err: any) {
      console.error('Failed to trigger scraper:', err.message);
      return reply.code(500).send({ error: 'Failed to trigger remote scraper.' });
    }
  });

  /**
   * POST /admin/force-roster-move
   * Add or drop a wrestler from a player's roster.
   */
  fastify.post<{ Body: { playerSeasonId: string, wrestlerId: string, action: 'ADD' | 'DROP' } }>('/force-roster-move', async (request, reply) => {
    const { playerSeasonId, wrestlerId, action } = request.body;

    if (action === 'ADD') {
      const existing = await prisma.rosterSlot.findFirst({ 
        where: { 
          playerSeasonId, 
          wrestlers: { some: { id: wrestlerId } } 
        } 
      });
      if (existing) return reply.code(400).send({ error: 'Wrestler already on roster' });

      const newSlot = await prisma.rosterSlot.create({
        data: { 
          playerSeasonId, 
          status: 'ACTIVE',
          wrestlers: { connect: { id: wrestlerId } }
        }
      });
      return { success: true, slot: newSlot };
    } else {
      const existing = await prisma.rosterSlot.findFirst({ 
        where: { 
          playerSeasonId, 
          wrestlers: { some: { id: wrestlerId } } 
        } 
      });
      if (!existing) return reply.code(400).send({ error: 'Wrestler not on roster' });

      await prisma.rosterSlot.delete({ where: { id: existing.id } });
      return { success: true, message: 'Wrestler removed' };
    }
  });

  /**
   * POST /admin/merge-units
   * Combines multiple wrestlers (from different slots) into a single slot (Unit).
   */
  fastify.post<{ Body: { playerSeasonId: string, wrestlerIds: string[] } }>('/merge-units', async (request, reply) => {
    const { playerSeasonId, wrestlerIds } = request.body;

    return await prisma.$transaction(async (tx) => {
       // 1. Find and delete existing slots for these wrestlers
       for (const id of wrestlerIds) {
         const slot = await tx.rosterSlot.findFirst({
           where: { playerSeasonId, wrestlers: { some: { id } } }
         });
         if (slot) {
           await tx.rosterSlot.delete({ where: { id: slot.id } });
         }
       }

       // 2. Create the new combined slot
       const newSlot = await tx.rosterSlot.create({
         data: {
           playerSeasonId,
           status: 'ACTIVE',
           wrestlers: { connect: wrestlerIds.map(id => ({ id })) }
         }
       });

       return { success: true, slot: newSlot };
    });
  });

  /**
   * POST /admin/split-units
   * Breaks a multi-wrestler slot into separate individual slots.
   */
  fastify.post<{ Body: { rosterSlotId: string } }>('/split-units', async (request, reply) => {
    const { rosterSlotId } = request.body;

    return await prisma.$transaction(async (tx) => {
       const slot = await tx.rosterSlot.findUnique({
         where: { id: rosterSlotId },
         include: { wrestlers: true }
       });
       if (!slot || slot.wrestlers.length <= 1) {
         return reply.code(400).send({ error: 'Slot not found or is already a single.' });
       }

       // 1. Delete the unit slot
       await tx.rosterSlot.delete({ where: { id: rosterSlotId } });

       // 2. Create individual slots for each member
       const newSlots = [];
       for (const w of slot.wrestlers) {
         const s = await tx.rosterSlot.create({
           data: {
             playerSeasonId: slot.playerSeasonId,
             status: slot.status,
             wrestlers: { connect: { id: w.id } }
           }
         });
         newSlots.push(s);
       }

       return { success: true, count: newSlots.length };
    });
  });

  /**
   * POST /admin/execute-trade
   * Execute a trade between players. 
   */
  fastify.post<{ Body: { 
    fromPlayerSeasonId: string, 
    toPlayerSeasonId: string, 
    wrestlerIdsOut: string[], 
    wrestlerIdsIn: string[] 
  } }>('/execute-trade', async (request, reply) => {
    const { fromPlayerSeasonId, toPlayerSeasonId, wrestlerIdsOut, wrestlerIdsIn } = request.body;

    await prisma.$transaction(async (tx) => {
      for (const id of wrestlerIdsOut) {
        const slot = await tx.rosterSlot.findFirst({ 
          where: { playerSeasonId: fromPlayerSeasonId, wrestlers: { some: { id } } } 
        });
        if (slot) {
          await tx.rosterSlot.update({ where: { id: slot.id }, data: { playerSeasonId: toPlayerSeasonId } });
        }
      }

      for (const id of wrestlerIdsIn) {
        const slot = await tx.rosterSlot.findFirst({ 
          where: { playerSeasonId: toPlayerSeasonId, wrestlers: { some: { id } } } 
        });
        if (slot) {
          await tx.rosterSlot.update({ where: { id: slot.id }, data: { playerSeasonId: fromPlayerSeasonId } });
        }
      }

      await tx.trade.create({
        data: {
          data: {
            fromPlayerSeasonId,
            toPlayerSeasonId,
            wrestlerIdsOut,
            wrestlerIdsIn,
          },
          executedAt: new Date()
        }
      });
    });

    return { success: true };
  });

  // 3. Bulk Draft Entry
  fastify.post<{ Body: { assignments: { playerSeasonId: string, wrestlerId: string }[] } }>('/draft', async (request, reply) => {
    const { assignments } = request.body;

    if (!assignments || !Array.isArray(assignments)) {
      return reply.code(400).send({ error: 'Invalid assignments format' });
    }

    try {
      const results = await prisma.$transaction(
        assignments.map(a => prisma.rosterSlot.create({
          data: {
            playerSeasonId: a.playerSeasonId,
            status: 'ACTIVE',
            wrestlers: { connect: { id: a.wrestlerId } }
          }
        }))
      );

      return { message: `Successfully assigned ${results.length} wrestlers.`, count: results.length };
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  });
}
