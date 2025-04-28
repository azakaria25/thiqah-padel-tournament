import React, { useState, useEffect } from 'react';
import './App.css';

interface Team {
  id: string;
  name: string;
  players: string[];
}

interface Match {
  id: string;
  round: number;
  team1: Team | null;
  team2: Team | null;
  winner: Team | null;
  matchIndex: number;
}

function App() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [newTeam, setNewTeam] = useState({ name: '', players: ['', ''] });

  useEffect(() => {
    fetchTeams();
    fetchMatches();
  }, []);

  const fetchTeams = async () => {
    const response = await fetch('http://localhost:5000/api/teams');
    const data = await response.json();
    setTeams(data);
  };

  const fetchMatches = async () => {
    const response = await fetch('http://localhost:5000/api/matches');
    const data = await response.json();
    setMatches(data);
  };

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await fetch('http://localhost:5000/api/teams', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newTeam),
    });
    const data = await response.json();
    setTeams([...teams, data]);
    setNewTeam({ name: '', players: ['', ''] });
  };

  const startTournament = async () => {
    if (teams.length !== 8) {
      alert('Please register exactly 8 teams to start the tournament');
      return;
    }

    // Create initial matches for first round
    const initialMatches: Match[] = [];
    for (let i = 0; i < 4; i++) {
      initialMatches.push({
        id: `match-1-${i}`,
        round: 1,
        team1: teams[i * 2],
        team2: teams[i * 2 + 1],
        winner: null,
        matchIndex: i
      });
    }

    // Create semi-final matches
    for (let i = 0; i < 2; i++) {
      initialMatches.push({
        id: `match-2-${i}`,
        round: 2,
        team1: null,
        team2: null,
        winner: null,
        matchIndex: i
      });
    }

    // Create final match
    initialMatches.push({
      id: 'match-3-0',
      round: 3,
      team1: null,
      team2: null,
      winner: null,
      matchIndex: 0
    });

    setMatches(initialMatches);
  };

  const setWinner = async (matchId: string, winnerId: string) => {
    // Update the current match with the winner
    const updatedMatches = matches.map(match => {
      if (match.id === matchId) {
        const winner = match.team1?.id === winnerId ? match.team1 : match.team2;
        return { ...match, winner };
      }
      return match;
    });

    // Find the current match
    const currentMatch = updatedMatches.find(m => m.id === matchId);
    if (!currentMatch || !currentMatch.winner) return;

    // Find the next round match
    const nextRound = currentMatch.round + 1;
    const nextMatchIndex = Math.floor(currentMatch.matchIndex / 2);
    const nextMatch = updatedMatches.find(m => m.round === nextRound && m.matchIndex === nextMatchIndex);

    if (nextMatch) {
      // Determine if winner should be team1 or team2 in next match
      const isTeam1Slot = currentMatch.matchIndex % 2 === 0;
      
      // Update the next match with the winner
      const updatedNextMatch = {
        ...nextMatch,
        [isTeam1Slot ? 'team1' : 'team2']: currentMatch.winner
      };

      // Update all matches
      setMatches(updatedMatches.map(m => m.id === nextMatch.id ? updatedNextMatch : m));
    } else {
      setMatches(updatedMatches);
    }
  };

  const renderBracket = () => {
    if (matches.length === 0) return null;

    // Group matches by round
    const rounds = matches.reduce((acc: { [key: number]: Match[] }, match) => {
      if (!acc[match.round]) {
        acc[match.round] = [];
      }
      acc[match.round].push(match);
      return acc;
    }, {});

    // Sort rounds by number and matches by index
    const sortedRounds = Object.entries(rounds).sort((a, b) => Number(a[0]) - Number(b[0]));
    sortedRounds.forEach(([_, roundMatches]) => {
      roundMatches.sort((a, b) => a.matchIndex - b.matchIndex);
    });

    return (
      <div className="bracket">
        {sortedRounds.map(([round, roundMatches]) => (
          <div key={round} className="round">
            <h3>{round === '1' ? 'Quarter Finals' : round === '2' ? 'Semi Finals' : 'Final'}</h3>
            {roundMatches.map(match => {
              const isTeam1Winner = match.winner?.id === match.team1?.id;
              const isTeam2Winner = match.winner?.id === match.team2?.id;
              const isMatchComplete = !!match.winner;

              return (
                <div key={match.id} className="match">
                  <div 
                    className={`team ${isTeam1Winner ? 'winner' : ''} ${isMatchComplete ? 'disabled' : ''}`}
                    onClick={() => !isMatchComplete && match.team1 && setWinner(match.id, match.team1.id)}
                  >
                    {match.team1 ? match.team1.name : 'TBD'}
                  </div>
                  <div 
                    className={`team ${isTeam2Winner ? 'winner' : ''} ${isMatchComplete ? 'disabled' : ''}`}
                    onClick={() => !isMatchComplete && match.team2 && setWinner(match.id, match.team2.id)}
                  >
                    {match.team2 ? match.team2.name : 'TBD'}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <div className="logo-container">
            <img src="https://www.thiqah.sa/media/qv0drq0w/logo.png" alt="THIQAH Logo" className="logo" />
          </div>
          <h1>THIQAH Padel Tournament Management</h1>
        </div>
      </header>
      
      <div className="content">
        <div className="teams-section">
          <h2>Team Management</h2>
          <form onSubmit={handleAddTeam}>
            <input
              type="text"
              placeholder="Team Name"
              value={newTeam.name}
              onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
            />
            <input
              type="text"
              placeholder="Player 1"
              value={newTeam.players[0]}
              onChange={(e) => setNewTeam({ ...newTeam, players: [e.target.value, newTeam.players[1]] })}
            />
            <input
              type="text"
              placeholder="Player 2"
              value={newTeam.players[1]}
              onChange={(e) => setNewTeam({ ...newTeam, players: [newTeam.players[0], e.target.value] })}
            />
            <button type="submit">Register Team</button>
          </form>
          
          <div className="teams-list">
            {teams.map(team => (
              <div key={team.id} className="team-card">
                <h3>{team.name}</h3>
                <p>{team.players.join(' & ')}</p>
              </div>
            ))}
          </div>
          
          <button onClick={startTournament} disabled={teams.length < 2}>
            Initialize Tournament
          </button>
        </div>

        <div className="bracket-section">
          <h2>Tournament Bracket</h2>
          {renderBracket()}
        </div>
      </div>
    </div>
  );
}

export default App;
