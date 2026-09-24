import { useEffect, useState } from 'react'
import avatar2 from '../assets/avatars/avatar-2.png'
import avatar3 from '../assets/avatars/avatar-3.png'
import avatar4 from '../assets/avatars/avatar-4.png'
import { getSoloTournament } from '../lib/tournamentSolo'
import { tr } from '../i18n/gameText'
import './TournamentBotsHud.css'

const avatars = [avatar2, avatar3, avatar4]

/** Multiplayer-style opponent strip used while a solo tournament round is running. */
export default function TournamentBotsHud({ active }: { active: boolean }) {
  const [elapsed, setElapsed] = useState(0)
  const tournament = active ? getSoloTournament() : null

  useEffect(() => {
    if (!active || !tournament) return
    const started = performance.now()
    const timer = window.setInterval(() => {
      setElapsed(Math.floor((performance.now() - started) / 1000))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [active, tournament?.id])

  if (!active || !tournament || tournament.status !== 'playing') return null

  const bots = tournament.players.filter(player => player.player_id !== tournament.human_player_id)

  return (
    <div className="tournament-bots-hud" aria-label={tr('Robots en jeu')}>
      <span className="tournament-bots-label">{tr('ROBOTS EN JEU')}</span>
      <div className="tournament-bots-list">
        {bots.map((bot, index) => {
          const score = bot.scores.find(item => item.round === tournament.current_round)?.raw_score
          const liveScore = score ?? Math.max(0, Math.floor(elapsed * (index + 1) * 1.7))
          return (
            <div className="tournament-bot" key={bot.player_id}>
              <img src={avatars[index] ?? avatars[0]} alt="" />
              <span className="tournament-bot-details">
                <strong>{bot.pseudo}</strong>
                <small><i /> {tr('JOUE')}</small>
              </span>
              <b>{liveScore}</b>
            </div>
          )
        })}
      </div>
    </div>
  )
}
