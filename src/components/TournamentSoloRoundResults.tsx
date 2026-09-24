import { useNavigate } from 'react-router-dom'
import { tr } from '../i18n/gameText'
import { getSoloTournament } from '../lib/tournamentSolo'
import TournamentBoard from './TournamentBoard'
import './TournamentSoloRoundResults.css'

type Props = { game: string; score: number }

export default function TournamentSoloRoundResults({ score }: Props) {
  const navigate = useNavigate()
  const tournament = getSoloTournament()
  const round = tournament?.players[0]?.scores.find(item =>
    item.round === (tournament.status === 'finished'
      ? 4
      : tournament.current_round - 1),
  )

  return (
    <div className="tournament-solo-round-results">
      <div className="tournament-solo-round-results-card">
        <p className="tournament-solo-round-results-kicker">{tr('MANCHE TERMINÉE')}</p>
        <h2>{score.toLocaleString()} <small>{tr('points')}</small></h2>
        {round && <p>{round.points} {tr('points de tournoi')}</p>}
        {tournament && (
          <TournamentBoard players={tournament.players} currentPlayerId={tournament.human_player_id} />
        )}
        <button type="button" onClick={() => navigate('/tournament/solo')}>
          {tr(tournament?.status === 'finished' ? 'Voir le classement final' : 'Manche suivante')} →
        </button>
      </div>
    </div>
  )
}
