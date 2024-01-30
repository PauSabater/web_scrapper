import fs from "fs/promises"
import path from "path"
import { fileURLToPath } from "url"
import fss from "fs"
// import { verbsList } from "./list"


const __dirname: string = path.dirname(fileURLToPath(import.meta.url))
const pathResults = "../../results/"
// const numFiles = fss.readdirSync(
//     path.resolve(__dirname, "../../descriptions/")
// ).length

const readFilesContent = () => {
    [
        'sehen',
        'wollen',
        'lassen',
        'stehen',
        'finden',
        'liegen',
        'denken',
        'nehmen',
        'tun',
        'glauben',
        'sprechen',
        'zeigen',
        'fühlen',
        'mögen',
        'halten',
        'bringen',
        'leben',
        'fahren',
        'essen',
        'schlafen',
].forEach((verb, i)=> {

        console.log("heyc   lets post" + verb)
        fs.readFile(path.resolve(__dirname, `../../results/${verb}.json`))
            .then(data => {
                const verbData = JSON.parse(data.toString())

                // console.log(verbData)

                postVerbData(verbData)

                // fs.rename(
                //     path.resolve(__dirname, `${pathStorage}00000000${i}.json`),
                //     path.resolve(__dirname, `${pathStorage}${verbData.verb}.json`)
                // )
            })
            .catch(error => {
                console.log(`did not find file for verb: ${verb}`)
                // Do something if error
            })
    })
}

const postVerbData = (verbData: any) => {
    const headers = {
        Accept: "application/json",
        "Content-Type": "application/json"
    }

    fetch("http://localhost:9090/verbs/create", {
        method: "POST",
        headers: headers,
        body: JSON.stringify(verbData)
    })
    .then(async response => {
        if (!response.ok) {
            const text = await response.text();
            throw Error(text);
            return Promise.reject(response)
        }
        else return response.json()
    })
    .then(data => {
        console.log("success")
        console.log(data)
    })
    .catch(error => {
        if (typeof error.json === "function") {
            error.json().then(jsonError => {
                console.log("Json error from API");
                console.log(jsonError);
            }).catch(genericError => {
                console.log("Generic error from API");
                console.log(error.statusText);
            });
        } else {
            console.log("Fetch error");
            console.log(error);
        }
    });
}

readFilesContent()