export interface ScrapflyScrapeRequest {
    apiKey: string;
    payload: ScrapflyScrapeConfig
}
export interface ScrapflyScrapeConfig {
    url: string,
    render_js: boolean,
    asp: boolean,
    session: string,
    session_sticky_proxy: boolean,
    country: string,
    headers: any,
    proxy_pool: string,
    cost_budget?: number,
    wait_for_selector?: string
    screenshots?: any
}

export interface ScrapeflyScrapeResponse {

}

export function make_scrape_config(url: string, session_id: string, refferer: string | undefined = undefined): ScrapflyScrapeConfig {
    let headers: any = {};
    if (refferer) headers['referer'] = refferer;
    return {
        url, render_js: false, asp: true, session: session_id, session_sticky_proxy: true, country: 'gb', headers, proxy_pool: 'public_datacenter_pool', cost_budget: 30, wait_for_selector: "[id^=\"listing\"]", screenshots: { "page": "fullpage" }
    };
}

export async function scrape(scrapeRequest: ScrapflyScrapeRequest): Promise<ScrapeResult> {

    const url = "https://api.scrapfly.io/scrape";
    const payload = new URLSearchParams();
    payload.append("url", scrapeRequest.payload.url);
    payload.append("render_js", scrapeRequest.payload.render_js.toString());
    payload.append("asp", scrapeRequest.payload.asp.toString());
    payload.append("session", scrapeRequest.payload.session);
    payload.append("session_sticky_proxy", scrapeRequest.payload.session_sticky_proxy.toString());
    payload.append("country", scrapeRequest.payload.country);
    payload.append("proxy_pool", scrapeRequest.payload.proxy_pool);
    if (scrapeRequest.payload.cost_budget) payload.append("cost_budget", scrapeRequest.payload.cost_budget.toString());
    if (scrapeRequest.payload.wait_for_selector) {
        payload.append("wait_for_selector", scrapeRequest.payload.wait_for_selector);
    }

    for (const key in scrapeRequest.payload.headers) {
        payload.append(`headers[${key}]`, scrapeRequest.payload.headers[key]);
    }
    for (const key in scrapeRequest.payload.screenshots) {
        payload.append(`screenshots[${key}]`, scrapeRequest.payload.screenshots[key]);
    }

    console.log(`Scraping ${url}?${payload.toString()}&key=REDACTED`);

    payload.append("key", scrapeRequest.apiKey);

    return fetch(`${url}?${payload.toString()}`, {
        method: "GET"
    }).then(async response => {
        if (!response.ok) {
            const contentType = response.headers.get("content-type");
            let error = ""
            if (contentType && contentType.indexOf("application/json") !== -1) {
                error = await response.json().then(d => JSON.stringify(d));
            } else {
                error = await response.text();
            }
            console.error(error);
            throw new Error("Failed to scrape: " + response.status + " " + error);
        }
        return response.json();
    }).then((data: any) => {
        return data as ScrapeResult;
    });
}


export interface ConfigData {
    url: string;
    retry: boolean;
    // method: HttpMethod;
    country?: string;
    render_js: boolean;
    cache: boolean;
    cache_clear: boolean;
    ssl: boolean;
    dns: boolean;
    asp: boolean;
    debug: boolean;
    raise_on_upstream_error: boolean;
    cache_ttl: number;
    proxy_pool: string;
    session?: string;
    tags: Set<string>;
    correlation_id?: string;
    cookies: Record<string, string>;
    body?: string;
    // data?: Rec<any>;
    // headers: Rec<string>;
    js?: string;
    rendering_wait?: number;
    wait_for_selector?: string;
    session_sticky_proxy: boolean;
    // screenshots?: Rec<any>;
    webhook?: string;
    timeout?: number; // in milliseconds
    // js_scenario?: Rec<any>;
    // extract?: Rec<any>;
    lang?: string[];
    os?: string;
    auto_scroll?: boolean;
}

export interface ContextData {
    asp: boolean;
    bandwidth_consumed: number;
    cache: {
        state: string;
        entry?: string;
    };
    cookies: Record<string, string>;
    cost: {
        details: Array<{ amount: number; code: string; description: string }>;
        total: number;
    };
    created_at: string;
    debug: {
        response_url: string;
        screenshot_url?: string;
    };
    env: string;
    fingerprint: string;
    headers: Record<string, string>;
    is_xml_http_request: boolean;
    job?: string;
    lang: Array<string>;
    os: {
        distribution: string;
        name: string;
        type: string;
        version: string;
    };
    project: string;
    proxy: {
        country: string;
        identity: string;
        network: string;
        pool: string;
    };
    redirects: Array<string>;
    retry: number;
    schedule?: string;
    session?: string;
    spider?: any;
    throttler?: any;
    uri: {
        base_url: string;
        fragment?: string;
        host: string;
        // params?: Rec<string>;
        port: number;
        query?: string;
        root_domain: string;
        scheme: string;
    };
    url: string;
    webhook?: string;
}

export interface ResultData {
    browser_data: {
        javascript_evaluation_result?: string;
        js_scenario?: {
            duration: number;
            executed: number;
            response: any;
            steps: Array<{
                action: string;
                // config: Rec<string>;
                duration: number;
                executed: boolean;
                result?: string;
                success: boolean;
            }>;
        };
        // local_storage_data?: Rec<string>;
        // session_storage_data?: Rec<string>;
        websockets?: Array<any>;
        xhr_call?: Array<{
            body?: string;
            // headers: Rec<string>;
            method: string;
            type: string;
            url: string;
            response: {
                body: string;
                duration: number;
                format: string;
                // headers: Rec<string>;
                status: number;
            };
        }>;
    };
    content: string;
    content_encoding: string;
    content_type: string;
    cookies: Array<{
        name: string;
        value: string;
        expires: string;
        path: string;
        comment: string;
        domain: string;
        max_age: number;
        secure: boolean;
        http_only: boolean;
        version: string;
        size: number;
    }>;
    // data?: Rec<any>;
    // dns?: Rec<Array<Rec<any>>>;
    duration: number;
    error?: {
        code: string;
        http_code: number;
        // links: Rec<string>;
        message: string;
        retryable: boolean;
        doc_url?: string;
    };
    format: string;
    iframes: Array<{
        url: string;
        uri: {
            root_domain: string;
            base_url: string;
            host: string;
            scheme: string;
            query?: string;
            fragment?: string;
            port: number;
            // params?: Rec<string>;
        };
        content: string;
    }>;
    log_url: string;
    reason: string;
    // request_headers: Rec<string>;
    // response_headers: Rec<string>;
    // screenshots: Rec<{
    //     css_selector?: string;
    //     extension: string;
    //     format: string;
    //     size: number;
    //     url: string;
    // }>;
    size: number;
    // ssl?: {
    //     certs: Array<Rec<any>>;
    // };
    status: string;
    status_code: number;
    success: boolean;
    url: string;
}

export interface ScrapeResult {
    config: ConfigData;
    context: ContextData;
    result: ResultData;
    uuid: string;
    // selector: cheerio.CheerioAPI | undefined;
}

export interface ScrapeResultData {
    [key: string | number | symbol]: never;
}

export interface AccountData {
    account: {
        account_id: string;
        currency: string;
        timezone: string;
    };
    project: {
        allow_extra_usage: boolean;
        allowed_networks: Array<string>;
        budget_limit: any;
        budget_spent: any;
        concurrency_limit?: number;
        name: string;
        quota_reached: boolean;
        scrape_request_count: number;
        scrape_request_limit: number;
        tags: Array<string>;
    };
    subscription: {
        billing: {
            current_extra_scrape_request_price: { currency: string; amount: number };
            extra_scrape_request_price_per_10k: { currency: string; amount: number };
            ongoing_payment: { currency: string; amount: number };
            plan_price: { currency: string; amount: number };
        };
        extra_scrape_allowed: boolean;
        max_concurrency: number;
        period: {
            start: string;
            end: string;
        };
        plan_name: string;
        usage: {
            schedule: { current: number; limit: number };
            spider: { current: number; limit: number };
            scrape: {
                concurrent_limit: number;
                concurrent_remaining: number;
                concurrent_usage: number;
                current: number;
                extra: number;
                limit: number;
                remaining: number;
            };
        };
    };
}

export interface ScreenshotMetadata {
    extension_name: string;
    upstream_status_code: number;
    upstream_url: string;
}

export interface ScreenshotResult {
    image: ArrayBuffer;
    metadata: ScreenshotMetadata;
    result: object | null;
}

export interface ExtractionResult {
    data: string;
    content_type: string;
    data_quality?: string;
}