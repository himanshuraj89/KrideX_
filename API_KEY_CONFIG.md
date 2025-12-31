# API Key Configuration

## How to Change Your API Key

To update your API key, simply edit the file:

**`src/config/apiConfig.js`**

Change this line:
```javascript
API_KEY: "your-old-api-key-here"
```

To:
```javascript
API_KEY: "your-new-api-key-here"
```

That's it! The new API key will be used throughout the entire application.

## Getting a New API Key

1. Visit https://www.cricapi.com/
2. Sign up or log in
3. Get your API key from the dashboard
4. Replace the API_KEY value in `src/config/apiConfig.js`
5. Save the file

## File Location

- **Config File**: `src/config/apiConfig.js`
- **Used By**: 
  - `src/services/api.js` (Cricket scorecard API)
  - `src/services/multiSportApi.js` (All sports APIs)
