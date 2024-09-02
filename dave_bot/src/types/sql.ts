//  Added in Migration number: 0001 
export interface User {
    user_id: number,
    alias?: string,
    consent_date: Date,
    bot: boolean
}

//  Added in Migration number: 0001 
export interface Chat {
    chat_id: number,
    alias?: string
}

export type GameType = "wordle" | "connections" | "autism_test"

// Added in Migration number: 0002
export interface GameSubmission {
    game_id: number,
    game_type: GameType,
    user_id: number,
    submission: string,
    submission_date: Date
}

// Added in Migration number: 0004

// CREATE TABLE property_snapshots (
//     url VARCHAR(255) NOT NULL,
//     search_id BIGINT NOT NULL FOREIGN KEY REFERENCES searches(search_id) ON DELETE CASCADE,
//     PRIMARY KEY (url, search_id),
//     address VARCHAR(255) NOT NULL,
//     price_per_month INTEGER NOT NULL,
//     longitude FLOAT NOT NULL,
//     latitude FLOAT NOT NULL,
//     property_type VARCHAR(20) NOT NULL,
//     summary_description TEXT NOT NULL,
//     published_on DATE NOT NULL,
//     available_from DATE NOT NULL,
// );

// CREATE TABLE searches (
//     search_id SERIAL PRIMARY KEY,
//     user_query_id BIGINT NOT NULL FOREIGN KEY REFERENCES user_queries(user_query_id) ON DELETE CASCADE,
//     search_datetime TIMESTAMP NOT NULL DEFAULT (TIMESTAMP('now')),
// );

// CREATE TABLE user_queries (
//     user_query_id BIGINT SERIAL PRIMARY KEY,
//     user_id BIGINT NOT NULL FOREIGN KEY REFERENCES users(user_id) ON DELETE CASCADE,
//     query VARCHAR(255) NOT NULL,
//     creation_date DATE NOT NULL DEFAULT (DATE('now')),
// );

export interface UserQuery {
    user_query_id: number,
    chat_id: number,
    user_id: number,
    location: string
    query: string,
    min_price: number,
    max_price: number,
    min_bedrooms: number,
    max_bedrooms: number,
    available_from: Date,
    creation_date: Date,
    target_longitude?: number | null,
    target_latitude?: number | null,
    search_radius_km?: number | null
}


export interface PropertySnapshot {
    property_id: string,
    location: string,
    url: string,
    address: string,
    price_per_month: number,
    longitude: number,
    latitude: number,
    property_type: string,
    summary_description: string,
    published_on?: Date,
    available_from?: Date,
    shown: boolean,
    comma_separated_images: string,
    num_bedrooms: number
}

export type Permission = "Manage Property Query"

export interface UserPermission {
    permission_id: number,
    user_id: number,
    permission: Permission,
    creation_date: Date
}