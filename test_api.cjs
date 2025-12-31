
const https = require('https');

const API_KEY = "cad10300-b2e8-48ae-aae6-ea1005dacf29";
const URL = `https://api.cricapi.com/v1/currentMatches?apikey=${API_KEY}&offset=0`;

console.log(`Testing API Key: ${API_KEY}`);
console.log(`URL: ${URL}`);

https.get(URL, (resp) => {
    let data = '';

    // A chunk of data has been received.
    resp.on('data', (chunk) => {
        data += chunk;
    });

    // The whole response has been received.
    resp.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log("API Status:", json.status);
            console.log("API Info:", json.info);
            if (json.data) {
                console.log(`Found ${json.data.length} matches.`);
                if (json.data.length > 0) {
                    console.log("Sample Match:", JSON.stringify(json.data[0], null, 2));
                }
            } else {
                console.log("No data found in response:", data);
            }
        } catch (e) {
            console.error("Error parsing JSON:", e.message);
            console.log("Raw Data:", data);
        }
    });

}).on("error", (err) => {
    console.log("Error: " + err.message);
});
