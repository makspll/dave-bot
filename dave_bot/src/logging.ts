import { gzipSync } from "zlib";
import { ChatbotSettings } from "./types/settings.js";
import moment from "moment";

export interface Log {
    level: "INFO" | "WARN" | "ERROR";
    message: string;
    json?: object;
    timestamp: number;
}

export interface ServiceTags {
    service: string;
    environment: string;
}

const bypass_log = console.log
const bypass_error = console.error
const bypass_warn = console.warn


export function inject_logger(settings: ChatbotSettings, tags: ServiceTags) {

    LogBatcher.set_tags(tags)
    console.log = async (...args: any[]) => {
        bypass_log.apply(console, args)
        LogBatcher.push_log({
            level: "INFO", message: args_to_string(args), timestamp: Date.now() * 1000000
        })
    }
    console.error = async (...args: any[]) => {
        bypass_error.apply(console, args)
        LogBatcher.push_log({ level: "ERROR", message: args_to_string(args), timestamp: Date.now() * 1000000 })
    }
    console.warn = async (...args: any[]) => {
        bypass_warn.apply(console, args)
        LogBatcher.push_log({ level: "WARN", message: args_to_string(args), timestamp: Date.now() * 1000000 })
    }
}

function args_to_string(args: any[]): string {
    return args.map(arg => {
        if (typeof arg === "object") {
            return JSON.stringify(arg)
        } else {
            return arg.toString()
        }
    }).join(" ")
}

export async function flush_logs(settings: ChatbotSettings) {
    await LogBatcher.flush(settings)
}

export async function post_logs_to_loki(logs: Log[], tags: ServiceTags, settings: ChatbotSettings) {
    // This function would send the logs to Loki
    // For the sake of this example, we'll just log them to the console
    const url = "https://logs-prod-012.grafana.net/loki/api/v1/push"
    const payload = {
        "streams": [
            {
                "stream": {
                    "service": tags.service,
                    "environment": tags.environment
                },
                "values": logs.map(log => [log.timestamp.toString(), log.message, { "level": log.level, ...log.json }])
            }
        ]
    }
    const basic_auth = btoa(`${settings.loki_username}:${settings.loki_password}`)
    const json = JSON.stringify(payload)
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Authorization": `Basic ${basic_auth}`,
            "Content-Type": "application/json"
        },
        body: json
    }).then(async res => {
        if (!res.ok) {
            const text = await res.text()
            throw new Error("Failed to send logs to Loki " + res.status + "," + text + "when sending: " + json)
        } else {
            bypass_log.apply(console, [`Successfully sent ${logs.length} logs to Loki with timestamp ${Date.now() * 1000000} `])
        }
    })

    return response
}

export class LogBatcher {
    static logs = new Array<Log>();
    static tags: ServiceTags | null = null

    static set_tags(tags: ServiceTags) {
        this.tags = tags
    }

    static push_log(log: Log) {
        this.logs.push(log)
    }

    static async flush(settings: ChatbotSettings) {
        if (!this.tags) {
            throw new Error("Tags not set")
        }
        const response = await post_logs_to_loki(this.logs, this.tags, settings)
        this.logs = []
    }

}
