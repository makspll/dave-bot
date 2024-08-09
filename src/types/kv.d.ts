
declare global {
    type Scores = {
        [game: string]: {
            [id: string]: number
        }
    } & {
        "names"?: {
            [id: string]: string
        }
    }
}

export { }