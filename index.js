import verbs from './top-german-verbs.json' assert { type: "json" }
import fs from "fs"

// console.log(verbs)
const data = verbs.verbs.map((verb) => {
    return verb.Infinitiv
})

console.log(data)

fs.writeFileSync('verbs.js', JSON.stringify(data, null, 2))