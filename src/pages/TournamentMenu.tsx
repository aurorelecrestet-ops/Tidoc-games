import { tr } from '../i18n/gameText'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  createTournamentSession,
  getOpenTournamentSessions,
  joinTournamentSession,
  type OpenTournamentSession,
} from '../lib/tournament'
import { SoloIcon, PlayersIcon } from '../components/ModeIcons'
import './Solo.css'
import './Tournament.css'

/*
  MODE TOURNOI — MENU

  Deux chemins : le tournoi solo contre des robots,
  et le tournoi multijoueur à 2-4 joueurs.
  Chaque manche est une vraie salle multijoueur, donc
  les quatre jeux existants s'enchaînent sans changement.
*/

const LIST_REFRESH_MS = 5_000

function TournamentMenu() {
  const navigate = useNavigate()
  const [view, setView] = useState<'main' | 'multiplayer'>('main')
  const [sessions, setSessions] = useState<OpenTournamentSession[]>([])
  const [roomCode, setRoomCode] = useState('')
  const [loadingList, setLoadingList] = useState(true)
  const [creating, setCreating] = useState(false)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')

  /* Tournois ouverts : rafraîchis tant que la vue est affichée. */

  useEffect(() => {
    if (view !== 'multiplayer') return
    let active = true

    async function loadSessions() {
      try {
        const openSessions = await getOpenTournamentSessions()
        if (active) setSessions(openSessions)
      } catch (err) {
        if (!active) return
        setError(err instanceof Error ? err.message : 'Impossible de charger les tournois en cours.')
      } finally {
        if (active) setLoadingList(false)
      }
    }

    void loadSessions()
    const timer = window.setInterval(() => { void loadSessions() }, LIST_REFRESH_MS)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [view])

  async function handleCreateTournament() {
    if (creating) return
    setCreating(true)
    setError('')
    try {
      const session = await createTournamentSession()
      navigate(`/tournament/lobby/${session.code}`)
    } catch (err) {
      console.error('Erreur création tournoi :', err)
      setError(err instanceof Error ? err.message : 'Impossible de créer le tournoi.')
    } finally {
      setCreating(false)
    }
  }

  async function handleJoinTournament(code: string) {
    const cleanedCode = code.trim().toUpperCase()
    if (cleanedCode.length === 0 || joining) return
    setJoining(true)
    setError('')
    try {
      const session = await joinTournamentSession(cleanedCode)
      navigate(`/tournament/lobby/${session.code}`)
    } catch (err) {
      console.error('Erreur rejoindre tournoi :', err)
      setError(err instanceof Error ? err.message : 'Impossible de rejoindre ce tournoi.')
    } finally {
      setJoining(false)
    }
  }


  /* Vue multijoueur : créer, rejoindre par code, tournois ouverts. */

  if (view === 'multiplayer') {
    return (
      <section className="solo-page">
        <button type="button" className="solo-menu-back" onClick={() => setView('main')}>
          <span aria-hidden="true">←</span> {tr(" Retour")}</button>

        <div className="solo-heading">
          <p className="solo-eyebrow">{tr("MODE TOURNOI")}</p>
          <h1>{tr("Multi")}<span>{tr("joueur")}</span></h1>
          <p className="solo-subtitle">
            {tr("Enchaîne les 4 jeux Ti'Doc à 2 ou 4 joueurs, puis découvre le classement final.")}</p>
        </div>

        <div className="tournament-actions">

          {/* CRÉER */}

          <article className="tournament-card">
            <h2>{tr("Créer un tournoi")}</h2>
            <p>
              {tr("Ouvre une salle, partage le code à tes amis et démarre la première manche dès que vous êtes 2.")}</p>
            <button
              type="button"
              className="tournament-primary"
              onClick={handleCreateTournament}
              disabled={creating}
            >
              {creating ? tr('Création…') : tr('Créer un tournoi')}
              {!creating && <span> →</span>}
            </button>
          </article>

          {/* REJOINDRE */}

          <article className="tournament-card">
            <h2>{tr("Rejoindre")}</h2>
            <p>{tr("Entre le code à 6 caractères communiqué par l'hôte.")}</p>
            <div className="tournament-join">
              <input
                className="tournament-code-input"
                type="text"
                value={roomCode}
                maxLength={6}
                placeholder={tr("CODE")}
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck={false}
                onChange={event =>
                  setRoomCode(
                    event.target.value
                      .toUpperCase()
                      .replace(/[^A-Z0-9]/g, ''),
                  )
                }
              />
              <button
                type="button"
                className="tournament-secondary"
                onClick={() => { void handleJoinTournament(roomCode) }}
                disabled={joining || roomCode.length === 0}
              >
                {joining ? tr('Connexion…') : tr('Rejoindre')}
              </button>
            </div>
          </article>

          {/* TOURNOIS OUVERTS */}

          <article className="tournament-card">
            <h2>{tr("Tournois en cours")}</h2>

            {loadingList && sessions.length === 0 ? (
              <p className="tournament-status">{tr("Chargement des tournois…")}</p>
            ) : sessions.length === 0 ? (
              <p className="tournament-status">
                {tr("Aucun tournoi en attente. Crée le premier !")}</p>
            ) : (
              <div className="tournament-list">
                {sessions.map(session => (
                  <div className="tournament-list-item" key={session.id}>
                    <div>
                      <strong>{session.code}</strong>
                      <span>
                        {session.host_pseudo}
                        {' · '}
                        {session.players} / {session.max_players} {tr(" joueurs")}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => { void handleJoinTournament(session.code) }}
                      disabled={joining || session.players >= session.max_players}
                    >
                      {session.players >= session.max_players ? tr('Complet') : tr('Rejoindre')}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </article>

          {error && (
            <p className="tournament-error" role="alert">{tr(error)}</p>
          )}

        </div>
      </section>
    )
  }

  return (
    <section className="solo-page">
      <button type="button" className="solo-menu-back" onClick={() => navigate('/')}>
        <span aria-hidden="true">←</span> {tr(" Retour à l’accueil")}</button>

      <div className="solo-heading">
        <p className="solo-eyebrow">{tr("MODE TOURNOI")}</p>
        <h1>{tr("Choisis ton ")}<span>{tr("défi")}</span></h1>
        <p className="solo-subtitle">{tr("Enchaîne les 4 jeux Ti'Doc et accumule un maximum de points.")}</p>
      </div>

      <div className="solo-games">
        <article className="solo-game-card">
          <div className="solo-card-top">
            <div className="solo-specialty-icon">
              <SoloIcon />
            </div>
          </div>
          <div className="solo-card-content">
            <p className="solo-specialty">{tr("CHAMPIONNAT")}</p>
            <h2>{tr("Solo")}</h2>
            <p className="solo-description">{tr("Affronte des robots dans un tournoi endiablé.")}</p>
          </div>
          <div className="solo-card-bottom">
            <div className="solo-best-score">
              <span>{tr("ROBOTS")}</span>
              <strong>3</strong>
            </div>
            <button type="button" onClick={() => navigate('/tournament/solo')}>
              {tr("Jouer ")}<span>→</span>
            </button>
          </div>
        </article>

        <article className="solo-game-card">
          <div className="solo-card-top">
            <div className="solo-specialty-icon">
              <PlayersIcon />
            </div>
          </div>
          <div className="solo-card-content">
            <p className="solo-specialty">{tr("COMPÉTITION")}</p>
            <h2>{tr("Multijoueur")}</h2>
            <p className="solo-description">{tr("Affronte d'autres joueurs en temps réel sur les 4 jeux.")}</p>
          </div>
          <div className="solo-card-bottom">
            <div className="solo-best-score">
              <span>{tr("JOUEURS")}</span>
              <strong>2–4</strong>
            </div>
            <button type="button" onClick={() => setView('multiplayer')}>
              {tr("Jouer ")}<span>→</span>
            </button>
          </div>
        </article>
      </div>
    </section>
  )
}

export default TournamentMenu
