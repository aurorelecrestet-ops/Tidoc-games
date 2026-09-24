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
import TournamentSoloPlayersHud from '../components/TournamentSoloPlayersHud'
import TournamentSoloRoundResults from '../components/TournamentSoloRoundResults'

import './BacteriaSlash.css'
import './BacteriaMultiplayerGame.css'
import '../components/TournamentSoloRoundResults.css'
import './TournamentSoloTeams.css'

import bacteriaMusic from '../assets/audio/bacteria-music.mp3'

/* ========================================
   CLASSEMENT
======================================== */



import {
  computeBotScore,
  getSoloTournament,
  getSoloTournamentReturnPath,
  recordSoloRound,
} from '../lib/tournamentSolo'

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

type TeamColor = 'green' | 'red' | 'yellow' | 'purple'

type ObjectKind = 'bacteria'

type GameItem = {
  id: number
  kind: ObjectKind
  color: TeamColor
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
  points: number
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



const GRAVITY = 1180
const BACTERIA_POINTS = 100

const BEST_SCORE_KEY =
  'tidoc-bacteria-slash-best'


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

  const teamBagRef = useRef<TeamColor[]>([])
  const botCapturesRef = useRef<Record<string, number>>({})

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

    gameOverRef.current = false
    teamBagRef.current = []
    botCapturesRef.current = {}

    roundSecondsRef.current = 45
    setRoundSecondsLeft(45)
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

    const source = bacteriaList

    const selected =
      source[
        Math.floor(
          Math.random() *
          source.length
        )
      ]

    const size = 82 + Math.random() * 30

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

      kind: 'bacteria',

      color: (() => {
        if (teamBagRef.current.length === 0) {
          teamBagRef.current = ['green', 'red', 'yellow', 'purple']
            .sort(() => Math.random() - 0.5) as TeamColor[]
        }
        return teamBagRef.current.shift() ?? 'green'
      })(),

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

  // Les robots éliminent visuellement leurs propres bactéries, sans
  // enregistrer une deuxième fois leurs points. Leur HUD et leur score final
  // sont calculés par computeBotScore dans tournamentSolo.ts.
  useEffect(() => {
    if (gameState !== 'playing' || paused || showRecord) return
    const tournament = getSoloTournament()
    if (!tournament || tournament.status !== 'playing') return
    const timer = window.setInterval(() => {
      const elapsed = 45 - roundSecondsRef.current
      let changed = false
      for (const bot of tournament.players.filter(player => player.player_id !== tournament.human_player_id)) {
        const color = bot.color as TeamColor
        const budget = Math.floor(computeBotScore({
          stateId: tournament.id,
          round: tournament.current_round,
          botOrder: bot.player_order,
          cup: tournament.cup ?? 'interne',
          elapsed,
        }) / BACTERIA_POINTS)
        const captured = botCapturesRef.current[color] ?? 0
        if (captured >= budget) continue
        const candidate = itemsRef.current.find(item => item.kind === 'bacteria' && item.color === color)
        if (!candidate) continue
        itemsRef.current = itemsRef.current.filter(item => item.id !== candidate.id)
        botCapturesRef.current[color] = captured + 1
        changed = true
      }
      if (changed) setItems([...itemsRef.current])
    }, 250)
    return () => window.clearInterval(timer)
  }, [gameState, paused, showRecord])

  // Chronomètre de tournoi : 45 secondes de jeu actif, pause incluse.
  const [roundSecondsLeft, setRoundSecondsLeft] = useState(45)
  const roundSecondsRef = useRef(45)

  useEffect(() => {
    if (gameState !== 'playing' || paused || showRecord) return
    const tick = window.setInterval(() => {
      roundSecondsRef.current = Math.max(0, roundSecondsRef.current - 1)
      setRoundSecondsLeft(roundSecondsRef.current)
    }, 1000)
    return () => window.clearInterval(tick)
  }, [gameState, paused, showRecord])

  useEffect(() => {
    if (gameState === 'playing' && roundSecondsLeft === 0) endGame()
    // endGame is intentionally tied to the zero crossing, not to every game render.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, roundSecondsLeft])

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

    /* Manche d'un tournoi solo : score enregistré. */

    recordSoloRound(
      'bacteria-slash',
      finalScore,
      window.localStorage,
      45 - roundSecondsRef.current
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
  showRecord ||
  paused
) {
  return
}

    /* Une autre couleur appartient à un robot : pénalité, comme en multi. */
    const ownColor = item.color === 'green'

    /*
      Bactérie :
      +100 points si verte.
    */

    itemsRef.current =
      itemsRef.current.filter(
        current =>
          current.id !== item.id
      )

    setItems([
      ...itemsRef.current,
    ])

    const newScore = Math.max(0, scoreRef.current + (ownColor ? BACTERIA_POINTS : -BACTERIA_POINTS))

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

      points: ownColor ? BACTERIA_POINTS : -BACTERIA_POINTS,
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
     RETOUR AU MENU
  ======================================== */

  function returnToMenu() {

    onFullscreenChange?.(
      false
    )

    navigate(
      getSoloTournamentReturnPath('bacteria-slash')
    )
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

      <TournamentSoloPlayersHud active={gameState === 'playing'} humanScore={score} />
      {gameState === 'playing' && (
        <div className="tournament-solo-clock" role="timer" aria-label="Temps restant">
          {Math.floor(roundSecondsLeft / 60)}:{String(roundSecondsLeft % 60).padStart(2, '0')}
        </div>
      )}

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
            <p className="bacteria-start-mode">{tr('MODE TOURNOI • SOLO')}</p>
            <h1>Bacteria <span>Slash</span></h1>
            <p className="bacteria-start-instructions">{tr('Élimine les bactéries vertes et évite les autres couleurs.')}</p>
            <button type="button" className="bacteria-start-button" onClick={startGame}>
              {tr('Commencer')} <span>→</span>
            </button>
          </div>
        )}

        {/* =================================
            HUD
        ================================= */}

        {gameState === 'countdown' && (

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
                  `bacteria-object is-bacteria bacteria-multi-object bacteria-target-${item.color}`
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
                {explosion.points > 0 ? '+' : '−'}{Math.abs(explosion.points)}
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
          <TournamentSoloRoundResults game="bacteria-slash" score={score} />
        )}

        {/* =================================
            CONSIGNE
        ================================= */}

        {gameState === 'playing' && (

          <div className="bacteria-game-hint">

            <span className="good">
              {tr("Bactéries +100")}</span>

            <span className="danger">
              {tr("Autres couleurs = −100 points")}</span>

          </div>

        )}

      </div>

    </section>
  )
}

export default BacteriaSlash
