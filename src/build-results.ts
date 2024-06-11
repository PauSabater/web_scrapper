import fs from "fs/promises"
import path from "path"
import { fileURLToPath } from "url"
import fss from "fs"
import { modalVerbs } from '../list.js'
// import { auxiliaryVerbs } from '../list.js'


const __dirname: string = path.dirname(fileURLToPath(import.meta.url))
const pathStorage = "../storage/datasets/default/"
const pathDescriptions = "../descriptions/"
const pathExamples = "../examples/"
const pathResults = "../results/"

const numFiles = fss.readdirSync(path.resolve(__dirname, "../storage/datasets/default/")).length - 1

console.log("num files is "+numFiles)

const readFilesContent = (numFiles: number) => {

    Array.from(Array(numFiles + 1)).forEach((_, i)=> {


        fs.readFile(path.resolve(__dirname, `${pathStorage}000000${((i + 1).toString()).padStart(3, '0')}.json`))
            .then(async data => {
                const verbData = JSON.parse(data.toString())
                const verbName = verbData.verb
                const newVerbObj = verbData
                newVerbObj.data.properties.isModal = modalVerbs.includes(verbName)

                // await fs.readFile(path.resolve(__dirname, `${pathDescriptions}${verbName}.json`))
                //     .then((descriptions) => {
                //         Object.assign(newVerbObj, verbData)
                //         Object.assign(newVerbObj, JSON.parse(descriptions.toString()))
                //         newVerbObj.data.properties.isModal = modalVerbs.includes(verbName)
                //     })

                // await fs.readFile(path.resolve(__dirname, `${pathExamples}${verbName}.json`))
                // .then((examples) => {
                //     const newVerbObj = verbData
                //     Object.assign(newVerbObj, verbData)
                //     Object.assign(newVerbObj, JSON.parse(examples.toString()))
                // })

                await fs.writeFile(path.resolve(__dirname, `${pathResults}${verbName}.json`), JSON.stringify(newVerbObj))

            })
            .catch(error => {
                console.log("error in building the results")
                console.log(error)
            })
    })
}

readFilesContent(numFiles)