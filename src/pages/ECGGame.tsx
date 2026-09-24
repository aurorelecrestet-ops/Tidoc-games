import { getLanguage } from '../i18n/languages'
import { tr } from '../i18n/gameText'
import { useGameAudio } from '../hooks/useGameAudio'
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react'

import { useNavigate } from 'react-router-dom'
import SoloPauseMenu from '../components/SoloPauseMenu'

import './ECGGame.css'

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

import {
  getLeaderboard,
  submitBestScore,
  type LeaderboardEntry,
} from '../lib/player'


type ECGGameProps = {
  onFullscreenChange?: (
    fullscreen: boolean
  ) => void
}


type GameState =
  | 'ready'
  | 'rotate'
  | 'countdown'
  | 'playing'
  | 'record'
  | 'gameover'


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

/*
  À partir de cette largeur de petit côté,
  on considère l'appareil comme une tablette.

  iPhone paysage :
  petit côté généralement < 600 px.

  iPad :
  petit côté généralement >= 600 px.
*/
const TABLET_MIN_SHORT_SIDE = 600

const RECORD_PAUSE_DURATION = 2000


/* ========================================
   BATTEMENT SINUSAL
======================================== */

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


/* ========================================
   EXTRASYSTOLE VENTRICULAIRE
======================================== */

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


/* ========================================
   FIBRILLATION ATRIALE
======================================== */

const AF_PATTERNS: PatternPoint[][] = [
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


/* ========================================
   FLUTTER
======================================== */

const FLUTTER_BEAT: PatternPoint[] = [
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


/* ========================================
   SÉQUENCES
======================================== */

const RHYTHM_SEQUENCES:
Record<RhythmEvent, BeatType[]> = {
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


function chooseRhythmEvent():
RhythmEvent {

  const random =
    Math.random()

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


/* ========================================
   APPAREIL
======================================== */

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

const leaderboardAvatars = [
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

function ECGGame({
  onFullscreenChange,
}: ECGGameProps) {
  const { setMusicVolume, setMusicMuted, getEffectsOutput } = useGameAudio()


  const navigate =
    useNavigate()


  /* ========================================
     APPAREIL / ORIENTATION
  ======================================== */

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


  /* ========================================
     STATE
  ======================================== */

  const [
    gameState,
    setGameState,
  ] = useState<GameState>(
    'ready',
  )

  const [paused, setPaused] = useState(false)

  const [
    countdown,
    setCountdown,
  ] = useState(3)

  const [
    score,
    setScore,
  ] = useState(0)

  const [
    bestScore,
    setBestScore,
  ] = useState(() => {

    const saved =
      localStorage.getItem(
        'tidoc-ecg-best-score',
      )

    const value =
      Number(saved)

    return Number.isFinite(value)
      ? value
      : 0
  })

  const [
    points,
    setPoints,
  ] = useState<ECGPoint[]>([])

  const [
    targets,
    setTargets,
  ] = useState<ECGTarget[]>([])

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
  leaderboard,
  setLeaderboard,
] = useState<LeaderboardEntry[]>([])

const [
  leaderboardLoading,
  setLeaderboardLoading,
] = useState(false)

const [
  rhythmAlert,
  setRhythmAlert,
] = useState<string | null>(
  null,
)


  /* ========================================
     REFS
  ======================================== */

const rhythmAlertTimerRef =
  useRef<number | null>(
    null,
  )

  const pointsRef =
    useRef<ECGPoint[]>([])

  const targetsRef =
    useRef<ECGTarget[]>([])

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
    useRef(0)

  const pointIdRef =
    useRef(0)

  const targetIdRef =
    useRef(0)

  const gameOverRef =
    useRef(false)

  const scoreRef =
    useRef(0)

  const nextHoldScoreRef =
    useRef(2500)

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

  /*
    Record présent AVANT le début
    de la partie.
  */
  const recordToBeatRef =
    useRef(bestScore)

  /*
    Permet de n'afficher
    l'animation qu'une fois.
  */
  const recordCelebratedRef =
    useRef(false)

  /*
    Sert à reprendre la partie
    après l'animation record.
  */
  const recordTimerRef =
    useRef<number | null>(
      null,
    )


  /* ========================================
     ORIENTATION
  ======================================== */

  useEffect(() => {

    const updateDevice = () => {

      const device =
        getDeviceState()

      setIsPortrait(
        device.isPortrait,
      )

      setIsTablet(
        device.isTablet,
      )
    }

    updateDevice()

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
     HEADER / MODE IMMERSIF
  ======================================== */

  useEffect(() => {

    /*
      TABLETTE :
      - menu : Header
      - countdown / partie : plein écran
      - Game Over : Header

      TÉLÉPHONE :
      - menu : Header
      - rotation vers paysage : plein écran
      - countdown / partie : plein écran
      - fin en paysage : plein écran
      - résultats portrait : Header
    */

    const fullscreen =
      gameState === 'rotate' ||
      gameState === 'countdown' ||
      gameState === 'playing' ||
      gameState === 'record' ||
      (
        gameState === 'gameover' &&
        !isTablet &&
        !isPortrait
      )

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
    isPortrait,
    isTablet,
    onFullscreenChange,
  ])


  /* ========================================
     AUDIO
  ======================================== */

function prepareBackgroundMusic() {

  if (
    backgroundMusicRef.current
  ) {
    return backgroundMusicRef.current
  }

  const audio =
    new Audio(
      backgroundMusic,
    )

  audio.loop = true

  setMusicVolume(audio, 0.001)

  audio.preload = 'auto'

  backgroundMusicRef.current =
    audio

  return audio
}


function unlockBackgroundMusic() {

  const audio =
    prepareBackgroundMusic()

  setMusicMuted(audio, false)

  setMusicVolume(audio, 0.001)

  /*
    IMPORTANT POUR IPHONE :
    on lance réellement la musique
    pendant le clic utilisateur.

    On ne la met pas en pause ensuite.
    Elle tourne simplement presque
    silencieusement pendant le countdown.
  */

  if (
    audio.paused
  ) {

    void audio
      .play()
      .catch(
        error => {

          console.warn(
            'Déverrouillage musique ECG bloqué :',
            error,
          )
        },
      )
  }
}


function startBackgroundMusic() {

  const audio =
    prepareBackgroundMusic()

  setMusicMuted(audio, false)

  /*
    La musique joue déjà grâce
    au clic sur "Commencer".

    On augmente simplement son volume
    lorsque la partie commence.
  */

  setMusicVolume(audio, 0.18)

  if (
    audio.paused
  ) {

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


  function warmUpAudio() {

    const context =
      getAudioContext()

    const oscillator =
      context.createOscillator()

    const gain =
      context.createGain()

    gain.gain.value = 0

    oscillator.connect(gain)

    gain.connect(
      getEffectsOutput(context),
    )

    oscillator.start()

    oscillator.stop(
      context.currentTime +
      0.01,
    )
  }

  

  function playHeartBeep() {

    const context =
      audioContextRef.current

    if (!context) {
      return
    }

    if (
      context.state ===
      'suspended'
    ) {

      void context.resume()
    }

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

    oscillator.connect(gain)

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

  /*
    3 → 520 Hz
    2 → 620 Hz
    1 → 720 Hz
    GO → 980 Hz
  */
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

  oscillator.start(
    now,
  )

  oscillator.stop(
    now + duration,
  )
}

function playGameOverSound() {

  const context =
    getAudioContext()

  const now =
    context.currentTime


  /*
    Première tonalité :
    chute rapide.
  */

  const oscillator1 =
    context.createOscillator()

  const gain1 =
    context.createGain()

  oscillator1.type =
    'sine'

  oscillator1.frequency.setValueAtTime(
    520,
    now,
  )

  oscillator1.frequency.exponentialRampToValueAtTime(
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

  oscillator1.connect(
    gain1,
  )

  gain1.connect(
    getEffectsOutput(context),
  )

  oscillator1.start(
    now,
  )

  oscillator1.stop(
    now + 0.36,
  )


  /*
    Deuxième tonalité :
    petit "échec" plus grave.
  */

  const oscillator2 =
    context.createOscillator()

  const gain2 =
    context.createGain()

  oscillator2.type =
    'sine'

  oscillator2.frequency.value =
    180

  const secondStart =
    now + 0.28

  gain2.gain.setValueAtTime(
    0.0001,
    secondStart,
  )

  gain2.gain.exponentialRampToValueAtTime(
    0.10,
    secondStart + 0.015,
  )

  gain2.gain.exponentialRampToValueAtTime(
    0.0001,
    secondStart + 0.35,
  )

  oscillator2.connect(
    gain2,
  )

  gain2.connect(
    getEffectsOutput(context),
  )

  oscillator2.start(
    secondStart,
  )

  oscillator2.stop(
    secondStart + 0.36,
  )
}

  function playRecordSound() {

  const context =
    getAudioContext()

  const now =
    context.currentTime

  /*
    Petite fanfare de victoire :
    notes montantes puis accord final.
  */

  const notes = [
    {
      frequency: 523.25,
      start: 0,
      duration: 0.14,
    },
    {
      frequency: 659.25,
      start: 0.12,
      duration: 0.14,
    },
    {
      frequency: 783.99,
      start: 0.24,
      duration: 0.14,
    },
    {
      frequency: 1046.5,
      start: 0.38,
      duration: 0.42,
    },
  ]


  notes.forEach(
    note => {

      const oscillator =
        context.createOscillator()

      const gain =
        context.createGain()

      oscillator.type =
        'triangle'

      oscillator.frequency.value =
        note.frequency

      const startTime =
        now +
        note.start

      gain.gain.setValueAtTime(
        0.0001,
        startTime,
      )

      gain.gain.exponentialRampToValueAtTime(
        0.12,
        startTime + 0.015,
      )

      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        startTime +
          note.duration,
      )

      oscillator.connect(
        gain,
      )

      gain.connect(
        getEffectsOutput(context),
      )

      oscillator.start(
        startTime,
      )

      oscillator.stop(
        startTime +
          note.duration,
      )
    },
  )


  /*
    Petit accord brillant final
    pour donner davantage
    l'impression de victoire.
  */

  const finalNotes = [
    523.25,
    659.25,
    783.99,
  ]

  finalNotes.forEach(
    frequency => {

      const oscillator =
        context.createOscillator()

      const gain =
        context.createGain()

      oscillator.type =
        'sine'

      oscillator.frequency.value =
        frequency

      const startTime =
        now + 0.48

      gain.gain.setValueAtTime(
        0.0001,
        startTime,
      )

      gain.gain.exponentialRampToValueAtTime(
        0.055,
        startTime + 0.02,
      )

      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        startTime + 0.55,
      )

      oscillator.connect(
        gain,
      )

      gain.connect(
        getEffectsOutput(context),
      )

      oscillator.start(
        startTime,
      )

      oscillator.stop(
        startTime + 0.56,
      )
    },
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

  first.type = 'sine'

  first.frequency.setValueAtTime(
    740,
    now,
  )

  first.connect(gain)

  first.start(now)

  first.stop(
    now + 0.16,
  )


  const second =
    context.createOscillator()

  second.type = 'sine'

  second.frequency.setValueAtTime(
    980,
    now + 0.17,
  )

  second.connect(gain)

  second.start(
    now + 0.17,
  )

  second.stop(
    now + 0.42,
  )
}  

  /* ========================================
     RESET
  ======================================== */

  function resetEngine() {

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

    gameOverRef.current =
      false

    recordToBeatRef.current =
      bestScore

    recordCelebratedRef.current =
      false

    if (
      recordTimerRef.current !==
      null
    ) {

      window.clearTimeout(
        recordTimerRef.current,
      )
    }

    recordTimerRef.current =
      null

    nextHoldScoreRef.current =
      2500 +
      Math.floor(
        Math.random() *
        1000,
      )

    setHoldActive(false)

    setHoldPressed(false)

    setHoldProgress(0)

    holdStartRef.current =
      null

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

    stopFlatlineSound()
  }


  /* ========================================
     COMMENCER
  ======================================== */

function startGame() {

  /*
    Déverrouille les sons Web Audio
    avec le clic utilisateur.
  */

  warmUpAudio()

  /*
    Déverrouille également la musique
    HTMLAudio pour Safari / iPhone.

    Elle commence presque silencieusement.
  */

  unlockBackgroundMusic()


  setScore(0)

  scoreRef.current =
    0

  setCountdown(3)

  resetEngine()


  if (
    isPortrait
  ) {

    setGameState(
      'rotate',
    )

  } else {

    setGameState(
      'countdown',
    )
  }
}


  useEffect(() => {

    if (
      gameState === 'rotate' &&
      !isPortrait
    ) {

      setCountdown(3)

      setGameState(
        'countdown',
      )
    }

  }, [
    gameState,
    isPortrait,
  ])

  useEffect(() => {

  if (
    gameState !==
    'countdown'
  ) {
    return
  }

  playCountdownSound(
    countdown,
  )

}, [
  gameState,
  countdown,
])

  /* ========================================
     COUNTDOWN
  ======================================== */

  useEffect(() => {

    if (
      gameState !==
      'countdown'
    ) {
      return
    }

    /*
      Une fois commencé,
      le countdown continue même
      si le téléphone est retourné.
    */

    if (
  countdown === 0
) {

  const timer =
    window.setTimeout(
      () => {

        startBackgroundMusic()

        setGameState(
          'playing',
        )

      },
      650,
    )

      return () =>
        window.clearTimeout(
          timer,
        )
    }

    const timer =
      window.setTimeout(
        () => {

          setCountdown(
            value =>
              value - 1,
          )

        },
        800,
      )

    return () =>
      window.clearTimeout(
        timer,
      )

  }, [
    gameState,
    countdown,
  ])


  /* ========================================
     NOUVEAU RECORD
  ======================================== */

  function triggerNewRecord() {

    if (
      recordCelebratedRef.current
    ) {
      return
    }

    /*
      Si le joueur n'avait encore
      jamais de score, on ne déclenche
      pas l'animation à 100 points.
    */
    if (
      recordToBeatRef.current <= 0
    ) {
      return
    }

    recordCelebratedRef.current =
      true

    setGameState(
      'record',
    )

    playRecordSound()

    recordTimerRef.current =
      window.setTimeout(
        () => {

          recordTimerRef.current =
            null

          setGameState(
            'playing',
          )

        },
        RECORD_PAUSE_DURATION,
      )
  }


  /* ========================================
     CIBLE
  ======================================== */

  function hitTarget(
    id: number,
  ) {

    if (
      gameState !==
      'playing' ||
      holdActive ||
      (
        !isTablet &&
        isPortrait
      )
    ) {
      return
    }

    const exists =
      targetsRef.current.some(
        target =>
          target.id === id,
      )

    if (!exists) {
      return
    }

    targetsRef.current =
      targetsRef.current.filter(
        target =>
          target.id !== id,
      )

    setTargets([
      ...targetsRef.current,
    ])

    scoreRef.current +=
      100

    const newScore =
      scoreRef.current

    setScore(
      newScore,
    )

    playHeartBeep()

    if (
      !recordCelebratedRef.current &&
      recordToBeatRef.current > 0 &&
      newScore >
        recordToBeatRef.current
    ) {

      triggerNewRecord()
    }
  }


  /* ========================================
     TOUCH IPHONE / IPAD
  ======================================== */

  function handleECGPointerDown(
    event:
      ReactPointerEvent<SVGSVGElement>,
  ) {

    if (
      gameState !==
      'playing' ||
      holdActive ||
      (
        !isTablet &&
        isPortrait
      )
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

    if (
      rect.width <= 0 ||
      rect.height <= 0
    ) {
      return
    }

    const coarsePointer =
      window.matchMedia(
        '(pointer: coarse)',
      ).matches

    /*
      On conserve la sensibilité
      qui fonctionne bien maintenant.
    */
    const hitRadius =
      coarsePointer
        ? 70
        : 38

    let nearestTarget:
      ECGTarget | null =
      null

    let nearestDistance =
      Infinity

    for (
      const target of
      targetsRef.current
    ) {

      const targetScreenX =
        rect.left +
        (
          target.x /
          SVG_WIDTH
        ) *
        rect.width

      const targetScreenY =
        rect.top +
        (
          target.y /
          SVG_HEIGHT
        ) *
        rect.height

      const distance =
        Math.hypot(
          event.clientX -
            targetScreenX,

          event.clientY -
            targetScreenY,
        )

      if (
        distance <=
          hitRadius &&
        distance <
          nearestDistance
      ) {

        nearestTarget =
          target

        nearestDistance =
          distance
      }
    }

    if (
      nearestTarget
    ) {

      hitTarget(
        nearestTarget.id,
      )
    }
  }


  /* ========================================
     HOLD
  ======================================== */

  function beginHoldEvent() {

    if (
      targetsRef.current.length >
      0
    ) {

      nextHoldScoreRef.current +=
        300

      return
    }

    setHoldActive(true)

    setHoldPressed(false)

    setHoldProgress(0)

    if (
  rhythmAlertTimerRef.current !==
  null
) {

  window.clearTimeout(
    rhythmAlertTimerRef.current,
  )
}

setRhythmAlert(
  'ASYSTOLIE',
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

    holdStartRef.current =
      null

    beatQueueRef.current = []

    patternIndexRef.current =
      0

    currentPatternRef.current = [
      {
        dx: 40,
        dy: 0,
      },
    ]

    startFlatlineSound()
  }


  function finishHoldEvent() {

    setHoldPressed(false)

    setHoldProgress(100)

    setHoldActive(false)

    holdStartRef.current =
      null

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

    stopFlatlineSound()

    scoreRef.current +=
      HOLD_BONUS

    const newScore =
      scoreRef.current

    setScore(
      newScore,
    )

    playHeartBeep()

    patternIndexRef.current =
      0

    currentPatternRef.current =
      SINUS_BEAT

    beatQueueRef.current = [
      'sinus',
      'sinus',
    ]

    nextHoldScoreRef.current =
      newScore +
      3000 +
      Math.floor(
        Math.random() *
        2000,
      )

    if (
      !recordCelebratedRef.current &&
      recordToBeatRef.current > 0 &&
      newScore >
        recordToBeatRef.current
    ) {

      triggerNewRecord()
    }
  }


  function startHold() {

    if (
      !holdActive ||
      gameState !==
      'playing' ||
      (
        !isTablet &&
        isPortrait
      ) ||
      holdPressed
    ) {
      return
    }

    setHoldPressed(true)

    holdStartRef.current =
      performance.now()

    function updateHold(
      time: number,
    ) {

      if (
        holdStartRef.current ===
        null
      ) {
        return
      }

      const elapsed =
        time -
        holdStartRef.current

      const progress =
        Math.min(
          (
            elapsed /
            HOLD_DURATION
          ) *
          100,
          100,
        )

      setHoldProgress(
        progress,
      )

      if (
        progress >= 100
      ) {

        finishHoldEvent()

        return
      }

      holdFrameRef.current =
        requestAnimationFrame(
          updateHold,
        )
    }

    holdFrameRef.current =
      requestAnimationFrame(
        updateHold,
      )
  }


  function cancelHold() {

    if (
      !holdActive
    ) {
      return
    }

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
  }


  useEffect(() => {

    /*
      Sur téléphone seulement :
      on annule le maintien si le
      téléphone est retourné.

      Sur tablette, aucune contrainte
      portrait/paysage pour les menus,
      mais le jeu reste conçu paysage.
    */

    if (
      !isTablet &&
      isPortrait &&
      holdPressed
    ) {

      cancelHold()
    }

  }, [
    isPortrait,
    isTablet,
    holdPressed,
  ])


 /* ========================================
   GAME OVER
======================================== */

function endGame() {

  if (
    gameOverRef.current
  ) {
    return
  }

  gameOverRef.current =
    true

  stopFlatlineSound()

  stopBackgroundMusic()

  playGameOverSound()

  const finalScore =
    scoreRef.current

  setScore(
    finalScore,
  )

  setBestScore(
    currentBest => {

      const newBest =
        Math.max(
          currentBest,
          finalScore,
        )

      localStorage.setItem(
        'tidoc-ecg-best-score',
        String(newBest),
      )

      return newBest
    },
  )


  /*
    ENREGISTREMENT DU SCORE,
    PUIS ACTUALISATION DU CLASSEMENT.
  */

  setLeaderboardLoading(true)

  void submitBestScore(
    'ecg',
    finalScore,
  )
    .then(() =>
      getLeaderboard(
        'ecg',
        10,
      )
    )
    .then(
      entries => {

        setLeaderboard(
          entries,
        )

      },
    )
    .catch(
      error => {

        console.error(
          'Erreur classement ECG :',
          error,
        )

      },
    )
    .finally(
      () => {

        setLeaderboardLoading(
          false,
        )

      },
    )


  setGameState(
    'gameover',
  )
}


  /* ========================================
     RETOUR MENU SOLO
  ======================================== */

  function returnToMenu() {

    onFullscreenChange?.(
      false,
    )

    navigate('/solo')
  }

  function pauseGame() {
    stopBackgroundMusic()
    setPaused(true)
  }

  function resumeGame() {
    setPaused(false)
    startBackgroundMusic()
  }

  /* ========================================
   NOM DU TROUBLE DU RYTHME
======================================== */

function showRhythmAlert(
  event: RhythmEvent,
) {

  const labels:
  Partial<
    Record<RhythmEvent, string>
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
     MOTEUR
  ======================================== */

  useEffect(() => {

    if (
      paused ||
      gameState !==
      'playing'
    ) {
      return
    }

    /*
      IMPORTANT :

      PLUS AUCUN PLAFOND.

      Avant :
      vitesse max = 220.

      Maintenant :
      elle continue à augmenter
      tant que le score augmente.

      0 pts     = 90
      1 000     = 100
      5 000     = 140
      10 000    = 190
      20 000    = 290
      30 000    = 390
      etc.

      Donc un excellent joueur
      finit obligatoirement par
      rencontrer une difficulté
      de plus en plus élevée.
    */

    const BASE_SPEED =
      90

    function frame(
      time: number,
    ) {

      if (
        gameOverRef.current
      ) {
        return
      }

      const speed =
        BASE_SPEED +
        Math.floor(
          scoreRef.current /
          250,
        ) *
        8

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
        targetsRef.current.map(
          target => ({
            ...target,

            x:
              target.x -
              movement,
          }),
        )

      if (!holdActive) {

        const missedTarget =
          targetsRef.current.some(
            target =>
              target.x <=
              MISS_X,
          )

        if (
          missedTarget
        ) {

          setPoints([
            ...pointsRef.current,
          ])

          setTargets([
            ...targetsRef.current,
          ])

          endGame()

          return
        }
      }

      if (
        !holdActive &&
        scoreRef.current >=
          nextHoldScoreRef.current
      ) {

        beginHoldEvent()
      }

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

          x: SPAWN_X,

          y:
            BASELINE +
            nextPattern.dy,
        }

        pointsRef.current.push(
          newPoint,
        )

        if (
          nextPattern.target &&
          !holdActive
        ) {

          targetsRef.current.push(
            {
              id:
                targetIdRef.current++,

              x: SPAWN_X,

              y:
                newPoint.y,

              wave:
                nextPattern.target,
            },
          )
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
            holdActive
          ) {

            currentPatternRef.current = [
              {
                dx: 40,
                dy: 0,
              },
            ]

          } else if (
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
              beatQueueRef.current.shift()
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
                  Math.random() *
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

      targetsRef.current =
        targetsRef.current.filter(
          target =>
            target.x >
            -80,
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
    holdActive,
    paused,
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
        recordTimerRef.current !==
        null
      ) {

        window.clearTimeout(
          recordTimerRef.current,
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


  /* ========================================
     ROTATION VERS PAYSAGE
  ======================================== */

  const mustRotateForGame =
    gameState === 'rotate' ||
    (
      !isTablet &&
      isPortrait &&
      (
        gameState ===
          'countdown' ||
        gameState ===
          'playing' ||
        gameState ===
          'record'
      )
    )

  if (
    mustRotateForGame
  ) {

    return (

      <section className="ecg-rotate-screen">

        <div className="ecg-rotate-phone">

          <div className="ecg-rotate-phone-screen">
            <span>↻</span>
          </div>

        </div>

        <p className="ecg-mode">
          Beat Catcher
        </p>

        <h1>
          {tr("Tourne ton appareil")}</h1>

        <p>
          {tr("La partie se joue en mode paysage.")}</p>

      </section>
    )
  }


  /* ========================================
     FIN : TÉLÉPHONE → PORTRAIT
  ======================================== */

  if (
    gameState === 'gameover' &&
    !isTablet &&
    !isPortrait
  ) {

    return (

      <section className="ecg-return-portrait">

        <div className="ecg-return-phone">

          <div className="ecg-return-phone-screen">
            <span>↻</span>
          </div>

        </div>

        <p className="ecg-mode">
          {tr("PARTIE TERMINÉE")}</p>

        <h1>
          {tr("Repasse en portrait")}</h1>

        <p>
          {tr("Tourne ton appareil pour afficher tes résultats.")}</p>

      </section>
    )
  }


  /* ========================================
     AFFICHAGE
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

      {gameState === 'playing' && (
        <SoloPauseMenu
          paused={paused}
          onPause={pauseGame}
          onResume={resumeGame}
          onReturn={returnToMenu}
          label="Beat Catcher"
        />
      )}


     {(
  gameState === 'playing' ||
  gameState === 'record'
) && (

  <div className="ecg-topbar">


    {/* =================================
        MEILLEUR SCORE — GAUCHE
    ================================= */}

    <div className="ecg-best-score">

      <span>
        {tr("MEILLEUR SCORE")}</span>

      <strong>
        {bestScore.toLocaleString(
          getLanguage(),
        )}
      </strong>

    </div>


    {/* =================================
        TITRE — CENTRE
    ================================= */}

    <div className="ecg-hud-title">

      <span>
        BEAT
      </span>

      <strong>
        CATCHER
      </strong>

    </div>


    {/* =================================
        SCORE — DROITE
    ================================= */}

    <div className="ecg-current-score">

      <span>
        {tr("SCORE")}</span>

      <strong>
        {score.toLocaleString(
          getLanguage(),
        )}
      </strong>

    </div>


  </div>

)}


      <div className="ecg-play-area">


        {/* =================================
            MENU
        ================================= */}

        {gameState ===
          'ready' && (

          <div className="ecg-start-screen">

            <div className="ecg-menu-best">

              <span>
                {tr("MEILLEUR SCORE")}</span>

              <strong>
                {bestScore}
              </strong>

            </div>

            <div className="ecg-start-icon">

              <svg
  viewBox="0 0 512 512"
  aria-hidden="true"
>
  <g>
    <path
      fill="currentColor"
      d="M435.924,97.105c-4.452-7.72-10.798-14.374-16.971-18.044c-4.12-2.479-7.996-3.6-11.311-3.6
      c-2.652.016-5.036.615-7.743,2.242c-40.553,24.793-74.005,55.727-98.546,90.127
      c-24.557,34.392-40.217,72.217-45.427,110.918c-.813,5.992-6.322,10.183-12.306,9.378
      c-5.999-.797-10.19-6.307-9.393-12.298c5.739-42.593,22.915-83.734,49.302-120.722
      c13.79-19.292,30.105-37.462,48.623-54.149c-6.882-14.019-3.631-28.504,3.363-41.875
      c3.67-7.017,7.562-13.442,10.285-19.844c-.118-.323-.402-.868-.892-1.562
      c-1.042-1.5-3.039-3.561-5.636-5.581c-5.21-4.088-12.787-8.059-19.568-10.332
      c-4.492-1.539-8.699-2.297-11.051-2.258l-.671.008c-.379.718-.828,1.594-1.318,2.589
      c-1.002,2.044-2.233,4.586-3.623,7.324c-2.85,5.487-6.338,11.801-11.162,17.413
      c-3.228,3.726-7.12,7.286-12.353,9.614c-2.96,1.318-6.402,2.163-9.985,2.139
      c-18.456.079-27.627-17.192-29.798-33.089c-.378-2.826-.544-5.289-.544-7.396
      c0-.656,0-1.232,0-1.752c.008-1.76-.087-2.66-.158-2.936c-.102-.293.016-.158-.386-.734
      c-.285-.379-.861-1.01-1.903-1.871c-1.279-1.105-3.994-2.478-7.672-3.362
      c-3.655-.9-8.186-1.373-12.843-1.366c-4.184,0-8.477.364-12.361,1.018
      c-21.391,3.544-17.057,17.113-17.057,34.708c0,4.278-.174,9.108-.727,14.516
      c-.592,6.165-2.162,11.911-4.451,17.208c-2.274,5.288-5.257,10.087-8.659,14.563
      c-6.797,8.936-15.18,16.593-24.099,24.676c-17.855,16.141-38.014,33.831-54.386,63.408
      c-38.851,70.306-31.329,152.912,8.865,220.747c22.772,38.536,55.111,72.525,92.44,93.254
      C220.729,504.012,247.772,512,276.054,512c11.706,0,23.649-1.366,35.79-4.294
      c12.795-3.52,26.064-11.398,38.685-23.104c12.684-11.722,24.663-27.201,34.908-45.292
      c20.523-36.184,34.021-82.778,33.974-130.313c0-36.641-7.949-73.763-26.491-107.674
      c-2.534,2.85-4.957,5.81-7.23,8.904c-5.825,7.948-10.728,16.734-14.256,26.814
      c-2.004,5.714-8.252,8.722-13.952,6.71c-5.706-1.989-8.706-8.225-6.709-13.94
      c4.294-12.322,10.324-23.097,17.282-32.545c6.955-9.456,14.816-17.618,22.868-24.864
      c16.095-14.484,32.971-25.527,45.222-35.662c2.463-2.06,4.057-4.294,5.193-6.93
      c1.106-2.644,1.689-5.746,1.689-9.259C443.091,113.46,440.47,104.809,435.924,97.105z"
    />

    <path
      fill="currentColor"
      d="M90.843,74.412c2.43,4.933,5.098,10.696,7.601,17.026c3.717,9.378,7.119,19.962,8.659,31.006
      c6.748-7.168,13.426-13.49,19.678-19.174c8.628-7.862,16.387-14.658,22.458-21.068
      c-2.731-2.526-5.037-5.352-7.223-8.422c-5.06-7.151-9.519-15.605-13.766-23.325
      c-2.518-4.626-4.934-8.904-7.128-12.33c-.663-.189-1.839-.394-3.394-.386
      c-2.439-.008-5.715.481-9.401,1.76c-3.678,1.279-7.767,3.355-11.966,6.512
      c-5.352,4.002-8.407,7.507-10.025,10.08c-1.594,2.597-1.807,4.168-1.815,5.067
      c0,.726.142,1.137.316,1.484C86.257,65.413,88.427,69.502,90.843,74.412z"
    />
  </g>
</svg>

            </div>

            <p className="ecg-mode">
              {tr("CARDIOLOGIE")}</p>

            <h1>
              Beat{' '}
              <span>
                Catcher
              </span>
            </h1>

            <p className="ecg-instructions">
              {tr("Suis le tracé et touche chaque impulsion au bon moment.")}</p>

            <button
              className="ecg-start-button"
              type="button"
              onClick={
                startGame
              }
            >

              {tr("Commencer")}<span>
                →
              </span>

            </button>

          </div>
        )}


        {/* =================================
            COUNTDOWN
        ================================= */}

        {gameState ===
          'countdown' && (

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
        )}


        {/* =================================
            JEU
        ================================= */}

        {(
          gameState ===
            'playing' ||
          gameState ===
            'record'
        ) && (

          <div className="ecg-game-board">


{rhythmAlert && (
  <div
    className="ecg-rhythm-alert"
    key={rhythmAlert}
  >
    <span>
      {tr("TROUBLE DU RYTHME")}</span>

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

              aria-label={tr("Tracé ECG")}

              onPointerDown={
                handleECGPointerDown
              }
            >

              <defs>

                <linearGradient
                  id="ecgGradient"
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
              />

              {targets.map(
                target => (

                  <g
                    key={
                      target.id
                    }

                    className="ecg-live-target"

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


            {/* HOLD */}

            {holdActive &&
              gameState ===
                'playing' && (

              <div className="ecg-hold-event">

                <span className="ecg-hold-warning">
                  {tr("SIGNAL PERDU")}</span>

                {/*
                  Une enveloppe tactile
                  plus large autour du
                  bouton permet d'éviter
                  le décalage ressenti
                  sur iPhone/iPad.
                */}

                <div
                  className="ecg-hold-touch-zone"

                  onPointerDown={event => {

                    event.preventDefault()

                    event.stopPropagation()

                    event.currentTarget
                      .setPointerCapture(
                        event.pointerId,
                      )

                    startHold()
                  }}

                  onPointerUp={event => {

                    event.preventDefault()

                    cancelHold()
                  }}

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

                    <span
                      className="ecg-hold-progress"
                    />

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
                      +{
                        holdProgress >= 100
                          ? 500
                          : holdProgress >= 75
                            ? 400
                            : holdProgress >= 50
                              ? 250
                              : holdProgress >= 25
                                ? 100
                                : 0
                      }
                    </strong>

                  </div>

                </div>

                <span className="ecg-hold-bonus">
                  +{HOLD_BONUS} {tr(" POINTS")}</span>

              </div>
            )}


            {/* NOUVEAU RECORD */}

            {gameState ===
              'record' && (

              <div className="ecg-record-overlay">

                <div className="ecg-record-burst">

                  <span className="ecg-record-kicker">
                    {tr("NOUVEAU RECORD")}</span>

                  <strong>
                    {score}
                  </strong>

                  <p>
                    {tr("Tu viens de battre ton meilleur score")}</p>

                  <span className="ecg-record-star">
                    ✦
                  </span>

                </div>

              </div>
            )}

          </div>
        )}


        {/* =================================
            GAME OVER
        ================================= */}

        {gameState ===
          'gameover' && (

          <div className="ecg-game-over">

            <p className="ecg-mode">
              {tr("PARTIE TERMINÉE")}</p>

            <h2>
              {score}
            </h2>

            <span className="ecg-game-over-points">
              {tr("points")}</span>

            <div className="ecg-game-over-best">

              <span>
                {tr("MEILLEUR SCORE")}</span>

              <strong>
                {bestScore}
              </strong>

            </div>

            <div className="ecg-leaderboard">

  <div className="ecg-leaderboard-heading">

    <div>
      <span className="ecg-leaderboard-kicker">
        {tr("CLASSEMENT MONDIAL")}</span>

      <strong>
        Beat Catcher
      </strong>
    </div>

    <div className="ecg-leaderboard-trophy">

  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
  >

    <path
      d="M22,3H19V2a1,1,0,0,0-1-1H6A1,1,0,0,0,5,2V3H2A1,1,0,0,0,1,4V6a4.994,4.994,0,0,0,4.276,4.927A7.009,7.009,0,0,0,11,15.92V18H7a1,1,0,0,0-.949.684l-1,3A1,1,0,0,0,6,23H18a1,1,0,0,0,.948-1.316l-1-3A1,1,0,0,0,17,18H13V15.92a7.009,7.009,0,0,0,5.724-4.993A4.994,4.994,0,0,0,23,6V4A1,1,0,0,0,22,3ZM5,8.829A3.006,3.006,0,0,1,3,6V5H5ZM16.279,20l.333,1H7.387l.334-1ZM17,9A5,5,0,0,1,7,9V3H17Zm4-3a3.006,3.006,0,0,1-2,2.829V5h2ZM10.667,8.667,9,7.292,11,7l1-2,1,2,2,.292L13.333,8.667,13.854,11,12,9.667,10.146,11Z"
    />

  </svg>

</div>

  </div>


  {leaderboardLoading ? (

    <div className="ecg-leaderboard-loading">
      {tr("Chargement du classement...")}</div>

  ) : leaderboard.length === 0 ? (

    <div className="ecg-leaderboard-loading">
      {tr("Aucun score pour le moment.")}</div>

  ) : (

    <div className="ecg-ranking-list">

      {leaderboard.map(
        (
          entry,
          index,
        ) => {

          const rank =
            index + 1

          const avatarIndex =
            Math.max(
              0,
              Math.min(
                leaderboardAvatars.length - 1,
                entry.avatar - 1,
              ),
            )

          return (

            <div
              key={entry.player_id}
              className={
                `ecg-ranking-row ${
                  rank <= 3
                    ? `ecg-ranking-top ecg-ranking-${rank}`
                    : ''
                } ${
                  entry.isCurrentPlayer
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
                  leaderboardAvatars[
                    avatarIndex
                  ]
                }
                alt=""
              />


              <div className="ecg-ranking-player">

                <strong>
                  {entry.pseudo}
                </strong>

                {entry.isCurrentPlayer && (
                  <span>
                    {tr("TOI")}</span>
                )}

              </div>


              <div className="ecg-ranking-score">

                <strong>
                  {entry.score.toLocaleString(
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
  )}

</div>

            <button
              type="button"

              className="ecg-start-button"

              onClick={
                startGame
              }
            >

              {tr("Rejouer")}<span>
                ↻
              </span>

            </button>

            <button
              type="button"

              className="ecg-back-button"

              onClick={
                returnToMenu
              }
            >

              {tr("Retour au menu principal")}</button>

          </div>
        )}

      </div>

    </section>
  )
}


export default ECGGame
