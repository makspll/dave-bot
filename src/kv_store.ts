
export async function get_kv_object(namespace: KVNamespace, key: string, cache_seconds: number, defaultVal = "{}") {
    let data = await namespace.get(key, { cacheTtl: cache_seconds });
    if (!data) {
        data = defaultVal
        await namespace.put(key, data)
    }
    console.log("Retrieved data: " + data + " at key: " + key)
    return JSON.parse(data)
}

export async function store_kv_object(namespace: KVNamespace, key: string, value: any) {
    if (value != null && value != undefined) {
        console.log("storing kv object at key", key, "with value", value)
        let data = JSON.stringify(value);
        await namespace.put(key, data)
    } else {
        console.log("Could not store KV object as it was null")
    }
}


export type Scores = {
    [game: string]: {
        [id: string]: number
    }
} & {
    "names"?: {
        [id: string]: string
    }
}

export async function get_connections_scores(namespace: KVNamespace): Promise<Scores> {
    return await get_kv_object(namespace, "connections_scores", 60)
}

export async function store_connections_scores(namespace: KVNamespace, scores: Scores) {
    return store_kv_object(namespace, "connections_scores", scores)
}

export async function get_wordle_scores(namespace: KVNamespace): Promise<Scores> {
    return await get_kv_object(namespace, "wordle_scores", 60)
}

export async function store_wordle_scores(namespace: KVNamespace, scores: Scores) {
    return store_kv_object(namespace, "wordle_scores", scores)
}

export async function get_included_ids(namespace: KVNamespace) {
    return await get_kv_object(namespace, "excluded_users", 60)
}

export async function store_included_ids(namespace: KVNamespace, ids: any) {
    return store_kv_object(namespace, "excluded_users", ids)
}

export async function get_affection_data(namespace: KVNamespace) {
    return get_kv_object(namespace, "affection_data", 60)
}

export async function store_affection_data(namespace: KVNamespace, data: any) {
    return store_kv_object(namespace, "affection_data", data)
}

export async function get_job_data(namespace: KVNamespace) {
    return get_kv_object(namespace, "jobs", 60, "[]")
}

export async function store_job_data(namespace: KVNamespace, data: any) {
    return store_kv_object(namespace, "jobs", data)
}

