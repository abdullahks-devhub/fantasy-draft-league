import * as cheerio from 'cheerio';
import axios from 'axios';
import Fuse from 'fuse.js';
import prisma from '../lib/db';

export class CagematchService {
  private baseUrl = 'https://www.cagematch.net';

  /**
   * Scrapes recent shows based on the TV/PPV requirements.
   * If passing mockHtml, it skips the network request (used for tests/bypassing IP blocks).
   */
  async scrapeRecentShows(mockHtml?: string) {
    let html = mockHtml;
    
    // Fallback to real network request if mock is not provided
    if (!html) {
      // In reality, this would hit the advanced search page for the last 7 days.
      // We are stubbing the live URL request for now to prevent bans.
      const res = await axios.get(`${this.baseUrl}/?id=1`); 
      html = res.data as string;
    }

    const $ = cheerio.load(html);
    const shows: any[] = [];

    // Hypothetical standard Cagematch parse logic:
    // Every cagematch table row with class 'TRRow' represents an entity
    $('.TRRow').each((i, el) => {
      const showName = $(el).find('.TCol').eq(1).text().trim();
      const dateStr = $(el).find('.TCol').eq(0).text().trim();
      const promotion = $(el).find('.TCol').eq(2).text().trim();

      if (showName) {
        shows.push({
          name: showName,
          date: new Date(dateStr),
          promotion,
          // Extract more data logic...
        });
      }
    });

    return shows;
  }

  /**
   * Simulate parsing match results for a given show string
   */
  async parseMatchesForShow(showHtml: string) {
    const $ = cheerio.load(showHtml);
    const matches: any[] = [];

    $('.Match').each((i, el) => {
      const matchText = $(el).text();
      // logic determining win/loss, participants from text...
    });

    return matches;
  }

  async fuzzyMatchWrestler(rawName: string) {
    // 1. Check exact alias matches
    const aliasMatch = await prisma.wrestlerAlias.findFirst({
      where: { alias: rawName },
      include: { wrestler: true }
    });
    if (aliasMatch) return aliasMatch.wrestler;

    // 2. Load all active wrestlers
    const wrestlers = await prisma.wrestler.findMany({ select: { id: true, name: true } });
    
    // 3. Fuse search
    const fuse = new Fuse(wrestlers, { keys: ['name'], threshold: 0.3 });
    const result = fuse.search(rawName);
    
    if (result.length > 0) {
      return result[0].item;
    }
    
    return null; // Not found
  }
}
