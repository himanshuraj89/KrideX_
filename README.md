# Sports Scores Dashboard 🏏

A modern, interactive sports scores dashboard built with React, Tailwind CSS, and Vite. Displays live cricket matches with real-time scores, filtering, and search functionality.

## Features

- 🎨 **Modern UI** - Beautiful, responsive design with Tailwind CSS
- 🔍 **Search & Filter** - Search matches by team, name, or status
- 📊 **Live Updates** - Real-time match status indicators
- 🎯 **Smart Sorting** - Sort by date or live matches first
- 📱 **Responsive** - Works perfectly on desktop, tablet, and mobile
- ⚡ **Fast** - Built with Vite for lightning-fast development
- 🔐 **User Authentication** - Login, Signup, and Password Reset with email verification
- 🏆 **Multi-Sport Support** - Cricket, Basketball, Football, and Hockey
- ⭐ **Follow Features** - Follow your favorite sports and matches

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure API Keys:
   - Edit `src/config/apiConfig.js` and add your API keys:
     - Cricket API key from [cricapi.com](https://www.cricapi.com/)
     - API Sports key from [api-sports.io](https://api-sports.io/)


3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
krideX/
├── src/
│   ├── components/
│   │   └── MatchCard.jsx      # Individual match card component
│   ├── services/
│   │   └── api.js             # API service for fetching matches
│   ├── App.jsx                # Main application component
│   ├── main.jsx               # React entry point
│   └── main.css               # Tailwind CSS styles
├── index.html                 # HTML template
├── package.json               # Dependencies and scripts
├── vite.config.js            # Vite configuration
├── tailwind.config.js        # Tailwind CSS configuration
└── postcss.config.js         # PostCSS configuration
```

## Usage

- **Search**: Use the search bar to find matches by team name, match name, or status
- **Filter**: Click filter buttons to show all matches, live matches, or specific match types
- **Sort**: Use the sort dropdown to organize matches by date or prioritize live matches
- **Refresh**: Click the refresh button in the header to reload match data

## Technologies Used

- React 18
- Tailwind CSS 3
- Vite 5
- CricAPI

## License

MIT
