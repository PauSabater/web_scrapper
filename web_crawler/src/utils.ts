
// Extracts conjugations for single word declinations
export function getSingleWordObject(elConj: HTMLElement) {
    console.log(`HEYYYYY helooow`)

    return {
        person: elConj.firstElementChild?.innerHTML || '',
        stem: (elConj.lastElementChild?.firstElementChild as HTMLElement).innerText || '',
    }
}

export function test(elConj: HTMLElement) {
    console.log("test test")
    console.log(elConj)
}