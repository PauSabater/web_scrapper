import fs from "fs/promises"
import path from "path"
import { fileURLToPath } from "url"
import fss from "fs"
import { verbsList } from "./verbs.js"


const __dirname: string = path.dirname(fileURLToPath(import.meta.url))
const pathResults = "../../results/to-post/"
const files = fss.readdirSync(
    path.resolve(__dirname, "../../results/to-post/")
)

const readFilesContent = () => {
    files.forEach((verb, i)=> {

        console.log("heyc   lets post " + verb)
        console.log(path.resolve(__dirname, `../../results/to-post/${verb}`))
        fs.readFile(path.resolve(__dirname, `../../results/to-post/${verb}`))

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

    fetch("http://localhost:9090/api/verbs/create", {
        method: "POST",
        headers: headers,
        body: JSON.stringify(verbData)
    })
    // fetch(`http://localhost:9090/api/verbs/update/${verbData.verb}`, {
    //     method: "PATCH",
    //     headers: headers,
    //     body: JSON.stringify(verbData)
    // })
    .then(async response => {
        if (!response.ok) {
            const text = await response.text();
            throw Error(text);
            return Promise.reject(response)
        }
        else return response.json()
    })
    .then(data => {
        console.log("success" + data.verb.verb)
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