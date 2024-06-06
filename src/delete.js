
const deleteData = async ( ) =>{

    for (const verb of verbsIrregularExtra) {
        const response = await fetch(`http://localhost:9090/api/verbs/delete/${verb}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: null
        })

        const data = await response.json( );

        // now do whatever you want with the data
         console.log(data);
    }
}

deleteData( );