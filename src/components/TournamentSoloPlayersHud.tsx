import { useEffect, useState } from 'react'
import avatar1 from '../assets/avatars/avatar-1.png'
import avatar2 from '../assets/avatars/avatar-2.png'
import avatar3 from '../assets/avatars/avatar-3.png'
import avatar4 from '../assets/avatars/avatar-4.png'
import { computeBotScore, ensureRoundStarted, getSoloTournament } from '../lib/tournamentSolo'
import type { TournamentPlayer } from '../lib/tournament'
import { getLanguage } from '../i18n/languages'
import './TournamentSoloPlayersHud.css'

const avatarsBySlot = [avatar1, avatar2, avatar3, avatar4]

/*
  Bandeau des 4 joueurs pendant une manche de tournoi solo.
  Même language visuel que le multijoueur : pastille de couleur,
  pseudo, score live — les robots passent pour des joueurs classiques.
*/

const DISPLAY_NAMES: Record<string, string> = {
  'Robot Léo': 'Léo',
  'Robot Nina': 'Nina',
  'Robot Max': 'Max',
}

function displayPseudo(player: TournamentPlayer): string {
  return DISPLAY_NAMES[player.pseudo] ?? player.pseudo
}

function avatarFor(player: TournamentPlayer, index: number): string {
  const slot = Math.min(Math.max((player.avatar ?? index + 1) - 1, 0), avatarsBySlot.length - 1)
  return avatarsBySlot[slot]
}

type TournamentSoloPlayersHudProps = {
  active: boolean
  humanScore: number
}

export default function TournamentSoloPlayersHud({
  active,
  humanScore,
}: TournamentSoloPlayersHudProps) {
  const [elapsed, setElapsed] = useState(0)
  const [eliminated, setEliminated] = useState<Record<string, number>>({})

  useEffect(() => {
    const onBotStatus = (event: Event) => {
      setEliminated((event as CustomEvent<Record<string, number>>).detail ?? {})
    }
    window.addEventListener('tidoc-ecg-bot-status', onBotStatus)
    return () => window.removeEventListener('tidoc-ecg-bot-status', onBotStatus)
  }, [])
  const tournament = active ? getSoloTournament() : null

  useEffect(() => {
    if (!active || !tournament) return
    ensureRoundStarted()
    const started = performance.now()
    const timer = window.setInterval(() => {
      setElapsed(Math.floor((performance.now() - started) / 1000))
    }, 1000)
    return () => window.clearInterval(timer)
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [active, tournament?.id])

  if (!active || !tournament || tournament.status !== 'playing') return null

  const ordered = [...tournament.players].sort((a, b) => a.player_order - b.player_order)

  return (
    <div className="tournament-solo-players-hud" aria-label="Joueurs de la manche">
      {ordered.map((player, index) => {
        const isMe = player.player_id === tournament.human_player_id
        const finishedScore = player.scores.find(item => item.round === tournament.current_round)?.raw_score
        const botLive = computeBotScore({
          stateId: tournament.id,
          round: tournament.current_round,
          botOrder: player.player_order,
          cup: tournament.cup ?? 'interne',
          elapsed,
          humanScore,
        })
        const frozenScore = eliminated[player.color]
        const score = isMe ? humanScore : (finishedScore ?? frozenScore ?? botLive)

        return (
          <div
            key={player.player_id}
            className={`tournament-solo-hud-player${isMe ? ' is-me' : ''}`}
            style={frozenScore !== undefined && !isMe ? { opacity: 0.45 } : undefined}
          >
            <img className="tournament-solo-hud-avatar" src={avatarFor(player, index)} alt="" />
            <span className={`tournament-solo-hud-dot tournament-dot-${player.color}`} />
            <strong>{isMe ? player.pseudo : displayPseudo(player)}</strong>
            <span className="tournament-solo-hud-score">
              {score.toLocaleString(getLanguage())}
            </span>
          </div>
        )
      })}
    </div>
  )
}
