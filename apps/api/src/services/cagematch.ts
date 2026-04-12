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
    const { chromium } = require('playwright');
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    });

    try {
      if (!html) {
        const page = await context.newPage();
        await page.goto(`${this.baseUrl}/?id=1&view=results`, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(2000); 
        html = await page.content();
        await page.close();
      }

      const $ = cheerio.load(html || '');
      const shows: any[] = [];

      // Parse the advanced results page containing recent shows
      const showRows = $('.TRRow').toArray();
      for (const el of showRows) {
        const nameCol = $(el).find('.TCol').eq(2);
        const showName = nameCol.text().trim();
        const showHref = nameCol.find('a').attr('href');
        const dateStr = $(el).find('.TCol').eq(1).text().trim();
        const promotion = $(el).find('.TCol').eq(3).text().trim();

        if (showName && showHref) {
          const showDate = new Date(dateStr.split('.').reverse().join('-'));
          
          // Drill down into the specific show page
          const showPage = await context.newPage();
          await showPage.goto(`${this.baseUrl}/${showHref}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
          const showHtml = await showPage.content();
          const matches = await this.parseMatchesForShow(showHtml);
          await showPage.close();

          const dbShow = await this.saveShowAndMatches(showName, showDate, promotion, matches);
          shows.push(dbShow);
        }
      }

      return shows;
    } catch (err: any) {
      console.error('Scraping error:', err.message);
      throw err;
    } finally {
      await browser.close();
    }
  }

  async parseMatchesForShow(showHtml: string) {
    const $ = cheerio.load(showHtml);
    const matches: any[] = [];

    $('.Match').each((i, el) => {
      const matchText = $(el).text().trim();
      const isMainEvent = $(el).prevAll('.MatchHeader').length === $('.MatchHeader').length - 1; // Simplistic main event check
      
      let resultType: 'WIN' | 'DRAW' | 'NO_CONTEST' = 'WIN';
      let winnersRaw: string[] = [];
      let losersRaw: string[] = [];
      let drawersRaw: string[] = [];

      // Basic regex for winner/loser extraction
      if (matchText.includes(' defeats ')) {
        const parts = matchText.split(' defeats ');
        winnersRaw = [parts[0].trim()];
        losersRaw = [parts[1].split(' (')[0].trim()];
        resultType = 'WIN';
      } else if (matchText.includes(' defeat ')) {
        const parts = matchText.split(' defeat ');
        winnersRaw = parts[0].split(' & ').map(s => s.trim());
        losersRaw = parts[1].split(' (')[0].split(' & ').map(s => s.trim());
        resultType = 'WIN';
      } else if (matchText.includes(' d. ')) {
        const parts = matchText.split(' d. ');
        winnersRaw = [parts[0].trim()];
        losersRaw = [parts[1].split(' (')[0].trim()];
        resultType = 'WIN';
      } else if (matchText.includes(' draw ')) {
        drawersRaw = matchText.split(' (')[0].split(' vs. ').flatMap(s => s.split(' & ')).map(s => s.trim());
        resultType = 'DRAW';
      } else if (matchText.includes(' vs. ')) {
        // Unfinished or skipped
        return;
      }

      // Metadata detections
      const isTitleMatch = matchText.includes('Title') || matchText.includes('Championship');
      const isWorldTitle = matchText.includes('World') && isTitleMatch;

      matches.push({
        matchType: matchText.includes('&') ? 'Tag Team' : 'Singles',
        isMainEvent,
        resultType,
        isTitleMatch,
        isWorldTitle,
        winners: winnersRaw,
        losers: losersRaw,
        drawers: drawersRaw,
        rawText: matchText
      });
    });

    return matches;
  }

  private async saveShowAndMatches(name: string, date: Date, promotion: string, matches: any[]) {
    // Detect promotion from show name if not obvious
    const detectedPromotion = promotion || this.detectPromotion(name);

    // 1. Create Show (cast to any to allow compound unique key before client regeneration)
    const show = await (prisma.show as any).upsert({
      where: { 
        name_date: { name, date } 
      },
      update: { promotion: detectedPromotion },
      create: { 
        name, 
        date, 
        promotion: detectedPromotion,
        showType: this.detectShowType(name)
      }
    });

    // 2. Create Matches
    for (const m of matches) {
      const dbMatch = await (prisma.match as any).create({
        data: {
          showId: show.id,
          matchType: m.matchType,
          isMainEvent: m.isMainEvent,
          isTournament: false,
          resultType: m.resultType,
        }
      });

      // Map Participants and update wrestler promotion
      const processParticipants = async (names: string[], result: any) => {
        for (const rawName of names) {
          const wrestler = await this.fuzzyMatchWrestler(rawName);
          if (wrestler) {
            // Auto-update the wrestler's promotion based on the show they appeared in
            if (detectedPromotion && detectedPromotion !== 'Independent') {
              await (prisma.wrestler as any).update({
                where: { id: wrestler.id },
                data: { promotion: detectedPromotion, active: true }
              });
            }
            await prisma.matchParticipant.create({
              data: {
                matchId: dbMatch.id,
                wrestlerId: wrestler.id,
                result,
                isTitleMatch: m.isTitleMatch,
                isWorldTitle: m.isWorldTitle
              }
            });
          }
        }
      };

      await processParticipants(m.winners, 'WIN');
      await processParticipants(m.losers, 'LOSS');
      await processParticipants(m.drawers, 'DRAW');
    }

    return show;
  }

  private detectPromotion(showName: string): string {
    const name = showName.toLowerCase();
    if (name.includes('wwe') || name.includes('raw') || name.includes('smackdown') || name.includes('nxt')) return 'WWE';
    if (name.includes('aew') || name.includes('dynamite') || name.includes('collision') || name.includes('rampage')) return 'AEW';
    if (name.includes('tna') || name.includes('impact')) return 'TNA';
    if (name.includes('roh') || name.includes('ring of honor')) return 'ROH';
    if (name.includes('njpw') || name.includes('new japan')) return 'NJPW';
    if (name.includes('wwe') && name.includes('nxt')) return 'NXT';
    return 'Independent';
  }

  private detectShowType(showName: string): string {
    const name = showName.toLowerCase();
    if (
      name.includes('wrestlemania') || name.includes('summerslam') || name.includes('royal rumble') ||
      name.includes('survivor series') || name.includes('all in') || name.includes('all out') ||
      name.includes('double or nothing') || name.includes('dynasty') || name.includes('forbidden door') ||
      name.includes('payback') || name.includes('backlash') || name.includes('elimination chamber') ||
      name.includes('night of champions') || name.includes('clash')
    ) return 'PPV';
    return 'TV';
  }
  async fuzzyMatchWrestler(rawName: string) {
    const cleanName = rawName.split(' [')[0].split(' (')[0].trim();
    
    // 1. Check exact alias matches
    const aliasMatch = await prisma.wrestlerAlias.findFirst({
      where: { alias: cleanName },
      include: { wrestler: true }
    });
    if (aliasMatch) return aliasMatch.wrestler;

    // 2. Load all wrestlers
    const wrestlers = await prisma.wrestler.findMany({ select: { id: true, name: true } });
    
    // 3. Fuse search
    const fuse = new Fuse(wrestlers, { keys: ['name'], threshold: 0.3 });
    const result = fuse.search(cleanName);
    
    if (result.length > 0) {
      return result[0].item;
    }
    
    return null; // Not found
  }
}
