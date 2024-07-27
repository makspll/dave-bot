const axios = require('axios');
const { formatDateToYYYYMMDD } = require('./utils');

// retrieves connections for a specific date, returns a json object in the format:
//{
// "id": 440,
// "print_date": "2024-07-27",
// "editor": "Wyna Liu",
// "categories": [
//     {
//         "title": "OFF-TOPIC REMARKS",
//         "cards": [{ "content": "ASIDE", "position": 13 }, { "content": "DETOUR", "position": 1 }, { "content": "DIGRESSION", "position": 10 }, { "content": "TANGENT", "position": 5 }]
//     },
//     {
//         "title": "CREATE, AS RESULTS",
//         "cards": [{ "content": "BEAR", "position": 0 }, { "content": "GENERATE", "position": 9 }, { "content": "PRODUCE", "position": 12 }, { "content": "YIELD", "position": 3 }]
//     },
//     {
//         "title": "HOTTIE",
//         "cards": [{ "content": "BABE", "position": 15 }, { "content": "FOX", "position": 4 }, { "content": "SNACK", "position": 7 }, { "content": "TEN", "position": 8 }]
//     }, {
//         "title": "WORDS REPRESENTED BY THE LETTER \"R\"",
//         "cards": [{ "content": "ARE", "position": 14 }, { "content": "RADIUS", "position": 2 }, { "content": "REVERSE", "position": 6 }, { "content": "RIGHT", "position": 11 }]
//     }]
//}

async function getConnectionsForDay(date) {
    try {
        const response = await axios.get(`https://www.nytimes.com/svc/connections/v2/${formatDateToYYYYMMDD(date)}.json`);
        return response.data;
    } catch (error) {
        console.error(error);
        throw new Error('Failed to fetch connections');
    }
}

