import { tr } from '../i18n/gameText'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getCurrentPlayerId } from '../lib/multiplayer'
import { startGameRoomPresence } from '../lib/gameRoomPresence'
import {
  advanceTournamentRound,
  getCurrentRound,
  getTournamentGameLabel,
  getTournamentGamePath,
  getTournamentGameSpecialty,
  getTournamentState,
  startTournamentRound,
  TOURNAMENT_ROUND_COUNT,
  type TournamentState,
} from '../lib/tournament'
import TournamentBoard from '../components/TournamentBoard'
import './Solo.css'
import './Tournament.css'

/* ========================================
   MANCHE EN COURS

   Chaque manche est une vraie salle multijoueur :
   la page affiche le jeu à jouer, envoie les
   joueurs dedans, puis enregistre les points
   lorsque la salle est terminée.

   SYNCHRO : seul l'hôte lance le jeu.
   - L'hôte voit « Lancer la partie » et entre
     dans la salle en premier.
   - Les autres joueurs attendent sur cette page
     et voient « L'hôte lance la partie… ».
     Dès que l'hôte a lancé (la salle passe en
     « playing »), leur page les envoie
     automatiquement dans la partie : tout le
     monde démarre ensemble.

   Aucun rôle privilégié pour les points : le
   premier joueur revenu déclenche
   l'enregistrement (la fonction SQL est
   idempotente).
======================================== */

const ROUND_REFRESH_MS = 2_500

function TournamentRound() {
  const navigate = useNavigate()
  const { code = '' } = useParams()
  const [state, setState] = useState<TournamentState | null>(null)
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [advancing, setAdvancing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const advancingRef = useRef(false)
  const playerIdRef = useRef<string | null>(null)

  const round = state ? getCurrentRound(state) : null
  const isParticipant = Boolean(
    state?.players.some(player => player.player_id === currentPlayerId),
  )
  const isHost = Boolean(
    state && currentPlayerId && state.host_id === currentPlayerId,
  )
  const roundIsPlaying = round?.room_status === 'playing'

  /* La présence n'est envoyée que quand la partie est lancée. */

  /* ========================================
     SUIVI DU TOURNOI
  ======================================== */

  useEffect(() => {
    let active = true
    let firstLoad = true

    async function pollRound() {
      try {
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

        if (tournament.status === 'waiting') {
          navigate(`/tournament/lobby/${tournament.code}`, { replace: true })
          return
        }

        if (tournament.status === 'finished') {
          navigate(`/tournament/results/${tournament.code}`, { replace: true })
          return
        }

        const current = getCurrentRound(tournament)

        /*
          Manche terminée : on enregistre les points puis la
          manche suivante est créée. Un seul appel part de ce
          navigateur ; les autres joueurs recevront l'état à jour.
        */

        if (
          current &&
          current.room_status === 'finished' &&
          current.status !== 'finished' &&
          !advancingRef.current
        ) {
          advancingRef.current = true
          setAdvancing(true)

          try {
            tournament = await advanceTournamentRound(tournament.id)
            if (!active) return

            if (tournament.status === 'finished') {
              navigate(`/tournament/results/${tournament.code}`, { replace: true })
              return
            }
          } catch (error) {
            /*
              Un autre joueur est déjà passé (« encore en cours ») ou le
              visiteur ne participe pas au tournoi : on réessaiera au
              prochain cycle sans alarmer le joueur.
            */
            const transient =
              error instanceof Error &&
              (error.message.includes('encore en cours') ||
                error.message.includes('ne participes pas'))

            if (!transient && active) {
              setErrorMessage(
                error instanceof Error
                  ? error.message
                  : 'Impossible de passer à la manche suivante.',
              )
            }
          } finally {
            advancingRef.current = false
            if (active) setAdvancing(false)
          }
        }

        if (!active) return
        setState(tournament)
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

    void pollRound()
    const timer = window.setInterval(() => { void pollRound() }, ROUND_REFRESH_MS)

    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [code, navigate])

  /* ========================================
     PRÉSENCE PENDANT LA MANCHE

     Le joueur qui reste sur cette page ne doit pas
     être déclaré forfait : la salle de la manche
     reçoit un signal de présence.
  ======================================== */

  useEffect(() => {
    if (!roundIsPlaying || !isParticipant || !round?.room_id) return
    const stopPresence = startGameRoomPresence(round.room_id)
    return () => stopPresence()
  }, [roundIsPlaying, isParticipant, round?.room_id])

  /* ========================================
     JOUER LA MANCHE — SYNCHRONISÉE PAR L'HÔTE

     L'hôte clique « Lancer la partie » et entre
     dans la salle en premier. Les autres joueurs
     restent sur cette page : le sondage ci-dessus
     détecte que la salle est passée en « playing »
     et les envoie automatiquement dedans.
  ======================================== */

  const [launching, setLaunching] = useState(false)

  /* L'hôte lance : la salle de la manche passe en « playing ». */

  async function handleHostLaunch() {
    if (!round || !isHost || launching) return
    setLaunching(true)
    setErrorMessage('')
    try {
      const tournament = await startTournamentRound(round.room_id)
      setState(tournament)
      navigate(`${getTournamentGamePath(round.game)}/${round.room_code}`)
    } catch (error) {
      console.error('Erreur lancement manche :', error)
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Impossible de lancer la partie.',
      )
    } finally {
      setLaunching(false)
    }
  }

  /* Les invités suivent automatiquement l'hôte. */
  const autoJoinRef = useRef(false)

  useEffect(() => {
    if (
      !isParticipant ||
      isHost ||
      !round ||
      round.room_status !== 'playing' ||
      autoJoinRef.current
    ) {
      return
    }
    autoJoinRef.current = true
    navigate(`${getTournamentGamePath(round.game)}/${round.room_code}`)
  }, [isParticipant, isHost, round, navigate])

  /* Nouvelle manche : on réarme le suivi auto. */
  useEffect(() => {
    autoJoinRef.current = false
  }, [round?.room_id])

  /* ========================================
     AFFICHAGE
  ======================================== */

  return (
    <section className="solo-page">

      <button type="button" className="solo-menu-back" onClick={() => navigate('/tournament')}>
        <span aria-hidden="true">←</span> {tr(" Quitter le tournoi")}</button>

      <div className="solo-heading">
        <p className="solo-eyebrow">{tr("MODE TOURNOI • CODE ")}{code.toUpperCase()}</p>
        <h1>
          {round
            ? <>{tr("Manche ")}{round.round} <span>/ {TOURNAMENT_ROUND_COUNT}</span></>
            : <>{tr("Tournoi ")}<span>{tr("en cours")}</span></>
          }
        </h1>
        <p className="solo-subtitle">
          {tr("Chaque manche est une partie des 4 jeux Ti'Doc. Les points dépendent du classement de la manche.")}</p>
      </div>

      {loading && <p className="ecg-lobby-status">{tr("Chargement…")}</p>}

      {errorMessage && <p className="ecg-lobby-error" role="alert">{tr(errorMessage)}</p>}

      {state && round && (
        <div className="tournament-round-card">

          <span className="tournament-round-kicker">
            {tr(getTournamentGameSpecialty(round.game))}
          </span>

          <h2>{tr(getTournamentGameLabel(round.game))}</h2>

          {round.room_status === 'waiting' ? (
            <>
              <p>
                {isHost
                  ? tr('Tu es l’hôte : lance la partie quand tout le monde est prêt, les autres joueurs te suivront automatiquement.')
                  : tr('L’hôte lance la partie… Reste sur cette page, tu entreras automatiquement dès le top départ.')}
              </p>

              {isHost ? (
                <button
                  type="button"
                  onClick={() => { void handleHostLaunch() }}
                  disabled={!isParticipant || launching}
                >
                  {launching ? tr('Lancement…') : tr('Lancer la partie')}
                  {!launching && <span>→</span>}
                </button>
              ) : (
                <p className="tournament-status">
                  {tr("En attente de l’hôte…")}</p>
              )}
            </>
          ) : round.room_status === 'playing' ? (
            <>
              <p>
                {tr("La partie est lancée ! Entre dans la salle pour jouer avec les autres.")}</p>

              <button
                type="button"
                onClick={() => {
                  navigate(`${getTournamentGamePath(round.game)}/${round.room_code}`)
                }}
                disabled={!isParticipant}
              >
                {isParticipant ? tr('Rejoindre la partie') : tr('Manche en cours')}
                {isParticipant && <span>→</span>}
              </button>
            </>
          ) : (
            <>
              <p>
                {advancing
                  ? tr('Calcul du classement et préparation de la manche suivante…')
                  : tr('Manche terminée. Le classement ci-dessous se met à jour automatiquement.')
                }
              </p>
            </>
          )}

        </div>
      )}

      {state && (
        <TournamentBoard
          players={state.players}
          currentPlayerId={currentPlayerId}
        />
      )}

    </section>
  )
}

export default TournamentRound
