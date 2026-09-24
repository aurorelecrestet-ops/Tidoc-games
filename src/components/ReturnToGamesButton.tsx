import { useTranslation } from '../hooks/useTranslation'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { acknowledgeGameRoomResult } from '../lib/gameRoomResults'
import { getTournamentReturnPath } from '../lib/tournament'

/*
  Bouton de fin de partie des quatre jeux.

  Si la salle est une manche de tournoi, le joueur revient
  au tournoi (manche suivante ou classement final) au lieu
  du menu multijoueur.
*/

export default function ReturnToGamesButton({ roomId, className }: { roomId: string; className?: string }) {
  const { t } = useTranslation()

  const navigate = useNavigate()
  const busy = useRef(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(false)

  async function returnToGames() {
    if (busy.current) return
    busy.current = true
    setSaving(true)
    setError(false)
    try {
      await acknowledgeGameRoomResult(roomId)
    } catch {
      setError(true)
      busy.current = false
      setSaving(false)
      return
    }
    // Une erreur de lecture du tournoi laisse le retour habituel.
    const tournamentPath = await getTournamentReturnPath(roomId)
    busy.current = false
    setSaving(false)
    navigate(tournamentPath ?? '/multiplayer', { replace: true })
  }

  return <>
    {error && <p role="alert">{t('results.saveError')}</p>}
    <button type="button" className={className} disabled={saving} onClick={() => { void returnToGames() }}>
      {saving ? t('results.saving') : t('results.return')} <span>→</span>
    </button>
  </>
}

