// For more information, see https://crawlee.dev/
import { PlaywrightCrawler } from 'crawlee';
// import { getSingleWordObject } from './utils.js';
import { test } from './utils.js';

// PlaywrightCrawler crawls the web using a headless
// browser controlled by the Playwright library.
const crawler = new PlaywrightCrawler({

    // Stop crawling after several pages
    maxRequestsPerCrawl: 1,

    // Use the requestHandler to process each of the crawled pages.
    async requestHandler({ request, page, enqueueLinks, log, pushData }) {
        const title = await page.title();
        log.info(`Title of ${request.loadedUrl} is '${title}'`);


        // A function to be evaluated by Playwright within the browser context.
        const data = await page.$$eval('.vTbl', ($posts) => {
            const scrapedData: { tense: string, conjugations: any}[] = [];

            // We're getting the title, rank and URL of each post on Hacker News.
            $posts.forEach(async ($post) => {

                const elsConjugations = $post.querySelectorAll('tr') as NodeListOf<HTMLElement>
                let objConjugations: object[] = []

                elsConjugations.forEach((elTr)=> {
                    const numColumns = elTr.childElementCount
                    const elConj: HTMLElement = elTr.lastElementChild?.firstElementChild as HTMLElement

                    // Verb conj is only one word: ex: "trinken"
                    if (numColumns === 2) objConjugations.push({
                        person: elTr.firstElementChild?.innerHTML || '',
                        conjugation: (elConj as HTMLElement).innerText,
                        conjugationHTML: (elConj as HTMLElement).innerHTML,
                    })
                })

                scrapedData.push({
                    tense: ($post.querySelector('h2') as HTMLElement).innerText || '',
                    conjugations: objConjugations
                });
            });

            return scrapedData;
        });

        // Save results as JSON to ./storage/datasets/default
        await pushData({ title, url: request.loadedUrl, datapage: data });

        // Extract links from the current page
        // and add them to the crawling queue.
        await enqueueLinks();
    },
    // Uncomment this option to see the browser window.
    // headless: false,
});

await crawler.addRequests(['https://www.verbformen.de/konjugation/sein.htm']);
await crawler.addRequests(['https://www.verbformen.de/konjugation/trinken.htm']);

// Add first URL to the queue and start the crawl.
await crawler.run();


