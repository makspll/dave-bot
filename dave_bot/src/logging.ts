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

export function inject_logger(settings: ChatbotSettings, tags: ServiceTags) {
    const old_log = console.log
    const old_error = console.error
    const old_warn = console.warn
    console.log = (...args: any[]) => {
        old_log(...args)
        const response = post_logs_to_loki([{ level: "INFO", message: args.join(" "), timestamp: Date.now() * 1000 }], tags, settings)
        old_log("Logging to Loki: ", response)
    }
    console.error = (...args: any[]) => {
        old_error(...args)
        const response = post_logs_to_loki([{ level: "ERROR", message: args.join(" "), timestamp: Date.now() * 1000 }], tags, settings)
        old_log("Logging to Loki: ", response)
    }
    console.warn = (...args: any[]) => {
        old_warn(...args)
        const response = post_logs_to_loki([{ level: "WARN", message: args.join(" "), timestamp: Date.now() * 1000 }], tags, settings)
        old_log("Logging to Loki: ", response)

    }

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
                "values": logs.map(log => [log.timestamp, { "level": log.level, ...log.json }])
            }
        ]
    }
    const basic_auth = btoa(`${settings.loki_username}:${settings.loki_password}`)
    const compressed_payload = gzipSync(JSON.stringify(payload))
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Basic ${basic_auth}`,
            "Content-Encoding": "gzip"
        },
        body: compressed_payload
    }).then(res => res.json())

    return response
}