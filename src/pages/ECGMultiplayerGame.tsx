import { getLanguage } from '../i18n/languages'
import { tr } from '../i18n/gameText'
import ReturnToGamesButton from '../components/ReturnToGamesButton'
import { useGameAudio } from '../hooks/useGameAudio'
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react'

import {
  useNavigate,
  useParams,
} from 'react-router-dom'

import './ECGGame.css'
import './ECGMultiplayerGame.css'

import backgroundMusic
  from '../assets/audio/background-music.mp3'

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

import { supabase } from '../lib/supabase'

import './Classements.css'

import {
  eliminateMultiplayerPlayer,
  getCurrentPlayerId,
  getGameRoomByCode,
  getRoomPlayers,
  updateMultiplayerScore,
  type GameRoom,
  type LobbyPlayer,
} from '../lib/multiplayer'


type ECGMultiplayerGameProps = {
  onFullscreenChange?: (
    fullscreen: boolean
  ) => void
}


type GameState =
  | 'loading'
  | 'rotate'
  | 'countdown'
  | 'playing'
  | 'eliminated'
  | 'results'


type WaveName =
  | 'P'
  | 'Q'
  | 'R'
  | 'S'
  | 'T'
  | 'F'


type BeatType =
  | 'sinus'
  | 'pvc'
  | 'af'
  | 'flutter'


type RhythmEvent =
  | 'sinus'
  | 'pvc'
  | 'bigeminy'
  | 'trigeminy'
  | 'couplet'
  | 'triplet'
  | 'af'
  | 'flutter'


type PlayerColor =
  | 'green'
  | 'red'
  | 'yellow'
  | 'purple'


type ECGPoint = {
  id: number
  x: number
  y: number
}


type ECGTarget = {
  id: number
  x: number
  y: number
  wave: WaveName
  color: PlayerColor
}


type PatternPoint = {
  dx: number
  dy: number
  target?: WaveName
}


const BASELINE = 250
const SPAWN_X = 940
const MISS_X = 25

const HOLD_DURATION = 1800
const HOLD_BONUS = 500

const SVG_WIDTH = 1000
const SVG_HEIGHT = 500

const TABLET_MIN_SHORT_SIDE =
  600


const SINUS_BEAT: PatternPoint[] = [
  { dx: 32, dy: 0 },

  { dx: 10, dy: -7 },
  { dx: 10, dy: -18, target: 'P' },
  { dx: 10, dy: -7 },
  { dx: 10, dy: 0 },

  { dx: 24, dy: 0 },

  { dx: 7, dy: 12, target: 'Q' },
  { dx: 9, dy: -110, target: 'R' },
  { dx: 10, dy: 45, target: 'S' },
  { dx: 11, dy: 0 },

  { dx: 25, dy: 0 },

  { dx: 14, dy: -10 },
  { dx: 16, dy: -29, target: 'T' },
  { dx: 16, dy: -10 },
  { dx: 17, dy: 0 },

  { dx: 38, dy: 0 },
]


const PVC_BEAT: PatternPoint[] = [
  { dx: 12, dy: 0 },
  { dx: 12, dy: 20 },
  { dx: 16, dy: -50 },

  {
    dx: 18,
    dy: -92,
    target: 'R',
  },

  { dx: 20, dy: -58 },

  {
    dx: 20,
    dy: 38,
    target: 'S',
  },

  { dx: 18, dy: 58 },
  { dx: 22, dy: 34 },
  { dx: 22, dy: 18 },
  { dx: 20, dy: 0 },

  { dx: 62, dy: 0 },
]


const AF_PATTERNS:
PatternPoint[][] = [

  [
    { dx: 18, dy: -3 },
    { dx: 13, dy: 4 },
    { dx: 15, dy: -5 },
    { dx: 12, dy: 3 },

    { dx: 18, dy: 11, target: 'Q' },
    { dx: 9, dy: -92, target: 'R' },
    { dx: 10, dy: 38, target: 'S' },
    { dx: 11, dy: 0 },

    { dx: 14, dy: -4 },
    { dx: 12, dy: 3 },
    { dx: 18, dy: -18, target: 'T' },
    { dx: 16, dy: 0 },

    { dx: 28, dy: 3 },
    { dx: 19, dy: -4 },
  ],

  [
    { dx: 12, dy: 3 },
    { dx: 18, dy: -4 },

    { dx: 22, dy: 11, target: 'Q' },
    { dx: 9, dy: -98, target: 'R' },
    { dx: 10, dy: 40, target: 'S' },
    { dx: 11, dy: 0 },

    { dx: 19, dy: 4 },
    { dx: 14, dy: -3 },
    { dx: 17, dy: -20, target: 'T' },
    { dx: 16, dy: 0 },

    { dx: 46, dy: -4 },
    { dx: 20, dy: 3 },
  ],

  [
    { dx: 21, dy: -4 },
    { dx: 14, dy: 4 },

    { dx: 14, dy: 10, target: 'Q' },
    { dx: 9, dy: -88, target: 'R' },
    { dx: 10, dy: 37, target: 'S' },
    { dx: 11, dy: 0 },

    { dx: 16, dy: -3 },
    { dx: 14, dy: 4 },
    { dx: 17, dy: -19, target: 'T' },
    { dx: 16, dy: 0 },

    { dx: 20, dy: 4 },
    { dx: 15, dy: -3 },
  ],
]


const FLUTTER_BEAT:
PatternPoint[] = [

  { dx: 14, dy: -13 },
  { dx: 14, dy: 4 },
  { dx: 14, dy: -13 },
  { dx: 14, dy: 4 },
  { dx: 14, dy: -13 },
  { dx: 14, dy: 4 },

  {
    dx: 8,
    dy: 12,
    target: 'Q',
  },

  {
    dx: 8,
    dy: -95,
    target: 'R',
  },

  {
    dx: 10,
    dy: 38,
    target: 'S',
  },

  { dx: 11, dy: 0 },

  { dx: 14, dy: -13 },
  { dx: 14, dy: 4 },
  { dx: 14, dy: -13 },
  { dx: 14, dy: 4 },
  { dx: 14, dy: -13 },
  { dx: 14, dy: 4 },
]


const RHYTHM_SEQUENCES:
Record<
  RhythmEvent,
  BeatType[]
> = {

  sinus: ['sinus'],

  pvc: ['pvc'],

  bigeminy: [
    'sinus',
    'pvc',
    'sinus',
    'pvc',
  ],

  trigeminy: [
    'sinus',
    'sinus',
    'pvc',
    'sinus',
    'sinus',
    'pvc',
  ],

  couplet: [
    'pvc',
    'pvc',
  ],

  triplet: [
    'pvc',
    'pvc',
    'pvc',
  ],

  af: [
    'af',
    'af',
    'af',
    'af',
  ],

  flutter: [
    'flutter',
    'flutter',
    'flutter',
    'flutter',
  ],
}


const avatars = [
  avatar1,
  avatar2,
  avatar3,
  avatar4,
  avatar5,
  avatar6,
  avatar7,
  avatar8,
  avatar9,
  avatar10,
]


function getDeviceState() {

  const width =
    window.innerWidth

  const height =
    window.innerHeight

  const shortSide =
    Math.min(
      width,
      height,
    )

  return {

    isPortrait:
      height > width,

    isTablet:
      shortSide >=
      TABLET_MIN_SHORT_SIDE,
  }
}


/* ========================================
   RANDOM DÉTERMINISTE

   Même seed =
   même partie sur tous les appareils.
======================================== */

function createSeededRandom(
  seedValue: number,
) {

  let seed =
    seedValue >>> 0

  return () => {

    seed +=
      0x6D2B79F5

    let value =
      seed

    value =
      Math.imul(
        value ^
        value >>> 15,
        value | 1,
      )

    value ^=
      value +
      Math.imul(
        value ^
        value >>> 7,
        value | 61,
      )

    return (
      (
        value ^
        value >>> 14
      ) >>> 0
    ) /
    4294967296
  }
}


function ECGMultiplayerGame({
  onFullscreenChange,
}: ECGMultiplayerGameProps) {
  const { setMusicVolume, setMusicMuted, getEffectsOutput } = useGameAudio()


  const navigate =
    useNavigate()

  const {
    code = '',
  } = useParams()


  const initialDevice =
    getDeviceState()


  const [
    isPortrait,
    setIsPortrait,
  ] = useState(
    initialDevice.isPortrait,
  )

  const [
    isTablet,
    setIsTablet,
  ] = useState(
    initialDevice.isTablet,
  )


  const [
    gameState,
    setGameState,
  ] = useState<GameState>(
    'loading',
  )

  const [
    countdown,
    setCountdown,
  ] = useState(3)

  const [
    score,
    setScore,
  ] = useState(0)

  const [
    room,
    setRoom,
  ] = useState<GameRoom | null>(
    null,
  )

  const [
    players,
    setPlayers,
  ] = useState<LobbyPlayer[]>([])

  const [
    currentPlayerId,
    setCurrentPlayerId,
  ] = useState<string | null>(
    null,
  )

  const [
    points,
    setPoints,
  ] = useState<ECGPoint[]>([])

  const [
    targets,
    setTargets,
  ] = useState<ECGTarget[]>([])

  const [
    rhythmAlert,
    setRhythmAlert,
  ] = useState<string | null>(
    null,
  )

  const [
    holdActive,
    setHoldActive,
  ] = useState(false)

  const [
    holdPressed,
    setHoldPressed,
  ] = useState(false)

  const [
    holdProgress,
    setHoldProgress,
  ] = useState(0)

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('')

  const [
    remoteEliminationError,
    setRemoteEliminationError,
  ] = useState<string | null>(null)

  const targetColorBagRef =
  useRef<PlayerColor[]>([])

  const pointsRef =
    useRef<ECGPoint[]>([])

  const targetsRef =
    useRef<ECGTarget[]>([])

  const playersRef =
    useRef<LobbyPlayer[]>([])

  const roomRef =
    useRef<GameRoom | null>(null)

  const currentPlayerIdRef =
    useRef<string | null>(null)

  // Un seul appareil doit demander l'élimination d'un joueur absent.
  // Les autres peuvent observer la même cible sans multiplier les écritures.
  const remoteEliminationsRef =
    useRef<Set<string>>(new Set())


  const svgRef =
    useRef<SVGSVGElement | null>(
      null,
    )

  const animationRef =
    useRef<number | null>(
      null,
    )

  const previousTimeRef =
    useRef<number | null>(
      null,
    )

  const spawnDistanceRef =
    useRef(0)

  const patternIndexRef =
    useRef(0)

  const currentPatternRef =
    useRef<PatternPoint[]>(
      SINUS_BEAT,
    )

  const beatQueueRef =
    useRef<BeatType[]>([])

  const openingSinusRef =
    useRef(1)

  const pointIdRef =
    useRef(0)

  const targetIdRef =
    useRef(0)

  // Canal commun à tous les joueurs : envoi et réception sur le même topic.
  const gameChannelRef =
    useRef<ReturnType<typeof supabase.channel> | null>(null)

  // Évite qu'une cible déjà touchée réapparaisse sur un appareil en retard.
  const removedTargetIdsRef =
    useRef<Set<number>>(new Set())

  const scoreRef =
    useRef(0)

  const eliminatedRef =
    useRef(false)

  const randomRef =
    useRef<() => number>(
      Math.random,
    )

  const rhythmAlertTimerRef =
    useRef<number | null>(
      null,
    )

  const audioContextRef =
    useRef<AudioContext | null>(
      null,
    )

  const backgroundMusicRef =
    useRef<HTMLAudioElement | null>(
      null,
    )

  const flatlineOscillatorRef =
    useRef<OscillatorNode | null>(
      null,
    )

  const holdStartRef =
    useRef<number | null>(
      null,
    )

  const holdFrameRef =
    useRef<number | null>(
      null,
    )

  const holdEventStartRef =
    useRef<number | null>(
      null,
    )

  const nextHoldAtRef =
    useRef(30000)

  const holdCompletedRef =
    useRef(false)

  const gameStartedAtRef =
    useRef<number | null>(
      null,
    )


  const currentPlayer =
    players.find(
      player =>
        player.player_id ===
        currentPlayerId,
    )


  /* ========================================
     APPAREIL
  ======================================== */

  useEffect(() => {

    function updateDevice() {

      const device =
        getDeviceState()

      setIsPortrait(
        device.isPortrait,
      )

      setIsTablet(
        device.isTablet,
      )
    }


    window.addEventListener(
      'resize',
      updateDevice,
    )

    window.addEventListener(
      'orientationchange',
      updateDevice,
    )


    return () => {

      window.removeEventListener(
        'resize',
        updateDevice,
      )

      window.removeEventListener(
        'orientationchange',
        updateDevice,
      )
    }

  }, [])


  /* ========================================
     PLEIN ÉCRAN
  ======================================== */

  useEffect(() => {

    const fullscreen =
      gameState === 'rotate' ||
      gameState === 'countdown' ||
      gameState === 'playing' ||
      gameState === 'eliminated'

    onFullscreenChange?.(
      fullscreen,
    )

    return () => {

      onFullscreenChange?.(
        false,
      )
    }

  }, [
    gameState,
    onFullscreenChange,
  ])


  /* ========================================
     AUDIO
  ======================================== */

  function getAudioContext() {

    if (
      !audioContextRef.current
    ) {

      audioContextRef.current =
        new AudioContext({
          latencyHint:
            'interactive',
        })
    }


    const context =
      audioContextRef.current


    if (
      context.state ===
      'suspended'
    ) {

      void context.resume()
    }


    return context
  }


  function prepareBackgroundMusic() {

    if (
      backgroundMusicRef.current
    ) {
      return
    }


    const audio =
      new Audio(
        backgroundMusic,
      )

    audio.loop = true
    setMusicVolume(audio, 0.18)
    audio.preload = 'auto'

    backgroundMusicRef.current =
      audio
  }


  function startBackgroundMusic() {

    prepareBackgroundMusic()


    const audio =
      backgroundMusicRef.current


    if (!audio) {
      return
    }


    setMusicMuted(audio, false)
    audio.currentTime = 0


    void audio
      .play()
      .catch(
        error => {

          console.warn(
            'Musique ECG bloquée :',
            error,
          )
        },
      )
  }


  function stopBackgroundMusic() {

    const audio =
      backgroundMusicRef.current


    if (!audio) {
      return
    }


    audio.pause()
    audio.currentTime = 0
  }


  function playHeartBeep() {

    const context =
      getAudioContext()

    const oscillator =
      context.createOscillator()

    const gain =
      context.createGain()

    oscillator.type =
      'sine'

    oscillator.frequency.value =
      880


    const now =
      context.currentTime


    gain.gain.setValueAtTime(
      0.12,
      now,
    )

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      now + 0.055,
    )


    oscillator.connect(
      gain,
    )

    gain.connect(
      getEffectsOutput(context),
    )

    oscillator.start(now)

    oscillator.stop(
      now + 0.06,
    )
  }


  function playCountdownSound(
    value: number,
  ) {

    const context =
      getAudioContext()

    const oscillator =
      context.createOscillator()

    const gain =
      context.createGain()


    oscillator.type =
      'sine'


    const frequency =
      value === 0
        ? 980
        : value === 1
          ? 720
          : value === 2
            ? 620
            : 520


    oscillator.frequency.value =
      frequency


    const now =
      context.currentTime


    const duration =
      value === 0
        ? 0.22
        : 0.11


    gain.gain.setValueAtTime(
      0.0001,
      now,
    )

    gain.gain.exponentialRampToValueAtTime(
      value === 0
        ? 0.16
        : 0.11,
      now + 0.01,
    )

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      now + duration,
    )


    oscillator.connect(
      gain,
    )

    gain.connect(
      getEffectsOutput(context),
    )

    oscillator.start(now)

    oscillator.stop(
      now + duration,
    )
  }


  function playGameOverSound() {

    const context =
      getAudioContext()

    const now =
      context.currentTime


    const first =
      context.createOscillator()

    const gain1 =
      context.createGain()


    first.type =
      'sine'

    first.frequency.setValueAtTime(
      520,
      now,
    )

    first.frequency.exponentialRampToValueAtTime(
      220,
      now + 0.32,
    )


    gain1.gain.setValueAtTime(
      0.13,
      now,
    )

    gain1.gain.exponentialRampToValueAtTime(
      0.0001,
      now + 0.35,
    )


    first.connect(gain1)

    gain1.connect(
      getEffectsOutput(context),
    )

    first.start(now)

    first.stop(
      now + 0.36,
    )
  }


  function playPenaltySound() {

    const context =
      getAudioContext()

    const oscillator =
      context.createOscillator()

    const gain =
      context.createGain()

    const now =
      context.currentTime


    oscillator.type =
      'square'

    oscillator.frequency.value =
      180


    gain.gain.setValueAtTime(
      0.07,
      now,
    )

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      now + 0.10,
    )


    oscillator.connect(gain)

    gain.connect(
      getEffectsOutput(context),
    )

    oscillator.start(now)

    oscillator.stop(
      now + 0.11,
    )
  }


  function playRhythmAlertSound() {

    const context =
      getAudioContext()

    const now =
      context.currentTime

    const gain =
      context.createGain()


    gain.gain.setValueAtTime(
      0.0001,
      now,
    )

    gain.gain.exponentialRampToValueAtTime(
      0.11,
      now + 0.015,
    )

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      now + 0.42,
    )


    gain.connect(
      getEffectsOutput(context),
    )


    const first =
      context.createOscillator()

    first.type =
      'sine'

    first.frequency.value =
      740

    first.connect(gain)

    first.start(now)

    first.stop(
      now + 0.16,
    )


    const second =
      context.createOscillator()

    second.type =
      'sine'

    second.frequency.value =
      980

    second.connect(gain)

    second.start(
      now + 0.17,
    )

    second.stop(
      now + 0.42,
    )
  }


  function startFlatlineSound() {

    if (
      flatlineOscillatorRef.current
    ) {
      return
    }


    const context =
      getAudioContext()

    const oscillator =
      context.createOscillator()

    const gain =
      context.createGain()


    oscillator.type =
      'sine'

    oscillator.frequency.value =
      760

    gain.gain.value =
      0.045


    oscillator.connect(gain)

    gain.connect(
      getEffectsOutput(context),
    )

    oscillator.start()


    flatlineOscillatorRef.current =
      oscillator
  }


  function stopFlatlineSound() {

    try {

      flatlineOscillatorRef.current
        ?.stop()

    } catch {
      // déjà arrêté
    }


    flatlineOscillatorRef.current =
      null
  }


  /* ========================================
     ROOM
  ======================================== */

  useEffect(() => {

    let active =
      true


    async function load() {

      try {

        const roomData =
          await getGameRoomByCode(
            code,
          )


        if (!roomData) {

          throw new Error(
            'Partie introuvable.',
          )
        }


        const roomPlayers =
          await getRoomPlayers(
            roomData.id,
          )


        const playerId =
          await getCurrentPlayerId()


        if (!active) {
          return
        }


        setRoom(roomData)

        roomRef.current =
          roomData


        setPlayers(
          roomPlayers,
        )

        playersRef.current =
          roomPlayers


        setCurrentPlayerId(
          playerId,
        )

        currentPlayerIdRef.current =
          playerId


        if (
          roomData.status ===
          'finished'
        ) {

          setGameState(
            'results',
          )

          return
        }


        if (
          roomData.status !==
          'playing'
        ) {

          navigate(
            `/multiplayer/ecg/lobby/${roomData.code}`,
          )

          return
        }


        if (
          roomData.game_seed ===
          null ||
          !roomData.started_at
        ) {

          throw new Error(
            'Synchronisation de la partie impossible.',
          )
        }


        randomRef.current =
          createSeededRandom(
            Number(
              roomData.game_seed,
            ),
          )


        gameStartedAtRef.current =
          new Date(
            roomData.started_at,
          ).getTime()


        nextHoldAtRef.current =
          26000 +
          Math.floor(
            randomRef.current() *
            9000,
          )


        resetEngine()


        if (
          !initialDevice.isTablet &&
          initialDevice.isPortrait
        ) {

          setGameState(
            'rotate',
          )

        } else {

          setGameState(
            'countdown',
          )
        }


      } catch (error) {

        const message =
          error &&
          typeof error === 'object' &&
          'message' in error
            ? String(error.message)
            : 'Impossible de charger la partie.'


        setErrorMessage(
          message,
        )

      }

    }


    void load()


    return () => {

      active =
        false
    }

  }, [
    code,
    navigate,
  ])


  /* ========================================
     REALTIME
  ======================================== */

  useEffect(() => {

    if (!room) {
      return
    }


    const channel =
      supabase
        .channel(
          `ecg-game-${room.id}`,
        )

    gameChannelRef.current = channel


        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table:
              'game_room_players',
            filter:
              `room_id=eq.${room.id}`,
          },
          async () => {

            const freshPlayers =
              await getRoomPlayers(
                room.id,
              )


            setPlayers(
              freshPlayers,
            )

            playersRef.current =
              freshPlayers
          },
        )


        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table:
              'game_rooms',
            filter:
              `id=eq.${room.id}`,
          },
          payload => {

            const freshRoom =
              payload.new as GameRoom


            setRoom(
              freshRoom,
            )

            roomRef.current =
              freshRoom


            if (
              freshRoom.status ===
              'finished'
            ) {

              stopBackgroundMusic()

              setGameState(
                'results',
              )
            }

          },
        )


        /*
          Broadcast très rapide :
          quand une cible est touchée,
          les autres écrans la retirent
          également.
        */

        .on(
          'broadcast',
          {
            event: 'target-hit',
          },
          payload => {

            const targetId =
              Number(
                payload.payload
                  ?.targetId,
              )


            if (
              !Number.isFinite(
                targetId,
              )
            ) {
              return
            }


            removedTargetIdsRef.current.add(targetId)

            targetsRef.current =
              targetsRef.current.filter(
                target =>
                  target.id !==
                  targetId,
              )


            setTargets([
              ...targetsRef.current,
            ])
          },
        )


        .subscribe()


    return () => {

      if (gameChannelRef.current === channel) {
        gameChannelRef.current = null
      }

      void supabase
        .removeChannel(
          channel,
        )
    }

  }, [
    room?.id,
  ])


  /* ========================================
     RESET
  ======================================== */

  function resetEngine() {

    pointIdRef.current =
      0

    targetIdRef.current =
      0

    removedTargetIdsRef.current.clear()


    const firstPoint:
    ECGPoint = {

      id:
        pointIdRef.current++,

      x: SPAWN_X,

      y: BASELINE,
    }


    pointsRef.current = [
      firstPoint,
    ]

    targetsRef.current = []

    targetColorBagRef.current = []


    setPoints([
      firstPoint,
    ])

    setTargets([])


    previousTimeRef.current =
      null

    spawnDistanceRef.current =
      0

    patternIndexRef.current =
      0

    currentPatternRef.current =
      SINUS_BEAT

    beatQueueRef.current = []

    openingSinusRef.current =
      1

    scoreRef.current =
      0

    setScore(0)

    eliminatedRef.current =
      false

    holdEventStartRef.current =
      null

    holdCompletedRef.current =
      false

    setHoldActive(false)
    setHoldPressed(false)
    setHoldProgress(0)

    stopFlatlineSound()
  }


  /* ========================================
     COUNTDOWN SYNCHRONISÉ
  ======================================== */

  useEffect(() => {

  if (
    (
      gameState !== 'countdown' &&
      gameState !== 'rotate'
    ) ||
    !gameStartedAtRef.current
  ) {
    return
  }

  let previousValue:
    number | null = null

  function update() {

    const start =
      gameStartedAtRef.current

    if (!start) {
      return
    }

    const remaining =
      start - Date.now()

    /*
      Le GO commence exactement
      à l'heure commune de départ.
    */

    if (remaining <= 0) {

      if (
        previousValue !== 0
      ) {

        previousValue = 0

        setCountdown(0)

        if (
          gameState === 'countdown'
        ) {

          playCountdownSound(0)
        }
      }

      /*
        GO reste affiché 650 ms.

        Le temps est calculé depuis
        started_at : les joueurs
        gardent la même référence.
      */

      if (
        remaining <= -650 &&
        gameState === 'countdown'
      ) {

        startBackgroundMusic()

        setGameState(
          'playing',
        )
      }

      return
    }

    const seconds =
  Math.min(
    3,
    Math.max(
      1,
      Math.ceil(
        remaining / 1000,
      ),
    ),
  )

    if (
      seconds !== previousValue
    ) {

      previousValue =
        seconds

      setCountdown(
        seconds,
      )

      if (
        gameState === 'countdown'
      ) {

        playCountdownSound(
          seconds,
        )
      }
    }
  }

  update()

  const interval =
    window.setInterval(
      update,
      100,
    )

  return () => {

    window.clearInterval(
      interval,
    )
  }

}, [
  gameState,
])


  useEffect(() => {

    if (
      gameState ===
        'rotate' &&
      !isPortrait &&
      gameStartedAtRef.current
    ) {

      const alreadyStarted =
  Date.now() >=
  gameStartedAtRef.current + 650


      if (
        alreadyStarted
      ) {

        startBackgroundMusic()

        setGameState(
          'playing',
        )

      } else {

        setGameState(
          'countdown',
        )
      }
    }

  }, [
    gameState,
    isPortrait,
  ])


  /* ========================================
     TROUBLES DU RYTHME
  ======================================== */

  function chooseRhythmEvent():
  RhythmEvent {

    const random =
      randomRef.current()


    if (random < 0.72)
      return 'sinus'

    if (random < 0.79)
      return 'pvc'

    if (random < 0.83)
      return 'bigeminy'

    if (random < 0.87)
      return 'trigeminy'

    if (random < 0.90)
      return 'couplet'

    if (random < 0.92)
      return 'triplet'

    if (random < 0.96)
      return 'af'

    return 'flutter'
  }


  function showRhythmAlert(
    event: RhythmEvent,
  ) {

    const labels:
    Partial<
      Record<
        RhythmEvent,
        string
      >
    > = {

      pvc:
        'EXTRASYSTOLE VENTRICULAIRE',

      bigeminy:
        'BIGÉMINISME VENTRICULAIRE',

      trigeminy:
        'TRIGÉMINISME VENTRICULAIRE',

      couplet:
        "DOUBLET D'ESV",

      triplet:
        "TRIPLET D'ESV",

      af:
        'FIBRILLATION ATRIALE',

      flutter:
        'FLUTTER ATRIAL',
    }


    const label =
      labels[event]


    if (!label) {
      return
    }


    playRhythmAlertSound()


    if (
      rhythmAlertTimerRef.current !==
      null
    ) {

      window.clearTimeout(
        rhythmAlertTimerRef.current,
      )
    }


    setRhythmAlert(
      label,
    )


    rhythmAlertTimerRef.current =
      window.setTimeout(
        () => {

          setRhythmAlert(
            null,
          )

          rhythmAlertTimerRef.current =
            null
        },
        1800,
      )
  }


  /* ========================================
     COULEUR D'UNE CIBLE
  ======================================== */

  function chooseTargetColor():
PlayerColor {

  /*
    On utilise un "sac" de couleurs.

    Quand le sac est vide :
    - on prend uniquement les joueurs
      encore présents dans la partie,
    - on met plusieurs fois chaque couleur,
    - puis on mélange le tout avec
      notre random déterministe.

    Résultat :
    répartition équilibrée,
    mais ordre imprévisible.
  */

  if (
    targetColorBagRef.current.length ===
    0
  ) {

    const activePlayers =
      playersRef.current
        .filter(
          player =>
            !player.eliminated,
        )
        .slice()
        .sort(
          (a, b) =>
            a.player_order -
            b.player_order,
        )


    if (
      activePlayers.length === 0
    ) {
      return 'green'
    }


    /*
      2 joueurs :
      4 cibles chacun = bloc de 8

      3 joueurs :
      3 cibles chacun = bloc de 9

      4 joueurs :
      3 cibles chacun = bloc de 12
    */

    const repetitions =
      activePlayers.length === 2
        ? 4
        : 3


    const bag:
    PlayerColor[] = []


    for (
      const player of
      activePlayers
    ) {

      for (
        let i = 0;
        i < repetitions;
        i += 1
      ) {

        bag.push(
          player.color as PlayerColor,
        )
      }
    }


    /*
      Mélange Fisher-Yates
      avec le random déterministe.
    */

    for (
      let i =
        bag.length - 1;
      i > 0;
      i -= 1
    ) {

      const j =
        Math.floor(
          randomRef.current() *
          (i + 1),
        )


      const temp =
        bag[i]

      bag[i] =
        bag[j]

      bag[j] =
        temp
    }


    targetColorBagRef.current =
      bag
  }


  return (
    targetColorBagRef.current.shift()
    ?? 'green'
  )
}


  /* ========================================
     SCORE
  ======================================== */

  function changeScore(
    amount: number,
  ) {

    const newScore =
      Math.max(
        0,
        scoreRef.current +
        amount,
      )


    scoreRef.current =
      newScore

    setScore(
      newScore,
    )


    const currentRoom =
      roomRef.current


    if (currentRoom) {

      void updateMultiplayerScore(
        currentRoom.id,
        newScore,
      ).catch(
        error => {

          console.error(
            'Erreur score multi :',
            error,
          )
        },
      )
    }
  }


  /* ========================================
     TOUCHER UNE CIBLE
  ======================================== */

  function hitTarget(
    target: ECGTarget,
  ) {

    if (
      gameState !==
        'playing' ||
      eliminatedRef.current ||
      holdActive ||
      !currentPlayer
    ) {
      return
    }


    /*
      BONNE COULEUR
    */

    if (
      target.color ===
      currentPlayer.color
    ) {

      targetsRef.current =
        targetsRef.current.filter(
          item =>
            item.id !==
            target.id,
        )


      setTargets([
        ...targetsRef.current,
      ])


      changeScore(
        100,
      )

      playHeartBeep()


      // La cible disparaît chez les autres sur le canal déjà abonné.
      // Un canal créé ici à chaque clic n'était pas celui écouté plus haut.
      removedTargetIdsRef.current.add(target.id)

      const channel = gameChannelRef.current

      if (channel) {
        void channel.send({
          type: 'broadcast',
          event: 'target-hit',
          payload: {
            targetId: target.id,
          },
        }).then(status => {
          if (status !== 'ok') {
            console.warn('Envoi cible ECG :', status)
          }
        }).catch(console.error)
      }

      return
    }


    /*
      MAUVAISE COULEUR :
      -100
      La cible reste présente.
    */

    changeScore(
      -100,
    )

    playPenaltySound()
  }


  function handleECGPointerDown(
    event:
      ReactPointerEvent<SVGSVGElement>,
  ) {

    if (
      gameState !==
        'playing' ||
      eliminatedRef.current ||
      holdActive
    ) {
      return
    }


    const svg =
      svgRef.current


    if (!svg) {
      return
    }


    event.preventDefault()


    const rect =
      svg.getBoundingClientRect()


    const hitRadius =
      window.matchMedia(
        '(pointer: coarse)',
      ).matches
        ? 70
        : 38


    let nearest:
      ECGTarget | null =
      null

    let nearestDistance =
      Infinity


    for (
      const target of
      targetsRef.current
    ) {

      /*
        Les cibles appartenant à un
        joueur déjà éliminé ne sont
        plus interactives.
      */

      const owner =
        playersRef.current.find(
          player =>
            player.color ===
            target.color,
        )


      if (
        owner?.eliminated
      ) {
        continue
      }


      const x =
        rect.left +
        (
          target.x /
          SVG_WIDTH
        ) *
        rect.width


      const y =
        rect.top +
        (
          target.y /
          SVG_HEIGHT
        ) *
        rect.height


      const distance =
        Math.hypot(
          event.clientX - x,
          event.clientY - y,
        )


      if (
        distance <=
          hitRadius &&
        distance <
          nearestDistance
      ) {

        nearest =
          target

        nearestDistance =
          distance
      }
    }


    if (nearest) {

      hitTarget(
        nearest,
      )
    }
  }


  /* ========================================
     ÉLIMINATION
  ======================================== */

  async function eliminateAbsentPlayer(
    player: LobbyPlayer,
  ) {
    const currentRoom = roomRef.current

    if (
      !currentRoom ||
      currentRoom.status !== 'playing' ||
      player.eliminated ||
      remoteEliminationsRef.current.has(player.player_id)
    ) {
      return
    }

    remoteEliminationsRef.current.add(player.player_id)

    try {
      // La RPC vérifie que l'appelant est un participant actif,
      // élimine le joueur ciblé et termine la salle si nécessaire.
      // Elle conserve le score déjà enregistré du joueur absent.
      const { error } = await supabase.rpc(
        'eliminate_ecg_player_on_miss',
        {
          p_room_id: currentRoom.id,
          p_player_id: player.player_id,
        },
      )

      if (error) throw error

      const refreshed = await getRoomPlayers(currentRoom.id)
      playersRef.current = refreshed
      setPlayers(refreshed)

      const updatedPlayer = refreshed.find(
        item => item.player_id === player.player_id,
      )

      // Si la salle a déjà été terminée ailleurs, la RPC peut
      // renvoyer false sans modifier le joueur : relire la salle.
      const { data: refreshedRoom, error: roomError } = await supabase
        .from('game_rooms')
        .select('status, finished_at')
        .eq('id', currentRoom.id)
        .single()

      if (roomError) throw roomError

      if (refreshedRoom?.status === 'finished') {
        const finishedRoom: GameRoom = {
          ...currentRoom,
          status: 'finished',
          finished_at: refreshedRoom.finished_at,
        }
        roomRef.current = finishedRoom
        setRoom(finishedRoom)
        stopBackgroundMusic()
        setGameState('results')
      } else if (!updatedPlayer?.eliminated) {
        throw new Error(
          `L'élimination ECG n'a pas été enregistrée. Joueur : ${player.pseudo}.`,
        )
      }

      setRemoteEliminationError(null)
    } catch (error) {
      console.error('Élimination ECG du joueur absent :', error)
      const details = error && typeof error === 'object'
        ? [
            'message' in error ? String(error.message) : '',
            'code' in error ? `Code : ${String(error.code)}` : '',
            'details' in error ? String(error.details) : '',
            'hint' in error ? String(error.hint) : '',
          ].filter(Boolean).join(' — ')
        : String(error)
      setRemoteEliminationError(details)
      remoteEliminationsRef.current.delete(player.player_id)
    }
  }

  async function eliminateCurrentPlayer() {

    if (
      eliminatedRef.current
    ) {
      return
    }


    eliminatedRef.current =
      true


    playGameOverSound()


    const currentRoom =
      roomRef.current


    if (!currentRoom) {
      return
    }


    try {

      await eliminateMultiplayerPlayer(
        currentRoom.id,
        scoreRef.current,
      )


      const refreshed =
        await getRoomPlayers(
          currentRoom.id,
        )


      setPlayers(
        refreshed,
      )

      playersRef.current =
        refreshed


      setGameState(
        'eliminated',
      )


    } catch (error) {

      console.error(
        'Erreur élimination :',
        error,
      )
    }
  }


  /* ========================================
     ASYSTOLIE MULTI

     Fenêtre commune de 1,8 seconde.
     Maintenir = +500.
     L'ECG repart pour tout le monde
     automatiquement.
  ======================================== */

  function beginHoldEvent() {

    setHoldActive(true)

    setHoldPressed(false)

    setHoldProgress(0)

    holdCompletedRef.current =
      false

    holdEventStartRef.current =
      performance.now()


    setRhythmAlert(
      'ASYSTOLIE',
    )


    playRhythmAlertSound()

    startFlatlineSound()


    window.setTimeout(
      () => {

        stopFlatlineSound()

        setHoldActive(false)

        setHoldPressed(false)

        setHoldProgress(0)

        holdEventStartRef.current =
          null


        if (
          holdCompletedRef.current
        ) {

          changeScore(
            HOLD_BONUS,
          )

          playHeartBeep()
        }


        patternIndexRef.current =
          0

        currentPatternRef.current =
          SINUS_BEAT

        beatQueueRef.current = [
          'sinus',
          'sinus',
        ]


        const elapsed =
          gameStartedAtRef.current
            ? Date.now() -
              gameStartedAtRef.current
            : 0


        nextHoldAtRef.current =
          elapsed +
          30000 +
          Math.floor(
            randomRef.current() *
            18000,
          )

      },
      HOLD_DURATION,
    )
  }


  function startHold() {

    if (
      !holdActive ||
      holdPressed ||
      eliminatedRef.current
    ) {
      return
    }


    setHoldPressed(true)

    holdStartRef.current =
      performance.now()


    function frame(
      time: number,
    ) {

      if (
        holdStartRef.current ===
        null
      ) {
        return
      }


      const progress =
        Math.min(
          (
            (
              time -
              holdStartRef.current
            ) /
            HOLD_DURATION
          ) *
          100,
          100,
        )


      setHoldProgress(
        progress,
      )


      if (
        progress >= 92
      ) {

        holdCompletedRef.current =
          true

        return
      }


      holdFrameRef.current =
        requestAnimationFrame(
          frame,
        )
    }


    holdFrameRef.current =
      requestAnimationFrame(
        frame,
      )
  }


  function cancelHold() {

    if (
      holdFrameRef.current !==
      null
    ) {

      cancelAnimationFrame(
        holdFrameRef.current,
      )
    }


    holdFrameRef.current =
      null

    holdStartRef.current =
      null

    setHoldPressed(false)

    setHoldProgress(0)

    holdCompletedRef.current =
      false
  }


  /* ========================================
     MOTEUR
  ======================================== */

  useEffect(() => {

    if (
      (
        gameState !==
          'playing' &&
        gameState !==
          'eliminated'
      )
    ) {
      return
    }


    const BASE_SPEED =
      90


    function frame(
      time: number,
    ) {

      const startTime =
        gameStartedAtRef.current


      if (!startTime) {
        return
      }


      /*
        Difficulté commune :
        elle dépend du temps de partie,
        jamais du score individuel.
      */

      const elapsedMs =
        Math.max(
          0,
          Date.now() -
          startTime,
        )


      const speed =
        BASE_SPEED +
        Math.floor(
          elapsedMs /
          4000,
        ) *
        12


      if (
        previousTimeRef.current ===
        null
      ) {

        previousTimeRef.current =
          time
      }


      const delta =
        Math.min(
          (
            time -
            previousTimeRef.current
          ) /
          1000,
          0.04,
        )


      previousTimeRef.current =
        time


      const movement =
        speed *
        delta


      pointsRef.current =
        pointsRef.current
          .map(
            point => ({
              ...point,

              x:
                point.x -
                movement,
            }),
          )
          .filter(
            point =>
              point.x >
              -120,
          )


      targetsRef.current =
        targetsRef.current
          .map(
            target => ({
              ...target,

              x:
                target.x -
                movement,
            }),
          )


      /*
        Chaque écran encore ouvert surveille toutes les couleurs.
        Un joueur absent perd aussi lorsqu'une de ses cibles
        atteint la gauche. Son score déjà enregistré est conservé.
      */
      if (!holdActive && roomRef.current?.status === 'playing') {
        const missedColors = new Set(
          targetsRef.current
            .filter(target => target.x <= MISS_X)
            .map(target => target.color),
        )

        for (const player of playersRef.current) {
          if (
            player.eliminated ||
            !missedColors.has(player.color)
          ) {
            continue
          }

          if (player.player_id === currentPlayerIdRef.current) {
            if (!eliminatedRef.current) {
              void eliminateCurrentPlayer()
            }
          } else {
            void eliminateAbsentPlayer(player)
          }
        }
      }


      /*
        ASYSTOLIE COMMUNE
      */

      if (
        !holdActive &&
        elapsedMs >=
          nextHoldAtRef.current
      ) {

        beginHoldEvent()
      }


      if (
        !holdActive
      ) {

        spawnDistanceRef.current +=
          movement


        let nextPattern =
          currentPatternRef.current[
            patternIndexRef.current
          ]


        while (
          spawnDistanceRef.current >=
          nextPattern.dx
        ) {

          spawnDistanceRef.current -=
            nextPattern.dx


          const newPoint:
          ECGPoint = {

            id:
              pointIdRef.current++,

            x:
              SPAWN_X,

            y:
              BASELINE +
              nextPattern.dy,
          }


          pointsRef.current.push(
            newPoint,
          )


          if (
            nextPattern.target
          ) {

            const newTargetId = targetIdRef.current++
            const newTargetColor = chooseTargetColor()

            // Toujours consommer l'identifiant et la couleur même
            // lorsque le message d'un autre joueur est arrivé avant le spawn.
            if (!removedTargetIdsRef.current.has(newTargetId)) {
              targetsRef.current.push({
                id: newTargetId,
                x: SPAWN_X,
                y: newPoint.y,
                wave: nextPattern.target,
                color: newTargetColor,
              })
            }
          }


          patternIndexRef.current +=
            1


          if (
            patternIndexRef.current >=
            currentPatternRef.current
              .length
          ) {

            patternIndexRef.current =
              0


            if (
              openingSinusRef.current <
              3
            ) {

              currentPatternRef.current =
                SINUS_BEAT

              openingSinusRef.current +=
                1

            } else {

              if (
                beatQueueRef.current
                  .length === 0
              ) {

                const event =
                  chooseRhythmEvent()


                showRhythmAlert(
                  event,
                )


                beatQueueRef.current = [
                  ...RHYTHM_SEQUENCES[
                    event
                  ],
                ]
              }


              const nextBeat =
                beatQueueRef.current
                  .shift()
                ?? 'sinus'


              if (
                nextBeat ===
                'pvc'
              ) {

                currentPatternRef.current =
                  PVC_BEAT

              } else if (
                nextBeat ===
                'flutter'
              ) {

                currentPatternRef.current =
                  FLUTTER_BEAT

              } else if (
                nextBeat ===
                'af'
              ) {

                const randomIndex =
                  Math.floor(
                    randomRef.current() *
                    AF_PATTERNS.length,
                  )


                currentPatternRef.current =
                  AF_PATTERNS[
                    randomIndex
                  ]

              } else {

                currentPatternRef.current =
                  SINUS_BEAT
              }
            }
          }


          nextPattern =
            currentPatternRef.current[
              patternIndexRef.current
            ]
        }
      }


      /*
        Les cibles d'un joueur éliminé
        disparaissent visuellement.
      */

      targetsRef.current =
        targetsRef.current.filter(
          target => {

            if (
              target.x <=
              -80
            ) {
              return false
            }


            const owner =
              playersRef.current.find(
                player =>
                  player.color ===
                  target.color,
              )


            return (
              !owner ||
              !owner.eliminated
            )
          },
        )


      setPoints([
        ...pointsRef.current,
      ])

      setTargets([
        ...targetsRef.current,
      ])


      animationRef.current =
        requestAnimationFrame(
          frame,
        )
    }


    previousTimeRef.current =
      null


    animationRef.current =
      requestAnimationFrame(
        frame,
      )


    return () => {

      if (
        animationRef.current !==
        null
      ) {

        cancelAnimationFrame(
          animationRef.current,
        )
      }


      animationRef.current =
        null

      previousTimeRef.current =
        null
    }

  }, [
    gameState,
    currentPlayer?.color,
    holdActive,
  ])


  /* ========================================
     CLEANUP
  ======================================== */

  useEffect(() => {

    return () => {

      stopFlatlineSound()

      stopBackgroundMusic()


      if (
        holdFrameRef.current !==
        null
      ) {

        cancelAnimationFrame(
          holdFrameRef.current,
        )
      }


      if (
        rhythmAlertTimerRef.current !==
        null
      ) {

        window.clearTimeout(
          rhythmAlertTimerRef.current,
        )
      }
    }

  }, [])


  /* ========================================
     SVG
  ======================================== */

  const sortedPoints =
    [...points].sort(
      (a, b) =>
        a.x - b.x,
    )


  const ecgPath =
    sortedPoints.length > 0
      ? sortedPoints
          .map(
            (
              point,
              index,
            ) =>
              `${
                index === 0
                  ? 'M'
                  : 'L'
              } ${point.x} ${point.y}`,
          )
          .join(' ')
      : ''


  const sortedResults =
    [...players].sort(
      (a, b) => {

        if (
          b.score !==
          a.score
        ) {

          return (
            b.score -
            a.score
          )
        }

        return (
          a.player_order -
          b.player_order
        )
      },
    )


  /* ========================================
     ROTATION
  ======================================== */

  if (
    gameState !==
      'results' &&
    !isTablet &&
    isPortrait
  ) {

    return (

      <section className="ecg-rotate-screen">

        <div className="ecg-rotate-phone">

          <div className="ecg-rotate-phone-screen">
            <span>↻</span>
          </div>

        </div>

        <p className="ecg-mode">
          {tr("RYTHME ECG")}</p>

        <h1>
          {tr("Tourne ton appareil")}</h1>

        <p>
          {tr("La partie se joue en mode paysage.")}</p>

      </section>
    )
  }


  if (
    errorMessage
  ) {

    return (

      <section className="ecg-multi-error-screen">

        <strong>
          {tr("Erreur")}</strong>

        <p>
          {tr(errorMessage)}
        </p>

      </section>
    )
  }


  if (
    gameState ===
    'loading'
  ) {

    return (

      <section className="ecg-multi-error-screen">

        <p>
          {tr("Chargement de la partie...")}</p>

      </section>
    )
  }


  /* ========================================
   RÉSULTATS MULTIJOUEUR
======================================== */

if (
  gameState ===
  'results'
) {

  return (

    <section className="rankings-page ecg-multi-final-ranking">


      {/* ========================================
          TITRE
      ======================================== */}

      <div className="rankings-heading">

        <p className="rankings-eyebrow">
          {tr("PARTIE TERMINÉE")}</p>

        <h1>
          {tr("Classement de la")}{' '}
          <span>
            {tr("partie")}</span>
        </h1>

        <p className="rankings-subtitle">
          {tr("Voici les résultats de votre partie Rythme ECG.")}</p>

      </div>


      {/* ========================================
          CARTE ECG
      ======================================== */}

      <div className="rankings-games">

        <article className="rankings-game-card ecg-multi-final-card">


          <div className="rankings-card-top">

            <div className="rankings-specialty-icon">

              <svg
                viewBox="0 0 512 512"
                aria-hidden="true"
              >
                <g>

                  <path
                    d="M435.924,97.105c-4.452-7.72-10.798-14.374-16.971-18.044-4.12-2.479-7.996-3.6-11.311-3.6
                    c-2.652.016-5.036.615-7.743,2.242-40.553,24.793-74.005,55.727-98.546,90.127
                    c-24.557,34.392-40.217,72.217-45.427,110.918-.813,5.992-6.322,10.183-12.306,9.378
                    c-5.999-.797-10.19-6.307-9.393-12.298c5.739-42.593,22.915-83.734,49.302-120.722
                    c13.79-19.292,30.105-37.462,48.623-54.149c-6.882-14.019-3.631-28.504,3.363-41.875
                    c3.67-7.017,7.562-13.442,10.285-19.844-.118-.323-.402-.868-.892-1.562
                    c-1.042-1.5-3.039-3.561-5.636-5.581-5.21-4.088-12.787-8.059-19.568-10.332
                    c-4.492-1.539-8.699-2.297-11.051-2.258l-.671.008c-.379.718-.828,1.594-1.318,2.589
                    c-1.002,2.044-2.233,4.586-3.623,7.324-2.85,5.487-6.338,11.801-11.162,17.413
                    c-3.228,3.726-7.12,7.286-12.353,9.614-2.96,1.318-6.402,2.163-9.985,2.139
                    c-18.456.079-27.627-17.192-29.798-33.089-.378-2.826-.544-5.289-.544-7.396
                    c0-.656,0-1.232,0-1.752.008-1.76-.087-2.66-.158-2.936-.102-.293.016-.158-.386-.734
                    c-.285-.379-.861-1.01-1.903-1.871-1.279-1.105-3.994-2.478-7.672-3.362
                    c-3.655-.9-8.186-1.373-12.843-1.366-4.184,0-8.477.364-12.361,1.018
                    c-21.391,3.544-17.057,17.113-17.057,34.708,0,4.278-.174,9.108-.727,14.516
                    c-.592,6.165-2.162,11.911-4.451,17.208-2.274,5.288-5.257,10.087-8.659,14.563
                    c-6.797,8.936-15.18,16.593-24.099,24.676-17.855,16.141-38.014,33.831-54.386,63.408
                    c-38.851,70.306-31.329,152.912,8.865,220.747,22.772,38.536,55.111,72.525,92.44,93.254
                    C220.729,504.012,247.772,512,276.054,512c11.706,0,23.649-1.366,35.79-4.294
                    c12.795-3.52,26.064-11.398,38.685-23.104,12.684-11.722,24.663-27.201,34.908-45.292
                    c20.523-36.184,34.021-82.778,33.974-130.313,0-36.641-7.949-73.763-26.491-107.674
                    c-2.534,2.85-4.957,5.81-7.23,8.904-5.825,7.948-10.728,16.734-14.256,26.814
                    c-2.004,5.714-8.252,8.722-13.952,6.71-5.706-1.989-8.706-8.225-6.709-13.94
                    c4.294-12.322,10.324-23.097,17.282-32.545,6.955-9.456,14.816-17.618,22.868-24.864
                    c16.095-14.484,32.971-25.527,45.222-35.662,2.463-2.06,4.057-4.294,5.193-6.93
                    c1.106-2.644,1.689-5.746,1.689-9.259C443.091,113.46,440.47,104.809,435.924,97.105z"
                  />

                </g>
              </svg>

            </div>

          </div>


          <div className="rankings-card-content">

            <p className="rankings-specialty">
              {tr("CARDIOLOGIE • MULTIJOUEUR")}</p>

            <h2>
              {tr("Rythme ECG")}</h2>

            <p>
              {tr("Classement final de cette partie.")}</p>

          </div>


          {/* ========================================
              CLASSEMENT DE LA PARTIE
          ======================================== */}

          <div className="ecg-multi-match-ranking">

            {sortedResults.map(
              (
                player,
                index,
              ) => {

                const rank =
                  index + 1

                const avatarIndex =
                  Math.max(
                    0,
                    Math.min(
                      avatars.length - 1,
                      player.avatar - 1,
                    ),
                  )


                return (

                  <div
                    key={
                      player.player_id
                    }
                    className={
                      `ecg-ranking-row ${
                        rank <= 3
                          ? `ecg-ranking-top ecg-ranking-${rank}`
                          : ''
                      } ${
                        player.player_id ===
                        currentPlayerId
                          ? 'ecg-ranking-me'
                          : ''
                      }`
                    }
                  >


                    <div className="ecg-ranking-position">

                      {rank === 1
                        ? '🥇'
                        : rank === 2
                          ? '🥈'
                          : rank === 3
                            ? '🥉'
                            : rank}

                    </div>


                    <img
                      className="ecg-ranking-avatar"
                      src={
                        avatars[
                          avatarIndex
                        ]
                      }
                      alt=""
                    />


                    <div className="ecg-ranking-player">

                      <span
                        className={
                          `ecg-multi-ranking-dot ecg-color-${player.color}`
                        }
                      />

                      <strong>
                        {player.pseudo}
                      </strong>


                      {player.player_id ===
                        currentPlayerId && (

                        <span>
                          {tr("TOI")}</span>

                      )}

                    </div>


                    <div className="ecg-ranking-score">

                      <strong>
                        {player.score.toLocaleString(
                          getLanguage(),
                        )}
                      </strong>

                      <span>
                        {tr("PTS")}</span>

                    </div>

                  </div>

                )
              },
            )}

          </div>


          {/* ========================================
              BOUTON
          ======================================== */}

          <div className="rankings-card-bottom">

            <ReturnToGamesButton roomId={room!.id} />

          </div>


        </article>

      </div>

    </section>
  )
}


  /* ========================================
   JEU
======================================== */

return (

  <section
    className={
      `ecg-game-page ecg-state-${gameState} ${
        isTablet
          ? 'ecg-device-tablet'
          : 'ecg-device-phone'
      }`
    }
  >


    {remoteEliminationError && (
      <div role="alert" style={{
        position: 'fixed', top: 90, left: 16, right: 16,
        zIndex: 99999, padding: 16, borderRadius: 12,
        background: '#7f1d1d', color: '#fff',
        fontSize: 16, overflowWrap: 'anywhere',
      }}>
        <strong>{tr("ERREUR ÉLIMINATION ECG — prends une capture d’écran")}</strong>
        <p>{tr(remoteEliminationError)}</p>
      </div>
    )}

    {/* =================================
        COUNTDOWN
    ================================= */}

    {gameState ===
      'countdown' && (

      <div className="ecg-play-area">

        <div className="ecg-countdown">

          <span className="ecg-countdown-label">
            {tr("PRÊT ?")}</span>

          <strong
            key={
              countdown
            }
          >
            {countdown === 0
              ? tr('GO')
              : countdown}
          </strong>

        </div>

      </div>

    )}


    {/* =================================
        JEU
    ================================= */}

    {(
  gameState === 'playing' ||
  gameState === 'eliminated'
) && (
  <>

    {/* HUD DES JOUEURS */}

    <div className="ecg-multi-hud">

        {players
          .slice()
          .sort(
            (a, b) =>
              a.player_order -
              b.player_order,
          )
          .map(
            player => (

              <div
                key={
                  player.player_id
                }
                className={
                  `ecg-multi-hud-player ${
                    player.player_id ===
                    currentPlayerId
                      ? 'is-me'
                      : ''
                  } ${
                    player.eliminated
                      ? 'is-eliminated'
                      : ''
                  }`
                }
              >

                <span
                  className={
                    `ecg-multi-player-dot ecg-color-${player.color}`
                  }
                />

                <strong>
                  {player.pseudo}
                </strong>

                <span>
                  {player.score}
                </span>

              </div>

            ),
          )}

      </div>


      <div className="ecg-play-area">

        <div className="ecg-game-board">


          {rhythmAlert && (

            <div className="ecg-rhythm-alert">

              <strong>
                {tr(rhythmAlert)}
              </strong>

            </div>

          )}


          <svg
            ref={
              svgRef
            }

            className="ecg-tracer"

            viewBox="0 0 1000 500"

            preserveAspectRatio="none"

            onPointerDown={
              handleECGPointerDown
            }
          >

            <defs>

              <linearGradient
                id="ecgMultiGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >

                <stop
                  offset="0%"
                  stopColor="#198CA7"
                />

                <stop
                  offset="55%"
                  stopColor="#55D9EE"
                />

                <stop
                  offset="100%"
                  stopColor="#A4F4FF"
                />

              </linearGradient>

            </defs>


            <path
              className="ecg-trace-live"
              d={
                ecgPath
              }
              style={{
                stroke:
                  'url(#ecgMultiGradient)',
              }}
            />


            {targets.map(
              target => (

                <g
                  key={
                    target.id
                  }

                  className={
                    `ecg-live-target ecg-target-${target.color}`
                  }

                  transform={
                    `translate(${target.x} ${target.y})`
                  }

                  pointerEvents="none"
                >

                  <circle
                    className="ecg-target-glow"
                    r="27"
                  />

                  <circle
                    className="ecg-target-ring"
                    r="18"
                  />

                  <circle
                    className="ecg-target-dot"
                    r="5"
                  />

                </g>

              ),
            )}

          </svg>


          {/* ASYSTOLIE */}

          {holdActive &&
            !eliminatedRef.current && (

            <div className="ecg-hold-event">

              <span className="ecg-hold-warning">
                {tr("SIGNAL PERDU")}</span>

              <div
                className="ecg-hold-touch-zone"

                onPointerDown={
                  event => {

                    event.preventDefault()

                    event.stopPropagation()

                    event.currentTarget
                      .setPointerCapture(
                        event.pointerId,
                      )

                    startHold()
                  }
                }

                onPointerUp={
                  event => {

                    event.preventDefault()

                    /*
                      On ne remet pas
                      immédiatement la jauge
                      à zéro si le maintien
                      a réussi.
                    */

                    if (
                      !holdCompletedRef.current
                    ) {

                      cancelHold()
                    }
                  }
                }

                onPointerCancel={
                  cancelHold
                }
              >

                <button
                  type="button"

                  className={
                    `ecg-hold-button ${
                      holdPressed
                        ? 'is-holding'
                        : ''
                    }`
                  }

                  style={
                    {
                      '--hold-progress':
                        `${holdProgress}%`,
                    } as CSSProperties
                  }

                  tabIndex={-1}
                >

                  <span className="ecg-hold-progress" />

                  <strong>
                    {tr("MAINTIENS")}</strong>

                </button>

              </div>


              <div className="ecg-hold-meter">

                <div className="ecg-hold-meter-track">

                  <div
                    className="ecg-hold-meter-fill"

                    style={{
                      width:
                        `${holdProgress}%`,
                    }}
                  />

                </div>


                <div className="ecg-hold-meter-info">

                  <span>
                    {Math.round(
                      holdProgress,
                    )} %
                  </span>

                  <strong>
                    +500
                  </strong>

                </div>

              </div>


              <span className="ecg-hold-bonus">
                {tr("+500 POINTS")}</span>

            </div>

          )}


          {/* JOUEUR ÉLIMINÉ */}

          {gameState ===
            'eliminated' && (

            <div className="ecg-multi-eliminated-overlay">

              <div className="ecg-multi-eliminated-card">

                <p>
                  {tr("PARTIE TERMINÉE")}</p>

                <strong>
                  {score}
                </strong>

                <span>
                  {tr("points")}</span>

                <div className="ecg-multi-waiting">

                  <i />

                  {tr("En attente des autres joueurs…")}</div>

                <small>
                  {tr("La partie continue en arrière-plan.")}</small>

              </div>

            </div>

          )}

        </div>

            </div>

    </>

  )}

  </section>
)
}


export default ECGMultiplayerGame