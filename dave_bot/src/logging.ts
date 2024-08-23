import { gzipSync } from "zlib";
import { ChatbotSettings } from "./types/settings.js";
import moment from "moment";

export interface Log {
    level: "INFO" | "WARN" | "ERROR";
    message: string;
    json?: object;
    timestamp: bigint;
}

export interface ServiceTags {
    service: string;
    environment: string;
}


let bypass_log = console.log
let bypass_error = console.error
let bypass_warn = console.warn

export function inject_logger(settings: ChatbotSettings, tags: ServiceTags) {
    bypass_log = console.log
    bypass_error = console.error
    bypass_warn = console.warn
    LogBatcher.set_tags(tags)
    console.log = async (...args: any[]) => {
        bypass_log(...args)
        LogBatcher.push_log({ level: "INFO", message: args.join(" "), timestamp: process.hrtime.bigint() })
    }
    console.error = async (...args: any[]) => {
        bypass_error(...args)
        LogBatcher.push_log({ level: "ERROR", message: args.join(" "), timestamp: process.hrtime.bigint() })
    }
    console.warn = async (...args: any[]) => {
        bypass_warn(...args)
        LogBatcher.push_log({ level: "WARN", message: args.join(" "), timestamp: process.hrtime.bigint() })
    }

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