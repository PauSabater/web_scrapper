//@ts-ignore
import { PlaywrightCrawler } from 'crawlee'
import { verbsList } from './missingverbs.js'

interface IVerbConjugation {
    isNull?: boolean,
    person?: string,
    conjugation?: string,
    conjugationHTML?: string
    test?: string,
    numCols?: number
    text1?: string
    text2?: string
    text3?: string
    text4?: string
    text5?: string
}

// Initiate PlaywrightCrawler class
const crawler = new PlaywrightCrawler({
    // Only need one page, the corresponding from the page
    maxRequestsPerCrawl: 60,
    maxConcurrency: 1,
    // maxRequestsPerMinute: 10,

    // Use the requestHandler to process each of the crawled pages.
    async requestHandler({ request, page, enqueueLinks, log, pushData }) {

    //    if (request.loadedUrl.includes("")

        // EVALUATE ARTICLE
        const dataVerb = await page.$eval('article', (article) => {

            const defaultStr = '-'

            // Cleans and checks string for verbs data
            const cleanStr = (str: string)=> {
                return str ? str.replace("⁵", "&#42;").replace("³", "¹").trim() : ''
            }

            // Gets the properties from a verb html element:
            const getVerbProperties = (elTr: HTMLElement, isImperative: boolean): IVerbConjugation => {
                const elsCols: HTMLTableCellElement[] = Array.from(elTr.querySelectorAll("td"))
                const numCols: number = elsCols.length

                // If only one column, there is no person (partizip II)
                const person = numCols > 1 ? elsCols[!isImperative ? 0 : 1].innerHTML.trim() || '' : ''
                let conjugation: string
                let conjugationHTML: string
                let preconjugation: string
                let preconjugationHTML: string

                if (numCols === 1) {
                    conjugation = cleanStr(elsCols[0].innerText)
                    conjugationHTML = cleanStr(elsCols[0].innerHTML)
                }

                if (numCols === 2) {
                    conjugation = cleanStr(elsCols[isImperative ? 0 : 1].innerText)
                    conjugationHTML = cleanStr(elsCols[isImperative ? 0 : 1].innerHTML)
                }

                if (numCols === 3) {
                    conjugation = !isImperative
                        ? `${cleanStr(elsCols[1].innerText)} ${cleanStr(elsCols[2].innerText)}` || defaultStr
                        : cleanStr(elsCols[2].innerText),
                    conjugationHTML = !isImperative
                        ? `${cleanStr(elsCols[1].innerHTML)} ${cleanStr(elsCols[2].innerHTML)}`
                        : cleanStr(elsCols[2].innerHTML)

                    if (isImperative) {
                        preconjugation = cleanStr(elsCols[0].innerText)
                        preconjugationHTML = cleanStr(elsCols[0].innerHTML)
                    }
                }

                if (numCols === 4) {
                    conjugation = `${cleanStr(elsCols[1].innerText)} ${cleanStr(elsCols[2].innerText)} ${cleanStr(elsCols[3].innerText)}`,
                    conjugationHTML = `${cleanStr(elsCols[1].innerHTML)} ${cleanStr(elsCols[2].innerHTML)} ${cleanStr(elsCols[3].innerHTML)}`
                }

                if (conjugation && conjugationHTML) return {
                    ...preconjugation && {preconjugation: preconjugation},
                    ...preconjugationHTML && {preconjugationHTML: preconjugationHTML},
                    ...person && {person: person},
                    conjugation: conjugation,
                    conjugationHTML: conjugationHTML
                }

                // case for reflexive
                if (numCols === 5) return {
                    ...person && {person: person},
                    conjugation: `${cleanStr(elsCols[1].innerText)} ${cleanStr(elsCols[2].innerText)} ${cleanStr(elsCols[3].innerText)} ${cleanStr(elsCols[4].innerText)}`,
                    conjugationHTML: `${cleanStr(elsCols[1].innerHTML)} ${cleanStr(elsCols[2].innerHTML)} ${cleanStr(elsCols[3].innerHTML)}  ${cleanStr(elsCols[4].innerHTML)}`
                }

                // else return {
                //     numCols: numCols,
                //     text1: elsCols[0].innerText,
                //     text2: elsCols[1].innerText,
                //     text3: elsCols[2].innerText,
                //     text4: elsCols[3].innerText,
                //     text5: elsCols[4].innerText,
                //     isNull: true
                // }
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
            const verbInfinitive = elSectionMain.querySelector("#grundform")
            verbInfinitive.lastElementChild.remove()

            const stemFormation = elSectionMain.querySelector("#stammformen") as HTMLElement
            const elVerbTranslations = article.querySelector("#Uebersetzungen").nextElementSibling as HTMLElement
            const verbEnTranslation = elVerbTranslations.querySelector('[lang="en"]') as HTMLElement
            const verbEsTranslation = elVerbTranslations.querySelector('[lang="es"]') as HTMLElement
            const verbFrTranslation = elVerbTranslations.querySelector('[lang="fr"]') as HTMLElement
            const verbDeMeaning = article.querySelector('.rNt i') as HTMLElement

            let verbHTML = verbInfinitive.innerHTML
            // Array.from(verbInfinitive).forEach(element => {verbHTML = verbHTML + element.innerHTML})

            // Remove the link from stem
            stemFormation.lastElementChild?.remove()

            const isVerbSeparable = elVerbInfo.innerText.includes(' trennbar') ? true : false
            const isReflexive = elVerbInfo.innerText.includes(' reflexiv') ? true : false

            // Add generic verb information to object
            let completeData: any = {
                properties: {
                    level: verbLevel?.innerHTML.trim() || '-',
                    verbHTML: verbHTML,
                    stemFormationHTML: stemFormation?.innerHTML || '',
                    isIrregular: elVerbInfo.innerText.includes('unregelmäßig') ? true : false,
                    isSeparable: isVerbSeparable,
                    ...isReflexive && { reflexive: true },
                    ...elVerbInfo.innerText.includes(' untrennbar') && { prefixed:  true },
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
                let scrapedFormData: {
                    elSectionMain?: any,
                    nonExistent?: boolean,
                    tense?: string,
                    conjugations?: any
                } = {}

                // Case if form does not exist, ie with Conjunctive on verb "sein"
                if (elSection === null) {
                    {scrapedFormData.nonExistent = true}
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
                        const tenseEnding = tense.slice(-2)
                        const tenseLowerCase = tense.slice(0, -2).toLowerCase()
                        const tenseKey = (tenseLowerCase + tenseEnding).replaceAll(' ', '_').replaceAll('.', '')

                        {

                        }
                        scrapedFormData[tenseKey] = {}
                        scrapedFormData[tenseKey].conjugations = objConjugations
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
                _id: request.loadedUrl.split("konjugation/")[1].replace('.htm', '').replaceAll('u3', 'ü').replaceAll('o3', 'ö').replaceAll('s5', 'ß').replaceAll('a3', 'ä') || '',
                url: request.loadedUrl,
                verb: request.loadedUrl.split("konjugation/")[1].replace('.htm', '').replaceAll('u3', 'ü').replaceAll('o3', 'ö').replaceAll('s5', 'ß').replaceAll('a3', 'ä') || '',
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