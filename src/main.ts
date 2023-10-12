import { PlaywrightCrawler } from 'crawlee'
import { verbsList } from '../list.js'

interface IVerbConjugation {
    isNull?: boolean,
    person?: string,
    conjugation?: string,
    conjugationHTML?: string
}

// Initiate PlaywrightCrawler class
const crawler = new PlaywrightCrawler({

    // Only need one page, the corresponding from the page
    maxRequestsPerCrawl: 1,

    // Use the requestHandler to process each of the crawled pages.
    async requestHandler({ request, page, enqueueLinks, log, pushData }) {

        // EVALUATE ARTICLE
        const dataIndicativeForm = await page.$eval('article', (article) => {

            // Cleans and checks string for verbs data
            const cleanStr = (str: string)=> {
                return str ? str.replace("⁵", "&#42;").trim() : ''
            }

            // Gets the properties from a verb html element:
            const getVerbProperties = (elTr: HTMLElement, isImperative: boolean): IVerbConjugation => {
                const elsCols: HTMLTableCellElement[] = Array.from(elTr.querySelectorAll("td"))
                const numCols: number = elsCols.length
                const person = elsCols[!isImperative ? 0 : 1].innerHTML.trim() || ''

                if (numCols === 2) return {
                    person: person,
                    conjugation: cleanStr(elsCols[1].innerText),
                    conjugationHTML: cleanStr(elsCols[1].innerHTML)
                }

                if (numCols === 3) return {
                    person: person,
                    conjugation: `${cleanStr(elsCols[1].innerText)} ${cleanStr(elsCols[2].innerText)}`,
                    conjugationHTML: `${cleanStr(elsCols[1].innerHTML)} ${cleanStr(elsCols[2].innerHTML)}`
                }

                if (numCols === 4) return {
                    person: person,
                    conjugation: `${cleanStr(elsCols[1].innerText)} ${cleanStr(elsCols[2].innerText)} ${cleanStr(elsCols[3].innerText)}`,
                    conjugationHTML: `${cleanStr(elsCols[1].innerHTML)} ${cleanStr(elsCols[2].innerHTML)} ${cleanStr(elsCols[3].innerHTML)}`
                }

                return {isNull: true}
            }

            // Query page elements
            const elSectionMain = article.querySelector("section") as HTMLElement
            const elSectionIndicative = article.querySelector("#indikativ + section") as HTMLElement
            const elSectionConjunctive = article.querySelector("#konjunktiv + section") as HTMLElement
            const elSectionConditional = article.querySelector("#konditional + section") as HTMLElement
            const elSectionImperative = article.querySelector("#imperativ + section") as HTMLElement
            const elsSections = [elSectionIndicative, elSectionConjunctive, elSectionConditional, elSectionImperative]

            // Query verb information
            const verbLevel = elSectionMain.querySelector(".bZrt")
            const strIrregular = elSectionMain.querySelector(".rInf") as HTMLElement
            const verbInfinitive = elSectionMain.querySelector("#grundform b")
            const stemFormation = elSectionMain.querySelector("#stammformen") as HTMLElement
            // Remove the link from stem
            stemFormation.lastElementChild?.remove()

            // Add generic verb information to object
            let completeData: any = {
                level: verbLevel?.innerHTML.trim() || '',
                verbHTML: verbInfinitive?.innerHTML || '',
                stemFormationHTML: stemFormation?.innerHTML || '',
                isIrregular: strIrregular.innerText.includes('unregelmäßig') ? true : false,
            }

            for (const [index, elSection] of elsSections.entries()) {
                let scrapedFormData: {elSectionMain?: any, nonExistent?: boolean, tense?: string, conjugations?: any}[] = []

                // Case if form does not exist, ie with Conjunctive on verb "sein"
                if (elSection === null) {
                    {scrapedFormData.push({nonExistent: true})}
                    continue
                }

                const elsTables = Array.from(elSection.querySelectorAll(".vTbl"))

                for (const elTable of elsTables) {
                    const elsConjugations = elTable.querySelectorAll('tr') as NodeListOf<HTMLElement>
                    let objConjugations: IVerbConjugation[] = []
                    elsConjugations.forEach((elTr)=> objConjugations.push(
                        getVerbProperties(elTr, index === 3)
                    ))

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
                data: dataIndicativeForm
            }
        )

        // Extract links from the current page
        // and add them to the crawling queue.
        await enqueueLinks();
    },
    headless: true,
})

verbsList.forEach(async (verb: any)=> {
    await crawler.addRequests([`https://www.verbformen.de/konjugation/${verb}.htm`])
})

// Add first URL to the queue and start the crawl.
await crawler.run();


