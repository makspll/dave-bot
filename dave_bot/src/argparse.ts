import { UserErrorException } from "./error.js";



export function read_raw_args(input: string): string[] {
    const args: string[] = [];
    let currentArg = '';
    let inQuotes = false;

    for (let i = 0; i < input.length; i++) {
        const char = input[i];

        if (char === ' ' && !inQuotes) {
            if (currentArg.length > 0) {
                args.push(currentArg);
                currentArg = '';
            }
        } else if (char === '"') {
            inQuotes = !inQuotes;
        } else {
            currentArg += char;
        }
    }

    if (currentArg.length > 0) {
        args.push(currentArg);
    }

    return args;
}

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

    public describe(): string {
        if (this.position !== null) {
            return `${this.long_name}`
        } else {
            return `${this.long_name}=VALUE`
        }
    }

    public get_string_value(args: string[]): string | null {
        if (this.position !== null) {
            const value = args[this.position]
            if (value === undefined) {
                return null
            }
            return value;
        } else {
            for (const arg of args) {
                const [name, value] = arg.split('=');
                const trimmed_arg = name.trim().replace('-', '');
                const matches = trimmed_arg.startsWith(this.long_name) ||
                    (this.short_name !== null && trimmed_arg.startsWith(this.short_name));
                if (matches) {
                    return value;
                }
            }
            return null
        }
    }

    protected handle_missing_argument(): T {
        if (this.position !== null) {
            throw new UserErrorException(`Provide value for ${this.long_name} at position ${this.position + 1}. ${this.help}`)
        } else {
            throw new UserErrorException(`Provide value for ${this.long_name}. ${this.help}`)
        }
    }

    public get_value(args: string[]): T {
        const string = this.get_string_value(args);
        if (string === null) {
            return this.handle_missing_argument();
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
            throw new UserErrorException(`Expected ${this.long_name} to be one of '${this.values.join(', ')}' but got ${arg}`)
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

export class OptionalArg<T> extends Arg<T | null> {
    public arg: Arg<T>;

    constructor(arg: Arg<T>) {
        super(arg.long_name, arg.short_name, arg.help);
        this.arg = arg;
    }

    public override handle_missing_argument(): T | null {
        return null
    }

    public parse(arg: string): T | null {
        if (arg === '') {
            return null;
        }
        return this.arg.parse(arg);
    }
}


