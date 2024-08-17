import { UserErrorException } from "./commands.js";

export class ManyArgs<T extends any[]> {
    public args: { [K in keyof T]: Arg<T[K]> };

    constructor(args: { [K in keyof T]: Arg<T[K]> }) {
        args.forEach((arg, i) => {
            if (arg.short_name === null) {
                arg.position = i;
            }
        })

        this.args = args;
    }

    public get_values(args: string[]): T {
        return this.args.map(arg => arg.get_value(args)) as T;
    }
}

export abstract class Arg<T> {
    public long_name: string;
    public short_name: string | null;
    public position: number | null;
    public help: string;

    constructor(long_name: string, short_name: string | null, help: string, position: number | null = null) {
        this.long_name = long_name;
        this.short_name = short_name;
        this.help = help;
        this.position = position;
    }


    public get_string_value(args: string[]): string | null {
        if (this.position !== null) {
            const value = args[this.position]
            if (value === undefined) {
                throw new UserErrorException(`Provide value for ${this.long_name} at position ${this.position + 1}. ${this.help}`)
            }
            return value;
        } else {
            for (const arg of args) {
                const [name, value] = arg.split('=');

                const trimmed_arg = name.trim().replace('-', '');
                console.log(`Checking ${trimmed_arg} against ${this.long_name} and ${this.short_name}`)
                const matches = trimmed_arg.startsWith(this.long_name) ||
                    (this.short_name !== null && trimmed_arg.startsWith(this.short_name));
                if (matches) {
                    return value;
                }
            }
            return null
        }
    }

    public get_value(args: string[]): T | null {
        const string = this.get_string_value(args);
        console.log(`Parsing ${this.long_name} with value ${string}`)
        if (string === null) {
            return null;
        }
        try {
            return this.parse(string)
        } catch (e) {
            if (e instanceof UserErrorException) {
                throw e
            } else {
                console.error(`Error parsing argument ${this.long_name} with value ${string}`, e)
                throw new UserErrorException(`Expected ${this.long_name} to be of type ${this.constructor.name} but got ${string}`)
            }
        }
    }

    abstract parse(arg: string): T
}

export class StringArg extends Arg<string> {
    constructor(long_name: string, help: string, short_name: string | null = null) {
        super(long_name, short_name, help);
    }

    public parse(arg: string): string {
        return arg
    }
}

export class EnumArg<T extends string> extends Arg<T> {
    public values: T[];

    constructor(long_name: string, help: string, values: T[], short_name: string | null = null) {
        super(long_name, short_name, help);
        this.values = values;
    }

    public parse(arg: string): T {
        if (!this.values.includes(arg as T)) {
            throw new UserErrorException(`Expected ${this.long_name} to be one of ${this.values.join(', ')} but got ${arg}`)
        }
        return arg as T
    }
}

export class NumberArg extends Arg<number> {
    constructor(long_name: string, help: string, short_name: string | null = null) {
        super(long_name, short_name, help);
    }

    public parse(arg: string): number {
        const clean_arg = arg.replace(/[,.]/, '')
        return Number(clean_arg)
    }
}

export class BoolArg extends Arg<boolean> {
    constructor(long_name: string, help: string, short_name: string | null = null) {
        super(long_name, short_name, help);
    }

    public parse(arg: string): boolean {
        if (arg.length > 1) {
            return arg.toLowerCase() === 'true'
        } else {
            return arg === '1'
        }
    }
}

export class DateArg extends Arg<Date> {
    constructor(long_name: string, help: string, short_name: string | null = null) {
        super(long_name, short_name, help);
    }

    public parse(arg: string): Date {
        return new Date(arg);
    }
}


