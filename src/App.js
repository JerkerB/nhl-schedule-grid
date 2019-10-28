import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import moment from 'moment';
import { formatDate, parseDate } from 'react-day-picker/moment';
import TEAMS from './teams';

import DayPickerInput from 'react-day-picker/DayPickerInput';
import 'react-day-picker/lib/style.css';
import './style.css';

function App() {
  const toEl = useRef(null);
  const today = moment();
  const weekFromNow = moment().add(7, 'days');
  const [from, setFrom] = useState(today.format('YYYY-MM-DD'));
  const [to, setTo] = useState(weekFromNow.format('YYYY-MM-DD'));
  const [games, setGames] = useState([]);
  const [dates, setDates] = useState([]);

  useEffect(() => {
    (async () => {
      const response = await axios.get(`https://statsapi.web.nhl.com/api/v1/schedule?startDate=${from}&endDate=${to}`);
      const tempTeams = [];
      const tempDates = [];

      TEAMS.forEach((team, index) => {
        tempTeams.push({ ...team, games: [] });
        for (let j = 0; j < response.data.dates.length; j++) {
          tempTeams[index].games[j] = undefined;
        }
      });

      response.data.dates.forEach((date, dateIndex) => {
        tempDates.push(moment(date.date).format('MMM Do'));
        date.games.forEach(game => {
          const homeTeamId = game.teams.home.team.id;
          const awayTeamId = game.teams.away.team.id;
          const homeTeam = tempTeams.find(team => team.id === homeTeamId);
          const awayTeam = tempTeams.find(team => team.id === awayTeamId);
          homeTeam.games[dateIndex] = { against: awayTeam, isAway: false };
          awayTeam.games[dateIndex] = { against: homeTeam, isAway: true };
        });
      });

      setGames(tempTeams);
      setDates(tempDates);
    })();
  }, [from, to]);

  const renderHeaderRow = () => (
    <div className="grid-row">
      <div className="header-item">TEAM</div>
      {dates.map(date => {
        return (
          <div key={date} className="header-item">
            {date}
          </div>
        );
      })}
      <div className="header-item">GAMES</div>
    </div>
  );

  const renderTeamRows = () =>
    games.map((team, teamIndex) => {
      const totalGamesForTeam = team.games.filter(Boolean).length;
      return (
        <div className="grid-row" key={team.id}>
          <div>
            <span className="logo">{team.logo}</span>
          </div>
          {team.games.map((game, gameIndex) => {
            if (game) {
              return (
                <div key={`${teamIndex}${gameIndex}`}>
                  <span>{game.isAway ? '@ ' : ''}</span>
                  <span className="logo">{game.against ? game.against.logo : ''}</span>
                </div>
              );
            }
            return <div key={`${teamIndex}${gameIndex}`} />;
          })}
          <div>{totalGamesForTeam}</div>
        </div>
      );
    });

  const handleFromChange = day => {
    const newFrom = moment(day).format('YYYY-MM-DD');
    if (moment(newFrom).isBefore(to)) {
      setFrom(newFrom);
    }
  };

  const handleToChange = day => {
    const newTo = moment(day).format('YYYY-MM-DD');
    if (moment(newTo).isAfter(from)) {
      setTo(newTo);
    }
  };

  const toDate = moment(to).toDate();
  const fromDate = moment(from).toDate();
  const modifiers = { start: fromDate, end: toDate };

  if (games.length > 0) {
    return (
      <div>
        <h1>NHL Schedule</h1>
        <div>
          <div>
            <DayPickerInput
              value={fromDate}
              format="LL"
              formatDate={formatDate}
              parseDate={parseDate}
              onDayChange={handleFromChange}
              dayPickerProps={{
                selectedDays: [fromDate, { from: fromDate, to: toDate }],
                disabledDays: { after: toDate },
                toMonth: toDate,
                modifiers,
                onDayClick: () => toEl.current.getInput().focus()
              }}
            />
            {' — '}
            <DayPickerInput
              ref={toEl}
              value={toDate}
              format="LL"
              formatDate={formatDate}
              parseDate={parseDate}
              onDayChange={handleToChange}
              dayPickerProps={{
                selectedDays: [fromDate, { from: fromDate, to: toDate }],
                disabledDays: { before: fromDate },
                modifiers,
                month: fromDate,
                fromMonth: fromDate
              }}
            />
          </div>
          <div className="game-grid">
            {renderHeaderRow()}
            {renderTeamRows()}
          </div>
        </div>
      </div>
    );
  }

  return <div>No games</div>;
}

export default App;
