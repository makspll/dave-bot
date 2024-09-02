import { convertPropertyData, parseFlightData, PropertyData } from "../property/scrape.js"
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

it("converts property data 1", () => {
    let data: PropertyData = { "address": "53 Park Avenue, Wembley NW10", "alternativeRentFrequencyLabel": "£300 pw", "branch": { "branchId": 48296, "branchDetailsUri": "/find-agents/branch/right-home-estate-agents-wembley-48296/", "logoUrl": "https://st.zoocdn.com/zoopla_static_agent_logo_(300404).png", "name": "Right Home Estate Agents", "phone": "020 8166 5310" }, "displayType": "standard", "featuredType": null, "features": [{ "iconId": "bath", "content": 1 }, { "iconId": "bed", "content": 1 }], "gallery": [], "highlights": [], "image": { "src": "https://lid.zoocdn.com/645/430/00777fe39e8607d870aec65c851b764229362176.jpg", "responsiveImgList": [{ "width": 645, "src": "https://lid.zoocdn.com/645/430/00777fe39e8607d870aec65c851b764229362176.jpg" }, { "width": 354, "src": "https://lid.zoocdn.com/354/255/00777fe39e8607d870aec65c851b764229362176.jpg" }], "caption": "Pictures Coming Soon" }, "isPremium": false, "lastPublishedDate": "2024-08-31T21:22:49", "listingId": "68202954", "numberOfFloorPlans": 0, "numberOfImages": 1, "numberOfVideos": 0, "price": "£1,300 pcm", "priceTitle": "", "propertyType": "flat", "publishedOn": "31st Aug 2024", "publishedOnLabel": "Listed on", "shortPriceTitle": "£1300", "summaryDescription": "Lovely, fully furnished One Bedroom Flat is ready to move in today, located within 0.3 miles of the ever popular Hanger Lane tube station. Suited ...", "tags": [], "title": "1 bed flat to rent", "transports": [], "flag": "Just added", "underOffer": false, "availableFrom": "immediately", "availableFromLabel": "Available", "priceDrop": null, "isFavourite": false, "pos": { "lat": 51.533704, "lng": -0.29113 }, "listingType": "regular" }

    convertPropertyData(data, "1")
})

it("converts property data 2", () => {
    let data: PropertyData = { "address": "Royal Quarter, Seven Kings Way, Kingston Upon Thames KT2", "alternativeRentFrequencyLabel": "£391 pw", "branch": { "branchId": 74477, "branchDetailsUri": "/find-agents/branch/newbrix-chessington-74477/", "logoUrl": "https://st.zoocdn.com/zoopla_static_agent_logo_(750794).png", "name": "Newbrix", "phone": "020 8115 6802" }, "displayType": "standard", "featuredType": null, "features": [{ "iconId": "bath", "content": 1 }, { "iconId": "bed", "content": 1 }, { "iconId": "chair", "content": 1 }, { "iconId": "area", "content": 455 }], "gallery": ["d1feb5063e340a8eca99fba8171ec38d5f675295.jpg", "376c195c93fdcad8d299b0d0032bed05ffe6b3b4.jpg", "015de8576056fb83e1e89e783999e63ebd8938e2.jpg", "34bff7b8cbcd6eff7b76c08f4a25e04a76161f79.jpg", "5835919b5f97e40adbf9bd1d94baa258d17622a8.jpg", "0960265c90dace73738a481a91965563d9235d78.jpg", "359b7874b3f1e268e684cdf8609121e4220a37b6.jpg", "7016ba108f46f6c9a2f25bd086376ec107fc9013.jpg", "37efbfdeef969f064157066bb6fb0fef21b32472.jpg", "407b6083d7e93d3c965273d889c908284bfa9c0f.jpg"], "highlights": [], "image": { "src": "https://lid.zoocdn.com/645/430/c0da50f6cfd06357f2c15714eae53ab6acaa58a8.jpg", "responsiveImgList": [{ "width": 645, "src": "https://lid.zoocdn.com/645/430/c0da50f6cfd06357f2c15714eae53ab6acaa58a8.jpg" }, { "width": 354, "src": "https://lid.zoocdn.com/354/255/c0da50f6cfd06357f2c15714eae53ab6acaa58a8.jpg" }], "caption": null }, "isPremium": false, "lastPublishedDate": "2024-08-31T18:07:56", "listingId": "64838050", "numberOfFloorPlans": 1, "numberOfImages": 11, "numberOfVideos": 0, "price": "£1,695 pcm", "priceTitle": "", "propertyType": "flat", "publishedOn": "31st Aug 2024", "publishedOnLabel": "Listed on", "shortPriceTitle": "£1695", "summaryDescription": " Newbrix are pleased to present this spacious one bedroom luxury apartment in the prestigious Royal Quarter development. The property comprises a ...", "tags": [], "title": "1 bed flat to rent", "transports": [], "flag": "Just added", "underOffer": false, "availableFrom": "5th Oct 2024", "availableFromLabel": "Available from", "priceDrop": null, "isFavourite": false, "pos": { "lat": 51.414249, "lng": -0.303308 }, "listingType": "regular" }
    convertPropertyData(data, "1")
})

it("converts property data 3", () => {
    let data: PropertyData = { "address": "Clay, Alto, Wembley HA9", "alternativeRentFrequencyLabel": "£455 pw", "branch": { "branchId": 83458, "branchDetailsUri": "/find-agents/branch/home-made-london-83458/", "logoUrl": "https://st.zoocdn.com/zoopla_static_agent_logo_(633914).png", "name": "Home-Made", "phone": "020 8033 3965" }, "displayType": "standard", "featuredType": null, "features": [{ "iconId": "bath", "content": 1 }, null], "gallery": ["d7a88005d9ae2e60d8825d5ff0f427ac61c152e3.png", "f9eac867cb1df48f0df34b15bc64ca24ed594b62.jpg", "a186b9d1900da448516f36cc13ac33f0ffed5042.jpg", "0cc854e369a4bb1add9a451297e6f2abc4b5ce51.jpg", "0288146f6c94a170f016f6ebf0bc7cb847e6b726.jpg", "84eaf27b6d65be375c9d9bbef16e8f0660d90dd3.jpg", "b1953659c4148882c1c548db4a455561500734c2.jpg", "47b94970964af965c3a7c8ac25d9c7bfc64bb131.jpg", "d47dd700df10dbe156b4c7bdbbc70ba47e046158.jpg", "c24188a9210246f3e64a17ba238f7ce4d38025b7.jpg", "92d0a0c80fb02c62d794f98356bf20c43e85deec.jpg", "f5d8b34008a007510a904e28a477ea532daf6bf0.jpg", "fa1b215c2c058e9d2f7383bfc41ffcc7991959bd.jpg", "b1c1a88e0c87e92318b2b45fed1bc2342037f041.jpg", "2255e4610213cc22551f7d7cc9551a356e2b0cf1.jpg", "7f3b824bc5995093d62eff17a4b7e43155669de5.jpg", "c0e8cb769c5ae7a22ff986b51cf86897d7d00b91.jpg", "b88b9a0ca57a53a425a4c93a41af5118fc542502.jpg", "afc07fae5f5bca6d8d683473007b2c754ed82e12.jpg", "6dd3816c9bab120d613dfc5bcacee4e868ea78ae.jpg", "d8e0fdaf44c00e684843f27e42af1ceb707fc849.jpg", "1d5486fc5b77bf6d8afd07da5b61521be372a1e6.jpg", "328b0a01d6e3f0687f5a4ed1d87502152a35e502.jpg", "85dea9e34393acaa48dc5cea56fa59a50eb1c9f1.jpg", "2765614b3bc0aef55deeae665fb39ba5db0247a7.jpg", "e7f25ac03dfabeb86518d6cb6a8a52e2831480a8.jpg", "ac3e8deb5e8961e77bac2c2e66ee6280b7c0d64f.jpg", "390e0c46dfe11b78667bdf47349b53608ffe6ce4.jpg", "15194c0a527db322a50309919a030c364b239b2b.jpg", "82a15f5b898552497eb8c7d27b65dbb92df08b29.jpg", "adf229de9764f5a271ab3cd4e348a7bdce294642.jpg", "27e677fae41a63dd2d46c264a443062f1967ab7a.jpg", "cd35f1927ab546d7a55ae4930803bdb2dd217700.jpg", "f60321bf83f36ae4b06256f46048dd7fd089cb45.jpg", "b7dfd6b0082207e4767c8c9cf6e650810c6e06e7.jpg", "b8fa0e6213c17de6c7daca8bec0d977b3971757b.jpg"], "highlights": [], "image": { "src": "https://lid.zoocdn.com/645/430/b745b63119aa6d62938775566cf492a83fb56416.jpg", "responsiveImgList": [{ "width": 645, "src": "https://lid.zoocdn.com/645/430/b745b63119aa6d62938775566cf492a83fb56416.jpg" }, { "width": 354, "src": "https://lid.zoocdn.com/354/255/b745b63119aa6d62938775566cf492a83fb56416.jpg" }], "caption": "B7Cacaee910A05F04d19Fa4B5E37" }, "isPremium": false, "lastPublishedDate": "2024-09-02T08:13:13", "listingId": "68204922", "listingUris": { "contact": "/to-rent/contact/68204922/", "detail": "/to-rent/details/68204922/", "success": "/to-rent/contact/success/68204922/" }, "numberOfFloorPlans": 1, "numberOfImages": 37, "numberOfVideos": 0, "price": "£1,972 pcm", "priceTitle": "", "propertyType": "flat", "publishedOn": "2nd Sep 2024", "publishedOnLabel": "Listed on", "shortPriceTitle": "£1972", "summaryDescription": " Elevate your rental experience at Clay, within easy access of Wembley Park tube station for the Jubilee line and surrounded by a plethora of ...", "tags": [{ "content": "Pets allowed" }], "title": "1 bed flat to rent", "transports": [], "flag": "Just added", "underOffer": false, "availableFrom": "15th Sep 2024", "availableFromLabel": "Available from", "priceDrop": null, "isFavourite": false, "pos": { "lat": 51.55937, "lng": -0.282887 }, "listingType": "regular" }
    convertPropertyData(data, "1")
})

it("converts property data 4", () => {
    let data: PropertyData = { "address": "Tyger House, 7 New Warren Lane, Woolwich, London SE18", "alternativeRentFrequencyLabel": "£462 pw", "branch": { "branchId": 69405, "branchDetailsUri": "/find-agents/branch/vanquish-real-estate-royal-arsenal-riverside-69405/", "logoUrl": "https://st.zoocdn.com/zoopla_static_agent_logo_(596804).png", "name": "Vanquish Real Estate", "phone": "020 3746 1400" }, "displayType": "standard", "featuredType": null, "features": [{ "iconId": "bath", "content": 1 }, null, { "iconId": "chair", "content": 1 }], "gallery": [], "highlights": [], "image": null, "isPremium": false, "lastPublishedDate": "2024-09-02T09:47:24", "listingId": "65504944", "listingUris": { "contact": "/to-rent/contact/65504944/", "detail": "/to-rent/details/65504944/", "success": "/to-rent/contact/success/65504944/" }, "numberOfFloorPlans": 1, "numberOfImages": 0, "numberOfVideos": 0, "price": "£2,000 pcm", "priceTitle": "", "propertyType": "flat", "publishedOn": "2nd Sep 2024", "publishedOnLabel": "Listed on", "shortPriceTitle": "£2000", "summaryDescription": "This stunning one bedroom property in Pavilion Square is on the 4th floor and has a private balcony and is set around a central courtyard with ...", "tags": [], "title": "1 bed flat to rent", "transports": [], "flag": "Just added", "underOffer": false, "availableFrom": "8th Nov 2024", "availableFromLabel": "Available from", "priceDrop": null, "isFavourite": false, "pos": { "lat": 51.493599, "lng": 0.068957 }, "listingType": "regular" }
    convertPropertyData(data, "1")
})

it("converts property data 5", () => {
    let data: PropertyData = { "address": "George Street, Croydon CR0", "alternativeRentFrequencyLabel": "£352 pw", "branch": { "branchId": 83458, "branchDetailsUri": "/find-agents/branch/home-made-london-83458/", "logoUrl": "https://st.zoocdn.com/zoopla_static_agent_logo_(633914).png", "name": "Home-Made", "phone": "020 8033 3965" }, "displayType": "standard", "featuredType": null, "features": [{ "iconId": "bath", "content": 1 }, null], "gallery": ["a8461a728e8ea46a05ff6ba469cd2c6d2975c6e3.jpg", "0939d56db2ebda154ef3d9222bc4d71679e952fb.jpg", "45fae437b7de8a518f0bd3f29a1b01a9d9d2073e.jpg", "0d3ac0c0e6a8b809aab671e7bd85799d0ad93f82.jpg", "05096d4067b84d5a5d1ed31bb8a9d378b663c8ba.jpg", "9e5a5d78df72acbe9035e8d3e536b5c1bd1e72a9.jpg", "a5cb4f72ef6dad7830d5db57b2990b9bbe101fe4.jpg", "c6eff52feaf27b87bcadd0a8154f9900fc6ad49c.jpg", "eadc0b9091dcbe19c54414f48180a8a2e595f0f4.jpg", "eb0c3a9cd5580d1444c0d5506735e19186d1f948.jpg", "34fbddf4a86bcceba7daa265e2dc466ba72e2444.jpg", "dcce9101a7f7bda0c1555449c34a095220fdfeba.jpg", "42385dc3fd8c4f2cb81b428988c12f6c2d0d1797.jpg", "b422df42b8934788a8a944250247f8eb97f2e320.jpg", "1619ec1b3e76ec9bc85201de5c23774e856ac82a.jpg", "db4e19c5d152f774f9a4058dba3ba09e0a448716.jpg", "f57e17e16787470d6ca1a16c1141fca8f5fc97fe.jpg", "642ee4581f20e474f53de38aaee6e470d58960f7.jpg", "04d2cb4709c5cb963a04ff5b8a6210d453235fbb.jpg", "e4344e20fda47bbf355e2315eb08a14bb8aa52d0.jpg", "29cc66d690d62b2554c892e63164b1b91b5e5fb2.jpg"], "highlights": [], "image": { "src": "https://lid.zoocdn.com/645/430/8475dfb3f497a137b55b2745b5a20324fb836202.jpg", "responsiveImgList": [{ "width": 645, "src": "https://lid.zoocdn.com/645/430/8475dfb3f497a137b55b2745b5a20324fb836202.jpg" }, { "width": 354, "src": "https://lid.zoocdn.com/354/255/8475dfb3f497a137b55b2745b5a20324fb836202.jpg" }], "caption": "9B369F92Fa6Ab7cc5ee078Ca988E" }, "isPremium": false, "lastPublishedDate": "2024-09-02T08:15:11", "listingId": "68204949", "listingUris": { "contact": "/to-rent/contact/68204949/", "detail": "/to-rent/details/68204949/", "success": "/to-rent/contact/success/68204949/" }, "numberOfFloorPlans": 1, "numberOfImages": 22, "numberOfVideos": 0, "price": "£1,525 pcm", "priceTitle": "", "propertyType": "flat", "publishedOn": "2nd Sep 2024", "publishedOnLabel": "Listed on", "shortPriceTitle": "£1525", "summaryDescription": " Experience luxury living on an elevated level at Ten Degrees in Croydon. Residing in this fabulous development is more than just having an ...", "tags": [{ "content": "Pets allowed" }], "title": "1 bed flat to rent", "transports": [], "flag": "Just added", "underOffer": false, "availableFrom": "7th Sep 2024", "availableFromLabel": "Available from", "priceDrop": null, "isFavourite": false, "pos": { "lat": 51.374238, "lng": -0.094049 }, "listingType": "regular" }
    convertPropertyData(data, "1")
})

it("converts property data 6", () => {
    let data: PropertyData = { "address": "Church Path, Croydon CR0", "alternativeRentFrequencyLabel": "£312 pw", "branch": { "branchId": 2738, "branchDetailsUri": "/find-agents/branch/fieldhouse-residential-london-2738/", "logoUrl": "https://st.zoocdn.com/zoopla_static_agent_logo_(126509).png", "name": "Fieldhouse Residential", "phone": "020 3641 5270" }, "displayType": "standard", "featuredType": null, "gallery": ["b4432442b1cfdcf7dcd1abf3fc1643291741a72a.jpg", "a2ba7ed19d9848e0ec5fa81a9335870f88d126ec.jpg", "1cb4f966c9cb7ad8c8bb675946846bcbc814d90f.jpg", "aca1f0999f51f05e2bf66d22544575ab930e73ec.jpg", "397cce5f04ef1b5551ea3b9a3600a92dd6b5fe35.jpg", "fce532d976a66cad0176c8a555bf4aedafcc8f85.jpg"], "highlights": [], "image": { "src": "https://lid.zoocdn.com/645/430/bd5dc48a75866f3d22f644f13bd2f77c4e69f8a8.jpg", "responsiveImgList": [{ "width": 645, "src": "https://lid.zoocdn.com/645/430/bd5dc48a75866f3d22f644f13bd2f77c4e69f8a8.jpg" }, { "width": 354, "src": "https://lid.zoocdn.com/354/255/bd5dc48a75866f3d22f644f13bd2f77c4e69f8a8.jpg" }], "caption": null }, "isPremium": false, "lastPublishedDate": "2024-09-02T13:41:09", "listingId": "68208917", "listingUris": { "contact": "/to-rent/contact/68208917/", "detail": "/to-rent/details/68208917/", "success": "/to-rent/contact/success/68208917/" }, "numberOfFloorPlans": 1, "numberOfImages": 7, "numberOfVideos": 0, "price": "£1,350 pcm", "priceTitle": "", "propertyType": "flat", "publishedOn": "2nd Sep 2024", "publishedOnLabel": "Listed on", "shortPriceTitle": "£1350", "summaryDescription": " One-double bedroom second floor flat located in the heart of Croydon Town Centre. The property is entered from the rear of the building and ...", "tags": [], "title": "1 bed flat to rent", "transports": [], "flag": "Just added", "underOffer": false, "availableFrom": "immediately", "availableFromLabel": "Available", "priceDrop": null, "isFavourite": false, "pos": { "lat": 51.376731, "lng": -0.102647 }, "listingType": "regular" }
    convertPropertyData(data, "1")
})