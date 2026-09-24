import { getLanguage } from '../i18n/languages'
import { tr } from '../i18n/gameText'
import { useGameAudio } from '../hooks/useGameAudio'
import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'

import { useNavigate } from 'react-router-dom'
import SoloPauseMenu from '../components/SoloPauseMenu'

import './BacteriaSlash.css'

import bacteriaMusic from '../assets/audio/bacteria-music.mp3'

/* ========================================
   CLASSEMENT
======================================== */

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

/* ========================================
   BACTÉRIES
======================================== */

import eColi from '../assets/bactéries/EColi.png'
import hPylori from '../assets/bactéries/HPylori.png'
import klebsPneumo from '../assets/bactéries/KlebsPneumo.png'
import pseudoAeru from '../assets/bactéries/PseudoAeru.png'
import salmoEnterica from '../assets/bactéries/SalmoEnterica.png'
import staphDore from '../assets/bactéries/StaphDore.png'
import streptoPneumo from '../assets/bactéries/StreptoPneumo.png'

/* ========================================
   CELLULES DU SANG
======================================== */

import basophile from '../assets/cellules du sang/Baso.png'
import eosinophile from '../assets/cellules du sang/Eosi.png'
import globuleRouge from '../assets/cellules du sang/GR.png'
import lymphocyte from '../assets/cellules du sang/Lympho.png'
import monocyte from '../assets/cellules du sang/Mono.png'
import neutrophile from '../assets/cellules du sang/Neutro.png'

/* ========================================
   TYPES
======================================== */

type BacteriaSlashProps = {
  onFullscreenChange?: (
    fullscreen: boolean
  ) => void
}

type GameState =
  | 'ready'
  | 'countdown'
  | 'playing'
  | 'gameover'

type ObjectKind =
  | 'bacteria'
  | 'blood'

type GameItem = {
  id: number
  kind: ObjectKind
  name: string
  image: string
  x: number
  y: number
  vx: number
  vy: number
  rotation: number
  spin: number
  size: number
}

type Explosion = {
  id: number
  x: number
  y: number
  name: string
}

/* ========================================
   DONNÉES DU JEU
======================================== */

const bacteriaList = [
  {
    name: 'Escherichia coli',
    image: eColi,
  },
  {
    name: 'Staphylococcus aureus',
    image: staphDore,
  },
  {
    name: 'Pseudomonas aeruginosa',
    image: pseudoAeru,
  },
  {
    name: 'Streptococcus pneumoniae',
    image: streptoPneumo,
  },
  {
    name: 'Klebsiella pneumoniae',
    image: klebsPneumo,
  },
  {
    name: 'Salmonella Enteritidis',
    image: salmoEnterica,
  },
  {
    name: 'Helicobacter pylori',
    image: hPylori,
  },
]

const bloodCellList = [
  {
    name: 'Globule rouge',
    image: globuleRouge,
  },
  {
    name: 'Éosinophile',
    image: eosinophile,
  },
  {
    name: 'Basophile',
    image: basophile,
  },
  {
    name: 'Neutrophile',
    image: neutrophile,
  },
  {
    name: 'Monocyte',
    image: monocyte,
  },
  {
    name: 'Lymphocyte',
    image: lymphocyte,
  },
]

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

const GRAVITY = 1180
const BACTERIA_POINTS = 100

const BEST_SCORE_KEY =
  'tidoc-bacteria-slash-best'

const LEADERBOARD_GAME =
  'bacteria-slash'

const RECORD_DURATION = 2000

/* ========================================
   COMPOSANT PRINCIPAL
======================================== */

function BacteriaSlash({
  onFullscreenChange,
}: BacteriaSlashProps) {
  const { setMusicVolume, setMusicMuted, getEffectsOutput } = useGameAudio()


  const navigate = useNavigate()

  /* ========================================
     ÉTATS
  ======================================== */

  const [
    gameState,
    setGameState,
  ] = useState<GameState>('ready')

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

    const saved = Number(
      localStorage.getItem(
        BEST_SCORE_KEY
      ) || 0
    )

    return Number.isFinite(saved)
      ? saved
      : 0
  })

  const [
    items,
    setItems,
  ] = useState<GameItem[]>([])

  const [
    explosions,
    setExplosions,
  ] = useState<Explosion[]>([])

  const [
    restartCounter,
    setRestartCounter,
  ] = useState(0)

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

  const boardRef =
    useRef<HTMLDivElement | null>(null)

  const backgroundMusicRef =
    useRef<HTMLAudioElement | null>(null)

  const itemsRef =
    useRef<GameItem[]>([])

  const scoreRef =
    useRef(0)

  const itemIdRef =
    useRef(0)

  const explosionIdRef =
    useRef(0)

  const animationRef =
    useRef<number | null>(null)

  const previousTimeRef =
    useRef<number | null>(null)

  const spawnTimerRef =
    useRef<number | null>(null)

  const audioContextRef =
    useRef<AudioContext | null>(null)

  const gameOverRef =
    useRef(false)

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
     HEADER / MODE IMMERSIF
  ======================================== */

  useEffect(() => {

    const fullscreen =
      gameState === 'countdown' ||
      gameState === 'playing' ||
      gameState === 'gameover'

    onFullscreenChange?.(
      fullscreen
    )

    return () => {
      onFullscreenChange?.(false)
    }

  }, [
    gameState,
    onFullscreenChange,
  ])

  /* ========================================
     AUDIO
  ======================================== */

  function getAudioContext() {

    if (!audioContextRef.current) {

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
      getEffectsOutput(context)
    )

    oscillator.start()

    oscillator.stop(
      context.currentTime + 0.01
    )
  }

  function playCountdownSound(
    value: number
  ) {

    const context =
      getAudioContext()

    const oscillator =
      context.createOscillator()

    const gain =
      context.createGain()

    oscillator.type = 'sine'

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
      now
    )

    gain.gain.exponentialRampToValueAtTime(
      value === 0
        ? 0.16
        : 0.11,
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

  function playSliceSound() {

    const context =
      getAudioContext()

    const oscillator =
      context.createOscillator()

    const gain =
      context.createGain()

    const now =
      context.currentTime

    oscillator.type = 'sine'

    oscillator.frequency.setValueAtTime(
      880,
      now
    )

    oscillator.frequency.exponentialRampToValueAtTime(
      1240,
      now + 0.06
    )

    gain.gain.setValueAtTime(
      0.10,
      now
    )

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      now + 0.07
    )

    oscillator.connect(gain)

    gain.connect(
      getEffectsOutput(context)
    )

    oscillator.start(now)

    oscillator.stop(
      now + 0.08
    )
  }

  function playGameOverSound() {

    const context =
      getAudioContext()

    const now =
      context.currentTime

    const oscillator1 =
      context.createOscillator()

    const gain1 =
      context.createGain()

    oscillator1.type = 'sine'

    oscillator1.frequency.setValueAtTime(
      520,
      now
    )

    oscillator1.frequency.exponentialRampToValueAtTime(
      220,
      now + 0.32
    )

    gain1.gain.setValueAtTime(
      0.13,
      now
    )

    gain1.gain.exponentialRampToValueAtTime(
      0.0001,
      now + 0.35
    )

    oscillator1.connect(gain1)

    gain1.connect(
      getEffectsOutput(context)
    )

    oscillator1.start(now)

    oscillator1.stop(
      now + 0.36
    )

    const oscillator2 =
      context.createOscillator()

    const gain2 =
      context.createGain()

    const secondStart =
      now + 0.28

    oscillator2.type = 'sine'

    oscillator2.frequency.value = 180

    gain2.gain.setValueAtTime(
      0.0001,
      secondStart
    )

    gain2.gain.exponentialRampToValueAtTime(
      0.10,
      secondStart + 0.015
    )

    gain2.gain.exponentialRampToValueAtTime(
      0.0001,
      secondStart + 0.35
    )

    oscillator2.connect(gain2)

    gain2.connect(
      getEffectsOutput(context)
    )

    oscillator2.start(
      secondStart
    )

    oscillator2.stop(
      secondStart + 0.36
    )
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
     MUSIQUE DE FOND
  ======================================== */

  function prepareBackgroundMusic() {

    if (
      backgroundMusicRef.current
    ) {
      return
    }

    const audio =
      new Audio(bacteriaMusic)

    audio.loop = true
    setMusicVolume(audio, 0.22)
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
    setMusicVolume(audio, 0.22)

    if (audio.paused) {

      void audio.play().catch(
        error => {

          console.warn(
            'Musique Bacteria Slash bloquée :',
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
      On conserve le record qui
      existait AVANT cette partie.
    */

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

    /*
      Une seule animation par partie.

      Si le joueur n'a jamais eu
      de record, on n'affiche pas
      l'animation à 100 points.
    */

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

          setShowRecord(false)

          recordTimerRef.current =
            null

        },
        RECORD_DURATION
      )
  }

  /* ========================================
     COMMENCER
  ======================================== */

  function startGame() {

    warmUpAudio()

    resetRecordAnimation()

    scoreRef.current = 0

    setScore(0)

    itemsRef.current = []

    setItems([])

    setExplosions([])

    setLeaderboard([])

    setLeaderboardLoading(false)

    setLeaderboardError(false)

    gameOverRef.current = false

    setCountdown(3)

    setGameState(
      'countdown'
    )
  }

  /* ========================================
     COUNTDOWN
  ======================================== */

  useEffect(() => {

    if (
      gameState !== 'countdown'
    ) {
      return
    }

    setCountdown(3)

    scoreRef.current = 0

    setScore(0)

    itemsRef.current = []

    setItems([])

    setExplosions([])

    gameOverRef.current = false

    const timers: number[] = []

    timers.push(
      window.setTimeout(
        () => {

          setCountdown(3)

          playCountdownSound(3)

        },
        120
      )
    )

    timers.push(
      window.setTimeout(
        () => {

          setCountdown(2)

          playCountdownSound(2)

        },
        920
      )
    )

    timers.push(
      window.setTimeout(
        () => {

          setCountdown(1)

          playCountdownSound(1)

        },
        1720
      )
    )

    timers.push(
      window.setTimeout(
        () => {

          setCountdown(0)

          playCountdownSound(0)

        },
        2520
      )
    )

    timers.push(
      window.setTimeout(
        () => {

          startBackgroundMusic()

          setGameState(
            'playing'
          )

        },
        3170
      )
    )

    return () => {

      timers.forEach(
        timer => {

          window.clearTimeout(
            timer
          )
        }
      )
    }

  }, [
    gameState,
    restartCounter,
  ])

  /* ========================================
     CRÉATION D'UN OBJET
  ======================================== */

  function spawnItem() {

    const board =
      boardRef.current

    if (!board) {
      return
    }

    const rect =
      board.getBoundingClientRect()

    const isBloodCell =
      Math.random() < 0.18

    const source =
      isBloodCell
        ? bloodCellList
        : bacteriaList

    const selected =
      source[
        Math.floor(
          Math.random() *
          source.length
        )
      ]

    const size =
      isBloodCell
        ? 76 + Math.random() * 22
        : 82 + Math.random() * 30

    const safeSide =
      size / 2 + 12

    const x =
      safeSide +
      Math.random() *
      Math.max(
        20,
        rect.width -
          safeSide * 2
      )

    const direction =
      Math.random() < 0.5
        ? -1
        : 1

    const vx =
      direction *
      (
        20 +
        Math.random() * 90
      )

    const vy =
      900 +
      Math.random() * 190

    const item: GameItem = {

      id:
        itemIdRef.current++,

      kind:
        isBloodCell
          ? 'blood'
          : 'bacteria',

      name:
        selected.name,

      image:
        selected.image,

      x,

      y:
        -size,

      vx,

      vy,

      rotation:
        Math.random() * 360,

      spin:
        (
          Math.random() < 0.5
            ? -1
            : 1
        ) *
        (
          45 +
          Math.random() * 95
        ),

      size,
    }

    itemsRef.current = [
      ...itemsRef.current,
      item,
    ]

    setItems(
      itemsRef.current
    )
  }

  /* ========================================
     APPARITION DES OBJETS
  ======================================== */

  useEffect(() => {

    if (
  paused ||
  gameState !== 'playing' ||
  showRecord
) {
  return
}

    let active = true

    function scheduleSpawn() {

      if (!active) {
        return
      }

      const delay =
        550 +
        Math.random() * 350

      spawnTimerRef.current =
        window.setTimeout(
          () => {

            if (!active) {
              return
            }

            spawnItem()

            scheduleSpawn()

          },
          delay
        )
    }

    spawnTimerRef.current =
      window.setTimeout(
        () => {

          spawnItem()

          scheduleSpawn()

        },
        300
      )

    return () => {

      active = false

      if (
        spawnTimerRef.current !== null
      ) {

        window.clearTimeout(
          spawnTimerRef.current
        )
      }

      spawnTimerRef.current =
        null
    }

 }, [
  gameState,
  showRecord,
  paused,
])

  /* ========================================
     MOTEUR PHYSIQUE
  ======================================== */

  useEffect(() => {

    if (
  paused ||
  gameState !== 'playing' ||
  showRecord
) {
  return
}

    function frame(
      time: number
    ) {

      const board =
        boardRef.current

      if (!board) {
        return
      }

      if (
        previousTimeRef.current === null
      ) {

        previousTimeRef.current =
          time
      }

      const delta =
        Math.min(
          (
            time -
            previousTimeRef.current
          ) / 1000,
          0.04
        )

      previousTimeRef.current =
        time

      const boardWidth =
        board.clientWidth

      itemsRef.current =
        itemsRef.current
          .map(
            item => {

              let nextX =
                item.x +
                item.vx * delta

              let nextVx =
                item.vx

              const half =
                item.size / 2

              if (
                nextX < half
              ) {

                nextX =
                  half

                nextVx =
                  Math.abs(
                    nextVx
                  )
              }

              if (
                nextX >
                boardWidth - half
              ) {

                nextX =
                  boardWidth - half

                nextVx =
                  -Math.abs(
                    nextVx
                  )
              }

              const nextVy =
                item.vy -
                GRAVITY * delta

              const nextY =
                item.y +
                item.vy * delta

              return {

                ...item,

                x:
                  nextX,

                y:
                  nextY,

                vx:
                  nextVx,

                vy:
                  nextVy,

                rotation:
                  item.rotation +
                  item.spin * delta,
              }
            }
          )
          .filter(
            item =>
              !(
                item.vy < 0 &&
                item.y <
                  -item.size - 60
              )
          )

      setItems([
        ...itemsRef.current,
      ])

      animationRef.current =
        requestAnimationFrame(
          frame
        )
    }

    previousTimeRef.current =
      null

    animationRef.current =
      requestAnimationFrame(
        frame
      )

    return () => {

      if (
        animationRef.current !== null
      ) {

        cancelAnimationFrame(
          animationRef.current
        )
      }

      animationRef.current =
        null

      previousTimeRef.current =
        null
    }

  }, [
  gameState,
  showRecord,
  paused,
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

    stopBackgroundMusic()

    playGameOverSound()

    /*
      L'animation du record ne doit
      pas rester ouverte après
      la fin de la partie.
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

    const finalScore =
      scoreRef.current

    setScore(
      finalScore
    )

    setBestScore(
      currentBest => {

        const newBest =
          Math.max(
            currentBest,
            finalScore
          )

        localStorage.setItem(
          BEST_SCORE_KEY,
          String(newBest)
        )

        return newBest
      }
    )

    /* ====================================
       CLASSEMENT MONDIAL
    ==================================== */

    setLeaderboard([])

    setLeaderboardError(false)

    setLeaderboardLoading(true)

    void submitBestScore(
      LEADERBOARD_GAME,
      finalScore
    )
      .then(
        () =>
          getLeaderboard(
            LEADERBOARD_GAME,
            10
          )
      )
      .then(
        entries => {

          setLeaderboard(
            entries
          )
        }
      )
      .catch(
        error => {

          console.error(
            'Erreur classement Bacteria Slash :',
            error
          )

          setLeaderboardError(
            true
          )
        }
      )
      .finally(
        () => {

          setLeaderboardLoading(
            false
          )
        }
      )

    setGameState(
      'gameover'
    )
  }

  /* ========================================
     TOUCHER UN OBJET
  ======================================== */

  function hitItem(
    event:
      ReactPointerEvent<HTMLButtonElement>,
    item: GameItem
  ) {

    event.preventDefault()

    event.stopPropagation()

    if (
  gameState !== 'playing' ||
  showRecord
) {
  return
}

    /*
      Cellule sanguine :
      fin de partie.
    */

    if (
      item.kind === 'blood'
    ) {

      endGame()

      return
    }

    /*
      Bactérie :
      +100 points.
    */

    itemsRef.current =
      itemsRef.current.filter(
        current =>
          current.id !== item.id
      )

    setItems([
      ...itemsRef.current,
    ])

    const newScore =
      scoreRef.current +
      BACTERIA_POINTS

    scoreRef.current =
      newScore

    setScore(
      newScore
    )

    playSliceSound()

    /*
      Vérifie si le score dépasse
      le record d'avant la partie.
    */

    triggerNewRecord(
      newScore
    )

    const explosion: Explosion = {

      id:
        explosionIdRef.current++,

      x:
        item.x,

      y:
        item.y,

      name:
        item.name,
    }

    setExplosions(
      current => [
        ...current,
        explosion,
      ]
    )

    window.setTimeout(
      () => {

        setExplosions(
          current =>
            current.filter(
              effect =>
                effect.id !==
                explosion.id
            )
        )

      },
      650
    )
  }

  /* ========================================
     REJOUER
  ======================================== */

  function restartGame() {

    warmUpAudio()

    resetRecordAnimation()

    setLeaderboard([])

    setLeaderboardLoading(false)

    setLeaderboardError(false)

    setRestartCounter(
      current => current + 1
    )

    setGameState(
      'countdown'
    )
  }

  /* ========================================
     RETOUR AU MENU
  ======================================== */

  function returnToMenu() {

    onFullscreenChange?.(
      false
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
     NETTOYAGE
  ======================================== */

  useEffect(() => {

    return () => {

      stopBackgroundMusic()

      if (
        animationRef.current !== null
      ) {

        cancelAnimationFrame(
          animationRef.current
        )
      }

      if (
        spawnTimerRef.current !== null
      ) {

        window.clearTimeout(
          spawnTimerRef.current
        )
      }

      if (
        recordTimerRef.current !== null
      ) {

        window.clearTimeout(
          recordTimerRef.current
        )

        recordTimerRef.current =
          null
      }

      try {

        void audioContextRef.current
          ?.close()

      } catch {

        // Rien à faire.
      }
    }

  }, [])

  /* ========================================
     AFFICHAGE
  ======================================== */

  return (

    <section
      className={
        `bacteria-game-page bacteria-state-${gameState}`
      }
    >

      {gameState === 'playing' && (
        <SoloPauseMenu
          paused={paused}
          onPause={pauseGame}
          onResume={resumeGame}
          onReturn={returnToMenu}
          label="Bacteria Slash"
        />
      )}

      <div
        ref={boardRef}
        className="bacteria-game-board"
      >

        {/* =================================
            MENU DE DÉPART
        ================================= */}

        {gameState === 'ready' && (

          <div className="bacteria-start-screen">

            <div className="bacteria-menu-best">

              <span>
                {tr("MEILLEUR SCORE")}</span>

              <strong>
                {bestScore.toLocaleString(
                  getLanguage()
                )}
              </strong>

            </div>

            <div className="bacteria-start-icon">

              <svg
                viewBox="0 -64 640 640"
                aria-hidden="true"
              >

                <path
                  fill="currentColor"
                  d="M272.35,226.4A17.71,17.71,0,0,0,281.46,203l-4-9.08a121.29,121.29,0,0,1,12.36-3.08A83.34,83.34,0,0,0,323.57,177l10,9a17.76,17.76,0,1,0,23.92-26.27l-9.72-8.76a83.12,83.12,0,0,0,11.65-48.18l11.85-3.51a17.73,17.73,0,1,0-10.15-34l-11.34,3.36a84,84,0,0,0-36.38-35.57l2.84-10.85a17.8,17.8,0,0,0-34.47-8.93l-2.82,10.78a83.25,83.25,0,0,0-16.74,1.1C250.83,27,240,30.22,229.1,33.39l-3.38-9.46a17.8,17.8,0,0,0-33.56,11.89l3.49,9.8a286.74,286.74,0,0,0-43.94,23.57l-6.32-8.43a17.9,17.9,0,0,0-24.94-3.6A17.69,17.69,0,0,0,116.84,82l6.45,8.61a286.59,286.59,0,0,0-34.95,35.33l-8.82-6.42a17.84,17.84,0,0,0-24.89,3.86,17.66,17.66,0,0,0,3.88,24.77l8.88,6.47a286.6,286.6,0,0,0-23,43.91l-10.48-3.59a17.73,17.73,0,1,0-11.59,33.52L32.67,232c-2.79,10-5.79,19.84-7.52,30.22a83.16,83.16,0,0,0-.82,19l-11.58,3.43a17.73,17.73,0,1,0,10.13,34l11.27-3.33a83.51,83.51,0,0,0,36.39,35.43l-2.88,11.06a17.81,17.81,0,0,0,34.48,8.92l2.87-11c1,0,2.07.26,3.1.26a83.39,83.39,0,0,0,45.65-13.88l8.59,8.8a17.77,17.77,0,0,0,25.56-24.7l-9.14-9.37a83.41,83.41,0,0,0,12.08-31.05,119.08,119.08,0,0,1,3.87-15.53l9,4.22a17.74,17.74,0,1,0,15.15-32.09l-8.8-4.11c.67-1,1.2-2.08,1.9-3.05a119.89,119.89,0,0,1,7.87-9.41,121.73,121.73,0,0,1,11.65-11.4,119.49,119.49,0,0,1,9.94-7.82c1.12-.77,2.32-1.42,3.47-2.15l3.92,8.85a17.86,17.86,0,0,0,16.32,10.58A18.14,18.14,0,0,0,272.35,226.4ZM128,256a32,32,0,1,1,32-32A32,32,0,0,1,128,256Zm80-96a16,16,0,1,1,16-16A16,16,0,0,1,208,160Zm431.26,45.3a17.79,17.79,0,0,0-17.06-12.69,17.55,17.55,0,0,0-5.08.74l-11.27,3.33a83.61,83.61,0,0,0-36.39-35.43l2.88-11.06a17.81,17.81,0,0,0-34.48-8.91l-2.87,11c-1,0-2.07.26-3.1-.26a83.32,83.32,0,0,0-45.65,13.89l-8.59-8.81a17.77,17.77,0,0,0-25.56,24.7l9.14,9.37a83.28,83.28,0,0,0-12.08,31.06,119.34,119.34,0,0,1-3.87,15.52l-9-4.22a17.74,17.74,0,1,0-15.15,32.09l8.8,4.11c-.67,1-1.2,2.08-1.89,3.05a117.71,117.71,0,0,1-7.94,9.47,119,119,0,0,1-11.57,11.33,121.59,121.59,0,0,1-10,7.83c-1.12.77-2.32,1.42-3.47,2.15l-3.92-8.85a17.86,17.86,0,0,0-16.32-10.58,18.14,18.14,0,0,0-7.18,1.5A17.71,17.71,0,0,0,358.54,309l4,9.08a118.71,118.71,0,0,1-12.36,3.08,83.34,83.34,0,0,0-33.77,13.9l-10-9a17.77,17.77,0,1,0-23.92,26.28l9.72,8.75a83.12,83.12,0,0,0-11.65,48.18l-11.86,3.51a17.73,17.73,0,1,0,10.16,34l11.34-3.36A84,84,0,0,0,326.61,479l-2.84,10.85a17.8,17.8,0,0,0,34.47,8.93L361.06,488a83.3,83.3,0,0,0,16.74-1.1c11.37-1.89,22.24-5.07,33.1-8.24l3.38,9.46a17.8,17.8,0,0,0,33.56-11.89l-3.49-9.79a287.66,287.66,0,0,0,43.94-23.58l6.32,8.43a17.88,17.88,0,0,0,24.93,3.6A17.67,17.67,0,0,0,523.16,430l-6.45-8.61a287.37,287.37,0,0,0,34.95-35.34l8.82,6.42a17.76,17.76,0,1,0,21-28.63l-8.88-6.46a287.17,287.17,0,0,0,23-43.92l10.48,3.59a17.73,17.73,0,1,0,11.59-33.52L607.33,280c2.79-10,5.79-19.84,7.52-30.21a83.27,83.27,0,0,0,.82-19.05l11.58-3.43A17.7,17.7,0,0,0,639.26,205.3ZM416,416a32,32,0,1,1,32-32A32,32,0,0,1,416,416Z"
                />

              </svg>

            </div>

            <p className="bacteria-start-mode">
              {tr("INFECTIOLOGIE")}</p>

            <h1>
              Bacteria{' '}
              <span>
                Slash
              </span>
            </h1>

            <p className="bacteria-start-instructions">
              {tr("Élimine les bactéries sans toucher aux cellules sanguines.")}</p>

            <button
              type="button"
              className="bacteria-start-button"
              onClick={startGame}
            >
              {tr("Commencer")}<span>→</span>
            </button>

          </div>

        )}

        {/* =================================
            HUD
        ================================= */}

        {gameState !== 'ready' &&
          gameState !== 'gameover' && (

          <div className="bacteria-hud">

            <div className="bacteria-hud-block">

              <span>
                {tr("SCORE")}</span>

              <strong>
                {score.toLocaleString(
                  getLanguage()
                )}
              </strong>

            </div>

            <div className="bacteria-hud-title">

              <span>
                BACTERIA
              </span>

              <strong>
                SLASH
              </strong>

            </div>

            <div className="bacteria-hud-block bacteria-hud-best">

              <span>
                {tr("RECORD")}</span>

              <strong>
                {bestScore.toLocaleString(
                  getLanguage()
                )}
              </strong>

            </div>

          </div>

        )}

        {/* =================================
            COUNTDOWN
        ================================= */}

        {gameState === 'countdown' && (

          <div className="bacteria-countdown">

            <span>
              {tr("PRÊT ?")}</span>

            <strong key={countdown}>
              {countdown === 0
                ? tr('GO')
                : countdown}
            </strong>

          </div>

        )}

        {/* =================================
            OBJETS
        ================================= */}

        {gameState === 'playing' &&
          items.map(
            item => (

              <button
                key={item.id}
                type="button"

                className={
                  `bacteria-object ${
                    item.kind === 'blood'
                      ? 'is-blood-cell'
                      : 'is-bacteria'
                  }`
                }

                style={{
                  width:
                    `${item.size}px`,

                  height:
                    `${item.size}px`,

                  left:
                    `${item.x}px`,

                  bottom:
                    `${item.y}px`,

                  transform:
                    `translateX(-50%) rotate(${item.rotation}deg)`,
                }}

                onPointerDown={
                  event =>
                    hitItem(
                      event,
                      item
                    )
                }
              >

                <img
                  src={item.image}
                  alt={tr(item.name)}
                  draggable={false}
                />

              </button>

            )
          )}

        {/* =================================
            EXPLOSIONS
        ================================= */}

        {explosions.map(
          explosion => (

            <div
              key={explosion.id}

              className="bacteria-explosion"

              style={{
                left:
                  `${explosion.x}px`,

                bottom:
                  `${explosion.y}px`,
              }}
            >

              <i />
              <i />
              <i />
              <i />
              <i />
              <i />

              <strong>
                +100
              </strong>

              <span>
                {tr(explosion.name)}
              </span>

            </div>

          )
        )}

        {/* =================================
            ANIMATION NOUVEAU RECORD
        ================================= */}

        {gameState === 'playing' &&
          showRecord && (

          <div className="bacteria-record-overlay">

            <div className="bacteria-record-burst">

              <span className="bacteria-record-kicker">
                {tr("NOUVEAU RECORD")}</span>

              <strong>
                {recordScore.toLocaleString(
                  getLanguage()
                )}
              </strong>

              <p>
                {tr("Tu viens de battre ton meilleur score !")}</p>

              <span className="bacteria-record-star">
                ✦
              </span>

            </div>

          </div>

        )}

        {/* =================================
            GAME OVER
        ================================= */}

        {gameState === 'gameover' && (

          <div className="bacteria-gameover-overlay">

            <div className="bacteria-gameover-card">

              <p>
                {tr("CELLULE SANGUINE TOUCHÉE")}</p>

              <h1>
                {tr("GAME OVER")}</h1>

              <div className="bacteria-gameover-score">

                <span>
                  {tr("SCORE")}</span>

                <strong>
                  {score.toLocaleString(
                    getLanguage()
                  )}
                </strong>

                <small>
                  {tr("points")}</small>

              </div>

              {/* =================================
                  CLASSEMENT MONDIAL
              ================================= */}

              <div className="bacteria-leaderboard">

                <div className="bacteria-leaderboard-heading">

                  <div>

                    <span className="bacteria-leaderboard-kicker">
                      {tr("CLASSEMENT MONDIAL")}</span>

                    <strong>
                      Bacteria Slash
                    </strong>

                  </div>

                  <div className="bacteria-leaderboard-trophy">

                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >

                      <path
                        d="M22,3H19V2a1,1,0,0,0-1-1H6A1,1,0,0,0,5,2V3H2A1,1,0,0,0,1,4V6a4.994,4.994,0,0,0,4.276,4.927A7.009,7.009,0,0,0,11,15.92V18H7a1,1,0,0,0-.949.684l-1,3A1,1,0,0,0,6,23H18a1,1,0,0,0,.948-1.316l-1-3A1,1,0,0,0,17,18H13V15.92a7.009,7.009,0,0,0,5.724-4.993A4.994,4.994,0,0,0,23,6V4A1,1,0,0,0,17,18H13V15.92a7.009,7.009,0,0,0,5.724-4.993A4.994,4.994,0,0,0,23,6V4A1,1,0,0,0,22,3ZM5,8.829A3.006,3.006,0,0,1,3,6V5H5ZM16.279,20l.333,1H7.387l.334-1ZM17,9A5,5,0,0,1,7,9V3H17Zm4-3a3.006,3.006,0,0,1-2,2.829V5h2ZM10.667,8.667,9,7.292,11,7l1-2,1,2,2,.292L13.333,8.667,13.854,11,12,9.667,10.146,11Z"
                      />

                    </svg>

                  </div>

                </div>

                {leaderboardLoading ? (

                  <div className="bacteria-leaderboard-loading">
                    {tr("Chargement du classement...")}</div>

                ) : leaderboardError ? (

                  <div className="bacteria-leaderboard-loading">
                    {tr("Classement momentanément indisponible.")}</div>

                ) : leaderboard.length === 0 ? (

                  <div className="bacteria-leaderboard-loading">
                    {tr("Aucun score pour le moment.")}</div>

                ) : (

                  <div className="bacteria-ranking-list">

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
                            key={entry.player_id}

                            className={
                              `bacteria-ranking-row ${
                                rank <= 3
                                  ? `bacteria-ranking-top bacteria-ranking-${rank}`
                                  : ''
                              } ${
                                entry.isCurrentPlayer
                                  ? 'bacteria-ranking-me'
                                  : ''
                              }`
                            }
                          >

                            <div className="bacteria-ranking-position">

                              {rank === 1
                                ? '🥇'
                                : rank === 2
                                  ? '🥈'
                                  : rank === 3
                                    ? '🥉'
                                    : rank}

                            </div>

                            <img
                              className="bacteria-ranking-avatar"

                              src={
                                leaderboardAvatars[
                                  avatarIndex
                                ]
                              }

                              alt=""
                            />

                            <div className="bacteria-ranking-player">

                              <strong>
                                {entry.pseudo}
                              </strong>

                              {entry.isCurrentPlayer && (

                                <span>
                                  {tr("TOI")}</span>

                              )}

                            </div>

                            <div className="bacteria-ranking-score">

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
                  ACTIONS
              ================================= */}

              <div className="bacteria-gameover-actions">

                <button
                  type="button"
                  onClick={restartGame}
                >

                  {tr("Rejouer")}<span>
                    ↻
                  </span>

                </button>

                <button
                  type="button"
                  className="bacteria-secondary-button"
                  onClick={returnToMenu}
                >

                  {tr("Retour aux jeux")}</button>

              </div>

            </div>

          </div>

        )}

        {/* =================================
            CONSIGNE
        ================================= */}

        {gameState === 'playing' && (

          <div className="bacteria-game-hint">

            <span className="good">
              {tr("Bactéries +100")}</span>

            <span className="danger">
              {tr("Cellules sanguines = Game Over")}</span>

          </div>

        )}

      </div>

    </section>
  )
}

export default BacteriaSlash
