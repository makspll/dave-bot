import { PropertySnapshot, UserQuery } from "@src/types/sql.js";
import { make_scrape_config, scrape, ScrapeResult } from "./scrapfly.js";
import { LogBatcher } from "../logging.js";
import { get_latest_search, get_latest_two_searches, get_todays_searches, insert_new_search, insert_property_snapshots } from "../data/sql.js";
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

function convertPropertyData(propertyData: PropertyData, search_id: number): PropertySnapshot {
    const propertySnapshot: PropertySnapshot = {
        property_id: propertyData.listingId,
        search_id: search_id,
        url: `https://www.zoopla.co.uk${propertyData.listingUris.detail}`,
        address: propertyData.address,
        price_per_month: parseInt(propertyData.price.replace(/[^0-9]/g, "")),
        longitude: propertyData.pos.lng,
        latitude: propertyData.pos.lat,
        property_type: propertyData.propertyType,
        summary_description: propertyData.summaryDescription,
        num_bedrooms: parseInt(propertyData.title.replace(/[^0-9]/g, "")),
        comma_separated_images: propertyData.gallery.join(",")
    }
    return propertySnapshot
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
    let last_search_id = await get_latest_search(settings.db);

    if (!last_search_id) {
        console.error("No search id found")
        return
    }

    let content = request.result.content;
    let flightData = parseFlightData(content);
    let snapshots = flightData.map((propertyData) => {
        try {
            return convertPropertyData(propertyData, last_search_id?.search_id)
        } catch (e) {
            console.error("Failed to convert property data", e)
            return null
        }
    }).filter((snapshot) => snapshot !== null);

    console.log("Saving", snapshots.length, "properties to db")
    await insert_property_snapshots(settings.db, snapshots)

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

interface State {
    replacements: number
}


function recursive_replace_lookup_string(full_data: any, current_data: any, lookup_key_prefix: string = '$', state: State): any {
    if (current_data === null || current_data === undefined) {
        return current_data
    }

    if (typeof current_data === 'string' && current_data.startsWith(lookup_key_prefix)) {
        state.replacements++;
        const lookup_key = current_data.slice(1);
        return full_data[lookup_key];
    }

    if (Array.isArray(current_data)) {
        return current_data.map((item) => recursive_replace_lookup_string(full_data, item, lookup_key_prefix, state));
    }
    if (typeof current_data === 'object') {
        const new_data: any = {};
        for (const [key, val] of Object.entries(current_data)) {
            new_data[key] = recursive_replace_lookup_string(full_data, val, lookup_key_prefix, state);
        }
        return new_data;
    }
    return current_data;
}

function inlineFlightDataReferences(flightData: any) {
    // recursively walk lists dictionaries and replace references like "$72" with the actual value from the flight data dict
    let state = {
        replacements: 999
    }
    let new_data = flightData;
    while (state.replacements > 0) {
        console.log(state.replacements)
        state.replacements = 0;
        new_data = recursive_replace_lookup_string(new_data, new_data, '$', state);
    }
    return new_data
}

function findPropertyData(flightData: any): PropertyData[] {
    const propertyData: PropertyData[] = [];
    for (const key in flightData) {
        if (typeof flightData[key] === "object" && flightData[key].listingId !== undefined && flightData[key].propertyType !== undefined) {
            propertyData.push(flightData[key]);
        }
    }
    return propertyData;
}

export function parseFlightData(html: string): PropertyData[] {
    const data: any = {};
    for (const [key, val] of iterateFlightData(html)) {
        const jsonValue = parseFlightJsonValue(val);
        if (jsonValue) {
            data[key] = jsonValue;
        }
    }
    const inlined = inlineFlightDataReferences(data);
    return findPropertyData(inlined);
}

interface Branch {
    branchDetailsUri: string;
    branchId: number;
    logoUrl: string;
    name: string;
    phone: string;
}

interface Feature {
    content: number;
    iconId: string;
}

interface Image {
    src: string;
    caption: string | null;
    responsiveImgList: Array<{
        src: string;
        width: number;
    }>;
}

interface ListingUris {
    contact: string;
    detail: string;
    success: string;
}

interface Position {
    lat: number;
    lng: number;
}

interface PropertyData {
    address: string;
    alternativeRentFrequencyLabel: string;
    availableFrom: string;
    availableFromLabel: string;
    branch: Branch;
    displayType: string;
    featuredType: string | null;
    features: Feature[];
    flag: string;
    gallery: string[];
    highlights: any[]; // Adjust the type if you have a specific structure for highlights
    image: Image;
    isFavourite: boolean;
    isPremium: boolean;
    lastPublishedDate: string;
    listingId: string;
    listingType: string;
    listingUris: ListingUris;
    numberOfFloorPlans: number;
    numberOfImages: number;
    numberOfVideos: number;
    pos: Position;
    price: string;
    priceDrop: string | null;
    priceTitle: string;
    propertyType: string;
    publishedOn: string;
    publishedOnLabel: string;
    shortPriceTitle: string;
    summaryDescription: string;
    tags: Array<{
        content: string;
    }>;
    title: string;
    transports: any[]; // Adjust the type if you have a specific structure for transports
    underOffer: boolean;
}