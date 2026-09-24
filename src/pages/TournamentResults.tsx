import { getLanguage } from '../i18n/languages'
import { tr, formatGameText } from '../i18n/gameText'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getCurrentPlayerId } from '../lib/multiplayer'
import {
  getRoundScore,
  getTotalRawScore,
  getTournamentState,
  rankTournamentPlayers,
  TOURNAMENT_ROUND_COUNT,
  type TournamentState,
} from '../lib/tournament'
import TournamentBoard from '../components/TournamentBoard'
import './Solo.css'
import './Tournament.css'
import './Classements.css'
import './ECGGame.css'

/* ========================================
   CLASSEMENT FINAL DU TOURNOI

   Total des points de tournoi sur les 4 manches,
   avec le détail des points manche par manche.
======================================== */

const RESULTS_REFRESH_MS = 5_000

function TournamentResults() {
  const navigate = useNavigate()
  const { code = '' } = useParams()
  const [state, setState] = useState<TournamentState | null>(null)
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const playerIdRef = useRef<string | null>(null)

  useEffect(() => {
    let active = true
    let firstLoad = true

    async function loadResults() {
      try {
        if (!playerIdRef.current) {
          playerIdRef.current = await getCurrentPlayerId()
        }
        const playerId = playerIdRef.current
        const tournament = await getTournamentState(code)
        if (!active) return

        if (!tournament) {
          setErrorMessage('Tournoi introuvable.')
          return
        }

        setCurrentPlayerId(playerId)

        /*
          Le tournoi n'est pas terminé : on renvoie le joueur
          là où il doit être.
        */

        if (tournament.status === 'waiting') {
          navigate(`/tournament/lobby/${tournament.code}`, { replace: true })
          return
        }

        if (tournament.status === 'playing') {
          navigate(`/tournament/round/${tournament.code}`, { replace: true })
          return
        }

        setState(tournament)
      } catch (error) {
        if (!active) return
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Impossible de charger le classement.',
        )
      } finally {
        if (active && firstLoad) {
          firstLoad = false
          setLoading(false)
        }
      }
    }

    void loadResults()
    const timer = window.setInterval(() => { void loadResults() }, RESULTS_REFRESH_MS)

    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [code, navigate])

  const standings = state ? rankTournamentPlayers(state.players) : []
  const winner = standings[0] ?? null

  /* ========================================
     AFFICHAGE
  ======================================== */

  return (
    <section className="solo-page">

      <button type="button" className="solo-menu-back" onClick={() => navigate('/tournament')}>
        <span aria-hidden="true">←</span> {tr(" Nouveau tournoi")}</button>

      <div className="rankings-heading">
        <p className="rankings-eyebrow">{tr("MODE TOURNOI • CODE ")}{code.toUpperCase()}</p>
        <h1>{tr("Classement ")}<span>{tr("final")}</span></h1>
        <p className="rankings-subtitle">
          {TOURNAMENT_ROUND_COUNT} {tr(" manches, ")}{state?.players.length ?? 0} {tr(" joueurs. Les points dépendent du classement de chaque manche.")}</p>
      </div>

      {loading && <p className="ecg-lobby-status">{tr("Chargement…")}</p>}

      {errorMessage && <p className="ecg-lobby-error" role="alert">{tr(errorMessage)}</p>}

      {winner && (
        <div className="tournament-winner">
          <span>{tr("CHAMPION DU TOURNOI")}</span>
          <strong>{winner.player.pseudo}</strong>
          <p>
            {winner.player.total_score} {tr(winner.player.total_score === 1 ? 'point' : 'points')}
            {' · '}
            {getTotalRawScore(winner.player).toLocaleString(getLanguage())} {tr(" pts marqués")}{winner.player.player_id === currentPlayerId ? tr(' · c’est toi !') : ''}
          </p>
        </div>
      )}

      {state && (
        <>
          <div className="ecg-leaderboard">

            <div className="ecg-leaderboard-heading">
              <div>
                <span className="ecg-leaderboard-kicker">{tr("CLASSEMENT GÉNÉRAL")}</span>
                <strong>{tr("Tournoi Ti'Doc")}</strong>
              </div>
            </div>

            <div className="ecg-ranking-list">
              {standings.map(standing => (
                <div
                  className={
                    `ecg-ranking-row${
                      standing.player.player_id === currentPlayerId
                        ? ' ecg-ranking-me'
                        : ''
                    }`
                  }
                  key={standing.player.player_id}
                >
                  <div className="ecg-ranking-position">{standing.position}</div>

                  <div className="ecg-ranking-player">
                    <strong>{standing.player.pseudo}</strong>
                    <span>
                      {Array.from(
                        { length: TOURNAMENT_ROUND_COUNT },
                        (_, index) => {
                          const score = getRoundScore(standing.player, index + 1)
                          return formatGameText("M{0} {1}", index + 1, score ? score.points : '—')
                        },
                      ).join(' · ')}
                    </span>
                  </div>

                  <div className="ecg-ranking-score">
                    <strong>{standing.player.total_score}</strong>
                    <span>{tr("POINTS")}</span>
                  </div>
                </div>
              ))}
            </div>

          </div>

          <TournamentBoard
            players={state.players}
            currentPlayerId={currentPlayerId}
          />

          <div className="tournament-results-actions">
            <button
              type="button"
              className="tournament-primary"
              onClick={() => navigate('/tournament')}
            >
              {tr("Créer un autre tournoi")}<span> →</span>
            </button>

            <button
              type="button"
              className="tournament-secondary"
              onClick={() => navigate('/')}
            >
              {tr("Retour à l’accueil")}</button>
          </div>
        </>
      )}

    </section>
  )
}

export default TournamentResults
