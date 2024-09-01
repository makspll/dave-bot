import { parseFlightData } from "../property/scrape.js"
import { readFileSync } from 'node:fs';

it("parses flight data correctly", () => {
    console.log("current work dir", process.cwd())
    const flightData = readFileSync('./test_data/scrape_data.json', 'utf-8');
    const parsed = JSON.parse(flightData);
    const result = parseFlightData(parsed.content);
    expect(result[2]).toEqual(
        {
            address: 'Chelsea Manor Street, London SW3',
            alternativeRentFrequencyLabel: '£440 pw',
            branch: {
                branchId: 115464,
                branchDetailsUri: '/find-agents/branch/hogarth-estates-london-115464/',
                logoUrl: 'https://st.zoocdn.com/zoopla_static_agent_logo_(307083).png',
                name: 'Hogarth Estates',
                phone: '020 8128 9241'
            },
            displayType: 'standard',
            featuredType: null,
            features: [
                { iconId: 'bath', content: 1 },
                { iconId: 'bed', content: 1 },
                { iconId: 'chair', content: 1 },
                undefined
            ],
            gallery: [
                '6801345f738df5814833e42455efb7aca81b6c5f.jpg',
                '75cce9ce75173a59fd884a8ef2e7882c62cc2b1c.jpg',
                '63e6fc1726f4c03dc4f00d3725b65ce4f3e18a77.jpg',
                'd6584edfcc14d154e8930e2f5e9b0631af69316b.jpg',
                '10ae522e7303cf5fdcc622a5205cee2a9a6e2eba.jpg',
                '22c183dd8220411f9ee4a9c915db09644ea73e3c.jpg',
                'e4b396d95880e79ee8af156375e9d65908391cde.jpg',
                '24f854a3855fe060331d99f208f2ba20e9de4643.jpg',
                '8b865d9f7f1f2da25bb4c7c907ee186363131283.jpg',
                '52fbfff2b3dc53cb426d2e27aa3dc26e12250c24.jpg',
                'dc0c66b2e9b36ea7bed465c0192c980ae62e1da0.jpg',
                '6cdc2d9f840400408f0c0cc7b4ff5d313b51c3fa.jpg'
            ],
            highlights: [],
            image: {
                src: 'https://lid.zoocdn.com/645/430/24b2d0b3afc3889d77621637143b311983baa7f5.jpg',
                responsiveImgList: [{
                    src: "https://lid.zoocdn.com/645/430/24b2d0b3afc3889d77621637143b311983baa7f5.jpg",
                    width: 645
                }, {
                    src: "https://lid.zoocdn.com/354/255/24b2d0b3afc3889d77621637143b311983baa7f5.jpg",
                    width: 354
                }],
                caption: null
            },
            isPremium: false,
            lastPublishedDate: '2024-09-01T10:01:29',
            listingId: '68203511',
            listingUris: {
                contact: '/to-rent/contact/68203511/',
                detail: '/to-rent/details/68203511/',
                success: '/to-rent/contact/success/68203511/'
            },
            numberOfFloorPlans: 0,
            numberOfImages: 13,
            numberOfVideos: 0,
            price: '£1,907 pcm',
            priceTitle: '',
            propertyType: 'flat',
            publishedOn: '1st Sep 2024',
            publishedOnLabel: 'Listed on',
            shortPriceTitle: '£440',
            summaryDescription: 'Stylish studio flat located just off the Kings Road in Chelsea.',
            tags: [],
            title: '1 bed flat to rent',
            transports: [],
            flag: 'Just added',
            underOffer: false,
            availableFrom: '19th Oct 2024',
            availableFromLabel: 'Available from',
            priceDrop: null,
            isFavourite: false,
            pos: { lat: 51.488705, lng: -0.168289 },
            listingType: 'regular'
        }
    )
})