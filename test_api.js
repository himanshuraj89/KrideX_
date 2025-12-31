
const API_KEY = "dfa89ae0-11aa-442d-b62f-6020e461204c";
const BASE_URL = "https://api.cricapi.com/v1/currentMatches";

async function testApi() {
    console.log(`Searching for Vijay Hazare matches...`);
    try {
        let allMatches = [];

        // Fetch 3 pages - purely to get a sample
        for (let offset of [0, 25, 50]) {
            const url = `${BASE_URL}?apikey=${API_KEY}&offset=${offset}`;
            const response = await fetch(url);
            const data = await response.json();
            if (data.status === "success" && data.data) {
                allMatches = [...allMatches, ...data.data];
            }
        }

        const domesticMatches = allMatches.filter(m =>
            m.name.toLowerCase().includes('vijay') ||
            m.series.toLowerCase().includes('vijay')
        );

        console.log(`Found ${domesticMatches.length} Vijay Hazare matches.`);

        domesticMatches.forEach((m, i) => {
            console.log(`\n[${i + 1}] Name: ${m.name}`);
            console.log(`    Status: "${m.status}"`);
            console.log(`    Started: ${m.matchStarted}, Ended: ${m.matchEnded}`);
            console.log(`    Score: ${JSON.stringify(m.score)}`);
        });

    } catch (error) {
        console.error('Fetch Error:', error);
    }
}

testApi();
