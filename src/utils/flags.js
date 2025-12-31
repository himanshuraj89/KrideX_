
// Country name to flag emoji mapping
const countryFlags = {
    // Full country names
    'australia': '🇦🇺',
    'bangladesh': '🇧🇩',
    'england': '🇬🇧',
    'india': '🇮🇳',
    'new zealand': '🇳🇿',
    'pakistan': '🇵🇰',
    'south africa': '🇿🇦',
    'sri lanka': '🇱🇰',
    'west indies': '🇯🇲',
    'zimbabwe': '🇿🇼',
    'afghanistan': '🇦🇫',
    'ireland': '🇮🇪',
    'scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
    'netherlands': '🇳🇱',
    'nepal': '🇳🇵',
    'oman': '🇴🇲',
    'uae': '🇦🇪',
    'usa': '🇺🇸',
    'canada': '🇨🇦',
    
    // Common abbreviations and variations
    'aus': '🇦🇺',
    'ban': '🇧🇩',
    'eng': '🇬🇧',
    'ind': '🇮🇳',
    'nz': '🇳🇿',
    'pak': '🇵🇰',
    'sa': '🇿🇦',
    'rsa': '🇿🇦',
    'sl': '🇱🇰',
    'sri lanka': '🇱🇰',
    'wi': '🇯🇲',
    'windies': '🇯🇲',
    'zim': '🇿🇼',
    'afg': '🇦🇫',
    'ire': '🇮🇪',
    'sco': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
    'ned': '🇳🇱',
    'nep': '🇳🇵',
    
    // IPL Teams (League)
    'mumbai indians': '🏏',
    'chennai super kings': '🏏',
    'royal challengers bangalore': '🏏',
    'kolkata knight riders': '🏏',
    'delhi capitals': '🏏',
    'punjab kings': '🏏',
    'rajasthan royals': '🏏',
    'sunrisers hyderabad': '🏏',
    'gujarat titans': '🏏',
    'lucknow super giants': '🏏',
    
    // Other leagues
    'psl': '🏏',
    'bbl': '🏏',
    'cpl': '🏏',
    'spl': '🏏',
};

// Get flag for a team name
export function getTeamFlag(teamName) {
    if (!teamName) return '🏏';
    
    const normalized = teamName.toLowerCase().trim();
    
    // Direct match
    if (countryFlags[normalized]) {
        return countryFlags[normalized];
    }
    
    // Check if team name contains country name
    for (const [country, flag] of Object.entries(countryFlags)) {
        if (normalized.includes(country) || country.includes(normalized)) {
            return flag;
        }
    }
    
    // Check for common patterns
    if (normalized.includes('india') || normalized.includes('indian')) return '🇮🇳';
    if (normalized.includes('australia') || normalized.includes('australian')) return '🇦🇺';
    if (normalized.includes('england') || normalized.includes('english')) return '🇬🇧';
    if (normalized.includes('pakistan') || normalized.includes('pakistani')) return '🇵🇰';
    if (normalized.includes('bangladesh') || normalized.includes('bangladeshi')) return '🇧🇩';
    if (normalized.includes('sri lanka') || normalized.includes('sri lankan')) return '🇱🇰';
    if (normalized.includes('south africa') || normalized.includes('south african')) return '🇿🇦';
    if (normalized.includes('new zealand') || normalized.includes('kiwi')) return '🇳🇿';
    if (normalized.includes('west indies') || normalized.includes('windies')) return '🇯🇲';
    if (normalized.includes('afghanistan') || normalized.includes('afghan')) return '🇦🇫';
    if (normalized.includes('zimbabwe') || normalized.includes('zimbabwean')) return '🇿🇼';
    if (normalized.includes('ireland') || normalized.includes('irish')) return '🇮🇪';
    
    // Default cricket emoji for leagues/domestic teams
    return '🏏';
}
