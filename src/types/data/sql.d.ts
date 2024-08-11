declare global {
    //  Added in Migration number: 0001 
    interface User {
        user_id: number,
        alias?: string,
        consent_date: Date,
    }

    //  Added in Migration number: 0001 
    interface Chat {
        chat_id: number,
        alias?: string
    }
}

export { }

