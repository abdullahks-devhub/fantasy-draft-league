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
    
    if (!html) {
      const { chromium } = require('playwright');
      const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      });
      const page = await context.newPage();
      
      try {
        await page.goto(`${this.baseUrl}/?id=1&view=results`, { waitUntil: 'domcontentloaded', timeout: 30000 });
        // Give time for any potential cloudflare redirection or simple table load
        await page.waitForTimeout(2000); 
        html = await page.content();
      } catch (err: any) {
        console.error('Playwright navigation failed:', err.message);
        throw err;
      } finally {
        await browser.close();
      }
    }

    const $ = cheerio.load(html || '');
    const shows: any[] = [];

    // Parse the advanced results page containing recent shows
    $('.TRRow').each((i, el) => {
      // In the advanced results view, indices might differ from the homepage
      const nameCol = $(el).find('.TCol').eq(2);
      const showName = nameCol.text().trim();
      
      // Link to the specific show results: ?id=1&nr=12345
      const showHref = nameCol.find('a').attr('href');
      
      const dateStr = $(el).find('.TCol').eq(1).text().trim();
      const promotion = $(el).find('.TCol').eq(3).text().trim();

      if (showName && showHref) {
        shows.push({
          name: showName,
          date: new Date(dateStr.split('.').reverse().join('-')), // simple format parser often needed for EU dates
          promotion,
          urlRef: showHref
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
