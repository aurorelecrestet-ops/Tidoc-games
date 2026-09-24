import { tr, formatGameText } from '../i18n/gameText'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getCurrentPlayerId } from '../lib/multiplayer'
import {
  getTournamentState,
  joinTournamentSession,
  leaveTournamentSession,
  startTournamentSession,
  getTournamentGameLabel,
  TOURNAMENT_GAMES,
  type TournamentState,
} from '../lib/tournament'
import './ECGLobby.css'
import './Tournament.css'

/* ========================================
   SALLE D'ATTENTE DU TOURNOI

   1. Le premier joueur crée le tournoi, les autres
      rejoignent avec le code (ou en ouvrant le lien).
   2. L'hôte démarre dès que 2 à 4 joueurs sont prêts.
   3. L'hôte lance la première manche : chacun est
      envoyé vers la salle du premier jeu.
======================================== */

const COLORS = [
  { key: 'green', label: 'VERT' },
  { key: 'red', label: 'ROUGE' },
  { key: 'yellow', label: 'JAUNE' },
  { key: 'purple', label: 'VIOLET' },
] as const

const LOBBY_REFRESH_MS = 2_000

function TournamentLobby() {
  const navigate = useNavigate()
  const { code = '' } = useParams()
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null)
  const [state, setState] = useState<TournamentState | null>(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const joinedRef = useRef(false)
  const playerIdRef = useRef<string | null>(null)

  /* ========================================
     CHARGEMENT ET SUIVI DU LOBBY
  ======================================== */

  useEffect(() => {
    let active = true
    let joining = false
    let firstLoad = true

    async function pollLobby() {
      try {
        /* L'identité du joueur ne change pas pendant le lobby. */
        if (!playerIdRef.current) {
          playerIdRef.current = await getCurrentPlayerId()
        }
        const playerId = playerIdRef.current
        let tournament = await getTournamentState(code)
        if (!active) return

        if (!tournament) {
          setErrorMessage('Tournoi introuvable.')
          return
        }

        setCurrentPlayerId(playerId)

        const isParticipant = tournament.players.some(
          player => player.player_id === playerId,
        )

        /* Un joueur qui arrive par le lien est inscrit automatiquement. */

        if (
          !isParticipant &&
          !joining &&
          !joinedRef.current &&
          tournament.status === 'waiting'
        ) {
          joining = true
          try {
            tournament = await joinTournamentSession(code)
            if (!active) return
            joinedRef.current = true
            setErrorMessage('')
          } catch (error) {
            if (active) {
              setErrorMessage(
                error instanceof Error
                  ? error.message
                  : 'Impossible de rejoindre ce tournoi.',
              )
            }
          } finally {
            joining = false
          }
        } else if (isParticipant) {
          joinedRef.current = true
        }

        if (!active) return
        setState(tournament)

        /* Le tournoi a démarré : direction la manche en cours. */

        if (tournament.status === 'playing') {
          navigate(`/tournament/round/${tournament.code}`, { replace: true })
          return
        }

        if (tournament.status === 'finished') {
          navigate(`/tournament/results/${tournament.code}`, { replace: true })
        }
      } catch (error) {
        if (!active) return
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Impossible de charger le tournoi.',
        )
      } finally {
        if (active && firstLoad) {
          firstLoad = false
          setLoading(false)
        }
      }
    }

    void pollLobby()
    const timer = window.setInterval(() => { void pollLobby() }, LOBBY_REFRESH_MS)

    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [code, navigate])

  /* ========================================
     DÉMARRER LE TOURNOI
  ======================================== */

  async function handleStartGame() {
    if (!state || starting) return
    setStarting(true)
    setErrorMessage('')
    try {
      const started = await startTournamentSession(state.id)
      setState(started)
      navigate(`/tournament/round/${started.code}`)
    } catch (error) {
      console.error('Erreur démarrage tournoi :', error)
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Impossible de démarrer le tournoi.',
      )
    } finally {
      setStarting(false)
    }
  }

  /* ========================================
     QUITTER
     Avant le départ, le joueur est retiré de la salle.
  ======================================== */

  async function handleLeave() {
    if (state) {
      try {
        await leaveTournamentSession(state.id)
      } catch (error) {
        console.error('Erreur sortie tournoi :', error)
      }
    }
    navigate('/tournament')
  }

  return (
    <section className="ecg-lobby-page">

      <button type="button" className="ecg-lobby-back" onClick={() => { void handleLeave() }}>
        {tr("← Quitter")}</button>

      <div className="ecg-lobby-heading">
        <p className="ecg-lobby-eyebrow">{tr("MODE TOURNOI • SALLE D'ATTENTE")}</p>
        <h1>{tr("Lobby")}</h1>
        <div className="ecg-lobby-code">
          <span>{tr("CODE DU TOURNOI")}</span>
          <strong>{code.toUpperCase()}</strong>
        </div>
      </div>

      {loading && <p className="ecg-lobby-status">{tr("Chargement...")}</p>}

      {errorMessage && <p className="ecg-lobby-error" role="alert">{tr(errorMessage)}</p>}

      {state && (
        <>
          {/* Les 4 manches, dans l'ordre du tournoi. */}

          <div className="tournament-rounds">
            {TOURNAMENT_GAMES.map((game, index) => (
              <div
                className={`tournament-round-badge${
                  state.current_round === index + 1 ? ' is-current' : ''
                }`}
                key={game.game}
              >
                <span>{tr("MANCHE ")}{index + 1}</span>
                <strong>{tr(getTournamentGameLabel(game.game))}</strong>
              </div>
            ))}
          </div>

          <div className="ecg-lobby-players">
            {COLORS.map((color, index) => {
              const player = state.players.find(item => item.player_order === index + 1)
              return (
                <article className={`ecg-lobby-player ecg-lobby-${color.key}`} key={color.key}>
                  <div className="ecg-lobby-player-number">{tr("JOUEUR ")}{index + 1}</div>
                  <div className="ecg-lobby-color-dot" />
                  {player ? (
                    <>
                      <strong>{player.pseudo}</strong>
                      <span>{player.player_id === state.host_id ? formatGameText("{0} · HÔTE", tr(color.label)) : tr(color.label)}</span>
                    </>
                  ) : (
                    <>
                      <strong>{tr("En attente...")}</strong>
                      <span>{tr(color.label)}</span>
                    </>
                  )}
                </article>
              )
            })}
          </div>

          <div className="ecg-lobby-footer">
            <p>{state.players.length} / {state.max_players} {tr(" joueurs")}</p>
            {currentPlayerId === state.host_id && (
              <button
                type="button"
                disabled={state.players.length < 2 || starting}
                onClick={() => { void handleStartGame() }}
              >
                {starting ? tr('Démarrage…') : tr('Démarrer le tournoi')}
                {!starting && <span>→</span>}
              </button>
            )}
          </div>
        </>
      )}
    </section>
  )
}

export default TournamentLobby
