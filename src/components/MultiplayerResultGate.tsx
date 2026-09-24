import { getLanguage } from '../i18n/languages'
import { tr } from '../i18n/gameText'
import { useEffect, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { acknowledgeGameRoomResult, isGameRoomResultAcknowledged } from '../lib/gameRoomResults'
import { getTournamentReturnPath } from '../lib/tournament'
import '../pages/Classements.css'
import '../pages/ECGGame.css'
import './MultiplayerResultGate.css'

type PendingResult = {
  room_id: string
  game: string
  code: string
  players: { player_id: string; pseudo: string; score: number; disconnected: boolean }[]
}

const gameNames: Record<string, string> = {
  ecg: 'ECG', bacteria: 'Bacteria Slash', 'bacteria-slash': 'Bacteria Slash',
  'surgically-insane': 'Surgically Insane', 'stock-and-stack': 'Stock & Stack',
}

export default function MultiplayerResultGate({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [pending, setPending] = useState<PendingResult | null>(null)
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const [saving, setSaving] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    let running = false
    const check = async () => {
      if (running) return
      running = true
      try {
        const { data: session, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) throw sessionError
        if (!active) return
        setPlayerId(session.session?.user.id ?? null)
        if (session.session) {
          const code = pathname.match(/^\/multiplayer\/[^/]+\/game\/([^/]+)$/)?.[1] ?? null
          const { data, error: syncError } = await supabase.rpc('sync_game_room_presence', { p_active_code: code })
          if (syncError) throw syncError
          if (!active) return
          const result = data as PendingResult | null
          setPending(result && !isGameRoomResultAcknowledged(result.room_id) ? result : null)
        } else {
          setPending(null)
        }
        setError(false)
      } catch {
        // La vérification sera retentée sans bloquer la navigation.
      } finally {
        running = false
      }
    }
    const resume = () => {
      void check()
    }
    const visible = () => { if (document.visibilityState === 'visible') resume() }
    void check()
    const timer = window.setInterval(() => { void check() }, 10_000)
    window.addEventListener('online', resume)
    document.addEventListener('visibilitychange', visible)
    const { data: auth } = supabase.auth.onAuthStateChange((event) => {
      // Ne pas appeler les API Supabase depuis le callback d'authentification.
      if (active && (event === 'SIGNED_IN' || event === 'SIGNED_OUT')) setAttempt(value => value + 1)
    })
    return () => {
      active = false
      window.clearInterval(timer)
      window.removeEventListener('online', resume)
      document.removeEventListener('visibilitychange', visible)
      auth.subscription.unsubscribe()
    }
  }, [pathname, attempt])

  async function acknowledge() {
    if (!pending || saving) return
    setSaving(true)
    try {
      await acknowledgeGameRoomResult(pending.room_id)
    } catch {
      setError(true)
      return
    } finally {
      setSaving(false)
    }
    setError(false)
    // Une salle de manche de tournoi ramène au tournoi, pas au menu.
    const tournamentPath = await getTournamentReturnPath(pending.room_id)
    setPending(null)
    navigate(tournamentPath ?? '/multiplayer', { replace: true })
    setAttempt(value => value + 1)
  }

  if (pending) {
    const lost = pending.players.some(player => player.player_id === playerId && player.disconnected)
    return <section className="rankings-page multiplayer-result-page" aria-labelledby="pending-result-title">
      <div className="rankings-heading">
        <p className="rankings-eyebrow">{tr("FIN DE PARTIE · MULTIJOUEUR")}</p>
        <h1 id="pending-result-title">{lost ? <>{tr("Défaite par ")}<span>{tr("déconnexion")}</span></> : <>{tr("Partie ")}<span>{tr("interrompue")}</span></>}</h1>
        <p className="rankings-subtitle">{lost ? tr('Tu as été déclaré forfait après 30 secondes sans signal de présence.') : tr('Un joueur a été déclaré forfait après une déconnexion.')}</p>
      </div>
      <div className="ecg-leaderboard">
        <div className="ecg-leaderboard-heading">
          <div><span className="ecg-leaderboard-kicker">{tr("SALLE ")}{pending.code}</span><strong>{gameNames[pending.game] ?? pending.game}</strong></div>
        </div>
        <p className="multiplayer-result-note">{tr("Scores à l’interruption de la partie. Ils ne constituent pas un classement final.")}</p>
        <div className="ecg-ranking-list">{pending.players.map(player => <div key={player.player_id} className={`ecg-ranking-row multiplayer-result-row ${player.player_id === playerId ? 'ecg-ranking-me' : ''}`}>
          <div className="ecg-ranking-position" aria-hidden="true">•</div>
          <div className="ecg-ranking-player"><strong>{player.pseudo}</strong><span>{[player.player_id === playerId ? tr('TOI') : '', player.disconnected ? tr('FORFAIT') : ''].filter(Boolean).join(' · ')}</span></div>
          <div className="ecg-ranking-score"><strong>{player.score.toLocaleString(getLanguage())}</strong><span>{tr("PTS")}</span></div>
        </div>)}</div>
        {error && <p role="alert">{tr("Connexion impossible. Réessaie pour continuer.")}</p>}
        <div className="rankings-card-bottom"><button type="button" onClick={() => { void acknowledge() }} disabled={saving}>{saving ? tr('Enregistrement…') : tr('Retour aux jeux')} <span>→</span></button></div>
      </div>
    </section>
  }
  // Aucun conteneur intermédiaire : les pages restent des enfants du layout flex.
  // Les contrôles réseau ne masquent ni ne démontent la page en cours.
  return <>{children}</>
}
