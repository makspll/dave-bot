
export class UserErrorException extends Error {
    constructor(user_message: string) {
        super(user_message);
        this.name = "UserErrorException";
    }
}
