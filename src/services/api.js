import { API_CONFIG } from '../config/apiConfig';

// const API_KEY = API_CONFIG.CRICKET_API_KEY || API_CONFIG.API_KEY;

export async function fetchMatchScorecard(matchId, matchStatus = '') {
    try {
        if (!matchId) {
            throw new Error('Match ID is required');
        }

        // Check cache for completed matches
        const isCompleted = matchStatus && (
            matchStatus.toLowerCase().includes('finished') ||
            matchStatus.toLowerCase().includes('completed') ||
            matchStatus.toLowerCase().includes('ended') ||
            matchStatus.toLowerCase().includes('result') ||
            matchStatus.toLowerCase().includes('won by')
        );

        const cacheKey = `kridex_scorecard_${matchId}`;

        // 0. Intercept Custom/mock matches (IDs with hyphens or non-numeric)
        // This ensures custom matches declared in customMatches.json get their data from localStorage
        if (typeof matchId === 'string' && (matchId.includes('-') || isNaN(matchId))) {
            const cached = localStorage.getItem(cacheKey);
            if (cached) return JSON.parse(cached);
        }

        if (isCompleted) {
            try {
                const cached = localStorage.getItem(cacheKey);
                if (cached) {
                    console.log(`Serving cached scorecard for ${matchId}`);
                    return JSON.parse(cached);
                }
            } catch (e) {
                console.error("Error reading scorecard cache:", e);
            }
        }

        const currentApiKey = API_CONFIG.CRICKET_API_KEY || API_CONFIG.API_KEY;
        // Use match_info for lighter data (score only, no detailed scorecard)
        const url = `https://api.cricapi.com/v1/match_info?apikey=${currentApiKey}&id=${matchId}`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.status !== "success") {
            const errorMsg = data.reason || data.message || "Failed to fetch match scorecard";
            console.warn('API Error details:', data);

            // Handle "Not Found" gracefully - return null so UI shows fallback
            if (errorMsg.includes('not found') || errorMsg.includes('ERR_ID_NOT_FOUND')) {
                return null;
            }

            // Check for specific error cases
            if (errorMsg.includes('limit') || errorMsg.includes('exceeded') || errorMsg.includes('Blocking')) {
                throw new Error('API daily limit exceeded. Please try again tomorrow or upgrade your API plan.');
            }

            throw new Error(errorMsg);
        }

        // Return the data - it might be in data.data or directly in data
        const scorecardData = data.data || data;

        // Cache if match is completed and we have valid data
        if (isCompleted && scorecardData) {
            try {
                localStorage.setItem(cacheKey, JSON.stringify(scorecardData));
            } catch (e) {
                console.warn("Failed to cache scorecard:", e);
            }
        }

        return scorecardData;
    } catch (error) {
        console.error("Error fetching match scorecard:", error);
        // Re-throw with more context
        if (error.message) {
            throw error;
        }
        throw new Error(`Failed to fetch scorecard: ${error.message || 'Unknown error'}`);
    }
}

