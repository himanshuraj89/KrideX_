
import fs from 'fs';
import path from 'path';

// Read the config file directly to avoid ESM import issues in this standalone script
const configPath = path.resolve('d:/krideX/src/config/apiConfig.js');
const configContent = fs.readFileSync(configPath, 'utf8');

// Regex to extract the key
const match = configContent.match(/CRICKET_API_KEY:\s*["']([^"']+)["']/);
const apiKey = match ? match[1] : null;

console.log(`Extracted API Key: ${apiKey}`);

if (!apiKey) {
    console.error("Could not find CRICKET_API_KEY in apiConfig.js");
    process.exit(1);
}

async function testKey() {
    const url = `https://api.cricapi.com/v1/currentMatches?apikey=${apiKey}&offset=0`;
    console.log(`Fetching: ${url}`);

    try {
        const response = await fetch(url);
        const data = await response.json();

        console.log("Status:", data.status);
        if (data.status !== 'success') {
            console.error("API Error:", data.reason || data.message || "Unknown error");
            console.log("Full response:", JSON.stringify(data, null, 2));
        } else {
            console.log(`Success! Found ${data.data ? data.data.length : 0} matches.`);
            if (data.data && data.data.length > 0) {
                console.log("Sample match:", data.data[0].name);
            }
        }
    } catch (err) {
        console.error("Fetch error:", err.message);
    }
}

testKey();
