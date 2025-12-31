
const apiKey = "cad10300-b2e8-48ae-aae6-ea1005dacf29";

async function testKey() {
    // Current Matches endpoint
    const url = `https://api.cricapi.com/v1/currentMatches?apikey=${apiKey}&offset=0`;
    console.log(`Testing Key: ${apiKey}`);
    console.log(`Endpoint: ${url}`);

    try {
        const response = await fetch(url);
        const data = await response.json();

        console.log("---------------------------------------------------");
        console.log(`API Status: ${data.status}`);

        if (data.status === 'success') {
            console.log("✅ Key is WORKING!");
            console.log(`Matches found: ${data.data ? data.data.length : 0}`);
        } else {
            console.log("❌ Key is NOT working.");
            console.log(`Reason: ${data.reason || data.message || "Unknown error"}`);
            // Check for credit info if available
            if (data.info) console.log(`Info: ${JSON.stringify(data.info)}`);
        }
        console.log("---------------------------------------------------");
    } catch (err) {
        console.error("Network/Fetch Error:", err.message);
    }
}

testKey();
