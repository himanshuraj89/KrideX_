
const apiKey = "c019dc8c-7cd2-4117-9a32-683581c91e03";
const url = `https://api.cricapi.com/v1/currentMatches?apikey=${apiKey}&offset=0`;

console.log(`Checking API Key...`);

fetch(url)
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            console.log(`SUCCESS: Key is working. Found ${data.data ? data.data.length : 0} matches.`);
        } else {
            console.log(`FAILURE: ${data.reason || data.message || JSON.stringify(data)}`);
        }
    })
    .catch(err => console.log(`ERROR: ${err.message}`));
