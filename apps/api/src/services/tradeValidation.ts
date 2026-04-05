import prisma from '../lib/db';

export class TradeValidationService {
  /**
   * Validates if a proposed trade meets all season constraints.
   */
  async validateTrade(fromPlayerSeasonId: string, toPlayerSeasonId: string, wrestlerOutId: string, wrestlerInId: string) {
    // 1. Fetch current rosters
    const fromRoster = await prisma.rosterSlot.findMany({
      where: { playerSeasonId: fromPlayerSeasonId },
      include: { wrestlers: true }
    });

    const toRoster = await prisma.rosterSlot.findMany({
      where: { playerSeasonId: toPlayerSeasonId },
      include: { wrestlers: true }
    });

    // 2. Ownership verification
    const fromOwns = fromRoster.find((r: any) => r.wrestlers.some((w: any) => w.id === wrestlerOutId));
    const toOwns = toRoster.find((r: any) => r.wrestlers.some((w: any) => w.id === wrestlerInId));

    if (!fromOwns || !toOwns) {
      return { valid: false, reason: 'One or both players do not own the requested wrestlers.' };
    }

    // 3. IR Check
    if (fromOwns.status === 'IR' || toOwns.status === 'IR') {
      return { valid: false, reason: 'Cannot trade wrestlers currently in IR status.' };
    }

    // 4. Predict new rosters
    const predictedFrom = fromRoster.filter((r: any) => !r.wrestlers.some((w: any) => w.id === wrestlerOutId));
    predictedFrom.push({ ...toOwns, playerSeasonId: fromPlayerSeasonId } as any);

    const predictedTo = toRoster.filter((r: any) => !r.wrestlers.some((w: any) => w.id === wrestlerInId));
    predictedTo.push({ ...fromOwns, playerSeasonId: toPlayerSeasonId } as any);

    // 5. Check constraints (< 15 roster size) is naturally preserved by 1-for-1 swaps, but we verify anyway...
    const activeBenchFrom = predictedFrom.filter(r => r.status !== 'IR').length;
    const activeBenchTo = predictedTo.filter(r => r.status !== 'IR').length;
    
    if (activeBenchFrom > 15 || activeBenchTo > 15) {
      return { valid: false, reason: 'Trade violates maximum roster size of 15.' };
    }

    // 6. Tag Team Rules check
    if (!this.checkTagTeamLimits(predictedFrom) || !this.checkTagTeamLimits(predictedTo)) {
      return { valid: false, reason: 'Trade results in more than 3 tag teams on a single roster.' };
    }

    return { valid: true };
  }

  private checkTagTeamLimits(roster: any[]): boolean {
    // We group wrestlers by their currentTeam string
    const teams = new Map<string, number>();
    for (const slot of roster) {
      if (!slot.wrestlers) continue;
      for (const w of slot.wrestlers) {
        const teamName = w.currentTeam;
        if (teamName) {
          teams.set(teamName, (teams.get(teamName) || 0) + 1);
        }
      }
    }

    // Count how many teams have >= 2 members
    let multiMemberTeams = 0;
    for (const count of teams.values()) {
      if (count >= 2) multiMemberTeams++;
    }

    return multiMemberTeams <= 3;
  }
}
