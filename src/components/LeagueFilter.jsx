import React from 'react';

const LeagueFilter = ({ leagues, selectedLeague, onSelect, sport }) => {
    if (!leagues || leagues.length === 0) {
        return null;
    }

    return (
        <div className="mb-4">
            <div className="flex flex-wrap items-center gap-2">
                <button
                    onClick={() => onSelect(null)}
                    className={`filter-button ${
                        selectedLeague === null ? 'filter-button-active' : ''
                    }`}
                >
                    All Matches
                </button>
                {leagues.map(league => (
                    <button
                        key={league}
                        onClick={() => onSelect(league)}
                        className={`filter-button ${
                            selectedLeague === league ? 'filter-button-active' : ''
                        }`}
                    >
                        {league}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default LeagueFilter;
