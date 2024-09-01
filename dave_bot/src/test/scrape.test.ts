import { parseFlightData } from "../property/scrape.js"
import { readFileSync } from 'node:fs';

it("parses flight data correctly", () => {
    console.log("current work dir", process.cwd())
    const flightData = readFileSync('./test_data/scrape_data.json', 'utf-8');
    const parsed = JSON.parse(flightData);
    const result = parseFlightData(parsed.content);

    expect(result["72"]).toStrictEqual(
        {
            "address": "Room 1, London EC1V",
            "alternativeRentFrequencyLabel": "£317 pw",
            "availableFrom": "1st Oct 2024",
            "availableFromLabel": "Available from",
            "branch": "$73",
            "displayType": "standard",
            "featuredType": null,
            "features": "$74",
            "flag": "Just added",
            "gallery": "$77",
            "highlights": "$78",
            "image": "$79",
            "isFavourite": false,
            "isPremium": false,
            "lastPublishedDate": "2024-09-01T10:23:24",
            "listingId": "68203531",
            "listingType": "regular",
            "listingUris": "$7d",
            "numberOfFloorPlans": 0,
            "numberOfImages": 3,
            "numberOfVideos": 0,
            "pos": "$81",
            "price": "£1,375 pcm",
            "priceDrop": null,
            "priceTitle": "",
            "propertyType": "flat",
            "publishedOn": "1st Sep 2024",
            "publishedOnLabel": "Listed on",
            "shortPriceTitle": "£1375",
            "summaryDescription": "Room in a Shared Flat, Room 1, EC1V We are proud to offer this delightful room in a 3 bedroom, 2 bathroom shared flat in a great location. ...",
            "tags": "$7e",
            "title": "Room to rent",
            "transports": "$80",
            "underOffer": false,
        }
    )
})