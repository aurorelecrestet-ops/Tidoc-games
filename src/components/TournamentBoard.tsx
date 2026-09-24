import { tr, formatGameText } from '../i18n/gameText'
import {
  getRoundScore,
  sortTournamentPlayers,
  TOURNAMENT_GAMES,
  type TournamentPlayer,
} from '../lib/tournament'
import '../pages/Tournament.css'

/* ========================================
   TABLEAU DES SCORES DU TOURNOI

   Une colonne par manche (points gagnés)
   et le total des points de tournoi.
======================================== */

type TournamentBoardProps = {
  players: TournamentPlayer[]
  currentPlayerId: string | null
}


export default function TournamentBoard({
  players,
  currentPlayerId,
}: TournamentBoardProps) {

  const sortedPlayers =
    sortTournamentPlayers(players)


  return (
    <div className="tournament-board">

      <div className="tournament-board-head">
        <span>{tr("Joueur")}</span>

        {TOURNAMENT_GAMES.map((game, index) => (
          <span key={game.game}>
            {tr("M")}{index + 1}
          </span>
        ))}

        <span>{tr("Total")}</span>
      </div>


      {sortedPlayers.map(player => (

        <div
          className={
            `tournament-board-row${
              player.player_id === currentPlayerId
                ? ' is-me'
                : ''
            }`
          }
          key={player.player_id}
        >

          <div className="tournament-board-player">
            <span
              className={
                `tournament-board-dot tournament-dot-${player.color}`
              }
            />

            <strong>
              {player.pseudo}
            </strong>
          </div>


          {TOURNAMENT_GAMES.map((game, index) => {

            const score =
              getRoundScore(
                player,
                index + 1,
              )


            return (
              <div
                className="tournament-board-round"
                key={game.game}
              >
                {score
                  ? formatGameText("{0} pt{1}", score.points, score.points > 1 ? 's' : '')
                  : '—'
                }
              </div>
            )
          })}


          <div className="tournament-board-total">
            {player.total_score}
          </div>

        </div>

      ))}

    </div>
  )
}
