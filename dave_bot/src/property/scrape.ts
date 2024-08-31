import { PropertySnapshot } from "@src/types/sql.js";
import {
    ScrapflyClient, ScrapeConfig, ScreenshotConfig, ExtractionConfig,
} from 'scrapfly-sdk';

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



export async function scrape_zoopla(api_key: string, query: ZooplaQuery): Promise<PropertySnapshot[]> {
    // begin sesssion
    const client = new ScrapflyClient({ key: api_key });
    const session_id = await begin_zoopla_session(client, Date.now());

    // scrape 
    let last_url = "https://www.zoopla.co.uk/"

    for (const page_num of [1]) {
        query.pn = page_num;

        const config = make_scrape_config(make_zoopla_url(query), session_id, last_url);
        const response = await client.scrape(config);
        console.log("scrape result", response)
        last_url = config.url;
        const html = response.result.content;
        const data = parseFlightData(html);
        console.log(data)
    }
    return []
}

function make_scrape_config(url: string, session_id: string, refferer: string | undefined = undefined): ScrapeConfig {
    let headers: any = {};
    if (refferer) headers['referer'] = refferer;
    return new ScrapeConfig({
        url, render_js: false, asp: true, session: session_id, session_sticky_proxy: true, country: 'gb', headers,
    });
}

/**
 * Begins a session with Zoopla by visiting the Zoopla homepage and collecting cookies. returns scrapfly session id if successful or throws error
 */
async function begin_zoopla_session(client: ScrapflyClient, search_id: number): Promise<string> {
    const url = "https://www.zoopla.co.uk/";
    const session_id = search_id.toString();
    const scrapeConfig = make_scrape_config(url, session_id);

    const response = await client.scrape(scrapeConfig);
    console.log("begin scrape session result", response.uuid)
    if (!response.result.success) throw new Error("Failed to begin Zoopla session");

    return session_id
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

    return `https://www.zoopla.co.uk/to-rent/property/${params.location}/${zooplaUrlArgs.toString()}`;
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
    const flightData = html.match(/self.__next_f.push\(\[1, "(.*?)"\]\)/g) || [];
    const fullFlightData = unescape(flightData.map(match => match.match(/self.__next_f.push\(\[1, "(.*?)"\]\)/)?.[1] || '').join(''));
    const lines = fullFlightData.split('\n');
    for (const data of lines) {
        const [key, val] = extractKeyValue(data);
        yield [key, val];
    }
}

function parseFlightData(html: string): any {
    const data: any = {};
    for (const [key, val] of iterateFlightData(html)) {
        const jsonValue = parseFlightJsonValue(val);
        if (jsonValue) {
            data[key] = jsonValue;
        }
    }
    return data;
}