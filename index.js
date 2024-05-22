import verbs from './top-german-verbs.json' assert { type: "json" }
import fs from "fs"

const data = verbs.verbs.map((verb) => {
    return verb.Infinitiv
})

fs.writeFileSync('verbs.js', JSON.stringify(data, null, 2))