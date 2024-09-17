import { PropertySnapshot, UserQuery } from "@src/types/sql.js";
import { make_scrape_config, scrape, ScrapeResult } from "./scrapfly.js";
import { LogBatcher } from "../logging.js";
import { get_all_user_property_queries, get_properties_matching_query, get_user_property_queries_by_location, insert_property_snapshots, mark_properties_as_seen } from "../data/sql.js";
import moment from "moment-timezone";
import { ChatbotSettings } from "@src/types/settings.js";
import { sendLocation, sendMessage } from "../telegram.js";

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

export function merge_queries(acc: UserQuery, q: UserQuery): UserQuery {
    if (q.min_bedrooms < acc.min_bedrooms) acc.min_bedrooms = q.min_bedrooms
    if (q.max_bedrooms > acc.max_bedrooms) acc.max_bedrooms = q.max_bedrooms
    if (q.min_price < acc.min_price) acc.min_price = q.min_price
    if (q.max_price > acc.max_price) acc.max_price = q.max_price
    if (q.available_from < acc.available_from) acc.available_from = q.available_from
    if (q.query != acc.query) acc.query = acc.location
    return acc
}

export async function send_all_property_alerts(settings: ChatbotSettings) {
    let queries = await get_all_user_property_queries(settings.db)
    for (let query of queries) {
        let properties = await get_properties_matching_query(settings.db, query, false)
        const max_properties = 10
        if (properties.length) {
            await sendMessage({
                api_key: settings.telegram_api_key,
                open_ai_key: settings.openai_api_key,
                payload: {
                    chat_id: query.chat_id,
                    text: `Found ${properties.length} new properties matching your query. Showing the first ${max_properties}`
                },
                delay: 0,
                audio_chance: 0,
            })
        }

        if (properties.length > max_properties) {
            properties = properties.slice(0, max_properties)
        }

        for (let property of properties) {
            let msg = `${property.address} - ${property.price_per_month} - ${property.summary_description} - ${property.url}`
            await sendMessage({
                api_key: settings.telegram_api_key,
                open_ai_key: settings.openai_api_key,
                payload: {
                    chat_id: query.chat_id,
                    text: msg
                },
                delay: 0,
                audio_chance: 0,
            })
            await sendLocation(settings.telegram_api_key, query.chat_id, property.latitude, property.longitude)
            await mark_properties_as_seen(settings.db, [property.property_id])
        }
    }
}

export async function scrape_all_queries(settings: ChatbotSettings) {
    let queries = await get_all_user_property_queries(settings.db);
    let query_by_location = new Map<string, UserQuery>()
    for (let query of queries) {
        if (!query_by_location.has(query.location)) {
            query_by_location.set(query.location, query)
        } else {
            query_by_location.set(query.location, merge_queries(query_by_location.get(query.location)!, query))
        }
    }

    for (const [location, query] of query_by_location.entries()) {
        console.log("Scraping location", location)
        await scrape_zoopla(query, settings)
    }
}


export async function scrape_zoopla(query: UserQuery, settings: ChatbotSettings): Promise<void> {
    // find searches from today
    // get session id from epoch time now
    let session_id = moment().tz("Europe/London").unix()

    console.log("Starting scrape for query", query)
    await begin_zoopla_session(settings.scrapfly_api_key, session_id, settings);

    let page_num = 1
    let zoopla_query: ZooplaQuery = {
        location: query.location,
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
    while (page_num <= 10) {
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

function parseDate(dateStr: string): Date | null {
    const monthMap: { [key: string]: number } = {
        "Jan": 0, "Feb": 1, "Mar": 2, "Apr": 3, "May": 4, "Jun": 5,
        "Jul": 6, "Aug": 7, "Sep": 8, "Oct": 9, "Nov": 10, "Dec": 11
    };

    const dateRegex = /(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3})\s+(\d{4})/;
    const match = dateRegex.exec(dateStr);

    if (match) {
        const day = parseInt(match[1]);
        const month = monthMap[match[2]];
        const year = parseInt(match[3]);

        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
            return new Date(year, month, day);
        }
    }

    return null;
}

export function convertPropertyData(propertyData: PropertyData, location: string): PropertySnapshot {
    const propertySnapshot: PropertySnapshot = {
        property_id: "zoopla:" + propertyData.listingId,
        location,
        url: `https://www.zoopla.co.uk/to-rent/details/${propertyData.listingId}`,
        address: propertyData.address,
        price_per_month: parseInt(propertyData.price.replace(/[^0-9]/g, "")),
        longitude: propertyData.pos?.lng ?? propertyData.location?.longitude ?? 0,
        latitude: propertyData.pos?.lat ?? propertyData.location?.latitude ?? 0,
        summary_description: propertyData.summaryDescription,
        num_bedrooms: propertyData.features?.filter(x => x).filter(x => x != null).find((feature) => feature.iconId === "bed")?.content ?? 1,
        comma_separated_images: propertyData.gallery?.join(",") ?? "",
        shown: false,
        published_on: parseDate(propertyData.publishedOn) ?? new Date(),
        available_from: parseDate(propertyData.availableFrom) ?? new Date()
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

    // find query by parameters
    // location is part of the url
    let location = url.split("property/")[1].split("/")[0];
    let content = request.result.content;
    let flightData = parseFlightData(content);
    let snapshots = flightData.map((propertyData) => {
        try {
            return convertPropertyData(propertyData, location)
        } catch (e) {
            console.error("Failed to convert property data", e, typeof e, "from", propertyData)
            return null
        }
    }).filter((snapshot) => snapshot !== null);

    console.log("Saving", snapshots.length, "properties to db under location", location)
    await insert_property_snapshots(settings.db, snapshots)

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

    zooplaUrlArgs.set("is_retirement_home", params.is_retirement_home?.toString() ?? "false");
    zooplaUrlArgs.set("is_shared_accommodation", params.is_shared_accommodation?.toString() ?? "false");
    zooplaUrlArgs.set("is_student_accommodation", params.is_student_accommodation?.toString() ?? "false");

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

interface Coordinates {
    isApproximate: boolean;
    latitude: number;
    longitude: number;
}

export interface PropertyData {
    address: string;
    alternativeRentFrequencyLabel: string;
    availableFrom: string;
    availableFromLabel: string;
    branch: Branch;
    displayType: string;
    featuredType: string | null;
    features?: (Feature | null | undefined)[];
    flag: string;
    gallery?: string[];
    highlights: any[]; // Adjust the type if you have a specific structure for highlights
    image?: Image | null;
    isFavourite: boolean;
    isPremium: boolean;
    lastPublishedDate: string;
    listingId: string;
    listingType: string;
    listingUris?: ListingUris;
    numberOfFloorPlans: number;
    numberOfImages: number;
    numberOfVideos: number;
    pos?: Position;
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
    location?: Coordinates;
}