import { PropertySnapshot, UserQuery } from "@src/types/sql.js";
import { make_scrape_config, scrape, ScrapeResult } from "./scrapfly.js";
import { LogBatcher } from "../logging.js";
import { get_latest_search, get_latest_two_searches, get_todays_searches, insert_new_search } from "../data/sql.js";
import moment from "moment-timezone";
import { ChatbotSettings } from "@src/types/settings.js";

export interface ZooplaQuery {
    location: string,
    beds_max?: number,
    beds_min?: number,
    price_frequency?: "per_month",
    price_max?: number,
    price_min?: number,
    q?: string,
    results_sort?: "newest_listings",
    search_source?: "to-rent",
    is_retirement_home?: boolean,
    is_shared_accommodation?: boolean,
    is_student_accommodation?: boolean
    pn?: number
}


export async function scrape_zoopla(query: UserQuery, settings: ChatbotSettings): Promise<void> {
    // find searches from today
    // get session id from epoch time now
    let session_id = moment().tz("Europe/London").unix()

    console.log("Starting scrape for query", query)
    await begin_zoopla_session(settings.scrapfly_api_key, session_id, settings);
    console.log("Session started")
    await insert_new_search(settings.db, query)
    console.log("Inserted new search")

    let page_num = 1
    let zoopla_query: ZooplaQuery = {
        location: "london",
        q: query.query,
        results_sort: "newest_listings",
        search_source: "to-rent",
        beds_min: 1,
        beds_max: 1,
        price_min: 1000,
        price_max: 2000,
        is_retirement_home: false,
        is_shared_accommodation: false,
        is_student_accommodation: false,
    }
    let last_url = "https://www.zoopla.co.uk"
    while (page_num <= 2) {
        zoopla_query.pn = page_num;
        let zoopla_url = make_zoopla_url(zoopla_query);
        const config = make_scrape_config(zoopla_url, session_id.toString(), last_url, settings);
        last_url = zoopla_url;
        let retries = 3;
        while (retries > 0) {
            console.log("Initiating scraping of page:", page_num, "retries?:", retries)
            try {
                await scrape({
                    apiKey: settings.scrapfly_api_key,
                    payload: config
                });
                break
            } catch (e) {
                console.error("Failed to initiate scrape", e)
                retries--;
            }
        }
        if (retries === 0) {
            console.error("Failed to scrape page", page_num)
            break
        }

        page_num++;
    }
}

export async function process_scrape_result(request: ScrapeResult, settings: ChatbotSettings) {
    if (!request.result.success) {
        console.error("Scrape failed", request.result.error, request.result.url)
        if (request.result.error?.retryable) {
            console.log("Retrying")

            let config = make_scrape_config(request.result.url, request.context.session?.name, undefined, settings);
            await scrape({
                apiKey: settings.scrapfly_api_key,
                payload: config
            })
        }
        return
    }
    let url = request.result.url;
    let params = new URLSearchParams(url.split("?")[1]);
    if (params.size === 0) {
        console.log("processed initial scrape for session:", request.context.session?.name)
        return
    }

    let content = request.result.content;
    let flightData = parseFlightData(content);
    let latest_search_id = await get_latest_search(settings.db);
    console.log("saving properties to latest search id", latest_search_id)
}



/**
 * Begins a session with Zoopla by visiting the Zoopla homepage and collecting cookies. returns scrapfly session id if successful or throws error
 */
async function begin_zoopla_session(key: string, search_id: number, settings: ChatbotSettings): Promise<void> {
    const url = "https://www.zoopla.co.uk/";
    const session_id = search_id.toString();
    console.log("Starting session with id", session_id)
    const scrapeConfig = make_scrape_config(url, session_id, undefined, settings);
    scrapeConfig.wait_for_selector = undefined;
    console.log("Initiating scrape first scrape session", url)
    const response = await scrape({
        apiKey: key,
        payload: scrapeConfig
    })
}

function make_zoopla_url(params: ZooplaQuery) {
    const zooplaUrlArgs = new URLSearchParams();

    if (params.beds_max) zooplaUrlArgs.set("beds_max", params.beds_max.toString());
    if (params.beds_min) zooplaUrlArgs.set("beds_min", params.beds_min.toString());
    if (params.is_retirement_home) zooplaUrlArgs.set("is_retirement_home", params.is_retirement_home.toString());
    if (params.is_shared_accommodation) zooplaUrlArgs.set("is_shared_accommodation", params.is_shared_accommodation.toString());
    if (params.is_student_accommodation) zooplaUrlArgs.set("is_student_accommodation", params.is_student_accommodation.toString());
    if (params.price_frequency) zooplaUrlArgs.set("price_frequency", params.price_frequency.toString());
    if (params.price_max) zooplaUrlArgs.set("price_max", params.price_max.toString());
    if (params.price_min) zooplaUrlArgs.set("price_min", params.price_min.toString());
    if (params.q) zooplaUrlArgs.set("q", params.q.toString());
    if (params.results_sort) zooplaUrlArgs.set("results_sort", params.results_sort.toString());
    if (params.search_source) zooplaUrlArgs.set("search_source", params.search_source.toString());
    if (params.pn) zooplaUrlArgs.set("pn", params.pn.toString());

    return `https://www.zoopla.co.uk/to-rent/property/${params.location}/?${zooplaUrlArgs.toString()}`;
}


function unescape(line: string): string {
    return line.replace(/\\"/g, '"').replace(/\\n/g, "\n");
}

function extractKeyValue(line: string): [string, string] {
    const split = line.split(':');
    const key = split[0].trim();
    const values = split.slice(1).join(':').trim();
    return [key, values];
}

function parseFlightJsonValue(string: string): any {
    try {
        return JSON.parse(string);
    } catch {
        return null;
    }
}

function* iterateFlightData(html: string): Generator<[string, string]> {
    const flightData = html.matchAll(/self.__next_f.push\(\[1,.?"(.*?)"\]\)/g) || [];
    const fullFlightData = Array.from(flightData).map((m) => unescape(m[1])).join('\n');
    const lines = fullFlightData.split('\n');
    console.log("flight data lines count", lines.length)
    for (const data of lines) {
        const [key, val] = extractKeyValue(data);
        yield [key, val];
    }
}

export function parseFlightData(html: string): any {
    const data: any = {};
    for (const [key, val] of iterateFlightData(html)) {
        const jsonValue = parseFlightJsonValue(val);
        if (jsonValue) {
            data[key] = jsonValue;
        }
    }
    return data;
}