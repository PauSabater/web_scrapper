// For more information, see https://crawlee.dev/
import { PlaywrightCrawler } from 'crawlee';
// import { getSingleWordObject } from './utils.js';
import { test } from './utils.js';

interface IVerbConjugation {
    isNull?: boolean,
    auxiliar?: string,
    verb?: string,
    ending?: string,
    person?: string,
    conjugation?: string,
    conjugationHTML?: string
}

// PlaywrightCrawler crawls the web using a headless
// browser controlled by the Playwright library.
const crawler = new PlaywrightCrawler({

    // Stop crawling after several pages
    maxRequestsPerCrawl: 1,

    // Use the requestHandler to process each of the crawled pages.
    async requestHandler({ request, page, enqueueLinks, log, pushData }) {

        // EVALUATE ARTICLE
        const dataIndicativeForm = await page.$eval('article', (article) => {

            // Gets the properties from a verb html element:
            const getVerbProperties = (elTr: HTMLElement): IVerbConjugation => {
                // const elConj: HTMLElement = elTr.lastElementChild?.firstElementChild as HTMLElement
                const elsCols: HTMLTableCellElement[] = Array.from(elTr.querySelectorAll("td"))
                const numCols: number = elsCols.length
                const person = elsCols[0].innerHTML.trim() || ''

                if (numCols === 2) return {
                    person: person,
                    auxiliar: '',
                    verb: elsCols[1].innerText || '',
                    ending: '',
                    conjugation: elsCols[1].innerText || '',
                    conjugationHTML: elsCols[1].innerHTML || ''
                }

                if (numCols === 3) return {
                    person: person,
                    auxiliar: elsCols[1].innerText || '',
                    verb: elsCols[2].innerText || '',
                    ending: '',
                    conjugation: `${elsCols[1].innerText || ''} ${elsCols[2].innerText || ''}`,
                    conjugationHTML: `${elsCols[1].innerHTML || ''} ${elsCols[2].innerHTML || ''}`
                }

                if (numCols === 4) return {
                    person: person,
                    auxiliar: elsCols[1].innerText || '',
                    verb: elsCols[2].innerText || '',
                    ending: elsCols[3].innerText || '',
                    conjugation: `${elsCols[1].innerText || ''} ${elsCols[2].innerText || ''} ${elsCols[3].innerText || ''}`,
                    conjugationHTML: `${elsCols[1].innerHTML || ''} ${elsCols[2].innerHTML || ''} ${elsCols[3].innerHTML || ''}`
                }

                return {isNull: true}
            }

            // -------------  SECTION INDICATIVE
            const elSectionStandard = article.querySelectorAll(".rBox .rBoxWht ")[1]
            const elSectionIndicative = article.querySelector("#indikativ + section") as HTMLElement
            const elSectionConjunctive = article.querySelector("#konjunktiv + section") as HTMLElement
            const elSectionConditional = article.querySelector("#konditional + section") as HTMLElement
            const elSectionImperative = article.querySelector("#imperativ + section") as HTMLElement
            const elsSections = [elSectionIndicative, elSectionConjunctive, elSectionConditional, elSectionImperative]

            let completeData: any = {}

            for (const [index, elSection] of elsSections.entries()) {
                let scrapedFormData: {nonExistent?: boolean, tense?: string, conjugations?: any}[] = []

                // Case if form does not exist, ie with Conjunctive on verb "sein"
                if (elSection === null) {
                    {scrapedFormData.push({nonExistent: true})}
                    continue
                }

                const elsTables = Array.from(elSection.querySelectorAll(".vTbl"))

                for (const elTable of elsTables) {
                    const elsConjugations = elTable.querySelectorAll('tr') as NodeListOf<HTMLElement>
                    let objConjugations: IVerbConjugation[] = []
                    elsConjugations.forEach((elTr)=> objConjugations.push(getVerbProperties(elTr)))

                    scrapedFormData.push({
                        tense: (elTable.querySelector('h3') as HTMLElement).innerText || '',
                        conjugations: objConjugations
                    })
                }

                const formName = index === 0 ? "indicative"
                    : index === 1 ? "conjunctive"
                    : index === 2 ? "conditionalOrConjunctiveII" : "imperative"

                completeData[formName] = scrapedFormData
            }

            return completeData
        });


        // Save results as JSON to ./storage/datasets/default
        await pushData({
            url: request.loadedUrl,
            forms: {dataIndicativeForm}}
        )

        // Extract links from the current page
        // and add them to the crawling queue.
        await enqueueLinks();
    },
    // Uncomment this option to see the browser window.
    // headless: false,
});

// await crawler.addRequests(['https://www.verbformen.de/konjugation/sein.htm']);
await crawler.addRequests(['https://www.verbformen.de/konjugation/trinken.htm']);

// Add first URL to the queue and start the crawl.
await crawler.run();


