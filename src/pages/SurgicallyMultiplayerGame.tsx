import { getLanguage } from '../i18n/languages'
import { tr } from '../i18n/gameText'
import ReturnToGamesButton from '../components/ReturnToGamesButton'
import { useGameAudio } from '../hooks/useGameAudio'
import {
  useEffect, useRef, useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  getGameRoomByCode, getRoomPlayers, getCurrentPlayerId,
  type GameRoom, type LobbyPlayer,
} from '../lib/multiplayer'

import {
  startGameRoomPresence,
} from '../lib/gameRoomPresence'
import chirMusic from '../assets/audio/chir-music.mp3'
import patientNormal from '../assets/patient-normal.png'
import patientStresse from '../assets/patient-stresse.png'
import patientGrimace from '../assets/grimace.png'
import patientNoir from '../assets/patientnoir.png'
import pinceNoire from '../assets/pincenoire.png'
import boiteImage from '../assets/boite.png'
import pinceRangeeImage from '../assets/pincerangee.png'
import pinceMainImage from '../assets/pincemain.png'
import reinD from '../assets/organes/reinD.png'
import reinDPince from '../assets/organes/reinDpince.png'
import reinG from '../assets/organes/reinG.png'
import reinGPince from '../assets/organes/reinGpince.png'
import foie from '../assets/organes/foie.png'
import foiePince from '../assets/organes/foiepince.png'
import humerus from '../assets/organes/humerus.png'
import humerusPince from '../assets/organes/humeruspince.png'
import artereInterosseuse from '../assets/organes/ainteross.png'
import artereInterosseusePince from '../assets/organes/ainterosspince.png'
import tendpat from '../assets/organes/tendpat.png'
import tendpatPince from '../assets/organes/tendpatpince.png'
import tibialant from '../assets/organes/tibialant.png'
import tibialantPince from '../assets/organes/tibialantpince.png'
import coeur from '../assets/organes/coeur.png'
import coeurPince from '../assets/organes/coeurpince.png'
import estomac from '../assets/organes/estomac.png'
import estomacPince from '../assets/organes/estomacpince.png'
import intestins from '../assets/organes/intest.png'
import intestinsPince from '../assets/organes/intestpince.png'
import poumonD from '../assets/organes/poumonD.png'
import poumonDPince from '../assets/organes/poumonDpince.png'
import poumonG from '../assets/organes/poumonG.png'
import poumonGPince from '../assets/organes/poumonGpince.png'
import thyroide from '../assets/organes/thyro.png'
import thyroidePince from '../assets/organes/thyropince.png'
import avatar1 from '../assets/avatars/avatar-1.png'
import avatar2 from '../assets/avatars/avatar-2.png'
import avatar3 from '../assets/avatars/avatar-3.png'
import avatar4 from '../assets/avatars/avatar-4.png'
import avatar5 from '../assets/avatars/avatar-5.png'
import avatar6 from '../assets/avatars/avatar-6.png'
import avatar7 from '../assets/avatars/avatar-7.png'
import avatar8 from '../assets/avatars/avatar-8.png'
import avatar9 from '../assets/avatars/avatar-9.png'
import avatar10 from '../assets/avatars/avatar-10.png'
import './ECGGame.css'
import './SurgicallyMultiplayerGame.css'

type Props = { onFullscreenChange?: (fullscreen: boolean) => void }
type Position = { x: number; y: number }
type OrganName =
  | 'Rein droit' | 'Rein gauche' | 'Humérus' | 'Foie' | 'Estomac'
  | 'Cœur' | 'Poumon droit' | 'Poumon gauche' | 'Thyroïde'
  | 'Intestins' | 'Muscle tibial antérieur'
  | 'Artère interosseuse antérieure' | 'Tendon patellaire'
type OrganData = { color: string; points: number; image: string; pince: string; css: string }
type MatchState = {
  room_id: string; turn_index: number; revision: number;
  active_player_id: string | null; target_organ: OrganName | null;
  deadline_at: string | null;
}
type RemotePince = {
  active: boolean; x: number; y: number;
  pointerType: string; carriedOrgan: OrganName | null;
}
type Phase = 'loading' | 'countdown' | 'playing' | 'results'
type RoomEndReason = 'normal' | 'disconnection'

const FIRST_TIME = 20
const FEEDBACK_DURATION = 850
const COUNTDOWN_MS = 3000
const GO_DISPLAY_MS = 650
const avatars = [avatar1, avatar2, avatar3, avatar4, avatar5, avatar6, avatar7, avatar8, avatar9, avatar10]
const ORGAN_DATA: Record<OrganName, OrganData> = {
  'Thyroïde': { color: '#5DFF00', points: 300, image: thyroide, pince: thyroidePince, css: 'surgically-organ-thyroide' },
  'Humérus': { color: '#FF0B00', points: 150, image: humerus, pince: humerusPince, css: 'surgically-organ-humerus' },
  'Poumon droit': { color: '#FF00EC', points: 125, image: poumonD, pince: poumonDPince, css: 'surgically-organ-poumon-droit' },
  'Poumon gauche': { color: '#850000', points: 125, image: poumonG, pince: poumonGPince, css: 'surgically-organ-poumon-gauche' },
  'Cœur': { color: '#857C00', points: 225, image: coeur, pince: coeurPince, css: 'surgically-organ-coeur' },
  'Foie': { color: '#006085', points: 150, image: foie, pince: foiePince, css: 'surgically-organ-foie' },
  'Estomac': { color: '#0C8500', points: 175, image: estomac, pince: estomacPince, css: 'surgically-organ-estomac' },
  'Rein droit': { color: '#850085', points: 250, image: reinD, pince: reinDPince, css: 'surgically-organ-reindroit' },
  'Rein gauche': { color: '#854000', points: 250, image: reinG, pince: reinGPince, css: 'surgically-organ-reingauche' },
  'Intestins': { color: '#00C3FF', points: 125, image: intestins, pince: intestinsPince, css: 'surgically-organ-intestins' },
  'Artère interosseuse antérieure': { color: '#E4FF00', points: 300, image: artereInterosseuse, pince: artereInterosseusePince, css: 'surgically-organ-interossant' },
  'Tendon patellaire': { color: '#FF7F00', points: 150, image: tendpat, pince: tendpatPince, css: 'surgically-organ-patellaire' },
  'Muscle tibial antérieur': { color: '#5000FF', points: 200, image: tibialant, pince: tibialantPince, css: 'surgically-organ-tibant' },
}
const organs = Object.keys(ORGAN_DATA) as OrganName[]
const colors = organs.map(name => {
  const hex = ORGAN_DATA[name].color
  return { name, r: parseInt(hex.slice(1, 3), 16), g: parseInt(hex.slice(3, 5), 16), b: parseInt(hex.slice(5, 7), 16) }
})
function organFromPixel(r: number, g: number, b: number): OrganName | null {
  if (r < 40 && g < 40 && b < 40) return null
  let best: OrganName | null = null
  let distance = Infinity
  for (const color of colors) {
    const d = Math.hypot(r - color.r, g - color.g, b - color.b)
    if (d < distance) { distance = d; best = color.name }
  }
  return distance <= 45 ? best : null
}
function durationForTurn(turn: number) { return Math.max(1, FIRST_TIME - turn * 0.5) }
const emptyPince: RemotePince = { active: false, x: 0, y: 0, pointerType: 'mouse', carriedOrgan: null }

function SurgicallyMultiplayerGame({ onFullscreenChange }: Props) {
  const { setMusicVolume, getEffectsOutput } = useGameAudio()

  const navigate = useNavigate()
  const { code = '' } = useParams()
  const [room, setRoom] = useState<GameRoom | null>(null)
  const [players, setPlayers] = useState<LobbyPlayer[]>([])
  const [myId, setMyId] = useState<string | null>(null)
  const [match, setMatch] = useState<MatchState | null>(null)
  const [phase, setPhase] = useState<Phase>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [roomEndReason, setRoomEndReason] = useState<RoomEndReason>('normal')
  const [disconnectedPlayerIds, setDisconnectedPlayerIds] = useState<string[]>([])
  const [now, setNow] = useState(Date.now())
  const [countdown, setCountdown] = useState(3)
  const [pinceActive, setPinceActive] = useState(false)
  const [pincePosition, setPincePosition] = useState<Position>({ x: 0, y: 0 })
  const [pointerType, setPointerType] = useState('mouse')
  const [carriedOrgan, setCarriedOrgan] = useState<OrganName | null>(null)
  const [remotePince, setRemotePince] = useState<RemotePince>(emptyPince)
  const [depositedOrgan, setDepositedOrgan] = useState<OrganName | null>(null)
  const [feedback, setFeedback] = useState('')
  const [hitmapReady, setHitmapReady] = useState(false)
  const [hitmapError, setHitmapError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGrimacing, setIsGrimacing] = useState(false)
  const patientRef = useRef<HTMLImageElement | null>(null)
  const pinceRef = useRef<HTMLImageElement | null>(null)
  const depositPhoneRef = useRef<HTMLImageElement | null>(null)
  const depositTabletRef = useRef<HTMLImageElement | null>(null)
  const hitmapRef = useRef<ImageData | null>(null)
  const maskRef = useRef<Position[]>([])
  const activePointerRef = useRef<number | null>(null)
  const activeRef = useRef(false)
  const carriedRef = useRef<OrganName | null>(null)
  const positionRef = useRef<Position>({ x: 0, y: 0 })
  const matchRef = useRef<MatchState | null>(null)
  const myIdRef = useRef<string | null>(null)
  const roomRef = useRef<GameRoom | null>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const sendingRef = useRef(false)
  const lastSendRef = useRef(0)
  const feedbackTimerRef = useRef<number | null>(null)
  const musicRef = useRef<HTMLAudioElement | null>(null)
  const soundRef = useRef<AudioContext | null>(null)
  const lastCountdownSoundRef = useRef<number | null>(null)
  const me = players.find(p => p.player_id === myId)
  const activePlayer = players.find(p => p.player_id === match?.active_player_id)
  const myTurn = phase === 'playing' && !!myId && match?.active_player_id === myId && !me?.eliminated
  const duration = durationForTurn(match?.turn_index ?? 0)
  const timeLeft = match?.deadline_at
    ? Math.max(0, (new Date(match.deadline_at).getTime() - now) / 1000)
    : duration
  const displayPince = myTurn
    ? { active: pinceActive, x: pincePosition.x, y: pincePosition.y, pointerType, carriedOrgan }
    : { ...remotePince, x: remotePince.x * window.innerWidth, y: remotePince.y * window.innerHeight }

  useEffect(() => { matchRef.current = match }, [match])
  useEffect(() => { myIdRef.current = myId }, [myId])
  useEffect(() => { roomRef.current = room }, [room])
  useEffect(() => {
    const immersive = phase === 'countdown' || phase === 'playing'
    onFullscreenChange?.(immersive)
    return () => onFullscreenChange?.(false)
  }, [phase, onFullscreenChange])


  /* ========================================
     DÉCOMPTE COMMUN, COMME DANS ECG

     Le début réel reste celui de Supabase :
     room.started_at + 3 secondes.
     GO reste affiché 650 ms.
  ======================================== */

  useEffect(() => {
    if (phase !== 'countdown' || !room?.started_at) {
      lastCountdownSoundRef.current = null
      return
    }

    const gameStart = new Date(room.started_at).getTime() + COUNTDOWN_MS

    function updateCountdown() {
      const remaining = gameStart - Date.now()

      if (remaining <= -GO_DISPLAY_MS) {
        setPhase('playing')
        startMusic()
        return
      }

      const nextValue = remaining <= 0
        ? 0
        : Math.min(3, Math.max(1, Math.ceil(remaining / 1000)))

      setCountdown(previous => previous === nextValue ? previous : nextValue)

      if (lastCountdownSoundRef.current !== nextValue) {
        lastCountdownSoundRef.current = nextValue
        playCountdownSound(nextValue)
      }
    }

    updateCountdown()
    const timer = window.setInterval(updateCountdown, 100)
    return () => window.clearInterval(timer)
  }, [phase, room?.started_at])

  /* iOS : le son doit être autorisé par un vrai toucher. */
  function unlockAudio() {
    try {
      const context = getAudioContext()
      if (context.state === 'suspended') void context.resume().catch(console.warn)
      if (phase === 'playing') startMusic()
      else if (phase === 'countdown') {
        // Lance la piste silencieusement sur le geste, puis démasque au GO.
        const audio = prepareMusic()
        setMusicVolume(audio, 0)
        if (audio.paused) void audio.play().catch(console.warn)
      }
    } catch (error) {
      console.warn('Activation audio indisponible :', error)
    }
  }

  useEffect(() => {
    if (phase !== 'countdown' && phase !== 'playing') return
    function enableAudio() { unlockAudio() }
    window.addEventListener('pointerdown', enableAudio, { once: true })
    return () => window.removeEventListener('pointerdown', enableAudio)
  }, [phase])

  useEffect(() => {
    if (phase !== 'playing') return
    startMusic()
  }, [phase])

  useEffect(() => {
    if (phase !== 'playing') return
    const timer = window.setInterval(() => setNow(Date.now()), 50)
    return () => window.clearInterval(timer)
  }, [phase])

  /* ========================================
     AUDIO — CHIRURGIE MULTIJOUEUR
  ======================================== */

  function getAudioContext() {

    if (!soundRef.current) {

      soundRef.current =
        new AudioContext({
          latencyHint: 'interactive',
        })

    }

    const context =
      soundRef.current

    if (context.state === 'suspended') {

      void context.resume().catch(
        error => {
          console.warn(
            'Audio bloqué :',
            error
          )
        }
      )

    }

    return context
  }


  function playTone(
    frequency: number,
    duration = 0.16,
    type: OscillatorType = 'sine'
  ) {

    try {

      const context =
        getAudioContext()

      const oscillator =
        context.createOscillator()

      const gain =
        context.createGain()

      const start =
        context.currentTime

      oscillator.type =
        type

      oscillator.frequency.value =
        frequency

      gain.gain.setValueAtTime(
        0.0001,
        start
      )

      gain.gain.exponentialRampToValueAtTime(
        0.12,
        start + 0.01
      )

      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        start + duration
      )

      oscillator.connect(
        gain
      )

      gain.connect(
        getEffectsOutput(context)
      )

      oscillator.start(
        start
      )

      oscillator.stop(
        start + duration
      )

    } catch (error) {

      console.warn(
        'Impossible de jouer le son :',
        error
      )

    }

  }


  /* ========================================
     SON DU 3, 2, 1, GO
  ======================================== */

  function playCountdownSound(
    value: number
  ) {

    const frequency =
      value === 0
        ? 980
        : value === 1
          ? 720
          : value === 2
            ? 620
            : 520

    playTone(
      frequency,
      value === 0
        ? 0.22
        : 0.11
    )

  }


  /* ========================================
     PETIT SON DE PLEURS
  ======================================== */

  function playFunnyCrySound() {

    try {

      const context =
        getAudioContext()

      const now =
        context.currentTime

      const notes = [

        {
          start: 0,
          from: 700,
          to: 480,
          duration: 0.18,
        },

        {
          start: 0.20,
          from: 760,
          to: 510,
          duration: 0.18,
        },

        {
          start: 0.40,
          from: 680,
          to: 430,
          duration: 0.24,
        },

      ]

      for (const note of notes) {

        const oscillator =
          context.createOscillator()

        const gain =
          context.createGain()

        oscillator.type =
          'triangle'

        oscillator.frequency.setValueAtTime(
          note.from,
          now + note.start
        )

        oscillator.frequency.exponentialRampToValueAtTime(
          note.to,
          now + note.start + note.duration
        )

        gain.gain.setValueAtTime(
          0.0001,
          now + note.start
        )

        gain.gain.exponentialRampToValueAtTime(
          0.085,
          now + note.start + 0.02
        )

        gain.gain.exponentialRampToValueAtTime(
          0.0001,
          now + note.start + note.duration
        )

        oscillator.connect(
          gain
        )

        gain.connect(
          getEffectsOutput(context)
        )

        oscillator.start(
          now + note.start
        )

        oscillator.stop(
          now +
          note.start +
          note.duration +
          0.02
        )

      }

    } catch (error) {

      console.warn(
        'Son de pleurs indisponible :',
        error
      )

    }

  }


  /* ========================================
     SON DE DÉFAITE
  ======================================== */

  function playHospitalFlatlineSound() {

    try {

      const context =
        getAudioContext()

      const now =
        context.currentTime

      const notes = [

        {
          frequency: 392,
          start: 0,
          duration: 0.24,
        },

        {
          frequency: 330,
          start: 0.20,
          duration: 0.28,
        },

        {
          frequency: 262,
          start: 0.43,
          duration: 0.48,
        },

      ]

      for (const note of notes) {

        const oscillator =
          context.createOscillator()

        const gain =
          context.createGain()

        oscillator.type =
          'sine'

        oscillator.frequency.value =
          note.frequency

        const start =
          now + note.start

        gain.gain.setValueAtTime(
          0.0001,
          start
        )

        gain.gain.exponentialRampToValueAtTime(
          0.045,
          start + 0.025
        )

        gain.gain.exponentialRampToValueAtTime(
          0.0001,
          start + note.duration
        )

        oscillator.connect(
          gain
        )

        gain.connect(
          getEffectsOutput(context)
        )

        oscillator.start(
          start
        )

        oscillator.stop(
          start + note.duration + 0.02
        )

      }

    } catch (error) {

      console.warn(
        'Son de défaite indisponible :',
        error
      )

    }

  }


  /* ========================================
     MUSIQUE DE FOND
  ======================================== */

  function prepareMusic() {

    if (!musicRef.current) {

      const audio =
        new Audio(chirMusic)

      audio.loop =
        true

      setMusicVolume(audio, 0.15)

      audio.preload =
        'auto'

      musicRef.current =
        audio

    }

    return musicRef.current
  }


  function startMusic() {

    const audio =
      prepareMusic()

    setMusicVolume(audio, 0.15)

    if (audio.paused) {

      void audio.play().catch(
        error => {

          console.warn(
            'Musique chirurgie bloquée :',
            error
          )

        }
      )

    }

  }


  function stopMusic() {

    const audio =
      musicRef.current

    if (!audio) {
      return
    }

    audio.pause()

    audio.currentTime =
      0

  }


  async function refreshMatch(roomId: string) {
    const { data, error } = await supabase.from('surgically_match_state')
      .select('*').eq('room_id', roomId).maybeSingle()
    if (error) throw error
    if (data) {
      const incoming = data as MatchState
      setMatch(previous => {
        if (previous && incoming.revision < previous.revision) return previous
        matchRef.current = incoming
        return incoming
      })
    }
  }
  async function refreshPlayers(roomId: string) {
    setPlayers(await getRoomPlayers(roomId))
  }
  async function refreshRoomDisconnections(roomId: string) {
    const { data, error } = await supabase.from('game_room_players')
      .select('player_id, disconnected_at').eq('room_id', roomId)
    if (error) throw error
    const ids = (data ?? []).filter(player => player.disconnected_at !== null)
      .map(player => player.player_id as string)
    setDisconnectedPlayerIds(ids)
    setRoomEndReason(ids.length > 0 ? 'disconnection' : 'normal')
  }
  async function refreshRoom(roomCode: string) {
    const fresh = await getGameRoomByCode(roomCode)
    if (!fresh) return
    roomRef.current = fresh
    setRoom(fresh)
    if (fresh.status === 'finished') {
      stopMusic()
      await Promise.all([refreshPlayers(fresh.id), refreshRoomDisconnections(fresh.id)])
      setPhase('results')
    }
  }

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const found = await getGameRoomByCode(code)
        if (!found || found.game !== 'surgically-insane') throw new Error('Partie chirurgie introuvable.')
        const [id, participants] = await Promise.all([getCurrentPlayerId(), getRoomPlayers(found.id)])
        if (!mounted) return
        if (!id || !participants.some(p => p.player_id === id)) throw new Error('Tu ne fais pas partie de cette salle.')
        roomRef.current = found; myIdRef.current = id
        setRoom(found); setPlayers(participants); setMyId(id)
        if (found.status === 'waiting') {
          navigate(`/multiplayer/surgically-insane/lobby/${found.code}`, { replace: true })
          return
        }
        if (found.status === 'playing') {
          const { error } = await supabase.rpc('initialize_surgically_match', { p_room_id: found.id })
          if (error) throw error
        }
        if (!mounted) return
        await refreshMatch(found.id)
        if (found.status === 'finished') {
          await refreshRoomDisconnections(found.id)
        }
        if (!mounted) return
        // Évite d'afficher un faux 3 si le départ commun est déjà passé.
        const gameStart = found.started_at
          ? new Date(found.started_at).getTime() + COUNTDOWN_MS
          : Date.now()
        const remaining = gameStart - Date.now()
        setCountdown(remaining <= 0 ? 0 : Math.min(3, Math.max(1, Math.ceil(remaining / 1000))))
        setPhase(found.status === 'finished' ? 'results'
          : remaining <= -GO_DISPLAY_MS ? 'playing' : 'countdown')
      } catch (error) {
        if (mounted) setErrorMessage(error instanceof Error ? error.message : 'Impossible de charger la partie.')
      }
    }
    void load()
    return () => { mounted = false }
  }, [code, navigate])

/* ========================================
   PRÉSENCE MULTIJOUEUR
   SURGICALLY INSANE

   Un signal toutes les 10 secondes
   pendant la partie.

   Aucun forfait déclenché ici.
======================================== */

useEffect(() => {

  if (
    !room?.id ||
    !myId ||
    room.status !== 'playing'
  ) {
    return
  }

  const stopPresence =
    startGameRoomPresence(
      room.id
    )

  return () => {

    stopPresence()

  }

}, [
  room?.id,
  room?.status,
  myId,
])

  useEffect(() => {
    if (!room) return
    const roomId = room.id
    const channel = supabase.channel(`surgically-game-${roomId}`)
    channelRef.current = channel
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'surgically_match_state', filter: `room_id=eq.${roomId}` },
      () => { void refreshMatch(roomId).catch(console.error) })
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'game_room_players', filter: `room_id=eq.${roomId}` },
      () => { void refreshPlayers(roomId).catch(console.error) })
    channel.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'game_rooms', filter: `id=eq.${roomId}` },
      () => { void refreshRoom(code).catch(console.error) })
    channel.on('broadcast', { event: 'pince-move' }, message => {
      const data = message.payload
      if (!data || data.playerId === myIdRef.current || data.revision !== matchRef.current?.revision ||
          data.playerId !== matchRef.current?.active_player_id) return
      setRemotePince({
        active: Boolean(data.active), x: Number(data.x) || 0, y: Number(data.y) || 0,
        pointerType: String(data.pointerType || 'mouse'),
        carriedOrgan: data.carriedOrgan in ORGAN_DATA ? data.carriedOrgan as OrganName : null,
      })
    })
    channel.subscribe()
    return () => {
      if (channelRef.current === channel) channelRef.current = null
      void supabase.removeChannel(channel)
    }
  }, [room?.id, code])

  useEffect(() => {
    if (!room) return
    const timer = window.setInterval(() => {
      void Promise.all([refreshMatch(room.id), refreshPlayers(room.id), refreshRoom(room.code)]).catch(console.error)
    }, 1500)
    return () => window.clearInterval(timer)
  }, [room?.id])

  useEffect(() => {
    for (const src of [patientNormal, patientStresse, patientGrimace, pinceMainImage,
      ...organs.flatMap(name => [ORGAN_DATA[name].image, ORGAN_DATA[name].pince])]) {
      const image = new Image(); image.src = src
    }
  }, [])
  useEffect(() => {
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = image.naturalWidth; canvas.height = image.naturalHeight
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) { setHitmapError('Impossible de lire patientnoir.png.'); return }
      ctx.drawImage(image, 0, 0)
      hitmapRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height)
      setHitmapReady(true); setHitmapError('')
    }
    image.onerror = () => setHitmapError('patientnoir.png introuvable.')
    image.src = patientNoir
    return () => { image.onload = null; image.onerror = null }
  }, [])
  useEffect(() => {
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = image.naturalWidth; canvas.height = image.naturalHeight
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) return
      ctx.drawImage(image, 0, 0)
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const points: Position[] = []
      for (let y = 0; y <data.height; y += 3) for (let x = 0; x < data.width; x += 3) {
        const k = (y * data.width + x) * 4
        if (data.data[k + 3] > 0 && data.data[k] > 180 && data.data[k + 1] < 90 && data.data[k + 2] < 90)
          points.push({ x, y })
      }
      maskRef.current = points
    }
    image.src = pinceNoire
    return () => { image.onload = null }
  }, [])

  function getOrganAt(point: Position): OrganName | null {
    const image = patientRef.current
    const data = hitmapRef.current
    if (!image || !data || !image.naturalWidth || !image.naturalHeight) return null
    const rect = image.getBoundingClientRect()
    const scale = Math.min(rect.width / image.naturalWidth, rect.height / image.naturalHeight)
    const width = image.naturalWidth * scale, height = image.naturalHeight * scale
    const left = rect.left + (rect.width - width) / 2
    const top = rect.top + (rect.height - height) / 2
    const px = (point.x - left) / width, py = (point.y - top) / height
    if (px < 0 || px >= 1 || py < 0 || py >= 1) return null
    const k = (Math.floor(py * data.height) * data.width + Math.floor(px * data.width)) * 4
    return organFromPixel(data.data[k], data.data[k + 1], data.data[k + 2])
  }
  function getOrganUnderPince(): OrganName | null {
    const image = pinceRef.current
    if (!image || !maskRef.current.length) return null
    const rect = image.getBoundingClientRect()
    const w = image.naturalWidth || rect.width, h = image.naturalHeight || rect.height
    const counts = new Map<OrganName, number>()
    for (const point of maskRef.current) {
      const organ = getOrganAt({ x: rect.left + point.x / w * rect.width, y: rect.top + point.y / h * rect.height })
      if (organ) counts.set(organ, (counts.get(organ) ?? 0) + 1)
    }
    let best: OrganName | null = null, count = 0
    for (const [organ, c] of counts) if (c > count) { best = organ; count = c }
    return best
  }

  function broadcastPince(active: boolean, position: Position, carried: OrganName | null, kind: string) {
    const channel = channelRef.current, current = matchRef.current, id = myIdRef.current
    if (!channel || !current || !id) return
    void channel.send({ type: 'broadcast', event: 'pince-move', payload: {
      playerId: id, revision: current.revision, active,
      x: position.x / window.innerWidth, y: position.y / window.innerHeight,
      pointerType: kind, carriedOrgan: carried,
    } }).catch(console.warn)
  }
  function resetPince() {
    activeRef.current = false; carriedRef.current = null; activePointerRef.current = null
    setPinceActive(false); setCarriedOrgan(null)
    positionRef.current = { x: 0, y: 0 }; setPincePosition({ x: 0, y: 0 })
  }
  useEffect(() => {
    resetPince(); setRemotePince(emptyPince); setDepositedOrgan(null)
    setFeedback(''); setIsGrimacing(false); sendingRef.current = false; setIsSubmitting(false)
    if (feedbackTimerRef.current !== null) window.clearTimeout(feedbackTimerRef.current)
  }, [match?.revision])

  async function submitAction(action: 'success' | 'error' | 'timeout') {
    const currentRoom = roomRef.current, currentMatch = matchRef.current
    if (!currentRoom || !currentMatch || sendingRef.current) return
    sendingRef.current = true; setIsSubmitting(true)
    try {
      const { error } = await supabase.rpc('surgically_take_action', {
        p_room_id: currentRoom.id, p_revision: currentMatch.revision, p_action: action,
      })
      if (error) throw error
      await Promise.all([
        refreshMatch(currentRoom.id), refreshPlayers(currentRoom.id), refreshRoom(currentRoom.code),
      ])
    } catch (error) {
      console.error(error)
      setErrorMessage(error instanceof Error ? error.message : 'Impossible de valider le tour.')
    } finally { sendingRef.current = false; setIsSubmitting(false) }
  }
  
  useEffect(() => {

    if (
      phase !== 'playing' ||
      !match?.active_player_id ||
      !match.deadline_at ||
      timeLeft > 0 ||
      sendingRef.current
    ) {
      return
    }

    /*
      Le joueur concerné entend
      le son de défaite.

      Les spectateurs ne déclenchent
      pas tous le son simultanément.
    */

    if (
      match.active_player_id ===
      myIdRef.current
    ) {

      playHospitalFlatlineSound()

      setIsGrimacing(
        true
      )

    }

    void submitAction(
      'timeout'
    )

  }, [
    phase,
    match?.revision,
    match?.deadline_at,
    timeLeft,
  ])


  function takePince(event: ReactPointerEvent<HTMLButtonElement>) {
    if (!myTurn || !hitmapReady || sendingRef.current || activeRef.current || timeLeft <= 0) return
    event.preventDefault(); event.stopPropagation()
    activeRef.current = true; activePointerRef.current = event.pointerId
    const p = { x: event.clientX, y: event.clientY }
    positionRef.current = p; setPincePosition(p)
    setPointerType(event.pointerType); setPinceActive(true)
    broadcastPince(true, p, null, event.pointerType)
  }
  function getDepositBox() {
    return window.innerWidth <= 700 ? depositPhoneRef.current : depositTabletRef.current
  }
  function insideBox(p: Position) {
    const box = getDepositBox(); if (!box) return false
    const r = box.getBoundingClientRect()
    return p.x >= r.left && p.x <= r.right && p.y >= r.top && p.y <= r.bottom
  }
  function completeMission() {
    const organ = carriedRef.current
    if (!organ || sendingRef.current || !myTurn) return
    broadcastPince(false, positionRef.current, null, pointerType)
    resetPince(); setDepositedOrgan(organ)
    setFeedback(`+${ORGAN_DATA[organ].points} POINTS`); playTone(1100)
    void submitAction('success')
    if (feedbackTimerRef.current !== null) window.clearTimeout(feedbackTimerRef.current)
    feedbackTimerRef.current = window.setTimeout(() => { setDepositedOrgan(null); setFeedback('') }, FEEDBACK_DURATION)
  }
  
  function eliminateOnError() {

    if (
      sendingRef.current ||
      !myTurn
    ) {
      return
    }

    broadcastPince(
      false,
      positionRef.current,
      null,
      pointerType
    )

    resetPince()

    setFeedback(
      'AÏE !'
    )

    setIsGrimacing(
      true
    )

    playFunnyCrySound()

    playHospitalFlatlineSound()

    void submitAction(
      'error'
    )

  }


  useEffect(() => {
    if (!myTurn || !pinceActive) return
    const move = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' && event.pointerId !== activePointerRef.current) return
      const p = { x: event.clientX, y: event.clientY }
      positionRef.current = p; setPincePosition(p); setPointerType(event.pointerType)
      if (performance.now() - lastSendRef.current >= 50) {
        lastSendRef.current = performance.now()
        broadcastPince(true, p, carriedRef.current, event.pointerType)
      }
      if (carriedRef.current && insideBox(p)) completeMission()
    }
    const release = (event: PointerEvent) => {
      if (event.pointerId === activePointerRef.current) activePointerRef.current = null
    }
    const resume = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' || activePointerRef.current !== null) return
      activePointerRef.current = event.pointerId
      positionRef.current = { x: event.clientX, y: event.clientY }
      setPincePosition({ ...positionRef.current })
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', release)
    window.addEventListener('pointercancel', release)
    window.addEventListener('pointerdown', resume)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', release)
      window.removeEventListener('pointercancel', release)
      window.removeEventListener('pointerdown', resume)
    }
  }, [myTurn, pinceActive, match?.revision])
  function squeezePince() {
    if (!myTurn || !activeRef.current || carriedRef.current || sendingRef.current || timeLeft <= 0) return
    const organ = getOrganUnderPince()
    if (!organ || organ !== matchRef.current?.target_organ) { eliminateOnError(); return }
    carriedRef.current = organ; setCarriedOrgan(organ); playTone(760)
    broadcastPince(true, positionRef.current, organ, pointerType)
  }
  useEffect(() => () => {
    stopMusic()
    if (feedbackTimerRef.current !== null) window.clearTimeout(feedbackTimerRef.current)
    void soundRef.current?.close()
  }, [])

  if (errorMessage && (!room || !match)) return (
    <section className="surgically-multi-message"><h2>{tr("Partie indisponible")}</h2><p>{tr(errorMessage)}</p>
      <button onClick={() => navigate('/multiplayer/surgically-insane')}>{tr("Retour au menu")}</button></section>
  )
  if (phase === 'loading' || !room) return (
    <section className="surgically-multi-message">{tr("Chargement de la partie…")}</section>
  )
  const ordered = [...players].sort((a, b) => a.player_order - b.player_order)
  if (phase === 'results') {
    const ranking = [...players].sort((a, b) => b.score - a.score || a.player_order - b.player_order)
    const isDisconnectionEnd = roomEndReason === 'disconnection'
    const isCurrentPlayerDisconnected = isDisconnectionEnd && !!myId && disconnectedPlayerIds.includes(myId)
    return (
      <section className="surgically-multi-results">
        <p className="surgically-multi-eyebrow">{isDisconnectionEnd ? tr('PARTIE INTERROMPUE') : tr('PARTIE TERMINÉE')}</p>
        <h1>{isCurrentPlayerDisconnected ? tr('Game Over') : isDisconnectionEnd ? tr('Partie terminée') : <>{tr("Classement de la ")}<span>{tr("partie")}</span></>}</h1>
        {isDisconnectionEnd && <p className="surgically-multi-interruption-message">
          {isCurrentPlayerDisconnected
            ? tr('Vous avez été déclaré forfait après une déconnexion de plus de 30 secondes.')
            : tr('Un joueur a quitté la partie. La partie a été interrompue.')}
        </p>}
        <div className="surgically-multi-results-card">
          <p className="surgically-multi-eyebrow">{tr("SURGICALLY INSANE • MULTIJOUEUR")}</p>
          {isDisconnectionEnd && <>
            <p>{tr("Scores enregistrés au moment de l’interruption.")}</p>
            <p>{tr("La partie a été interrompue : les scores ci-dessous ne constituent pas un classement final.")}</p>
          </>}
          <div className="ecg-ranking-list">{ranking.map((player, i) => (
            <div key={player.player_id} className={`ecg-ranking-row ${i < 3 ? `ecg-ranking-top ecg-ranking-${i + 1}` : ''} ${player.player_id === myId ? 'ecg-ranking-me' : ''}`}>
              <div className="ecg-ranking-position">{isDisconnectionEnd ? '•' : ['🥇','🥈','🥉'][i] ?? i + 1}</div>
              <img className="ecg-ranking-avatar" src={avatars[Math.max(0, Math.min(9, player.avatar - 1))]} alt="" />
              <div className="ecg-ranking-player"><strong>{player.pseudo}</strong>{player.player_id === myId && <span>{tr("TOI")}</span>}</div>
              <div className="ecg-ranking-score"><strong>{player.score.toLocaleString(getLanguage())}</strong><span>{tr("PTS")}</span></div>
            </div>
          ))}</div>
          <ReturnToGamesButton roomId={room!.id} className="surgically-multi-return" />
        </div>
      </section>
    )
  }
  return (
    <section className={`surgically-page surgically-state-${phase === 'playing' ? 'playing' : 'countdown'} surgically-multi-game`}>
      <div className="surgically-patient-wrap">
        <img ref={patientRef} className="surgically-patient"
          src={isGrimacing ? patientGrimace : displayPince.active ? patientStresse : patientNormal}
          alt={tr("Patient sur un brancard")} draggable={false} />
      </div>
      {phase === 'playing' && hitmapReady && <div className="surgically-organs-group">{
        organs.map(organ => displayPince.carriedOrgan === organ || depositedOrgan === organ ? null :
          <img key={organ} className={`surgically-organ ${ORGAN_DATA[organ].css}`}
            src={ORGAN_DATA[organ].image} alt="" draggable={false} />)
      }</div>}
      {phase === 'playing' && <div className="surgically-boxes">
        <img ref={depositTabletRef} className="surgically-box surgically-box-1" src={boiteImage} alt="" draggable={false} />
        <img ref={depositPhoneRef} className="surgically-box surgically-box-2" src={boiteImage} alt="" draggable={false} />
        {(['phone', 'tablet'] as const).map(kind => <button key={kind} type="button"
          className={`surgically-tool surgically-tool-${kind} surgically-tool-pickup ${displayPince.active ? 'is-picked-up' : ''}`}
          onPointerDown={takePince} disabled={!myTurn || isSubmitting} aria-label={tr("Prendre la pince")}>
          <span className="surgically-pince-indicator"/><img src={pinceRangeeImage} alt="" draggable={false}/>
        </button>)}
      </div>}
      {phase === 'playing' && displayPince.active && <img
        ref={myTurn ? pinceRef : undefined}
        className={`surgically-pince-main ${displayPince.pointerType === 'touch' ? 'is-touch' : ''}`}
        src={displayPince.carriedOrgan ? ORGAN_DATA[displayPince.carriedOrgan].pince : pinceMainImage}
        alt={tr("Pince en main")} draggable={false}
        style={{ left: `${displayPince.x}px`, top: `${displayPince.y}px` }} />}
      {phase === 'playing' && depositedOrgan && <>
        {(['tablet', 'phone'] as const).map(kind => <img key={kind}
          className={`surgically-deposit-organ surgically-deposit-${kind} ${depositedOrgan === 'Muscle tibial antérieur' ? 'surgically-deposit-tibant' : ''}`}
          src={ORGAN_DATA[depositedOrgan].image} alt="" />)}
      </>}
      {phase === 'playing' && displayPince.carriedOrgan && <>
        <span className="surgically-deposit-indicator surgically-deposit-indicator-tablet" />
        <span className="surgically-deposit-indicator surgically-deposit-indicator-phone" />
      </>}
      {phase === 'countdown' && (
  <div className="surgically-countdown">
    <span>{tr("PRÊT ?")}</span>

    <strong key={countdown}>
      {countdown === 0 ? tr('GO') : countdown}
    </strong>
  </div>
)}
      {phase === 'playing' && <>
        <div className="surgically-multi-hud">{ordered.map(player => <div key={player.player_id}
          className={`surgically-multi-hud-player ${player.player_id === myId ? 'is-me' : ''} ${player.player_id === match?.active_player_id ? 'is-active' : ''} ${player.eliminated ? 'is-eliminated' : ''}`}>
          <span className={`surgically-multi-dot surgically-multi-color-${player.color}`} />
          <strong>{player.pseudo}</strong><span>{player.score.toLocaleString(getLanguage())}</span>
        </div>)}</div>
        <div className="surgically-multi-turn-banner">{myTurn ? 'À TON TOUR !' : `TOUR DE ${activePlayer?.pseudo ?? '…'}`}
          {me?.eliminated && <span> {tr(" • SPECTATEUR")}</span>}</div>
        <div className="surgically-timer"><span>{tr("TEMPS RESTANT")}</span>
          <strong className={timeLeft <= 5 ? 'is-danger' : ''}>{timeLeft.toFixed(1)} s</strong>
          <div className="surgically-timer-track"><div className="surgically-timer-fill"
            style={{ width: `${Math.max(0, Math.min(100, timeLeft / duration * 100))}%` }} /></div>
        </div>
        {myTurn && pinceActive && !carriedOrgan && !isSubmitting &&
          <button className="surgically-squeeze-button" type="button"
            onPointerDown={event => { event.stopPropagation(); event.preventDefault(); squeezePince() }}>{tr("SERRER LA PINCE")}</button>}
        {feedback && <div className={`surgically-feedback ${feedback.startsWith('+') ? 'is-success' : 'is-error'}`}>{tr(feedback)}</div>}
        {(hitmapError || errorMessage) && <div className="surgically-map-error">{tr(hitmapError || errorMessage)}</div>}
        <div className="surgically-bottom-mission"><span>{tr("À EXTRAIRE")}</span><strong>{tr(match?.target_organ ?? 'PRÉPARATION…')}</strong></div>
      </>}
    </section>
  )
}
export default SurgicallyMultiplayerGame
