import { getLanguage } from '../i18n/languages'
import { tr, formatGameText } from '../i18n/gameText'
import { useGameAudio } from '../hooks/useGameAudio'

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'

import { useNavigate } from 'react-router-dom'
import SoloPauseMenu from '../components/SoloPauseMenu'

import chirMusic from '../assets/audio/chir-music.mp3'

import {
  getLeaderboard,
  submitBestScore,
  type LeaderboardEntry,
} from '../lib/player'

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

import patientTriste from '../assets/triste.png'
import patientGrimace from '../assets/grimace.png'

import reinD from '../assets/organes/reinD.png'
import reinDPince from '../assets/organes/reinDpince.png'

import reinG from '../assets/organes/reinG.png'
import reinGPince from '../assets/organes/reinGpince.png'

import foie from '../assets/organes/foie.png'
import foiePince from '../assets/organes/foiepince.png'

import humerus from '../assets/organes/humerus.png'
import humerusPince from '../assets/organes/humeruspince.png'

import pinceNoire from '../assets/pincenoire.png'

import artereInterosseuse from '../assets/organes/ainteross.png'
import artereInterosseusePince from '../assets/organes/ainterosspince.png'

import tendpat from '../assets/organes/tendpat.png'
import tendpatPince from '../assets/organes/tendpatpince.png'

import tibialant from '../assets/organes/tibialant.png'
import tibialantPince from '../assets/organes/tibialantpince.png'

import patientNormal from '../assets/patient-normal.png'
import patientStresse from '../assets/patient-stresse.png'
import patientNoir from '../assets/patientnoir.png'

import boiteImage from '../assets/boite.png'
import pinceRangeeImage from '../assets/pincerangee.png'
import pinceMainImage from '../assets/pincemain.png'

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

import './SurgicallyInsane.css'


/* ========================================
   TYPES
======================================== */

type SurgicallyInsaneProps = {
  onFullscreenChange?: (
    fullscreen: boolean
  ) => void
}

type GameState =
  | 'ready'
  | 'countdown'
  | 'playing'
  | 'gameover'

type Position = {
  x: number
  y: number
}

type OrganName =
  | 'Rein droit'
  | 'Rein gauche'
  | 'Humérus'
  | 'Foie'
  | 'Estomac'
  | 'Cœur'
  | 'Poumon droit'
  | 'Poumon gauche'
  | 'Thyroïde'
  | 'Intestins'
  | 'Muscle tibial antérieur'
  | 'Artère interosseuse antérieure'
  | 'Tendon patellaire'

type OrganData = {
  color: string
  points: number
  image: string
  pince?: string
  css: string
}

type PatientExpression =
  | 'normal'
  | 'sad'
  | 'grimace'


/* ========================================
   CONSTANTES
======================================== */

const MAX_LIVES = 3

const FIRST_TIME = 20
const TIME_REDUCTION = 0.5
const MIN_TIME = 7

const FEEDBACK_DURATION = 850

const BEST_SCORE_KEY =
  'tidoc-surgically-insane-best'

const SURGICALLY_LEADERBOARD_GAME =
  'surgically-insane'

const RECORD_DURATION = 2000


/* ========================================
   ORGANES ET COULEURS
======================================== */

const ORGAN_DATA: Record<
  OrganName,
  OrganData
> = {

  'Thyroïde': {
    color: '#5DFF00',
    points: 300,
    image: thyroide,
    pince: thyroidePince,
    css: 'surgically-organ-thyroide',
  },

  'Humérus': {
    color: '#FF0B00',
    points: 150,
    image: humerus,
    pince: humerusPince,
    css: 'surgically-organ-humerus',
  },

  'Poumon droit': {
    color: '#FF00EC',
    points: 125,
    image: poumonD,
    pince: poumonDPince,
    css: 'surgically-organ-poumon-droit',
  },

  'Poumon gauche': {
    color: '#850000',
    points: 125,
    image: poumonG,
    pince: poumonGPince,
    css: 'surgically-organ-poumon-gauche',
  },

  'Cœur': {
    color: '#857C00',
    points: 225,
    image: coeur,
    pince: coeurPince,
    css: 'surgically-organ-coeur',
  },

  'Foie': {
    color: '#006085',
    points: 150,
    image: foie,
    pince: foiePince,
    css: 'surgically-organ-foie',
  },

  'Estomac': {
    color: '#0C8500',
    points: 175,
    image: estomac,
    pince: estomacPince,
    css: 'surgically-organ-estomac',
  },

  'Rein droit': {
    color: '#850085',
    points: 250,
    image: reinD,
    pince: reinDPince,
    css: 'surgically-organ-reindroit',
  },

  'Rein gauche': {
    color: '#854000',
    points: 250,
    image: reinG,
    pince: reinGPince,
    css: 'surgically-organ-reingauche',
  },

  'Intestins': {
    color: '#00C3FF',
    points: 125,
    image: intestins,
    pince: intestinsPince,
    css: 'surgically-organ-intestins',
  },

  'Artère interosseuse antérieure': {
    color: '#E4FF00',
    points: 300,
    image: artereInterosseuse,
    pince: artereInterosseusePince,
    css: 'surgically-organ-interossant',
  },

  'Tendon patellaire': {
    color: '#FF7F00',
    points: 150,
    image: tendpat,
    pince: tendpatPince,
    css: 'surgically-organ-patellaire',
  },

  'Muscle tibial antérieur': {
    color: '#5000FF',
    points: 200,
    image: tibialant,
    pince: tibialantPince,
    css: 'surgically-organ-tibant',
  },

}


/* ========================================
   ORGANES DISPONIBLES
======================================== */

const AVAILABLE_ORGANS = (
  Object.keys(ORGAN_DATA) as OrganName[]
).filter(
  name =>
    Boolean(
      ORGAN_DATA[name].image &&
      ORGAN_DATA[name].pince
    )
)


/* ========================================
   MÉLANGER LES MISSIONS
======================================== */

function shuffleOrgans(): OrganName[] {

  const result = [
    ...AVAILABLE_ORGANS,
  ]

  for (
    let i = result.length - 1;
    i > 0;
    i--
  ) {

    const j =
      Math.floor(
        Math.random() * (i + 1)
      )

    const temp = result[i]

    result[i] = result[j]
    result[j] = temp
  }

  return result
}


/* ========================================
   TEMPS PAR MISSION
======================================== */

function getMissionTime(
  successfulExtractions: number
) {

  return Math.max(
    MIN_TIME,

    FIRST_TIME -
      successfulExtractions *
      TIME_REDUCTION
  )
}


/* ========================================
   COULEURS
======================================== */

function hexToRgb(
  hex: string
) {

  return {
    r: parseInt(
      hex.slice(1, 3),
      16
    ),

    g: parseInt(
      hex.slice(3, 5),
      16
    ),

    b: parseInt(
      hex.slice(5, 7),
      16
    ),
  }
}


const ORGAN_COLORS = (
  Object.keys(ORGAN_DATA) as OrganName[]
).map(
  name => ({
    name,
    ...hexToRgb(
      ORGAN_DATA[name].color
    ),
  })
)


/* ========================================
   IDENTIFIER UN ORGANE PAR SA COULEUR
======================================== */

function getOrganFromPixel(
  r: number,
  g: number,
  b: number
): OrganName | null {

  if (
    r < 40 &&
    g < 40 &&
    b < 40
  ) {
    return null
  }

  let closest: OrganName | null =
    null

  let smallestDistance =
    Infinity

  for (
    const color of ORGAN_COLORS
  ) {

    const distance =
      Math.hypot(
        r - color.r,
        g - color.g,
        b - color.b
      )

    if (
      distance < smallestDistance
    ) {

      smallestDistance =
        distance

      closest =
        color.name
    }
  }

  return smallestDistance <= 45
    ? closest
    : null
}


/* ========================================
   CŒUR BLEU
======================================== */

function LifeHeart() {

  return (

    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
    >

      <defs>

        <linearGradient
          id="surgicallyHeartGradient"
          x1="15%"
          y1="0%"
          x2="85%"
          y2="100%"
        >

          <stop
            offset="0%"
            stopColor="#ECFDFF"
          />

          <stop
            offset="25%"
            stopColor="#91F1FF"
          />

          <stop
            offset="55%"
            stopColor="#27BDE9"
          />

          <stop
            offset="100%"
            stopColor="#0862B2"
          />

        </linearGradient>

      </defs>

      <path
        className="surgically-heart-shape"
        d="
          M32 56
          C26 51 7 37 5 22
          C3 11 10 5 19 5
          C25 5 29 8 32 13
          C35 8 39 5 45 5
          C54 5 61 11 59 22
          C57 37 38 51 32 56
          Z
        "
      />

      <path
        className="surgically-heart-highlight"
        d="
          M12 23
          C10 16 14 12 20 12
          C23 12 25 13 27 16
        "
      />

    </svg>

  )
}


/* ========================================
   AVATARS DU CLASSEMENT
======================================== */

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


/* ========================================
   JEU
======================================== */

function SurgicallyInsane({
  onFullscreenChange,
}: SurgicallyInsaneProps) {
  const { setMusicVolume, getEffectsOutput } = useGameAudio()


  const navigate =
    useNavigate()


  /* ========================================
     ÉTATS
  ======================================== */

  const [
    gameState,
    setGameState,
  ] = useState<GameState>(
    'ready'
  )

  const [paused, setPaused] = useState(false)

  const [
    countdown,
    setCountdown,
  ] = useState(3)

  const [
    lives,
    setLives,
  ] = useState(
    MAX_LIVES
  )

  const [
    explodingHeart,
    setExplodingHeart,
  ] = useState<number | null>(
    null
  )

  const [
    score,
    setScore,
  ] = useState(0)

  const [
    bestScore,
    setBestScore,
  ] = useState(() => {

    try {

      const saved =
        Number(
          localStorage.getItem(
            BEST_SCORE_KEY
          )
        )

      return Number.isFinite(saved)
        ? saved
        : 0

    } catch {

      return 0
    }
  })

  const [
    targetOrgan,
    setTargetOrgan,
  ] = useState<OrganName | null>(
    null
  )

  const [
    successfulExtractions,
    setSuccessfulExtractions,
  ] = useState(0)

  const [
    timeLeft,
    setTimeLeft,
  ] = useState(
    FIRST_TIME
  )

  const [
    pinceActive,
    setPinceActive,
  ] = useState(false)

  const [
    pincePosition,
    setPincePosition,
  ] = useState<Position>({
    x: 0,
    y: 0,
  })

  const [
    pincePointerType,
    setPincePointerType,
  ] = useState('mouse')

  const [
    carriedOrgan,
    setCarriedOrgan,
  ] = useState<OrganName | null>(
    null
  )

  const [
    depositedOrgan,
    setDepositedOrgan,
  ] = useState<OrganName | null>(
    null
  )

  const [
    feedback,
    setFeedback,
  ] = useState('')

  const [
    hitmapReady,
    setHitmapReady,
  ] = useState(false)

  const [
    hitmapError,
    setHitmapError,
  ] = useState('')

  const [
    patientExpression,
    setPatientExpression,
  ] = useState<PatientExpression>(
    'normal'
  )


  /* ========================================
     ÉTATS DU CLASSEMENT
  ======================================== */

  const [
    leaderboard,
    setLeaderboard,
  ] = useState<LeaderboardEntry[]>([])

  const [
    leaderboardLoading,
    setLeaderboardLoading,
  ] = useState(false)

  const [
    leaderboardError,
    setLeaderboardError,
  ] = useState(false)


  /* ========================================
     ÉTATS DU NOUVEAU RECORD
  ======================================== */

  const [
    showRecord,
    setShowRecord,
  ] = useState(false)

  const [
    recordScore,
    setRecordScore,
  ] = useState(0)


  /* ========================================
     REFS
  ======================================== */

const recordPausedRef =
  useRef(false)

  const leaderboardSubmittedRef =
    useRef(false)

  const patientRef =
    useRef<HTMLImageElement | null>(
      null
    )

  const backgroundMusicRef =
    useRef<HTMLAudioElement | null>(
      null
    )

  const pinceImageRef =
    useRef<HTMLImageElement | null>(
      null
    )

  const pinceMaskPointsRef =
    useRef<Position[]>([])

  const depositBoxPhoneRef =
    useRef<HTMLImageElement | null>(
      null
    )

  const depositBoxTabletRef =
    useRef<HTMLImageElement | null>(
      null
    )

  const canvasRef =
    useRef<HTMLCanvasElement | null>(
      null
    )

  const imageDataRef =
    useRef<ImageData | null>(
      null
    )

  const pincePositionRef =
    useRef<Position>({
      x: 0,
      y: 0,
    })

  const activePointerIdRef =
    useRef<number | null>(
      null
    )

  const pinceActiveRef =
    useRef(false)

  const carriedOrganRef =
    useRef<OrganName | null>(
      null
    )

  const targetOrganRef =
    useRef<OrganName | null>(
      null
    )

  const scoreRef =
    useRef(0)

  const extractionsRef =
    useRef(0)

  const missionQueueRef =
    useRef<OrganName[]>([])

  const deadlineRef =
    useRef(0)

  const missionLockedRef =
    useRef(false)

  const manualPausedRef =
    useRef(false)

  const gameStateRef =
    useRef<GameState>(
      'ready'
    )

  const audioContextRef =
    useRef<AudioContext | null>(
      null
    )

  const explosionTimerRef =
    useRef<number | null>(
      null
    )

  const feedbackTimerRef =
    useRef<number | null>(
      null
    )


  /* ========================================
     REFS DU NOUVEAU RECORD
  ======================================== */

  const recordToBeatRef =
    useRef(bestScore)

  const recordCelebratedRef =
    useRef(false)

  const recordTimerRef =
    useRef<number | null>(null)


  /* ========================================
     SYNCHRONISER L'ÉTAT DU JEU
  ======================================== */

  function changeGameState(
    next: GameState
  ) {

    gameStateRef.current =
      next

    setGameState(
      next
    )
  }


  /* ========================================
     MODE IMMERSIF
  ======================================== */

  useEffect(() => {

    const fullscreen =
      gameState === 'countdown' ||
      gameState === 'playing'

    onFullscreenChange?.(
      fullscreen
    )

    return () => {

      onFullscreenChange?.(
        false
      )
    }

  }, [
    gameState,
    onFullscreenChange,
  ])


  /* ========================================
     PRÉCHARGER LES IMAGES
  ======================================== */

  useEffect(() => {

    const images = [
      patientNormal,
      patientStresse,
      pinceMainImage,

      ...AVAILABLE_ORGANS.flatMap(
        name => [

          ORGAN_DATA[name].image!,

          ORGAN_DATA[name].pince!,

        ]
      ),
    ]

    for (
      const source of images
    ) {

      const image =
        new Image()

      image.src =
        source
    }

  }, [])


  /* ========================================
     CHARGER PATIENTNOIR.PNG
  ======================================== */

  useEffect(() => {

    const image =
      new Image()

    image.onload = () => {

      const canvas =
        document.createElement(
          'canvas'
        )

      canvas.width =
        image.naturalWidth

      canvas.height =
        image.naturalHeight

      const context =
        canvas.getContext(
          '2d',
          {
            willReadFrequently: true,
          }
        )

      if (!context) {

        setHitmapError(
          'Impossible de lire la carte des organes.'
        )

        return
      }

      context.drawImage(
        image,
        0,
        0
      )

      const data =
        context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        )

      canvasRef.current =
        canvas

      imageDataRef.current =
        data

      setHitmapReady(
        true
      )

      setHitmapError(
        ''
      )
    }

    image.onerror = () => {

      setHitmapError(
        'Le fichier patientnoir.png est introuvable.'
      )
    }

    image.src =
      patientNoir

    return () => {

      image.onload =
        null

      image.onerror =
        null
    }

  }, [])


  /* ========================================
     CHARGER PINCENOIRE.PNG
  ======================================== */

  useEffect(() => {

    const image =
      new Image()

    image.onload = () => {

      const canvas =
        document.createElement(
          'canvas'
        )

      canvas.width =
        image.naturalWidth

      canvas.height =
        image.naturalHeight

      const context =
        canvas.getContext(
          '2d',
          {
            willReadFrequently: true,
          }
        )

      if (!context) {
        return
      }

      context.drawImage(
        image,
        0,
        0
      )

      const data =
        context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        )

      const points: Position[] = []

      for (
        let y = 0;
        y < data.height;
        y += 3
      ) {

        for (
          let x = 0;
          x < data.width;
          x += 3
        ) {

          const index =
            (
              y * data.width +
              x
            ) * 4

          const r =
            data.data[index]

          const g =
            data.data[index + 1]

          const b =
            data.data[index + 2]

          const a =
            data.data[index + 3]

          const isRed =
            a > 0 &&
            r > 180 &&
            g < 90 &&
            b < 90

          if (isRed) {

            points.push({
              x,
              y,
            })
          }
        }
      }

      pinceMaskPointsRef.current =
        points
    }

    image.src =
      pinceNoire

    return () => {

      image.onload = null
    }

  }, [])


  /* ========================================
     POINTS SENSIBLES DE LA PINCE
  ======================================== */

  function getSensitivePincePointsOnScreen() {

    const image =
      pinceImageRef.current

    const maskPoints =
      pinceMaskPointsRef.current

    if (
      !image ||
      maskPoints.length === 0
    ) {
      return []
    }

    const rect =
      image.getBoundingClientRect()

    const sourceWidth =
      image.naturalWidth || rect.width

    const sourceHeight =
      image.naturalHeight || rect.height

    return maskPoints.map(
      point => ({

        x:
          rect.left +
          (point.x / sourceWidth) *
            rect.width,

        y:
          rect.top +
          (point.y / sourceHeight) *
            rect.height,

      })
    )
  }


  /* ========================================
     ORGANE SOUS LA PINCE
  ======================================== */

  function getOrganUnderPinceMask():
    OrganName | null {

    const points =
      getSensitivePincePointsOnScreen()

    if (!points.length) {
      return null
    }

    const counts =
      new Map<OrganName, number>()

    for (
      const point of points
    ) {

      const organ =
        getOrganAtPosition(point)

      if (!organ) {
        continue
      }

      counts.set(
        organ,
        (counts.get(organ) ?? 0) + 1
      )
    }

    let bestOrgan: OrganName | null =
      null

    let bestCount = 0

    for (
      const [organ, count]
      of counts
    ) {

      if (count > bestCount) {

        bestCount = count

        bestOrgan = organ
      }
    }

    return bestOrgan
  }


  /* ========================================
     POSITION RÉELLE DU PATIENT
  ======================================== */

  function getPatientImageRect() {

    const image =
      patientRef.current

    if (
      !image ||
      !image.naturalWidth ||
      !image.naturalHeight
    ) {
      return null
    }

    const rect =
      image.getBoundingClientRect()

    const scale =
      Math.min(
        rect.width /
          image.naturalWidth,

        rect.height /
          image.naturalHeight
      )

    const width =
      image.naturalWidth *
      scale

    const height =
      image.naturalHeight *
      scale

    return {

      left:
        rect.left +
        (rect.width - width) / 2,

      top:
        rect.top +
        (rect.height - height) / 2,

      width,

      height,
    }
  }


  /* ========================================
     DÉTECTER LA COULEUR À LA POINTE
  ======================================== */

  function getOrganAtPosition(
    position: Position
  ): OrganName | null {

    const imageRect =
      getPatientImageRect()

    const imageData =
      imageDataRef.current

    if (
      !imageRect ||
      !imageData
    ) {
      return null
    }

    const relativeX =
      (
        position.x -
        imageRect.left
      ) / imageRect.width

    const relativeY =
      (
        position.y -
        imageRect.top
      ) / imageRect.height

    if (
      relativeX < 0 ||
      relativeX >= 1 ||
      relativeY < 0 ||
      relativeY >= 1
    ) {
      return null
    }

    const x =
      Math.floor(
        relativeX *
        imageData.width
      )

    const y =
      Math.floor(
        relativeY *
        imageData.height
      )

    const index =
      (
        y * imageData.width +
        x
      ) * 4

    return getOrganFromPixel(
      imageData.data[index],
      imageData.data[index + 1],
      imageData.data[index + 2]
    )
  }


  /* ========================================
     IMAGE DU PATIENT
  ======================================== */

  function getPatientImage() {

    if (
      patientExpression === 'grimace'
    ) {
      return patientGrimace
    }

    if (
      patientExpression === 'sad'
    ) {
      return patientTriste
    }

    if (
      pinceActive &&
      gameState === 'playing'
    ) {
      return patientStresse
    }

    return patientNormal
  }


  /* ========================================
     MUSIQUE DE FOND
  ======================================== */

  function prepareBackgroundMusic() {

    if (
      backgroundMusicRef.current
    ) {

      return backgroundMusicRef.current
    }

    const audio =
      new Audio(chirMusic)

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

  /*
    On prépare le fichier audio,
    mais on ne le lance pas pendant
    le compte à rebours.
  */

  setMusicVolume(audio, 0.15)
  audio.preload = 'auto'
}



  function startBackgroundMusic() {

    const audio =
      prepareBackgroundMusic()

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


  function stopBackgroundMusic() {

    const audio =
      backgroundMusicRef.current

    if (!audio) {
      return
    }

    audio.pause()
    audio.currentTime = 0
  }


  /* ========================================
     AUDIO
  ======================================== */

  function getAudioContext() {

    if (
      !audioContextRef.current
    ) {

      audioContextRef.current =
        new AudioContext({
          latencyHint: 'interactive',
        })
    }

    const context =
      audioContextRef.current

    if (
      context.state === 'suspended'
    ) {

      void context.resume()
    }

    return context
  }


  function playTone(
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine'
  ) {

    const context =
      getAudioContext()

    const oscillator =
      context.createOscillator()

    const gain =
      context.createGain()

    const now =
      context.currentTime

    oscillator.type =
      type

    oscillator.frequency.value =
      frequency

    gain.gain.setValueAtTime(
      0.0001,
      now
    )

    gain.gain.exponentialRampToValueAtTime(
      0.12,
      now + 0.01
    )

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      now + duration
    )

    oscillator.connect(gain)

    gain.connect(
      getEffectsOutput(context)
    )

    oscillator.start(now)

    oscillator.stop(
      now + duration
    )
  }


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


  function playFunnyCrySound() {

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

    for (
      const note of notes
    ) {

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

      oscillator.connect(gain)

      gain.connect(
        getEffectsOutput(context)
      )

      oscillator.start(
        now + note.start
      )

      oscillator.stop(
        now + note.start + note.duration + 0.02
      )
    }
  }


  function playHospitalFlatlineSound() {

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

    for (
      const note of notes
    ) {

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

      oscillator.connect(gain)

      gain.connect(
        getEffectsOutput(context)
      )

      oscillator.start(start)

      oscillator.stop(
        start + note.duration + 0.02
      )
    }
  }


  /* ========================================
     SON DU NOUVEAU RECORD
  ======================================== */

  function playRecordSound() {

    const context =
      getAudioContext()

    const now =
      context.currentTime

    const notes = [
      523.25,
      659.25,
      783.99,
      1046.5,
    ]

    notes.forEach(
      (frequency, index) => {

        const oscillator =
          context.createOscillator()

        const gain =
          context.createGain()

        const start =
          now + index * 0.12

        const duration =
          index === notes.length - 1
            ? 0.42
            : 0.15

        oscillator.type =
          'triangle'

        oscillator.frequency.value =
          frequency

        gain.gain.setValueAtTime(
          0.0001,
          start
        )

        gain.gain.exponentialRampToValueAtTime(
          0.10,
          start + 0.015
        )

        gain.gain.exponentialRampToValueAtTime(
          0.0001,
          start + duration
        )

        oscillator.connect(gain)

        gain.connect(
          getEffectsOutput(context)
        )

        oscillator.start(start)

        oscillator.stop(
          start + duration + 0.01
        )
      }
    )
  }


  /* ========================================
     NOUVEAU RECORD
  ======================================== */

  function resetRecordAnimation() {

    if (
      recordTimerRef.current !== null
    ) {

      window.clearTimeout(
        recordTimerRef.current
      )

      recordTimerRef.current =
        null
    }

    /*
      Record présent AVANT
      cette nouvelle partie.
    */
recordPausedRef.current = false

    recordToBeatRef.current =
      bestScore

    recordCelebratedRef.current =
      false

    setShowRecord(false)

    setRecordScore(0)
  }


  function triggerNewRecord(
    newScore: number
  ) {

    if (
      recordCelebratedRef.current ||
      recordToBeatRef.current <= 0 ||
      newScore <=
        recordToBeatRef.current
    ) {
      return
    }

    recordCelebratedRef.current =
  true

recordPausedRef.current =
  true

setRecordScore(
  newScore
)

setShowRecord(true)


    playRecordSound()

    if (
      recordTimerRef.current !== null
    ) {

      window.clearTimeout(
        recordTimerRef.current
      )
    }

    recordTimerRef.current =
  window.setTimeout(
    () => {

      recordPausedRef.current =
        false

      /*
        On redonne le temps complet
        à la mission en cours.
      */

      if (
        gameStateRef.current === 'playing' &&
        !missionLockedRef.current
      ) {

        restartMissionTimer()

      }

      setShowRecord(false)

      recordTimerRef.current =
        null

    },
    RECORD_DURATION
  )
  }


  /* ========================================
     RÉINITIALISER LA PINCE
  ======================================== */

  function resetPince() {

    pinceActiveRef.current =
      false

    carriedOrganRef.current =
      null

    activePointerIdRef.current =
      null

    setPinceActive(
      false
    )

    setCarriedOrgan(
      null
    )

    setPincePosition({
      x: 0,
      y: 0,
    })

    pincePositionRef.current = {
      x: 0,
      y: 0,
    }
  }


  /* ========================================
     TIRER LA PROCHAINE MISSION
  ======================================== */

  function drawNextOrgan() {

    if (
      missionQueueRef.current.length === 0
    ) {

      missionQueueRef.current =
        shuffleOrgans()
    }

    const next =
      missionQueueRef.current.shift()
      ?? null

    targetOrganRef.current =
      next

    setTargetOrgan(
      next
    )
  }


  /* ========================================
     LANCER / RELANCER LE TIMER
  ======================================== */

  function restartMissionTimer() {

    const seconds =
      getMissionTime(
        extractionsRef.current
      )

    setTimeLeft(
      seconds
    )

    deadlineRef.current =
      performance.now() +
      seconds * 1000

    missionLockedRef.current =
      false
  }

  function pauseGame() {
    if (gameStateRef.current !== 'playing' || paused) return

    if (deadlineRef.current > 0) {
      setTimeLeft(Math.max(0, (deadlineRef.current - performance.now()) / 1000))
    }

    deadlineRef.current = 0
    manualPausedRef.current = true
    pinceActiveRef.current = false
    activePointerIdRef.current = null
    setPinceActive(false)
    stopBackgroundMusic()
    setPaused(true)
  }

  function resumeGame() {
    manualPausedRef.current = false
    if (gameStateRef.current === 'playing' && !missionLockedRef.current && timeLeft > 0) {
      deadlineRef.current = performance.now() + timeLeft * 1000
    }
    setPaused(false)
    startBackgroundMusic()
  }


  /* ========================================
     COMMENCER / REJOUER
  ======================================== */

  function startGame() {

    void getAudioContext()

    unlockBackgroundMusic()

    resetRecordAnimation()

    if (
      explosionTimerRef.current !==
      null
    ) {

      window.clearTimeout(
        explosionTimerRef.current
      )
    }

    if (
      feedbackTimerRef.current !==
      null
    ) {

      window.clearTimeout(
        feedbackTimerRef.current
      )
    }

    missionLockedRef.current =
      false

    scoreRef.current =
      0

    extractionsRef.current =
      0

    setScore(0)

    setSuccessfulExtractions(0)

    leaderboardSubmittedRef.current =
      false

    setLeaderboard([])

    setLeaderboardLoading(false)

    setLeaderboardError(false)

    setLives(
      MAX_LIVES
    )

    setExplodingHeart(
      null
    )

    setFeedback(
      ''
    )

    setPatientExpression(
      'normal'
    )

    setDepositedOrgan(
      null
    )

    resetPince()

    missionQueueRef.current =
      shuffleOrgans()

    drawNextOrgan()

    setTimeLeft(
      FIRST_TIME
    )

    setCountdown(3)

    changeGameState(
      'countdown'
    )
  }


  /* ========================================
     COUNTDOWN — AUDIO
  ======================================== */

  useEffect(() => {

    if (
      gameState !== 'countdown'
    ) {
      return
    }

    playCountdownSound(
      countdown
    )

  }, [
    gameState,
    countdown,
  ])


  /* ========================================
     COUNTDOWN — TEMPS
  ======================================== */

  useEffect(() => {

    if (
      gameState !== 'countdown'
    ) {
      return
    }

    const timer =
      window.setTimeout(
        () => {

          if (
            countdown === 0
          ) {

            startBackgroundMusic()

            changeGameState(
              'playing'
            )

            restartMissionTimer()

          } else {

            setCountdown(
              value =>
                value - 1
            )
          }

        },

        countdown === 0
          ? 650
          : 800
      )

    return () => {

      window.clearTimeout(
        timer
      )
    }

  }, [
    gameState,
    countdown,
  ])


  /* ========================================
     MEILLEUR SCORE
  ======================================== */

  function saveBestScore(
    finalScore: number
  ) {

    if (
      finalScore <= bestScore
    ) {
      return
    }

    setBestScore(
      finalScore
    )

    try {

      localStorage.setItem(
        BEST_SCORE_KEY,
        String(finalScore)
      )

    } catch {

      // Le jeu reste jouable.
    }
  }


  /* ========================================
     PERDRE UNE VIE
  ======================================== */

  function loseLife() {

    if (
      gameStateRef.current !==
        'playing' ||

      missionLockedRef.current
    ) {
      return
    }

    missionLockedRef.current =
      true

    deadlineRef.current =
      0

    activePointerIdRef.current =
      null

    setFeedback(
      'AÏE !'
    )

    resetPince()

    const remainingLives =
      lives - 1

    setExplodingHeart(
      remainingLives
    )

    explosionTimerRef.current =
      window.setTimeout(
        () => {

          setLives(
            remainingLives
          )

          setExplodingHeart(
            null
          )

          explosionTimerRef.current =
            null

        },
        650
      )

    if (
      remainingLives <= 0
    ) {

      recordPausedRef.current = false

      stopBackgroundMusic()

      setPatientExpression(
        'grimace'
      )

      playHospitalFlatlineSound()

      /*
        Fermer l'animation du record
        avant l'écran de fin.
      */

      if (
        recordTimerRef.current !== null
      ) {

        window.clearTimeout(
          recordTimerRef.current
        )

        recordTimerRef.current =
          null
      }

      setShowRecord(false)

      saveBestScore(
        scoreRef.current
      )

      feedbackTimerRef.current =
        window.setTimeout(
          () => {

            setFeedback('')

            changeGameState(
              'gameover'
            )

          },
          1500
        )

      return
    }

    setPatientExpression(
      'sad'
    )

    playFunnyCrySound()

    feedbackTimerRef.current =
      window.setTimeout(
        () => {

          setFeedback('')

          setPatientExpression(
            'normal'
          )

          restartMissionTimer()

        },
        FEEDBACK_DURATION
      )
  }


  /* ========================================
     TIMER PENDANT LA MISSION
  ======================================== */

  useEffect(() => {

    if (
      gameState !== 'playing'
    ) {
      return
    }

    const interval =
      window.setInterval(
        () => {

          if (
  recordPausedRef.current ||
  manualPausedRef.current ||
  missionLockedRef.current ||
  deadlineRef.current === 0
) {
  return
}

          const remaining =
            Math.max(
              0,

              (
                deadlineRef.current -
                performance.now()
              ) / 1000
            )

          setTimeLeft(
            remaining
          )

          if (
            remaining <= 0
          ) {

            loseLife()
          }

        },
        50
      )

    return () => {

      window.clearInterval(
        interval
      )
    }

  }, [
    gameState,
    lives,
    bestScore,
  ])


  /* ========================================
     PRENDRE LA PINCE
  ======================================== */

  function takePince(
    event:
      ReactPointerEvent<HTMLButtonElement>
  ) {

    if (
      gameStateRef.current !==
        'playing' ||

      manualPausedRef.current ||

          recordPausedRef.current ||

      missionLockedRef.current ||

      pinceActiveRef.current
    ) {
      return
    }

    event.preventDefault()

    event.stopPropagation()

    pinceActiveRef.current =
      true

    activePointerIdRef.current =
      event.pointerId

    pincePositionRef.current = {
      x: event.clientX,
      y: event.clientY,
    }

    setPincePosition({
      ...pincePositionRef.current
    })

    setPincePointerType(
      event.pointerType
    )

    setPinceActive(
      true
    )
  }


  /* ========================================
     DÉTECTER LA BOÎTE DE DÉPÔT
  ======================================== */

  function getDepositBox() {

    return window.innerWidth <= 700

      ? depositBoxPhoneRef.current

      : depositBoxTabletRef.current
  }


  /* ========================================
     UNE POSITION EST-ELLE DANS LA BOÎTE ?
  ======================================== */

  function isInsideBox(
    position: Position,
    box: HTMLElement | null
  ) {

    if (!box) {
      return false
    }

    const rect =
      box.getBoundingClientRect()

    // La pointe de la pince n'a pas besoin d'être exactement
    // au pixel près dans la boîte pour valider le dépôt.
    const padding =
      window.innerWidth <= 700
        ? 28
        : 24

    return (
      position.x >= rect.left - padding &&
      position.x <= rect.right + padding &&

      position.y >= rect.top - padding &&
      position.y <= rect.bottom + padding
    )
  }


  /* ========================================
     DÉPÔT RÉUSSI
  ======================================== */

  function completeMission() {

    const organ =
      carriedOrganRef.current

    if (
      !organ ||

      missionLockedRef.current ||

      gameStateRef.current !==
        'playing'
    ) {
      return
    }

    missionLockedRef.current =
      true

    deadlineRef.current =
      0

    activePointerIdRef.current =
      null

    const points =
      ORGAN_DATA[organ].points

    const newScore =
      scoreRef.current +
      points

    scoreRef.current =
      newScore

    setScore(
      newScore
    )

    /*
      Le record local continue
      à être mis à jour normalement.
    */

    saveBestScore(
      newScore
    )

    /*
      L'animation compare avec
      le record d'AVANT la partie.
    */

    triggerNewRecord(
      newScore
    )

    extractionsRef.current +=
      1

    setSuccessfulExtractions(
      extractionsRef.current
    )

    playTone(
      1100,
      0.18
    )

    resetPince()

    setDepositedOrgan(
      organ
    )

    setFeedback(
      `+${points} POINTS`
    )

    feedbackTimerRef.current =
      window.setTimeout(
        () => {

          setDepositedOrgan(
            null
          )

          setFeedback(
            ''
          )

          drawNextOrgan()

          restartMissionTimer()

        },

        FEEDBACK_DURATION
      )
  }


  /* ========================================
     DÉPLACEMENT DE LA PINCE
  ======================================== */

  useEffect(() => {

    if (
      gameState !== 'playing' ||
      !pinceActive
    ) {
      return
    }

    function move(
      event: PointerEvent
    ) {

      if (recordPausedRef.current || manualPausedRef.current) {
  return
}
      const activeId =
        activePointerIdRef.current

      if (
        event.pointerType !==
          'mouse' &&

        event.pointerId !==
          activeId
      ) {
        return
      }

      const position = {
        x: event.clientX,
        y: event.clientY,
      }

      pincePositionRef.current =
        position

      setPincePosition(
        position
      )

      setPincePointerType(
        event.pointerType
      )

      if (
        missionLockedRef.current
      ) {
        return
      }

      if (
        carriedOrganRef.current
      ) {

        if (
          isInsideBox(
            position,
            getDepositBox()
          )
        ) {

          completeMission()
        }

        return
      }
    }


    function release(
      event: PointerEvent
    ) {

      if (
        event.pointerId ===
        activePointerIdRef.current
      ) {

        activePointerIdRef.current =
          null
      }
    }


    function resume(
      event: PointerEvent
    ) {

      if (
        event.pointerType ===
          'mouse'
      ) {
        return
      }

      if (
        activePointerIdRef.current !==
        null
      ) {
        return
      }

      activePointerIdRef.current =
        event.pointerId

      pincePositionRef.current = {
        x: event.clientX,
        y: event.clientY,
      }

      setPincePosition({
        ...pincePositionRef.current
      })
    }


    window.addEventListener(
      'pointermove',
      move
    )

    window.addEventListener(
      'pointerup',
      release
    )

    window.addEventListener(
      'pointercancel',
      release
    )

    window.addEventListener(
      'pointerdown',
      resume
    )


    return () => {

      window.removeEventListener(
        'pointermove',
        move
      )

      window.removeEventListener(
        'pointerup',
        release
      )

      window.removeEventListener(
        'pointercancel',
        release
      )

      window.removeEventListener(
        'pointerdown',
        resume
      )
    }

  }, [
    gameState,
    pinceActive,
  ])


  /* ========================================
     SERRER LA PINCE
  ======================================== */

  function squeezePince() {

    if (
      gameStateRef.current !==
        'playing' ||

      missionLockedRef.current ||

      !pinceActiveRef.current ||

      carriedOrganRef.current
    ) {
      return
    }

    const detectedOrgan =
      getOrganUnderPinceMask()

    const expectedOrgan =
      targetOrganRef.current

    if (
      !detectedOrgan ||
      detectedOrgan !==
        expectedOrgan
    ) {

      loseLife()

      return
    }

    carriedOrganRef.current =
      detectedOrgan

    setCarriedOrgan(
      detectedOrgan
    )

    playTone(
      760,
      0.12
    )
  }


  /* ========================================
     RETOUR AU MENU
  ======================================== */

  function returnToMenu() {

    stopBackgroundMusic()

    onFullscreenChange?.(
      false
    )

    navigate('/solo')
  }


  /* ========================================
     NETTOYAGE
  ======================================== */

  useEffect(() => {

    return () => {

      stopBackgroundMusic()

      if (
        explosionTimerRef.current !==
        null
      ) {

        window.clearTimeout(
          explosionTimerRef.current
        )
      }

      if (
        feedbackTimerRef.current !==
        null
      ) {

        window.clearTimeout(
          feedbackTimerRef.current
        )
      }

      /*
        Nettoyage du minuteur
        du nouveau record.
      */

      if (
        recordTimerRef.current !== null
      ) {

        window.clearTimeout(
          recordTimerRef.current
        )

        recordTimerRef.current =
          null
      }

      void audioContextRef.current
        ?.close()
    }

  }, [])


  /* ========================================
     GAME OVER — CLASSEMENT MONDIAL
  ======================================== */

  useEffect(() => {

    if (
      gameState !== 'gameover' ||
      leaderboardSubmittedRef.current
    ) {
      return
    }

    leaderboardSubmittedRef.current =
      true

    const finalScore =
      scoreRef.current

    setLeaderboardLoading(true)

    setLeaderboardError(false)

    void submitBestScore(
      SURGICALLY_LEADERBOARD_GAME,
      finalScore
    )
      .then(() =>
        getLeaderboard(
          SURGICALLY_LEADERBOARD_GAME,
          10
        )
      )
      .then(entries => {

        setLeaderboard(
          entries
        )

      })
      .catch(error => {

        console.error(
          'Erreur classement Surgically Insane :',
          error
        )

        setLeaderboardError(
          true
        )

      })
      .finally(() => {

        setLeaderboardLoading(
          false
        )

      })

  }, [gameState])


  /* ========================================
     IMAGE DE LA PINCE ACTIVE
  ======================================== */

  const activePinceImage =
    carriedOrgan

      ? ORGAN_DATA[
          carriedOrgan
        ].pince ??
        pinceMainImage

      : pinceMainImage


  /* ========================================
     AFFICHAGE
  ======================================== */

  return (

    <section
      className={
        `surgically-page surgically-state-${gameState}`
      }
    >

      {gameState === 'playing' && (
        <SoloPauseMenu
          paused={paused}
          onPause={pauseGame}
          onResume={resumeGame}
          onReturn={returnToMenu}
          label="Surgically Insane"
        />
      )}


      {/* =================================
          PATIENT
      ================================= */}

      {gameState !== 'gameover' && (

        <div className="surgically-patient-wrap">

          <img
            ref={patientRef}
            className="surgically-patient"
            src={getPatientImage()}
            alt={tr("Patient sur un brancard")}
            draggable={false}
          />

        </div>

      )}


      {/* =================================
          ORGANES SUR LE PATIENT
      ================================= */}

      {gameState === 'playing' &&
        hitmapReady && (

        <div className="surgically-organs-group">

          {AVAILABLE_ORGANS.map(
            organ => {

              if (
                carriedOrgan === organ ||
                depositedOrgan === organ
              ) {
                return null
              }

              return (

                <img
                  key={organ}
                  className={`surgically-organ ${ORGAN_DATA[organ].css}`}
                  src={ORGAN_DATA[organ].image}
                  alt=""
                  draggable={false}
                />

              )
            }
          )}

        </div>

      )}


      {/* =================================
          BOÎTES
      ================================= */}

      {gameState === 'playing' && (

        <div className="surgically-boxes">


          {/* TABLETTE GAUCHE /
              TÉLÉPHONE HAUT */}

          <img
            ref={depositBoxTabletRef}

            className="
              surgically-box
              surgically-box-1
            "

            src={boiteImage}

            alt=""

            draggable={false}
          />


          {/* TABLETTE DROITE /
              TÉLÉPHONE BAS */}

          <img
            ref={depositBoxPhoneRef}

            className="
              surgically-box
              surgically-box-2
            "

            src={boiteImage}

            alt=""

            draggable={false}
          />


          {/* =================================
              PINCE RANGÉE TÉLÉPHONE
          ================================= */}

          <button
            type="button"

            className={
              `surgically-tool
               surgically-tool-phone
               surgically-tool-pickup
               ${
                 pinceActive
                   ? 'is-picked-up'
                   : ''
               }`
            }

            onPointerDown={
              takePince
            }

            aria-label={tr("Prendre la pince")}

            tabIndex={
              pinceActive
                ? -1
                : 0
            }
          >

            <span
              className="surgically-pince-indicator"
            />

            <img
              src={pinceRangeeImage}

              alt=""

              draggable={false}
            />

          </button>


          {/* =================================
              PINCE RANGÉE TABLETTE
          ================================= */}

          <button
            type="button"

            className={
              `surgically-tool
               surgically-tool-tablet
               surgically-tool-pickup
               ${
                 pinceActive
                   ? 'is-picked-up'
                   : ''
               }`
            }

            onPointerDown={
              takePince
            }

            aria-label={tr("Prendre la pince")}

            tabIndex={
              pinceActive
                ? -1
                : 0
            }
          >

            <span
              className="surgically-pince-indicator"
            />

            <img
              src={pinceRangeeImage}

              alt=""

              draggable={false}
            />

          </button>

        </div>

      )}


      {/* =================================
          PINCE TENUE EN MAIN
      ================================= */}

      {gameState === 'playing' &&
        pinceActive && (

        <img
          ref={pinceImageRef}

          className={
            `surgically-pince-main ${
              pincePointerType === 'touch'
                ? 'is-touch'
                : ''
            }`
          }

          src={activePinceImage}

          alt={
            carriedOrgan
              ? formatGameText("Pince avec {0}", tr(carriedOrgan))
              : tr('Pince en main')
          }

          draggable={false}

          style={{
            left:
              `${pincePosition.x}px`,

            top:
              `${pincePosition.y}px`,
          }}
        />

      )}


      {/* =================================
          ORGANE DÉPOSÉ
      ================================= */}

      {gameState === 'playing' &&
        depositedOrgan && (

        <>

          <img
            className={`surgically-deposit-organ surgically-deposit-tablet ${
              depositedOrgan === 'Muscle tibial antérieur'
                ? 'surgically-deposit-tibant'
                : ''
            }`}

            src={
              ORGAN_DATA[
                depositedOrgan
              ].image
            }

            alt=""
          />

          <img
            className={`surgically-deposit-organ surgically-deposit-phone ${
              depositedOrgan === 'Muscle tibial antérieur'
                ? 'surgically-deposit-tibant'
                : ''
            }`}

            src={
              ORGAN_DATA[
                depositedOrgan
              ].image
            }

            alt=""
          />

        </>

      )}


      {/* =================================
          CERCLE DE LA BOÎTE DE DÉPÔT
      ================================= */}

      {gameState === 'playing' &&
        carriedOrgan && (

        <>

          <span
            className="
              surgically-deposit-indicator
              surgically-deposit-indicator-tablet
            "
          />

          <span
            className="
              surgically-deposit-indicator
              surgically-deposit-indicator-phone
            "
          />

        </>

      )}


      {/* =================================
          MENU DE DÉPART
      ================================= */}

      {gameState === 'ready' && (

        <div className="surgically-start-screen">

          <div className="surgically-menu-best">

            <span>
              {tr("MEILLEUR SCORE")}</span>

            <strong>
              {bestScore}
            </strong>

          </div>


          <div className="surgically-start-icon">

            <svg
              viewBox="0 0 256 256"
              aria-hidden="true"
            >

              <path
                fill="currentColor"
                d="M9.7,9.8C9.3,9,9.6,8,10.4,7.6l12.2-6.7c0.8-0.5,1.8-0.1,2.3,0.7l4.9,8.9
                c18.5-5.6,39,2.4,48.6,20L54.8,43.4c3.9,7.2,1.3,16.1-5.9,20.1c-7.2,3.9-16.2,1.3-20.1-5.9
                L5.1,70.5c-9.6-17.6-5.2-39.2,9.5-51.7L9.7,9.8z
                M176.4,253.2H256v-82.4h-79.6V253.2z
                M167.3,171.4H103c-11.2,0-20.3,9.1-20.3,20.3c0,11.2,9.1,20.3,20.3,20.3h64.3V171.4z
                M28.6,253.2h138.6v-32.9H36.9c-4.6,0-8.2,3.7-8.2,8.2V253.2z
                M78.1,187.5c0-13.6-11-24.5-24.6-24.5c-13.6,0-24.6,11-24.6,24.5C29,201,40,212,53.5,212
                C67.1,212,78.1,201,78.1,187.5
                M212.3,118.7l-13.8-39.4c-2.7-7.4-7.8-13.2-22.3-13.2h-63.8C97.9,66.2,92.7,72,90,79.4
                l-13.8,39.4c-1,2.5-1.6,8.3,4.1,12.1l32.5,21.4c4.7,3.1,11.1,1.8,14.3-2.9
                c3.1-4.7,1.8-11.1-2.9-14.3l-15.6-12.3L172.9,98h10l7.3,20l-10.2,6.7l-15.6,10.3c-4.7,3.1-6.1,9.5-2.9,14.3
                c3.1,4.7,9.5,6.1,14.3,2.9l32.5-21.4C213.9,127,213.3,121.3,212.3,118.7
                M150.6,27.6c-1.5,3.3-4.9,5.7-8.8,5.7c-3.9,0-7.3-2.3-8.8-5.7h-17.8
                c-0.3,1.6-0.5,3.2-0.5,4.8c0,15,12.2,27.2,27.2,27.2c15,0,27.2-12.2,27.2-27.2
                c0-1.7-0.2-3.3-0.5-4.8H150.6z
                M132.4,21.2c1.1-4.2,4.9-7.4,9.4-7.4c4.5,0,8.4,3.1,9.4,7.4h15.4
                c-4.3-9.4-13.7-16-24.7-16c-11,0-20.4,6.5-24.7,16H132.4z"
              />

            </svg>

          </div>


          <p className="surgically-kicker">
            {tr("CHIRURGIE")}</p>


          <h1>
            Surgically{' '}
            <span>
              Insane
            </span>
          </h1>


          <p className="surgically-start-description">
            {tr("Extrais les bons organes sans toucher les bords. Tu n'as que trois vies !")}</p>


          <button
            type="button"

            className="surgically-primary-button"

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

      {gameState === 'countdown' && (

        <div className="surgically-countdown">

          <span>
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
          HUD
      ================================= */}

      {gameState === 'playing' && (

        <div className="surgically-hud">


          {/* MEILLEUR SCORE */}

          <div className="surgically-hud-best">

            <span>
              {tr("MEILLEUR SCORE")}</span>

            <strong>
              {bestScore.toLocaleString(
                getLanguage()
              )}
            </strong>

          </div>


          {/* VIES */}

          <div className="surgically-hud-lives">

            <span className="surgically-hud-label">
              {tr("VIES")}</span>

            <div className="surgically-hearts">

              {Array.from(
                { length: MAX_LIVES },
                (_, index) => {

                  const isVisible =
                    index < lives

                  const isExploding =
                    index === explodingHeart

                  return (

                    <div
                      key={index}

                      className={
                        `surgically-life ${
                          isExploding
                            ? 'is-exploding'
                            : ''
                        } ${
                          !isVisible
                            ? 'is-empty'
                            : ''
                        }`
                      }
                    >

                      <LifeHeart />

                      {isExploding && (

                        <div className="surgically-heart-particles">

                          {Array.from(
                            { length: 10 },
                            (_, particleIndex) => (

                              <i
                                key={
                                  particleIndex
                                }
                              />

                            )
                          )}

                        </div>

                      )}

                    </div>

                  )
                }
              )}

            </div>

          </div>


          {/* SCORE */}

          <div className="surgically-hud-score">

            <span>
              {tr("SCORE")}</span>

            <strong>
              {score.toLocaleString(
                getLanguage()
              )}
            </strong>

          </div>

        </div>

      )}


      {/* =================================
          CHRONOMÈTRE
      ================================= */}

      {gameState === 'playing' && (

        <div className="surgically-timer">

          <span>
            {tr("TEMPS RESTANT")}</span>

          <strong
            className={
              timeLeft <= 5
                ? 'is-danger'
                : ''
            }
          >

            {timeLeft.toFixed(1)} s

          </strong>

          <div className="surgically-timer-track">

            <div
              className="surgically-timer-fill"

              style={{
                width:
                  `${
                    (
                      timeLeft /
                      getMissionTime(
                        successfulExtractions
                      )
                    ) * 100
                  }%`,
              }}
            />

          </div>

        </div>

      )}


      {/* =================================
          BOUTON SERRER
      ================================= */}

      {gameState === 'playing' &&
        pinceActive &&
        !carriedOrgan &&
        !missionLockedRef.current && (

        <button
          type="button"

          className="surgically-squeeze-button"

          onPointerDown={
            event => {

              event.stopPropagation()

              event.preventDefault()

              squeezePince()
            }
          }
        >

          {tr("SERRER LA PINCE")}</button>

      )}


      {/* =================================
          ANIMATION POINTS / ERREUR
      ================================= */}

      {gameState === 'playing' &&
        feedback && (

        <div
          className={
            `surgically-feedback ${
              feedback.startsWith('+')
                ? 'is-success'
                : 'is-error'
            }`
          }
        >

          {tr(feedback)}

        </div>

      )}


      {/* =================================
          MESSAGE SI CARTE ABSENTE
      ================================= */}

      {gameState === 'playing' &&
        hitmapError && (

        <div className="surgically-map-error">

          {tr(hitmapError)}

        </div>

      )}


      {/* =================================
          ORGANE À EXTRAIRE
      ================================= */}

      {gameState === 'playing' && (

        <div className="surgically-bottom-mission">

          <span>
            {tr("À EXTRAIRE")}</span>

          <strong>
            {tr(targetOrgan ?? 'PRÉPARATION...')}
          </strong>

        </div>

      )}


      {/* =================================
          ANIMATION NOUVEAU RECORD
      ================================= */}

      {gameState === 'playing' &&
        showRecord && (

        <div className="surgically-record-overlay">

          <div className="surgically-record-burst">

            <span className="surgically-record-kicker">
              {tr("NOUVEAU RECORD")}</span>

            <strong>
              {recordScore.toLocaleString(
                getLanguage()
              )}
            </strong>

            <p>
              {tr("Tu viens de battre ton meilleur score !")}</p>

            <span className="surgically-record-star">
              ✦
            </span>

          </div>

        </div>

      )}


      {/* =================================
          GAME OVER
      ================================= */}

      {gameState === 'gameover' && (

        <div className="surgically-results-page">

          <div className="ecg-game-over">

            <p className="ecg-mode">
              {tr("PARTIE TERMINÉE")}</p>

            <h2>
              {score.toLocaleString(
                getLanguage()
              )}
            </h2>

            <span className="ecg-game-over-points">
              {tr("points")}</span>


            {/* MEILLEUR SCORE */}

            <div className="ecg-game-over-best">

              <span>
                {tr("MEILLEUR SCORE")}</span>

              <strong>
                {Math.max(
                  bestScore,
                  score
                ).toLocaleString(
                  getLanguage()
                )}
              </strong>

            </div>


            {/* =================================
                CLASSEMENT MONDIAL
            ================================= */}

            <div className="ecg-leaderboard">

              <div className="ecg-leaderboard-heading">

                <div>

                  <span className="ecg-leaderboard-kicker">
                    {tr("CLASSEMENT MONDIAL")}</span>

                  <strong>
                    Surgically Insane
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

              ) : leaderboardError ? (

                <div className="ecg-leaderboard-loading">
                  {tr("Impossible de charger le classement.")}</div>

              ) : leaderboard.length === 0 ? (

                <div className="ecg-leaderboard-loading">
                  {tr("Aucun score pour le moment.")}</div>

              ) : (

                <div className="ecg-ranking-list">

                  {leaderboard.map(
                    (
                      entry,
                      index
                    ) => {

                      const rank =
                        index + 1

                      const avatarIndex =
                        Math.max(
                          0,
                          Math.min(
                            leaderboardAvatars.length - 1,
                            entry.avatar - 1
                          )
                        )

                      return (

                        <div
                          key={
                            entry.player_id
                          }

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
                                getLanguage()
                              )}
                            </strong>

                            <span>
                              {tr("PTS")}</span>

                          </div>

                        </div>

                      )
                    }
                  )}

                </div>

              )}

            </div>


            {/* =================================
                REJOUER
            ================================= */}

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


            {/* =================================
                RETOUR AU MENU
            ================================= */}

            <button
              type="button"

              className="ecg-back-button"

              onClick={
                returnToMenu
              }
            >

              {tr("Retour au menu principal")}</button>

          </div>

        </div>

      )}

    </section>

  )
}

export default SurgicallyInsane
