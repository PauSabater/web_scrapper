import { verbsListPosted } from './verbs.js'

// let missing =

async function checkVerbs() {
    let verbs = ''

    for ( const verb of verbsListPosted ) {
        const headers = {
            Accept: "application/json",
            "Content-Type": "application/json"
        }

        fetch(`http://localhost:9090/api/verbs/get/exists/${verb}`, {
            method: "GET",
            headers: headers
        })
        .then(async response => {
            if (!response.ok) {
                const text = await response.text();
                throw Error(text);
                return Promise.reject(response)

                verbs = `${verbs} , ${verb} , `
            }
            else return response.json()
        })
        .then(data => {
            // console.log(data.data[0])

            if (data.data[0]) {
                // console.log("success" + data.data[0]._id)
                // console.log(data)
            } else {
                // console.log("error " + verb)

                verbs = `${verbs} ,
                '${verb}' `

                console.log('----------------------------')
                console.log(verbs)
            }
        })
    }
}


checkVerbs()