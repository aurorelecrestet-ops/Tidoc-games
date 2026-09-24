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

import './ECGGame.css'

import {
  startGameRoomPresence,
} from '../lib/gameRoomPresence'

import {
  useNavigate,
  useParams,
} from 'react-router-dom'

import { supabase } from '../lib/supabase'

import {
  getCurrentPlayerId,
  getGameRoomByCode,
  getRoomPlayers,
  type GameRoom,
  type LobbyPlayer,
} from '../lib/multiplayer'

import pieceImage from '../assets/pharma/piece.png'
import fondPharma from '../assets/pharma/fondpharma.png'
import pharmaMusic from '../assets/audio/pharma.mp3'

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

import './StockAndStack.css'
import './StockAndStackMultiplayerGame.css'
import './ECGMultiplayerGame.css'
import './Classements.css'


/* ========================================
   TYPES
======================================== */

type StockAndStackMultiplayerGameProps = {
  onFullscreenChange?: (
    fullscreen: boolean
  ) => void
}

// Temps commun au multijoueur de l'accueil, en secondes.
const STOCK_MULTIPLAYER_DURATION_SECONDS = 180

type GameState =
  | 'loading'
  | 'countdown'
  | 'playing'
  | 'results'

type Cell = {
  x: number
  y: number
}

type Shape = {
  id: string
  cells: Cell[]
}

/*
  0 = vide
  1 = joueur vert
  2 = joueur rouge
  3 = joueur jaune
  4 = joueur violet
*/

type Board = number[][]

type MatchMove = {
  player_order: number
  shape_id: string

  anchor_x: number
  anchor_y: number

  placed_cells: number[][]
  cleared_cells: number[][]

  lines_cleared: number

  placement_points: number
  line_points: number
  combo_bonus: number
  earned_points: number
}

type RoomPlayerPresence = {
  player_id: string
  disconnected_at: string | null
}

type RoomEndReason =
  | 'normal'
  | 'disconnection'

type StockMatch = {
  room_id: string

  board: Board
  offers: string[]

  turn_order: number
  revision: number

  last_move: MatchMove | null

  finished: boolean

  created_at: string
  updated_at: string
}

type DragData = {
  pointerId: number

  pieceIndex: number
  shape: Shape

  clientX: number
  clientY: number

  anchor: Cell | null
  valid: boolean

  cellSize: number
}

type ClearAnimation = {
  cells: string[]

  count: number
  message: string

  points: number
}


/* ========================================
   CONSTANTES
======================================== */

const GRID_SIZE = 8

const POINTS_PER_LINE = 100

const DRAG_LIFT = 85

const CLEAR_ANIMATION_DURATION = 750

const CLEAR_MESSAGE_DURATION = 1250

const GO_DISPLAY_DURATION = 650


const AVATARS = [
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


const PLAYER_COLORS = [
  'green',
  'red',
  'yellow',
  'purple',
] as const


/* ========================================
   FORMES

   Identiques au jeu solo
   et au catalogue SQL.
======================================== */

const SHAPES: Shape[] = [

  /* CARTON SEUL */

  {
    id: 'single',
    cells: [
      { x: 0, y: 0 },
    ],
  },


  /* LIGNES HORIZONTALES */

  {
    id: 'line-2',
    cells: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
    ],
  },

  {
    id: 'line-3',
    cells: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
    ],
  },

  {
    id: 'line-4',
    cells: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
    ],
  },

  {
    id: 'line-5',
    cells: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
      { x: 4, y: 0 },
    ],
  },


  /* LIGNES VERTICALES */

  {
    id: 'vertical-2',
    cells: [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
    ],
  },

  {
    id: 'vertical-3',
    cells: [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: 2 },
    ],
  },

  {
    id: 'vertical-4',
    cells: [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: 2 },
      { x: 0, y: 3 },
    ],
  },

  {
    id: 'vertical-5',
    cells: [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: 2 },
      { x: 0, y: 3 },
      { x: 0, y: 4 },
    ],
  },


  /* CARRÉS ET RECTANGLES */

  {
    id: 'square-2',
    cells: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ],
  },

  {
    id: 'square-3',
    cells: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },

      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },

      { x: 0, y: 2 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
    ],
  },

  {
    id: 'rectangle-2x3',
    cells: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },

      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
  },


  /* PETITS L */

  {
    id: 'l-small',
    cells: [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ],
  },

  {
    id: 'l-small-mirror',
    cells: [
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ],
  },

  {
    id: 'l-small-up',
    cells: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
    ],
  },

  {
    id: 'l-small-up-mirror',
    cells: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
    ],
  },


  /* L LONGS */

  {
    id: 'l-long',
    cells: [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: 2 },
      { x: 1, y: 2 },
    ],
  },

  {
    id: 'l-long-mirror',
    cells: [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 2 },
      { x: 1, y: 2 },
    ],
  },

  {
    id: 'l-long-up',
    cells: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: 2 },
    ],
  },

  {
    id: 'l-long-up-mirror',
    cells: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
    ],
  },


  /* FORMES EN T */

  {
    id: 't-down',
    cells: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 1, y: 1 },
    ],
  },

  {
    id: 't-up',
    cells: [
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
  },

  {
    id: 't-left',
    cells: [
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
    ],
  },

  {
    id: 't-right',
    cells: [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 0, y: 2 },
    ],
  },


  /* ESCALIERS */

  {
    id: 'stairs-right',
    cells: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
  },

  {
    id: 'stairs-left',
    cells: [
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ],
  },

  {
    id: 'stairs-vertical-right',
    cells: [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
    ],
  },

  {
    id: 'stairs-vertical-left',
    cells: [
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 0, y: 2 },
    ],
  },


  /* CROIX */

  {
    id: 'cross',
    cells: [
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 2 },
    ],
  },


  /* COIN */

  {
    id: 'corner-3',
    cells: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
    ],
  },


  /* DIAGONALES */

  {
    id: 'diagonal-2-left',
    cells: [
      { x: 1, y: 0 },
      { x: 0, y: 1 },
    ],
  },

  {
    id: 'diagonal-2-right',
    cells: [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
    ],
  },

  {
    id: 'diagonal-3-left',
    cells: [
      { x: 2, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 2 },
    ],
  },

  {
    id: 'diagonal-3-right',
    cells: [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 2 },
    ],
  },


  /* GRANDS L */

  {
    id: 'l-large-bottom-left',
    cells: [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: 2 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
    ],
  },

  {
    id: 'l-large-top-left',
    cells: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: 2 },
    ],
  },

  {
    id: 'l-large-top-right',
    cells: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 2, y: 1 },
      { x: 2, y: 2 },
    ],
  },

  {
    id: 'l-large-bottom-right',
    cells: [
      { x: 2, y: 0 },
      { x: 2, y: 1 },
      { x: 0, y: 2 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
    ],
  },

]


const SHAPES_BY_ID =
  new Map(
    SHAPES.map(
      shape => [
        shape.id,
        shape,
      ],
    ),
  )


/* ========================================
   OUTILS
======================================== */

function getShapeWidth(
  shape: Shape,
) {

  return (
    Math.max(
      ...shape.cells.map(
        cell => cell.x,
      ),
    ) + 1
  )

}


function getShapeHeight(
  shape: Shape,
) {

  return (
    Math.max(
      ...shape.cells.map(
        cell => cell.y,
      ),
    ) + 1
  )

}


function canPlaceShape(
  board: Board,
  shape: Shape,
  anchorX: number,
  anchorY: number,
) {

  return shape.cells.every(
    cell => {

      const x =
        anchorX + cell.x

      const y =
        anchorY + cell.y


      if (
        x < 0 ||
        x >= GRID_SIZE ||
        y < 0 ||
        y >= GRID_SIZE
      ) {

        return false

      }


      return (
        board[y]?.[x] === 0
      )

    },
  )

}


function getClearMessage(
  count: number,
) {

  if (
    count >= 4
  ) {

    return 'STOCK MASTER !'

  }


  if (
    count === 3
  ) {

    return 'TRIPLE COMBO !'

  }


  if (
    count === 2
  ) {

    return 'DOUBLE RANGEMENT !'

  }


  return 'RÉSERVE OPTIMISÉE !'

}


function getPlayerColor(
  playerOrder: number,
) {

  return (
    PLAYER_COLORS[
      playerOrder - 1
    ] ?? 'green'
  )

}


/* ========================================
   FORME EN CARTONS
======================================== */

function PieceShape({

  shape,
  cellSize,
  className = '',
  playerOrder,

}: {

  shape: Shape
  cellSize: number

  className?: string
  playerOrder?: number

}) {

  const width =
    getShapeWidth(
      shape,
    )


  const height =
    getShapeHeight(
      shape,
    )


  return (

    <div
      className={
        `stock-piece-shape ${className}`
      }

      style={
        {

          width:
            width * cellSize,

          height:
            height * cellSize,

        } as CSSProperties
      }
    >

      {shape.cells.map(
        (
          cell,
          index,
        ) => (

          <div

            key={
              `${cell.x}-${cell.y}-${index}`
            }

            className={
              `stock-piece-box ${
                playerOrder
                  ? `stock-multi-color-${getPlayerColor(
                      playerOrder,
                    )}`
                  : ''
              }`
            }

            style={{

              left:
                cell.x * cellSize,

              top:
                cell.y * cellSize,

              width:
                cellSize,

              height:
                cellSize,

            }}

          >

            <img
              src={pieceImage}
              alt=""
              draggable={false}
            />

          </div>

        ),
      )}

    </div>

  )

}


/* ========================================
   JEU MULTIJOUEUR
======================================== */

function StockAndStackMultiplayerGame({

  onFullscreenChange,

}: StockAndStackMultiplayerGameProps) {
  const { setMusicVolume, setMusicMuted, getEffectsOutput } = useGameAudio()


  const navigate =
    useNavigate()


  const {
    code = '',
  } = useParams()


  /* ========================================
     ÉTATS
  ======================================== */

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

  const [remainingSeconds, setRemainingSeconds] = useState(STOCK_MULTIPLAYER_DURATION_SECONDS)


  const [
    room,
    setRoom,
  ] = useState<GameRoom | null>(
    null,
  )


  const [
    players,
    setPlayers,
  ] = useState<LobbyPlayer[]>(
    [],
  )


  const [
    currentPlayerId,
    setCurrentPlayerId,
  ] = useState<string | null>(
    null,
  )


  const [
    match,
    setMatch,
  ] = useState<StockMatch | null>(
    null,
  )


  const [
    visibleBoard,
    setVisibleBoard,
  ] = useState<Board>(
    [],
  )


  const [
    drag,
    setDrag,
  ] = useState<DragData | null>(
    null,
  )


  const [
    clearAnimation,
    setClearAnimation,
  ] = useState<ClearAnimation | null>(
    null,
  )


  const [
    isClearing,
    setIsClearing,
  ] = useState(false)


  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false)


  const [
    errorMessage,
    setErrorMessage,
  ] = useState('')

  const [
  roomEndReason,
  setRoomEndReason,
] = useState<RoomEndReason>(
  'normal',
)

const [
  disconnectedPlayerIds,
  setDisconnectedPlayerIds,
] = useState<string[]>(
  [],
)


  /* ========================================
     REFS
  ======================================== */

  const gridRef =
    useRef<HTMLDivElement | null>(
      null,
    )


  const matchRef =
    useRef<StockMatch | null>(
      null,
    )


  const dragRef =
    useRef<DragData | null>(
      null,
    )


  const gameStateRef =
    useRef<GameState>(
      'loading',
    )


  const currentPlayerIdRef =
    useRef<string | null>(
      null,
    )


  const playersRef =
    useRef<LobbyPlayer[]>(
      [],
    )


  const roomRef =
    useRef<GameRoom | null>(
      null,
    )


  const startedAtRef =
    useRef<number | null>(
      null,
    )


  const submittingRef =
    useRef(false)


  const clearTimerRef =
    useRef<number | null>(
      null,
    )


  const clearMessageTimerRef =
    useRef<number | null>(
      null,
    )


  const resultsTimerRef =
    useRef<number | null>(
      null,
    )


  const audioContextRef =
    useRef<AudioContext | null>(
      null,
    )


  const pharmaMusicRef =
    useRef<HTMLAudioElement | null>(
      null,
    )


  /* ========================================
     JOUEURS
  ======================================== */

  const currentPlayer =
    players.find(
      player =>
        player.player_id ===
        currentPlayerId,
    )


  const activePlayer =
    players.find(
      player =>
        player.player_order ===
        match?.turn_order,
    )


  const isMyTurn =

    gameState === 'playing' &&

    match !== null &&

    !match.finished &&

    currentPlayer !== undefined &&

    currentPlayer.player_order ===
      match.turn_order


  /* ========================================
     PLEIN ÉCRAN
  ======================================== */

  useEffect(() => {

    const fullscreen =

      gameState === 'countdown' ||

      gameState === 'playing'


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
     ÉTATS DANS LES REFS
  ======================================== */

  useEffect(() => {

    gameStateRef.current =
      gameState

  }, [
    gameState,
  ])


  useEffect(() => {

    playersRef.current =
      players

  }, [
    players,
  ])


  /* ========================================
     AUDIO
  ======================================== */

  function getAudioContext() {

    if (
      !audioContextRef.current
    ) {

      audioContextRef.current =
        new AudioContext()

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


  function playTone(

    frequency: number,

    duration: number,

    volume: number,

    delay = 0,

    type: OscillatorType = 'sine',

  ) {

    const context =
      audioContextRef.current


    if (!context) {
      return
    }


    const oscillator =
      context.createOscillator()


    const gain =
      context.createGain()


    const start =
      context.currentTime +
      delay


    oscillator.type =
      type


    oscillator.frequency.value =
      frequency


    gain.gain.setValueAtTime(
      0.0001,
      start,
    )


    gain.gain.exponentialRampToValueAtTime(
      volume,
      start + 0.01,
    )


    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      start + duration,
    )


    oscillator.connect(
      gain,
    )


    gain.connect(
      getEffectsOutput(context),
    )


    oscillator.start(
      start,
    )


    oscillator.stop(
      start + duration + 0.01,
    )

  }


  function playCountdownSound(
    value: number,
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
        : 0.11,

      value === 0
        ? 0.16
        : 0.11,

    )

  }


  function playPlacementSound() {

    playTone(
      330,
      0.09,
      0.075,
      0,
      'triangle',
    )


    playTone(
      440,
      0.10,
      0.045,
      0.035,
    )

  }


  function playClearSound(
    lines: number,
  ) {

    const notes = [
      523.25,
      659.25,
      783.99,
      1046.5,
    ]


    const count =
      Math.min(
        lines + 2,
        notes.length,
      )


    for (
      let i = 0;
      i < count;
      i++
    ) {

      playTone(

        notes[i],

        i === count - 1
          ? 0.36
          : 0.15,

        0.085,

        i * 0.095,

        'triangle',

      )

    }


    if (
      lines >= 2
    ) {

      playTone(
        1318.51,
        0.35,
        0.055,
        0.29,
      )

    }

  }


  function playGameOverSound() {

    playTone(
      440,
      0.24,
      0.10,
    )


    playTone(
      330,
      0.28,
      0.09,
      0.20,
    )


    playTone(
      220,
      0.40,
      0.09,
      0.43,
    )

  }


  /* ========================================
     MUSIQUE PHARMACIE
  ======================================== */

  function preparePharmaMusic() {

    if (
      pharmaMusicRef.current
    ) {

      return pharmaMusicRef.current

    }


    const audio =
      new Audio(
        pharmaMusic,
      )


    audio.loop =
      true


    setMusicVolume(audio, 0.18)


    audio.preload =
      'auto'


    pharmaMusicRef.current =
      audio


    return audio

  }


  function startPharmaMusic() {

    const audio =
      preparePharmaMusic()


    setMusicMuted(audio, false)


    void audio
      .play()
      .catch(
        error => {

          console.warn(
            'Musique pharma bloquée :',
            error,
          )

        },
      )

  }


  function stopPharmaMusic() {

    const audio =
      pharmaMusicRef.current


    if (!audio) {
      return
    }


    audio.pause()


    audio.currentTime =
      0

  }


  function unlockAudio() {

    getAudioContext()


    const music =
      preparePharmaMusic()


    if (
      gameStateRef.current ===
      'countdown'
    ) {

      setMusicMuted(music, true)


      if (
        music.paused
      ) {

        void music
          .play()
          .catch(
            console.warn,
          )

      }

    } else if (
      gameStateRef.current ===
      'playing'
    ) {

      setMusicMuted(music, false)


      if (
        music.paused
      ) {

        void music
          .play()
          .catch(
            console.warn,
          )

      }

    }

  }


  /* ========================================
     MINUTEURS
  ======================================== */

  function cancelAnimationTimers() {

    if (
      clearTimerRef.current !==
      null
    ) {

      window.clearTimeout(
        clearTimerRef.current,
      )


      clearTimerRef.current =
        null

    }


    if (
      clearMessageTimerRef.current !==
      null
    ) {

      window.clearTimeout(
        clearMessageTimerRef.current,
      )


      clearMessageTimerRef.current =
        null

    }


    if (
      resultsTimerRef.current !==
      null
    ) {

      window.clearTimeout(
        resultsTimerRef.current,
      )


      resultsTimerRef.current =
        null

    }

  }


  /* ========================================
     RECEVOIR UNE NOUVELLE GRILLE

     Une ancienne réponse réseau
     ne peut pas remplacer
     une révision plus récente.
  ======================================== */

  function receiveMatch(
    incoming: StockMatch,
  ) {

    const previous =
      matchRef.current


    if (

      previous &&

      incoming.revision <
        previous.revision

    ) {

      return

    }


    /*
      Même révision :
      inutile de relancer
      toutes les animations.
    */

    if (

      previous &&

      incoming.revision ===
        previous.revision

    ) {

      matchRef.current =
        incoming


      setMatch(
        incoming,
      )


      return

    }


    const isNewMove =

      previous !== null &&

      incoming.revision ===
        previous.revision + 1 &&

      incoming.last_move !==
        null


    matchRef.current =
      incoming


    setMatch(
      incoming,
    )


    dragRef.current =
      null


    setDrag(
      null,
    )


    submittingRef.current =
      false


    setIsSubmitting(
      false,
    )


    cancelAnimationTimers()


    setClearAnimation(
      null,
    )


    setIsClearing(
      false,
    )


    /*
      Reconstruire temporairement
      le plateau avec les cartons
      du dernier coup.

      Cela permet de montrer
      l'effacement des lignes.
    */

    if (

      isNewMove &&

      previous &&

      incoming.last_move

    ) {

      const move =
        incoming.last_move


      const temporaryBoard =
        previous.board.map(
          row => [
            ...row,
          ],
        )


      for (
        const coordinates of
        move.placed_cells
      ) {

        const x =
          coordinates[0]


        const y =
          coordinates[1]


        if (
          temporaryBoard[y]
        ) {

          temporaryBoard[y][x] =
            move.player_order

        }

      }


      setVisibleBoard(
        temporaryBoard,
      )


      if (
        move.lines_cleared > 0
      ) {

        const animation:
        ClearAnimation = {

          cells:
            move.cleared_cells.map(
              coordinates =>
                `${coordinates[0]}-${coordinates[1]}`,
            ),

          count:
            move.lines_cleared,

          message:
            getClearMessage(
              move.lines_cleared,
            ),

          points:
            move.earned_points,

        }


        setClearAnimation(
          animation,
        )


        setIsClearing(
          true,
        )


        playClearSound(
          move.lines_cleared,
        )


        clearTimerRef.current =
          window.setTimeout(

            () => {

              setVisibleBoard(
                incoming.board,
              )


              setIsClearing(
                false,
              )


              clearTimerRef.current =
                null

            },

            CLEAR_ANIMATION_DURATION,

          )


        clearMessageTimerRef.current =
          window.setTimeout(

            () => {

              setClearAnimation(
                null,
              )


              clearMessageTimerRef.current =
                null

            },

            CLEAR_MESSAGE_DURATION,

          )

      } else {

        setVisibleBoard(
          incoming.board,
        )


        playPlacementSound()

      }

    } else {

      setVisibleBoard(
        incoming.board,
      )

    }


    /*
      Fin de partie :
      laisser l'animation du
      dernier coup se terminer.
    */

    if (
      incoming.finished
    ) {

      stopPharmaMusic()


      if (
        gameStateRef.current !==
        'results'
      ) {

        playGameOverSound()

      }


      const delay =

        isNewMove &&

        incoming.last_move &&
        incoming.last_move
          .lines_cleared > 0

          ? CLEAR_MESSAGE_DURATION

          : 450


      resultsTimerRef.current =
        window.setTimeout(

          () => {

            gameStateRef.current =
              'results'


            setGameState(
              'results',
            )


            resultsTimerRef.current =
              null

          },

          delay,

        )

    }

  }

  /* ========================================
   RÉCUPÉRER LES FORFAITS

   Permet de distinguer :
   - une fin normale ;
   - une partie interrompue
     par la déconnexion d'un joueur.
======================================== */

async function fetchRoomDisconnections(
  roomId: string,
) {

  const {
    data,
    error,
  } = await supabase
    .from('game_room_players')
    .select(
      'player_id, disconnected_at',
    )
    .eq(
      'room_id',
      roomId,
    )

  if (
    error
  ) {

    throw error

  }

  const roomPlayers =
    (
      data ?? []
    ) as RoomPlayerPresence[]

  const disconnectedIds =
    roomPlayers

      .filter(
        player =>
          player.disconnected_at !==
          null,
      )

      .map(
        player =>
          player.player_id,
      )

  setDisconnectedPlayerIds(
    disconnectedIds,
  )

  setRoomEndReason(

    disconnectedIds.length > 0

      ? 'disconnection'

      : 'normal',

  )

}

  /* ========================================
     RÉCUPÉRER L'ÉTAT SUPABASE
  ======================================== */

  async function fetchMatch(
    roomId: string,
  ) {

    const {
      data,
      error,
    } = await supabase

      .from(
        'stock_stack_matches',
      )

      .select('*')

      .eq(
        'room_id',
        roomId,
      )

      .maybeSingle()


    if (
      error
    ) {

      throw error

    }


    if (
      data
    ) {

      receiveMatch(
        data as StockMatch,
      )

    }

  }

/* ========================================
   PRÉSENCE MULTIJOUEUR

   Démarre lorsque :
   - la salle est chargée ;
   - le joueur est identifié ;
   - la partie est en cours.

   Arrête les signaux lorsque :
   - le composant est quitté ;
   - la salle change ;
   - la partie se termine.

   Aucun Game Over déclenché ici.
======================================== */

useEffect(() => {

  if (
    !room?.id ||
    !currentPlayerId ||
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
  currentPlayerId,
])

  /* ========================================
     CHARGEMENT INITIAL
  ======================================== */

  useEffect(() => {

    let active =
      true


    async function loadGame() {

      try {

        setErrorMessage(
          '',
        )


        const roomData =
          await getGameRoomByCode(
            code,
          )


        if (
          !roomData
        ) {

          throw new Error(
            'Partie introuvable.',
          )

        }


        if (
          roomData.game !==
          'stock-and-stack'
        ) {

          throw new Error(
            'Cette salle appartient à un autre jeu.',
          )

        }


        const [
          roomPlayers,
          playerId,
        ] = await Promise.all([

          getRoomPlayers(
            roomData.id,
          ),

          getCurrentPlayerId(),

        ])


        if (
          !active
        ) {

          return

        }


        const isMember =
          roomPlayers.some(
            player =>
              player.player_id ===
              playerId,
          )


        if (
          !isMember
        ) {

          throw new Error(
            'Tu ne participes pas à cette partie.',
          )

        }


        roomRef.current =
          roomData


        setRoom(
          roomData,
        )


        playersRef.current =
          roomPlayers


        setPlayers(
          roomPlayers,
        )


        currentPlayerIdRef.current =
          playerId


        setCurrentPlayerId(
          playerId,
        )


        /*
          Salle encore en attente :
          retour au lobby.
        */

        if (
          roomData.status ===
          'waiting'
        ) {

          navigate(
            `/multiplayer/stock-and-stack/lobby/${roomData.code}`,
          )


          return

        }


        if (
          !roomData.started_at
        ) {

          throw new Error(
            'Heure de démarrage introuvable.',
          )

        }


        startedAtRef.current =
          new Date(
            roomData.started_at,
          ).getTime()


        /*
          Plusieurs téléphones peuvent
          initialiser le match :
          le SQL ne crée qu'une
          seule grille commune.
        */

        if (
          roomData.status ===
          'playing'
        ) {

          const {
            data: initialized,
            error: initError,
          } = await supabase.rpc(

            'initialize_stock_stack_match',

            {
              p_room_id:
                roomData.id,
            },

          )


          if (
            initError
          ) {

            throw initError

          }


          if (
            !initialized
          ) {

            throw new Error(
              'Impossible d’initialiser la réserve.',
            )

          }


          if (
            !active
          ) {

            return

          }


          receiveMatch(
            initialized as StockMatch,
          )

        } else {

          await fetchMatch(
            roomData.id,
          )

        }


        if (
          !active
        ) {

          return

        }


        if (

  roomData.status ===
    'finished' ||

  matchRef.current?.finished

) {

  if (
    roomData.status ===
    'finished'
  ) {

    await fetchRoomDisconnections(
      roomData.id,
    )

    if (
      !active
    ) {

      return

    }

  }

  stopPharmaMusic()

  gameStateRef.current =
    'results'

  setGameState(
    'results',
  )

} else {

          const startTime =
            startedAtRef.current


          const alreadyStarted =

            startTime !== null &&

            Date.now() >=

              startTime +
              GO_DISPLAY_DURATION


          gameStateRef.current =

            alreadyStarted
              ? 'playing'
              : 'countdown'


          setGameState(

            alreadyStarted
              ? 'playing'
              : 'countdown',

          )

        }

      } catch (
        error
      ) {

        if (
          !active
        ) {

          return

        }


        console.error(
          'Erreur Stock & Stack multi :',
          error,
        )


        setErrorMessage(

          error &&
          typeof error === 'object' &&
          'message' in error

            ? String(
                error.message,
              )

            : 'Impossible de charger la partie.',

        )

      }

    }


    void loadGame()


    return () => {

      active =
        false

    }

  }, [
    code,
    navigate,
  ])


  /* ========================================
     TEMPS RÉEL
  ======================================== */

  useEffect(() => {

    if (
      !room
    ) {

      return

    }


    let active =
      true


    const channel =
      supabase

        .channel(
          `stock-stack-game-${room.id}`,
        )


        /*
          GRILLE ET TOUR
        */

        .on(

          'postgres_changes',

          {
            event: 'UPDATE',

            schema: 'public',

            table:
              'stock_stack_matches',

            filter:
              `room_id=eq.${room.id}`,
          },

          payload => {

            if (
              !active
            ) {

              return

            }


            receiveMatch(
              payload.new as StockMatch,
            )

          },

        )


        /*
          SCORES DES JOUEURS
        */

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

            try {

              const freshPlayers =
                await getRoomPlayers(
                  room.id,
                )


              if (
                !active
              ) {

                return

              }


              playersRef.current =
                freshPlayers


              setPlayers(
                freshPlayers,
              )

            } catch (
              error
            ) {

              console.error(
                'Erreur actualisation des scores :',
                error,
              )

            }

          },

        )


        /*
          FIN DE SALLE
        */

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

            if (
              !active
            ) {

              return

            }


            const updatedRoom =
              payload.new as GameRoom


            roomRef.current =
              updatedRoom


            setRoom(
              updatedRoom,
            )


            if (
  updatedRoom.status ===
  'finished'
) {

  void (async () => {

    try {

      await Promise.all([

        fetchMatch(
          room.id,
        ),

        fetchRoomDisconnections(
          room.id,
        ),

      ])

    } catch (
      error
    ) {

      console.error(
        'Erreur récupération fin de partie :',
        error,
      )

    } finally {

      stopPharmaMusic()

      cancelDrag()

      cancelAnimationTimers()

      gameStateRef.current =
        'results'

      setGameState(
        'results',
      )

    }

  })()

}

          },

        )


        .subscribe()


    return () => {

      active =
        false


      void supabase
        .removeChannel(
          channel,
        )

    }

  }, [
    room?.id,
  ])


  /* ========================================
     RATTRAPAGE DES ÉVÉNEMENTS

     Si un téléphone perd une
     notification Realtime,
     il recharge l'état SQL.
  ======================================== */

  useEffect(() => {

    if (

      !room ||

      gameState !==
      'playing'

    ) {

      return

    }


    let active =
      true


    async function refresh() {

      if (
        !active
      ) {

        return

      }


      try {

  const freshRoom =
    await getGameRoomByCode(
      code,
    )

  if (
    !active
  ) {

    return

  }

  if (
    freshRoom?.status ===
    'finished'
  ) {

    roomRef.current =
      freshRoom

    setRoom(
      freshRoom,
    )

    await Promise.all([

      fetchMatch(
        room!.id,
      ),

      fetchRoomDisconnections(
        room!.id,
      ),

    ])

    if (
      !active
    ) {

      return

    }

    stopPharmaMusic()

    cancelDrag()

    cancelAnimationTimers()

    gameStateRef.current =
      'results'

    setGameState(
      'results',
    )

    return

  }

  await fetchMatch(
    room!.id,
  )


        const freshPlayers =
          await getRoomPlayers(
            room!.id,
          )


        if (
          !active
        ) {

          return

        }


        playersRef.current =
          freshPlayers


        setPlayers(
          freshPlayers,
        )

      } catch (
        error
      ) {

        console.error(
          'Actualisation Stock & Stack :',
          error,
        )

      }

    }


    const interval =
      window.setInterval(
        refresh,
        3000,
      )


    return () => {

      active =
        false


      window.clearInterval(
        interval,
      )

    }

 }, [
  room?.id,
  gameState,
  code,
])


  /* ========================================
     FIN CHRONOMÉTRÉE — HEURE COMMUNE SUPABASE
     Le SQL valide la date et clôt la salle.
     Chaque appareil peut appeler le RPC : il est idempotent.
  ======================================== */
  useEffect(() => {
    if (!room?.id || !room.started_at || gameState !== 'playing') return

    const startedAt = new Date(room.started_at).getTime()
    if (!Number.isFinite(startedAt)) return

    let active = true
    let requesting = false

    const tick = async () => {
      const seconds = Math.max(0, Math.ceil(
        (startedAt + STOCK_MULTIPLAYER_DURATION_SECONDS * 1000 - Date.now()) / 1000,
      ))
      if (!active) return
      setRemainingSeconds(seconds)
      if (seconds > 0 || requesting) return

      requesting = true
      try {
        const { error } = await supabase.rpc('finish_stock_stack_if_expired', {
          p_room_id: room.id,
        })
        if (error) console.error('Fin chronométrée Stock & Stack :', error)
      } catch (error) {
        console.error('Fin chronométrée Stock & Stack :', error)
      } finally {
        requesting = false
      }
    }

    void tick()
    const interval = window.setInterval(() => { void tick() }, 1000)
    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [room?.id, room?.started_at, gameState])

  /* ========================================
     COMPTE À REBOURS SYNCHRONISÉ
  ======================================== */

  useEffect(() => {

    if (
      gameState !==
      'countdown'
    ) {

      return

    }


    let previousValue:
      number | null = null


    function updateCountdown() {

      const startedAt =
        startedAtRef.current


      if (
        !startedAt
      ) {

        return

      }


      const remaining =
        startedAt -
        Date.now()


      /*
        GO reste affiché 650 ms.
      */

      if (
        remaining <=
        -GO_DISPLAY_DURATION
      ) {

        startPharmaMusic()


        gameStateRef.current =
          'playing'


        setGameState(
          'playing',
        )


        return

      }


      const nextValue =

        remaining <= 0

          ? 0

          : Math.min(

              3,

              Math.max(

                1,

                Math.ceil(
                  remaining / 1000,
                ),

              ),

            )


      if (
        nextValue !==
        previousValue
      ) {

        previousValue =
          nextValue


        setCountdown(
          nextValue,
        )


        playCountdownSound(
          nextValue,
        )

      }

    }


    updateCountdown()


    const interval =
      window.setInterval(
        updateCountdown,
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


  /* ========================================
     POSITION DE LA PIÈCE

     Même calcul que le solo :
     la pièce reste au-dessus
     du doigt.
  ======================================== */

  function calculateDragPosition(

    currentDrag: DragData,

    clientX: number,

    clientY: number,

  ): DragData {

    const grid =
      gridRef.current


    const currentMatch =
      matchRef.current


    if (

      !grid ||

      !currentMatch

    ) {

      return {

        ...currentDrag,

        clientX,
        clientY,

        anchor: null,

        valid: false,

      }

    }


    const rect =
      grid.getBoundingClientRect()


    if (

      rect.width <= 0 ||

      rect.height <= 0

    ) {

      return {

        ...currentDrag,

        clientX,
        clientY,

        anchor: null,

        valid: false,

      }

    }


    const cellSize =

      Math.min(
        rect.width,
        rect.height,
      ) / GRID_SIZE


    const shapeWidth =
      getShapeWidth(
        currentDrag.shape,
      )


    const shapeHeight =
      getShapeHeight(
        currentDrag.shape,
      )


    const floatingLeft =

      clientX -

      (
        shapeWidth *
        cellSize
      ) / 2


    const floatingTop =

      clientY -

      DRAG_LIFT -

      (
        shapeHeight *
        cellSize
      ) / 2


    const anchorX =

      Math.round(

        (
          floatingLeft -
          rect.left
        ) / cellSize,

      )


    const anchorY =

      Math.round(

        (
          floatingTop -
          rect.top
        ) / cellSize,

      )


    const nearGrid =

      floatingLeft +
        shapeWidth *
        cellSize >
        rect.left &&

      floatingLeft <
        rect.right &&

      floatingTop +
        shapeHeight *
        cellSize >
        rect.top &&

      floatingTop <
        rect.bottom


    const anchor =

      nearGrid

        ? {

            x: anchorX,

            y: anchorY,

          }

        : null


    const valid =

      anchor !== null &&

      canPlaceShape(

        currentMatch.board,

        currentDrag.shape,

        anchorX,

        anchorY,

      )


    return {

      ...currentDrag,

      clientX,
      clientY,

      anchor,

      valid,

      cellSize,

    }

  }


  /* ========================================
     ANNULER UN GLISSEMENT
  ======================================== */

  function cancelDrag() {

    dragRef.current =
      null


    setDrag(
      null,
    )

  }


  /* ========================================
     PRENDRE UNE PIÈCE
  ======================================== */

  function handlePiecePointerDown(

    event:
      ReactPointerEvent<HTMLDivElement>,

    pieceIndex: number,

  ) {

    const currentMatch =
      matchRef.current


    const myPlayer =
      playersRef.current.find(

        player =>
          player.player_id ===
          currentPlayerIdRef.current,

      )


    if (

      gameStateRef.current !==
        'playing' ||

      !currentMatch ||

      currentMatch.finished ||

      !myPlayer ||

      myPlayer.player_order !==
        currentMatch.turn_order ||

      submittingRef.current ||

      dragRef.current

    ) {

      return

    }


    const shapeId =
      currentMatch.offers[
        pieceIndex
      ]


    const shape =
      SHAPES_BY_ID.get(
        shapeId,
      )


    if (
      !shape
    ) {

      return

    }


    event.preventDefault()


    unlockAudio()


    const initialDrag:
      DragData = {

        pointerId:
          event.pointerId,

        pieceIndex,

        shape,

        clientX:
          event.clientX,

        clientY:
          event.clientY,

        anchor: null,

        valid: false,

        cellSize: 0,

      }


    const positioned =
      calculateDragPosition(

        initialDrag,

        event.clientX,

        event.clientY,

      )


    dragRef.current =
      positioned


    setDrag(
      positioned,
    )

  }


  /* ========================================
     PLACEMENT SQL

     Le serveur vérifie le joueur,
     la révision, la forme,
     les cases et les points.
  ======================================== */

  async function submitPlacement(

    pieceIndex: number,

    anchorX: number,

    anchorY: number,

  ) {

    const currentMatch =
      matchRef.current


    const currentRoom =
      roomRef.current


    if (

      !currentMatch ||

      !currentRoom ||

      submittingRef.current

    ) {

      return

    }


    submittingRef.current =
      true


    setIsSubmitting(
      true,
    )


    setErrorMessage(
      '',
    )


    try {

      const {
        data,
        error,
      } = await supabase.rpc(

        'stock_stack_place_piece',

        {

          p_room_id:
            currentRoom.id,

          p_revision:
            currentMatch.revision,

          p_piece_index:
            pieceIndex,

          p_anchor_x:
            anchorX,

          p_anchor_y:
            anchorY,

        },

      )


      if (
        error
      ) {

        throw error

      }


      if (
        !data
      ) {

        throw new Error(
          'Le placement n’a pas été enregistré.',
        )

      }


      receiveMatch(
        data as StockMatch,
      )


      const freshPlayers =
        await getRoomPlayers(
          currentRoom.id,
        )


      playersRef.current =
        freshPlayers


      setPlayers(
        freshPlayers,
      )

    } catch (
      error
    ) {

      console.error(
        'Erreur placement Stock & Stack :',
        error,
      )


      setErrorMessage(

        error &&
        typeof error === 'object' &&
        'message' in error

          ? String(
              error.message,
            )

          : 'Impossible de placer cette forme.',

      )


      /*
        Si un autre joueur a placé
        son carton avant nous,
        récupérer la vraie grille.
      */

      try {

        await fetchMatch(
          currentRoom.id,
        )

      } catch (
        refreshError
      ) {

        console.error(
          'Erreur récupération de la grille :',
          refreshError,
        )

      }

    } finally {

      submittingRef.current =
        false


      setIsSubmitting(
        false,
      )

    }

  }


  /* ========================================
     DÉPLACER ET LÂCHER
  ======================================== */

  useEffect(() => {

    if (
      gameState !==
      'playing'
    ) {

      return

    }


    function handlePointerMove(
      event: PointerEvent,
    ) {

      const currentDrag =
        dragRef.current


      if (

        !currentDrag ||

        event.pointerId !==
          currentDrag.pointerId

      ) {

        return

      }


      event.preventDefault()


      const nextDrag =
        calculateDragPosition(

          currentDrag,

          event.clientX,

          event.clientY,

        )


      dragRef.current =
        nextDrag


      setDrag(
        nextDrag,
      )

    }


    function handlePointerUp(
      event: PointerEvent,
    ) {

      const currentDrag =
        dragRef.current


      if (

        !currentDrag ||

        event.pointerId !==
          currentDrag.pointerId

      ) {

        return

      }


      event.preventDefault()


      const finalDrag =
        calculateDragPosition(

          currentDrag,

          event.clientX,

          event.clientY,

        )


      cancelDrag()


      if (

        !finalDrag.valid ||

        !finalDrag.anchor

      ) {

        return

      }


      void submitPlacement(

        finalDrag.pieceIndex,

        finalDrag.anchor.x,

        finalDrag.anchor.y,

      )

    }


    function handlePointerCancel(
      event: PointerEvent,
    ) {

      if (

        dragRef.current?.pointerId ===
        event.pointerId

      ) {

        cancelDrag()

      }

    }


    window.addEventListener(

      'pointermove',

      handlePointerMove,

      {
        passive: false,
      },

    )


    window.addEventListener(

      'pointerup',

      handlePointerUp,

      {
        passive: false,
      },

    )


    window.addEventListener(

      'pointercancel',

      handlePointerCancel,

    )


    return () => {

      window.removeEventListener(
        'pointermove',
        handlePointerMove,
      )


      window.removeEventListener(
        'pointerup',
        handlePointerUp,
      )


      window.removeEventListener(
        'pointercancel',
        handlePointerCancel,
      )

    }

  }, [
    gameState,
  ])


  /* ========================================
     NETTOYAGE
  ======================================== */

  useEffect(() => {

    return () => {

      cancelAnimationTimers()


      stopPharmaMusic()


      if (
        audioContextRef.current
      ) {

        void audioContextRef.current
          .close()

      }

    }

  }, [])


  /* ========================================
     PRÉVISUALISATION
  ======================================== */

  const previewCells =
    new Set<string>()


  if (

    isMyTurn &&

    drag?.anchor &&

    drag.valid

  ) {

    for (
      const cell of
      drag.shape.cells
    ) {

      const x =
        drag.anchor.x +
        cell.x


      const y =
        drag.anchor.y +
        cell.y


      previewCells.add(
        `${x}-${y}`,
      )

    }

  }


  /* ========================================
     CASES EN COURS D'EFFACEMENT
  ======================================== */

  const clearingCells =
    new Set<string>(

      isClearing

        ? clearAnimation?.cells ?? []

        : [],

    )


  /* ========================================
     LES 64 CASES
  ======================================== */

  const boardCells =
    Array.from(

      {
        length:
          GRID_SIZE *
          GRID_SIZE,
      },

      (_, index) => {

        const x =
          index % GRID_SIZE


        const y =
          Math.floor(
            index / GRID_SIZE,
          )


        return {
          x,
          y,
        }

      },

    )

/* ========================================
   MOTIF DE FIN DE PARTIE
======================================== */

const isDisconnectionEnd =
  roomEndReason ===
  'disconnection'

const isCurrentPlayerDisconnected =

  isDisconnectionEnd &&

  currentPlayerId !== null &&

  disconnectedPlayerIds.includes(
    currentPlayerId,
  )


  /* ========================================
     CLASSEMENT FINAL
  ======================================== */

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
     ERREUR
  ======================================== */

  if (
    errorMessage &&
    gameState ===
      'loading'
  ) {

    return (

      <section className="ecg-multi-error-screen">

        <strong>
          {tr("Erreur")}</strong>


        <p>
          {tr(errorMessage)}
        </p>


        <button
          type="button"

          onClick={() =>
            navigate(
              '/multiplayer/stock-and-stack',
            )
          }
        >

          {tr("Retour")}</button>

      </section>

    )

  }


  /* ========================================
     CHARGEMENT
  ======================================== */

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

      <section className="rankings-page stock-multi-final-ranking">


        <div className="rankings-heading">

 {!isDisconnectionEnd && (

  <p className="rankings-eyebrow">
    {tr("PARTIE TERMINÉE")}</p>

)}


  <h1>

    {isCurrentPlayerDisconnected

      ? (
        <>
          {tr("Game ")}<span>{tr("Over")}</span>
        </>
      )

      : isDisconnectionEnd

        ? (
          <>
            {tr("Partie ")}<span>{tr("terminée")}</span>
          </>
        )

        : (
          <>
            {tr("Classement de la")}{' '}
            <span>{tr("partie")}</span>
          </>
        )}

  </h1>


  <p className="rankings-subtitle">

    {isCurrentPlayerDisconnected

      ? tr('Vous avez été déclaré forfait après une déconnexion de plus de 30 secondes.')

      : isDisconnectionEnd

        ? tr('Un joueur a quitté la partie. La partie a été interrompue.')

        : tr('Voici les résultats de votre partie Stock & Stack.')}

  </p>

</div>


        <div className="rankings-games">

          <article className="rankings-game-card stock-multi-final-card">


            {/* LOGO */}

            <div className="rankings-card-top">

              <div className="rankings-specialty-icon">

                <svg
                  viewBox="0 0 31.711 31.71"
                  aria-hidden="true"
                >

                  <path

                    d="M31.076,12.891c0.642-0.413,0.828-1.268,0.415-1.911l-4.714-7.33c-0.198-0.309-0.511-0.526-0.869-0.604
                    s-0.733-0.01-1.042,0.188l-3.29,2.117V1.45c0-0.764-0.619-1.382-1.383-1.382H11.52c-0.764,0-1.382,0.619-1.382,1.382v3.902
                    L6.845,3.234c-0.642-0.413-1.497-0.227-1.91,0.415L0.219,10.98c-0.198,0.308-0.266,0.683-0.187,1.042
                    c0.077,0.358,0.295,0.671,0.603,0.869l4.609,2.964l-4.608,2.962c-0.309,0.198-0.526,0.511-0.604,0.87
                    c-0.078,0.357-0.011,0.732,0.187,1.042l4.716,7.331c0.198,0.309,0.511,0.525,0.869,0.604c0.358,0.078,0.733,0.01,1.041-0.188
                    l3.293-2.117v3.9c0,0.765,0.618,1.384,1.382,1.384h8.673c0.764,0,1.383-0.619,1.383-1.384v-3.9l3.29,2.117
                    c0.309,0.197,0.684,0.266,1.042,0.188s0.671-0.295,0.869-0.604l4.714-7.332c0.413-0.643,0.227-1.497-0.415-1.911l-4.608-2.962
                    L31.076,12.891z M13.834,25.417c-0.483,0-0.941-0.246-1.207-0.66c-0.055-0.084-0.101-0.176-0.139-0.275
                    c-0.275-0.743,0.104-1.568,0.846-1.846c0.394-0.145,0.756-0.287,1.093-0.424v-5.367c-1.855-1.088-3.468-2.197-3.827-3.817
                    c-0.565-2.529,0.263-3.998,1.056-4.783c0.425-0.422,0.93-0.737,1.476-0.969c0.415-0.175,0.85-0.304,1.296-0.396V5.808
                    c0-0.792,0.637-1.435,1.431-1.435c0.793,0,1.428,0.642,1.428,1.435v0.906c0.749,0.043,1.396,0.14,1.831,0.219
                    c0.263,0.048,0.447,0.088,0.533,0.108c0.771,0.18,1.25,0.95,1.072,1.721c-0.148,0.636-0.694,1.074-1.312,1.111
                    c-0.5-0.102-1.283-0.238-2.124-0.293c-1.006-0.068-2.093-0.019-2.858,0.343c0,0-0.601,0.318-0.793,0.508
                    c-0.404,0.401-0.653,1.087-0.233,1.971c0.121,0.255,0.478,0.649,1.026,1.039v-2.968l2.858,0.574v9.773
                    c1.149-0.712,1.233-1.104,1.235-1.109c-0.017-0.092-1.057-4.424-1.057-4.424c2.128,1.247,4.086,2.6,3.915,4.663
                    c-0.114,1.402-1.19,2.612-3.479,3.825l-0.615,0.271l-2.858,1.258v-0.012c-0.03,0.012-0.062,0.023-0.093,0.035
                    C14.167,25.388,14.001,25.417,13.834,25.417z M17.285,25.902c0,0.792-0.635,1.436-1.428,1.436c-0.794,0-1.431-0.643-1.431-1.436
                    v-0.598l2.858-0.557L17.285,25.902L17.285,25.902z"

                  />

                </svg>

              </div>

            </div>


            <div className="rankings-card-content">

              <p className="rankings-specialty">
                {tr("PHARMACIE • MULTIJOUEUR")}</p>


              <h2>
                Stock &amp; Stack
              </h2>


              <p>

  {isDisconnectionEnd

    ? tr('Scores enregistrés au moment de l’interruption.')

    : tr('Classement final de cette partie.')}

</p>

            </div>


            {/* JOUEURS */}

            {isDisconnectionEnd && (

  <p className="stock-multi-interrupted-note">

    {tr("La partie a été interrompue : les scores ci-dessous ne constituent pas un classement final.")}</p>

)}

            <div className="stock-multi-match-ranking">

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

                        AVATARS.length - 1,

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


                      {/* POSITION */}

                      <div className="ecg-ranking-position">

                        {rank === 1
                          ? '🥇'
                          : rank === 2
                            ? '🥈'
                            : rank === 3
                              ? '🥉'
                              : rank}

                      </div>


                      {/* AVATAR */}

                      <img

                        className="ecg-ranking-avatar"

                        src={
                          AVATARS[
                            avatarIndex
                          ]
                        }

                        alt=""

                      />


                      {/* JOUEUR */}

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


                      {/* SCORE */}

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


            <div className="rankings-card-bottom">

              <ReturnToGamesButton roomId={room!.id} />

            </div>

          </article>

        </div>

      </section>

    )

  }


  /* ========================================
     COUNTDOWN + JEU
  ======================================== */

  return (

    <section

      className={
        `stock-game-page stock-state-${gameState} stock-multi-game`
      }

      onPointerDown={
        unlockAudio
      }

    >


      {/* ========================================
          COMPTE À REBOURS
      ======================================== */}

      {gameState ===
        'countdown' && (

        <div className="stock-countdown">

          <span className="stock-countdown-label">
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


      {/* ========================================
          PARTIE
      ======================================== */}

      {gameState ===
        'playing' &&
        match && (

        <div className="stock-playing-screen">


          {/* ========================================
              HUD DES JOUEURS
          ======================================== */}

          <div
            role="timer"
            aria-label="Temps restant"
            style={{ position: 'relative', zIndex: 20, margin: '0.5rem auto 0.9rem', width: 'fit-content', padding: '0.55rem 1.2rem', border: '1px solid rgba(143,235,255,.4)', borderRadius: '999px', background: 'rgba(7,60,75,.9)', color: '#fff', boxShadow: '0 8px 28px rgba(0,0,0,.25)', textAlign: 'center', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}
          >
            ⏱ {Math.floor(remainingSeconds / 60).toString().padStart(2, '0')}:
            {(remainingSeconds % 60).toString().padStart(2, '0')}
          </div>

          <div className="stock-multi-hud">

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
                      `stock-multi-hud-player ${
                        player.player_id ===
                        currentPlayerId
                          ? 'is-me'
                          : ''
                      } ${
                        player.player_order ===
                        match.turn_order
                          ? 'is-active'
                          : ''
                      }`
                    }

                  >


                    <span
                      className={
                        `stock-multi-player-dot stock-multi-color-${player.color}`
                      }
                    />


                    <strong>
                      {player.pseudo}
                    </strong>


                    <span>

                      {player.score.toLocaleString(
                        getLanguage(),
                      )}

                    </span>

                  </div>

                ),
              )}

          </div>


          {/* ========================================
              TITRE / TOUR
          ======================================== */}

          <div className="stock-multi-turn-banner">

            <span>
              STOCK &amp; STACK
            </span>


            <strong>

              {isMyTurn

                ? 'À TOI DE JOUER !'

                : `AU TOUR DE ${
                    activePlayer?.pseudo ??
                    'UN JOUEUR'
                  }`}

            </strong>

          </div>


          {/* ========================================
              RÉSERVE
          ======================================== */}

          <div className="stock-board-wrapper">

            <div className="stock-board">


              {/* FOND */}

              <img

                className="stock-board-background"

                src={
                  fondPharma
                }

                alt=""

                draggable={false}

              />


              {/* GRILLE */}

              <div

                ref={
                  gridRef
                }

                className="stock-grid"

              >

                {boardCells.map(
                  cell => {

                    const cellKey =
                      `${cell.x}-${cell.y}`


                    const owner =
                      visibleBoard[
                        cell.y
                      ]?.[
                        cell.x
                      ] ?? 0


                    const occupied =
                      owner > 0


                    const preview =
                      previewCells.has(
                        cellKey,
                      )


                    const clearing =
                      clearingCells.has(
                        cellKey,
                      )


                    return (

                      <div

                        key={
                          cellKey
                        }

                        className={
                          `stock-grid-cell ${
                            occupied
                              ? 'is-occupied'
                              : ''
                          } ${
                            preview
                              ? 'is-preview'
                              : ''
                          } ${
                            clearing
                              ? 'is-clearing'
                              : ''
                          }`
                        }

                      >


                        {/* CARTON POSÉ */}

                        {occupied && (

                          <div

                            className={
                              `stock-piece-box stock-board-box stock-multi-color-${getPlayerColor(
                                owner,
                              )}`
                            }

                          >

                            <img

                              src={
                                pieceImage
                              }

                              alt=""

                              draggable={false}

                            />

                          </div>

                        )}


                        {/* PRÉVISUALISATION */}

                        {preview && (

                          <div

                            className={
                              `stock-piece-box stock-board-box stock-preview-box stock-multi-color-${getPlayerColor(
                                currentPlayer?.player_order ?? 1,
                              )}`
                            }

                          >

                            <img

                              src={
                                pieceImage
                              }

                              alt=""

                              draggable={false}

                            />

                          </div>

                        )}


                        {/* PAILLETTES */}

                        {clearing && (

                          <div

                            className="stock-sparkles"

                            aria-hidden="true"

                          >

                            {Array.from(

                              {
                                length: 6,
                              },

                              (_, index) => (

                                <span

                                  key={
                                    index
                                  }

                                  style={
                                    {
                                      '--spark-index':
                                        index,
                                    } as CSSProperties
                                  }

                                />

                              ),

                            )}

                          </div>

                        )}

                      </div>

                    )

                  },
                )}

              </div>


              {/* ========================================
                  MESSAGE DE COMBO
              ======================================== */}

              {clearAnimation && (

                <div

                  className={
                    `stock-clear-message ${
                      clearAnimation.count >= 3
                        ? 'is-big-combo'
                        : ''
                    }`
                  }

                  aria-live="polite"

                >

                  <span>

                    +{
                      clearAnimation.count *
                      POINTS_PER_LINE
                    } {tr(" POINTS")}</span>


                  <strong>

                    {tr(clearAnimation.message)}

                  </strong>

                </div>

              )}

            </div>

          </div>


          {/* ========================================
              TROIS FORMES
          ======================================== */}

          <div className="stock-pieces-area">

            <p className="stock-pieces-label">

              {isMyTurn

                ? tr('CHOISIS UN LOT DE CARTONS')

                : tr('TROIS LOTS POUR CE TOUR')}

            </p>


            <div

              className={
                `stock-pieces-tray ${
                  !isMyTurn
                    ? 'stock-multi-tray-waiting'
                    : ''
                }`
              }

            >

              {match.offers.map(
                (
                  shapeId,
                  index,
                ) => {

                  const shape =
                    SHAPES_BY_ID.get(
                      shapeId,
                    )


                  const isDragging =
                    drag?.pieceIndex ===
                    index


                  return (

                    <div

                      key={
                        `${match.revision}-${index}`
                      }

                      className={
                        `stock-piece-slot ${
                          isDragging
                            ? 'is-dragging'
                            : ''
                        } ${
                          !isMyTurn ||
                          isSubmitting ||
                          isClearing
                            ? 'stock-multi-slot-disabled'
                            : ''
                        }`
                      }

                      onPointerDown={
                        event => {

                          if (
                            !shape ||
                            !isMyTurn ||
                            isSubmitting ||
                            isClearing
                          ) {

                            return

                          }


                          handlePiecePointerDown(

                            event,

                            index,

                          )

                        }
                      }

                    >

                      {shape && (

                        <PieceShape

                          shape={
                            shape
                          }

                          cellSize={
                            23
                          }

                          className="stock-tray-shape"

                          playerOrder={
                            match.turn_order
                          }

                        />

                      )}

                    </div>

                  )

                },
              )}

            </div>

          </div>


          {/* ========================================
              ENREGISTREMENT
          ======================================== */}

          {isSubmitting && (

            <div className="stock-multi-saving">

              {tr("Placement en cours...")}</div>

          )}


          {/* ========================================
              ERREUR DE PLACEMENT
          ======================================== */}

          {errorMessage && (

            <p

              className="stock-multi-error"

              role="alert"

            >

              {tr(errorMessage)}

            </p>

          )}


          {/* ========================================
              PIÈCE FLOTTANTE
          ======================================== */}

          {drag && (

            <div

              className={
                `stock-drag-ghost ${
                  drag.valid
                    ? 'is-valid'
                    : 'is-invalid'
                }`
              }

              style={{

                left:
                  drag.clientX,

                top:
                  drag.clientY -
                  DRAG_LIFT,

              }}

            >

              <PieceShape

                shape={
                  drag.shape
                }

                cellSize={

                  drag.cellSize > 0

                    ? drag.cellSize

                    : 40

                }

                className="stock-floating-shape"

                playerOrder={
                  currentPlayer?.player_order
                }

              />

            </div>

          )}

        </div>

      )}

    </section>

  )

}


export default StockAndStackMultiplayerGame
