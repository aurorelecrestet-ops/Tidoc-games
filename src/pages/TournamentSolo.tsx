import { tr, formatGameText } from '../i18n/gameText'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { initializePlayer } from '../lib/player'
import {
  getRoundScore,
  getTournamentGameLabel,
  getTournamentGameSpecialty,
  rankTournamentPlayers,
  TOURNAMENT_GAMES,
  TOURNAMENT_ROUND_COUNT,
} from '../lib/tournament'
import {
  abandonSoloTournament,
  getSoloLastScoredRound,
  getSoloTournament,
  getSoloTournamentGamePath,
  startSoloTournament,
  SOLO_TOURNAMENT_CUPS,
  type SoloTournamentCup,
  type SoloTournamentState,
} from '../lib/tournamentSolo'
import TournamentBoard from '../components/TournamentBoard'
import './Solo.css'
import './Tournament.css'
import './TournamentSoloCups.css'
import './ECGLobby.css'

/* ========================================
   TOURNOI SOLO — 3 ROBOTS

   1. Le joueur lance un tournoi : il occupe la
      place 1, trois robots prennent les autres.
   2. Les 4 manches s'enchaînent, dans le même
      ordre que le multijoueur. Chaque fin de
      partie enregistre le score de la manche
      (recordSoloRound est appelé par les 4 jeux).
   3. Le classement final réutilise le barème
      et le tableau du tournoi multijoueur.

   L'état vit dans le navigateur (localStorage) :
   aucun serveur n'est nécessaire.
============================================ */

function TournamentSolo() {

  const navigate = useNavigate()

  const [state, setState] =
    useState<SoloTournamentState | null>(() =>
      getSoloTournament(),
    )

  const [selectedCup, setSelectedCup] = useState<SoloTournamentCup>('interne')
  const [starting, setStarting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')


  /* ========================================
     DÉMARRER UN TOURNOI
  ======================================== */

  async function handleStart(cup: SoloTournamentCup = selectedCup) {
    if (starting) return
    setStarting(true)
    setErrorMessage('')

    try {
      /*
        Le profil donne le pseudo et l'avatar.
        Hors ligne, un identifiant local suffit :
        le tournoi solo reste entièrement jouable.
      */
      let identity = {
        id: `solo-local-${Date.now().toString(36)}`,
        pseudo: 'Toi',
        avatar: 1,
      }

      try {
        const player = await initializePlayer()
        identity = {
          id: player.id,
          pseudo: player.pseudo,
          avatar: player.avatar,
        }
      } catch {
        /* Profil indisponible : identité locale. */
      }

      setState(startSoloTournament(identity, window.localStorage, cup))
    } catch (error) {
      console.error('Erreur démarrage tournoi solo :', error)
      setErrorMessage('Impossible de lancer le tournoi solo.')
    } finally {
      setStarting(false)
    }
  }


  /* ========================================
     ABANDON
  ======================================== */

  function handleAbandon() {
    abandonSoloTournament()
    setState(null)
    setErrorMessage('')
    navigate('/tournament')
  }

  /* ========================================
     DONNÉES D'AFFICHAGE
  ======================================== */

  const currentRound = state && state.status === 'playing'
    ? state.current_round
    : null

  const currentGame = currentRound
    ? TOURNAMENT_GAMES[currentRound - 1]
    : null

  const lastScored = state ? getSoloLastScoredRound(state) : 0

  const standings = state
    ? rankTournamentPlayers(state.players)
    : []

  const activeCup = SOLO_TOURNAMENT_CUPS.find(cup => cup.id === (state?.cup ?? selectedCup)) ?? SOLO_TOURNAMENT_CUPS[1]

  const winner = state?.status === 'finished'
    ? standings[0] ?? null
    : null


  /* ========================================
     AFFICHAGE
  ======================================== */

  return (
    <section className="solo-page tournament-solo-page">

      <button
        type="button"
        className="solo-menu-back"
        onClick={() => navigate('/tournament')}
      >
        <span aria-hidden="true">←</span>
        {' '}{tr("Retour")}</button>


      <div className="solo-heading">

        <p className="solo-eyebrow">
          {tr("MODE TOURNOI • SOLO")}</p>

        <h1>
          {state && state.status === 'playing' ? (
            <>{tr("Manche ")}{currentRound} <span>/ {TOURNAMENT_ROUND_COUNT}</span></>
          ) : state ? (
            <>{tr("Classement ")}<span>{tr("final")}</span></>
          ) : (
            <>{tr("Les ")}<span>{tr("robots")}</span> {tr(" t'attendent")}</>
          )}
        </h1>

        <p className="solo-subtitle">
          {state
            ? tr('4 manches, 4 participants, le barème du multijoueur : 4, 3, 2 puis 1 point.')
            : formatGameText("{0} manches, 3 robots, un seul champion. Mêmes jeux, même classement qu'en multijoueur.", TOURNAMENT_ROUND_COUNT)}
        </p>

      </div>


      {state && (
        <p className="tournament-solo-cup-active" aria-label="Coupe sélectionnée">
          <span aria-hidden="true">{activeCup.trophy}</span> {activeCup.name} · {activeCup.difficulty}
        </p>
      )}

      {/* Les 4 manches, dans l'ordre du tournoi. */}

      <div className="tournament-rounds">
        {TOURNAMENT_GAMES.map((game, index) => (
          <div
            className={`tournament-round-badge${
              currentRound === index + 1
                ? ' is-current'
                : state && index + 1 <= lastScored
                  ? ' is-done'
                  : ''
            }`}
            key={game.game}
          >
            <span>{tr("MANCHE ")}{index + 1}</span>
            <strong>{tr(getTournamentGameLabel(game.game))}</strong>
          </div>
        ))}
      </div>


      {errorMessage && (
        <p className="tournament-error" role="alert">{tr(errorMessage)}</p>
      )}


      {/* ========================================
          SANS TOURNOI : LANCER
      ======================================== */}

      {!state && (
        <div className="tournament-solo-cups-section">
          <p className="tournament-solo-cups-intro">{tr('CHOISIS TA COUPE')}</p>
          <div className="tournament-solo-cups" role="group" aria-label="Difficulté du tournoi">
            {SOLO_TOURNAMENT_CUPS.map(cup => (
              <button
                key={cup.id}
                type="button"
                className={`tournament-solo-cup${selectedCup === cup.id ? ' is-selected' : ''}`}
                aria-pressed={selectedCup === cup.id}
                onClick={() => setSelectedCup(cup.id)}
              >
                <span className="tournament-solo-cup-trophy" aria-hidden="true">{cup.trophy}</span>
                <span className="tournament-solo-cup-difficulty">{cup.difficulty}</span>
                <strong>{cup.name}</strong>
                <span className="tournament-solo-cup-description">{cup.description}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            className="tournament-primary tournament-solo-cups-start"
            disabled={starting}
            onClick={() => { void handleStart() }}
          >
            {starting ? tr('Démarrage…') : `${tr('Lancer')} · ${activeCup.name}`}
            {!starting && <span aria-hidden="true"> →</span>}
          </button>
        </div>
      )}

      {/* ========================================
          MANCHE EN COURS
      ======================================== */}

      {state && state.status === 'playing' && currentGame && (
        <div className="tournament-round-card">
          <span className="tournament-round-kicker">
            {tr(getTournamentGameSpecialty(currentGame.game))}
          </span>

          <h2>{currentGame.label}</h2>

          <p>
            {lastScored > 0
              ? formatGameText("Manche {0} validée : les points sont ajoutés au tableau. Joue la suivante pour continuer.", lastScored)
              : tr('Joue cette manche jusqu\'à la fin : ton score et celui des robots seront comparés, puis les points seront attribués.')}
          </p>

          <button
            type="button"
            onClick={() => navigate(getSoloTournamentGamePath(currentGame.game))}
          >
            {tr("Jouer la manche")}<span>→</span>
          </button>

          <div className="tournament-results-actions">
            <button
              type="button"
              className="tournament-secondary"
              onClick={handleAbandon}
            >
              {tr("Abandonner le tournoi")}</button>
          </div>
        </div>
      )}


      {/* ========================================
          CLASSEMENT FINAL
      ======================================== */}

      {winner && (
        <div className="tournament-winner">
          <span>{tr("CHAMPION DU TOURNOI SOLO")}</span>
          <strong>{winner.player.pseudo}</strong>
          <p>
            {winner.player.total_score} {tr(winner.player.total_score === 1 ? 'point' : 'points')}
            {winner.player.player_id === state?.human_player_id ? tr(' · c’est toi !') : tr(' · le robot l’emporte…')}
          </p>
        </div>
      )}


      {state?.status === 'playing' && (
        <div className="ecg-lobby-players tournament-solo-lobby-players">
          {state.players.map(player => (
            <article
              key={player.player_id}
              className={`ecg-lobby-player ecg-lobby-${player.color}`}
            >
              <div className="ecg-lobby-player-number">{tr('JOUEUR ')}{player.player_order}</div>
              <div className="ecg-lobby-color-dot" />
              <strong>{player.pseudo}</strong>
              <span>{player.player_id === state.human_player_id ? tr('TOI') : tr('ROBOT')}</span>
            </article>
          ))}
        </div>
      )}

      {state && <TournamentBoard players={state.players} currentPlayerId={state.human_player_id} />}


      {state?.status === 'finished' && (
        <div className="tournament-standings">
          {standings.map(standing => (
            <div
              className={
                standing.player.player_id === state.human_player_id
                  ? 'tournament-standings-row is-me'
                  : 'tournament-standings-row'
              }
              key={standing.player.player_id}
            >
              <div className="tournament-standings-position" aria-label={`Place ${standing.position}`}>
                {standing.position === 1 ? '🥇' : standing.position === 2 ? '🥈' : standing.position === 3 ? '🥉' : standing.position}
              </div>

              <div className="tournament-standings-player">
                <strong>{standing.player.pseudo}</strong>
                <span>
                  {Array.from({ length: TOURNAMENT_ROUND_COUNT }, (_, index) => {
                    const score = getRoundScore(standing.player, index + 1)
                    return formatGameText("M{0} {1}", index + 1, score ? score.points : '—')
                  }).join(' · ')}
                </span>
              </div>

              <div className="tournament-standings-total">
                <strong>{standing.player.total_score}</strong>
                <span>{tr("PTS")}</span>
              </div>
            </div>
          ))}
        </div>
      )}


      {state?.status === 'finished' && (
        <div className="tournament-results-actions">
          <button
            type="button"
            className="tournament-primary"
            disabled={starting}
            onClick={() => { void handleStart(state.cup ?? 'interne') }}
          >
            {starting ? tr('Démarrage…') : tr('Rejouer un tournoi')}
            {!starting && <span>→</span>}
          </button>

          <button
            type="button"
            className="tournament-secondary"
            onClick={() => navigate('/tournament')}
          >
            {tr("Retour au menu")}</button>
        </div>
      )}

    </section>
  )
}


export default TournamentSolo


