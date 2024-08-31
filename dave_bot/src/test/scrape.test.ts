import { parseFlightData } from "../property/scrape.js"
import { readFileSync } from 'node:fs';

it("parses flight data correctly", () => {
    console.log("current work dir", process.cwd())
    const flightData = readFileSync('./test_data/scrape_data.html', 'utf-8');
    const result = parseFlightData(flightData);
    console.log(result)
    expect(result).toStrictEqual(
        {
            "address": "Old Street, London EC1V",
            "alternativeRentFrequencyLabel": "£692 pw",
            "availableFrom": "1st Sep 2024",
            "availableFromLabel": "Available from",
            "branch": "$82",
            "displayType": "standard",
            "featuredType": null,
            "features": "$83",
            "flag": "Just added",
            "gallery": "$86",
            "highlights": "$87",
            "image": null,
            "isFavourite": false,
            "isPremium": false,
            "lastPublishedDate": "2024-08-31T13:29:10",
            "listingId": "68201664",
            "listingType": "regular",
            "listingUris": "$88",
            "numberOfFloorPlans": 0,
            "numberOfImages": 0,
            "numberOfVideos": 0,
            "pos": "$8b",
            "price": "£3,000 pcm",
            "priceDrop": null,
            "priceTitle": "",
            "propertyType": "flat",
            "publishedOn": "31st Aug 2024",
            "publishedOnLabel": "Listed on",
            "shortPriceTitle": "£3000",
            "summaryDescription": "2 Bed Flat, Old Street, EC1V We are proud to offer this delightful 2 bedroom, 2 bathroom flat in a great location. Photos to follow shortly. ...",
            "tags": "$89",
            "title": "2 bed flat to rent",
            "transports": "$8a",
            "underOffer": false,
        }
    )
})