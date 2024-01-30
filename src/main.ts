//@ts-ignore
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
    maxRequestsPerCrawl: 9,

    // Use the requestHandler to process each of the crawled pages.
    async requestHandler({ request, page, enqueueLinks, log, pushData }) {

    //    if (request.loadedUrl.includes("")

        // EVALUATE ARTICLE
        const dataVerb = await page.$eval('article', (article) => {

            const defaultStr = '-'

            // Cleans and checks string for verbs data
            const cleanStr = (str: string)=> {
                return str ? str.replace("⁵", "&#42;").trim() : ''
            }

            // Gets the properties from a verb html element:
            const getVerbProperties = (elTr: HTMLElement, isImperative: boolean): IVerbConjugation => {
                const elsCols: HTMLTableCellElement[] = Array.from(elTr.querySelectorAll("td"))
                const numCols: number = elsCols.length

                // If only one column, there is no person (partizip II)
                const person = numCols > 1 ? elsCols[!isImperative ? 0 : 1].innerHTML.trim() || '' : ''
                let conjugation: string
                let conjugationHTML: string

                if (numCols === 1) {
                    conjugation = cleanStr(elsCols[0].innerText)
                    conjugationHTML = cleanStr(elsCols[0].innerHTML)
                }

                if (numCols === 2) {
                    conjugation = cleanStr(elsCols[isImperative ? 0 : 1].innerText)
                    conjugationHTML = cleanStr(elsCols[isImperative ? 0 : 1].innerHTML)
                }

                if (numCols === 3) {
                    conjugation = `${cleanStr(elsCols[1].innerText)} ${cleanStr(elsCols[2].innerText)}` || defaultStr,
                    conjugationHTML = `${cleanStr(elsCols[1].innerHTML)} ${cleanStr(elsCols[2].innerHTML)}`
                }

                if (numCols === 4) {
                    conjugation = `${cleanStr(elsCols[1].innerText)} ${cleanStr(elsCols[2].innerText)} ${cleanStr(elsCols[3].innerText)}`,
                    conjugationHTML = `${cleanStr(elsCols[1].innerHTML)} ${cleanStr(elsCols[2].innerHTML)} ${cleanStr(elsCols[3].innerHTML)}`
                }

                if (conjugation && conjugationHTML) return {
                    ...person && {person: person},
                    conjugation: conjugation,
                    conjugationHTML: conjugationHTML
                }
                else return {isNull: true}
            }

            // Query page elementsinfinit
            const elSectionMain = article.querySelector("section") as HTMLElement
            const elSectionIndicative = article.querySelector("#indikativ + section") as HTMLElement
            const elSectionInfinitivePartizip = article.querySelector("#infinit + section") as HTMLElement

            const elSectionConjunctive = article.querySelector("#konjunktiv + section") as HTMLElement
            const elSectionConditional = article.querySelector("#konditional + section") as HTMLElement
            const elSectionImperative = article.querySelector("#imperativ + section") as HTMLElement
            const elsSections = [elSectionIndicative, elSectionInfinitivePartizip, elSectionImperative, elSectionConjunctive, elSectionConditional]

            // Query verb information
            const verbLevel = elSectionMain.querySelector(".bZrt")
            const elVerbInfo = elSectionMain.querySelector(".rInf") as HTMLElement
            const verbInfinitive = elSectionMain.querySelectorAll("#grundform b")
            const stemFormation = elSectionMain.querySelector("#stammformen") as HTMLElement

            const elVerbTranslations = article.querySelector("#Uebersetzungen").nextElementSibling as HTMLElement
            const verbEnTranslation = elVerbTranslations.querySelector('[lang="en"]') as HTMLElement
            const verbEsTranslation = elVerbTranslations.querySelector('[lang="es"]') as HTMLElement
            const verbFrTranslation = elVerbTranslations.querySelector('[lang="fr"]') as HTMLElement
            const verbDeMeaning = article.querySelector('.rNt i') as HTMLElement

            let verbHTML = ''
            Array.from(verbInfinitive).forEach(element => {verbHTML = verbHTML + element.innerHTML})

            // Remove the link from stem
            stemFormation.lastElementChild?.remove()

            // Add generic verb information to object
            let completeData: any = {
                properties: {
                    level: verbLevel?.innerHTML.trim() || '-',
                    verbHTML: verbHTML,
                    stemFormationHTML: stemFormation?.innerHTML || '',
                    isIrregular: elVerbInfo.innerText.includes('unregelmäßig') ? true : false,
                    isSeparable: elVerbInfo.innerText.includes('trennbar') ? true : false,
                    auxiliary: elVerbInfo.innerText.includes('haben') ? 'haben' : 'sein',

                    translations: {
                        en: verbEnTranslation?.innerText || defaultStr,
                        es: verbEsTranslation?.innerText || defaultStr,
                        fr: verbFrTranslation?.innerText || defaultStr,
                        de: verbDeMeaning?.innerHTML || defaultStr
                    }
                },
                tenses: {
                    indicative: {},
                    infinitive: {},
                    imperative: {},
                    conditionalOrConjunctiveII: {}
                }
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
                        getVerbProperties(elTr, index === 2)
                    ))

                    const tense = index === 2 ? "Imperative" : (elTable.querySelector('h3') as HTMLElement).innerText

                    if (tense && objConjugations) {
                        scrapedFormData.push({
                            tense: tense,
                            conjugations: objConjugations
                        })
                    }
                }

                let formName = ''

                if (index === 0) formName = "indicative"
                else if (index === 1) formName = "infinitive"
                else if (index === 2) formName = "imperative"
                else if (index === 3) formName = "conjunctive"
                else if (index === 4) formName = "conditionalOrConjunctiveII"

                if (formName) completeData.tenses[formName] = scrapedFormData
            }

            return completeData
        });


        // Save results as JSON to ./storage/datasets/default
        await pushData({
                _id: request.loadedUrl.split("konjugation/")[1].replace('.htm', '').replaceAll('u3', 'ü').replaceAll('o3', 'ö') || '',
                url: request.loadedUrl,
                verb: request.loadedUrl.split("konjugation/")[1].replace('.htm', '').replaceAll('u3', 'ü').replaceAll('o3', 'ö') || '',
                data: dataVerb
            }
        )

        // Extract links from the current page
        // and add them to the crawling queue.
        // await enqueueLinks();
    },
    headless: true,
})

verbsList.forEach(async (verb: any)=> {
    await crawler.addRequests([`https://www.verbformen.de/konjugation/${verb}.htm`])
})

// Add first URL to the queue and start the crawl.
await crawler.run();