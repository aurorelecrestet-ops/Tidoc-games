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
import TournamentSoloPlayersHud from '../components/TournamentSoloPlayersHud'

import pieceImage from '../assets/pharma/piece.png'
import fondPharma from '../assets/pharma/fondpharma.png'

import './StockAndStack.css'

import pharmaMusic from '../assets/audio/pharma.mp3'


import TournamentBoard from '../components/TournamentBoard'
import {
  getSoloTournament,
  getSoloTournamentReturnPath,
  recordSoloRound,
  type SoloTournamentState,
} from '../lib/tournamentSolo'

/* ========================================
   TYPES
======================================== */

type StockAndStackProps = {
  onFullscreenChange?: (
    fullscreen: boolean
  ) => void
}

type GameState =
  | 'ready'
  | 'countdown'
  | 'playing'
  | 'gameover'

type Cell = {
  x: number
  y: number
}

type Shape = {
  id: string
  cells: Cell[]
}

type OfferedPiece = {
  id: number
  shape: Shape
}

type Board = boolean[][]

type GameData = {
  board: Board
  pieces: (OfferedPiece | null)[]
  score: number
  linesCleared: number
}

type DragData = {
  pointerId: number
  pieceIndex: number
  piece: OfferedPiece
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
}

type PlacementResult = {
  visibleGame: GameData
  finalGame: GameData
  clearAnimation: ClearAnimation | null
}


/* ========================================
   CONSTANTES
======================================== */

const GRID_SIZE = 8

const BEST_SCORE_KEY =
  'tidoc-stock-and-stack-best-score'

const POINTS_PER_BOX = 10
const POINTS_PER_LINE = 100

/* La pièce reste au-dessus du doigt. */
const DRAG_LIFT = 85

/* Disparition des cartons. */
const STOCK_TOURNAMENT_DURATION_SECONDS = 180

const CLEAR_ANIMATION_DURATION = 750

/* Durée totale du commentaire. */
const CLEAR_MESSAGE_DURATION = 1250


/* ========================================
   TOUTES LES FORMES
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


  /* FORMES EN L */

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


  /* AUTRE FORME À TROIS CARTONS */

  {
    id: 'corner-3',
    cells: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
    ],
  },

/* ========================================
   NOUVELLES FORMES — DIAGONALES
======================================== */

/* 1
   . ■
   ■ .
*/

{
  id: 'diagonal-2-left',
  cells: [
    { x: 1, y: 0 },
    { x: 0, y: 1 },
  ],
},

/* 2
   ■ .
   . ■
*/

{
  id: 'diagonal-2-right',
  cells: [
    { x: 0, y: 0 },
    { x: 1, y: 1 },
  ],
},

/* 3
   . . ■
   . ■ .
   ■ . .
*/

{
  id: 'diagonal-3-left',
  cells: [
    { x: 2, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 2 },
  ],
},

/* 4
   ■ . .
   . ■ .
   . . ■
*/

{
  id: 'diagonal-3-right',
  cells: [
    { x: 0, y: 0 },
    { x: 1, y: 1 },
    { x: 2, y: 2 },
  ],
},


/* ========================================
   NOUVELLES FORMES — GRANDS L
======================================== */

/* 5
   ■ . .
   ■ . .
   ■ ■ ■
*/

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

/* 6
   ■ ■ ■
   ■ . .
   ■ . .
*/

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

/* 7
   ■ ■ ■
   . . ■
   . . ■
*/

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

/* 8
   . . ■
   . . ■
   ■ ■ ■
*/

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


/* ========================================
   OUTILS DU JEU
======================================== */

function createEmptyBoard(): Board {

  return Array.from(
    { length: GRID_SIZE },
    () => Array(GRID_SIZE).fill(false),
  )

}


function getShapeWidth(
  shape: Shape,
) {

  return (
    Math.max(
      ...shape.cells.map(cell => cell.x),
    ) + 1
  )

}


function getShapeHeight(
  shape: Shape,
) {

  return (
    Math.max(
      ...shape.cells.map(cell => cell.y),
    ) + 1
  )

}


function createRandomPieces():
(OfferedPiece | null)[] {

  return Array.from(
    { length: 3 },
    () => {

      const randomIndex =
        Math.floor(
          Math.random() * SHAPES.length,
        )

      return {

        id: Math.random(),

        shape: SHAPES[randomIndex],

      }

    },
  )

}


function createNewGame(): GameData {

  return {

    board: createEmptyBoard(),

    pieces: createRandomPieces(),

    score: 0,

    linesCleared: 0,

  }

}


/* ========================================
   VÉRIFIER UN EMPLACEMENT
======================================== */

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

      return !board[y][x]

    },
  )

}


/* ========================================
   VÉRIFIER S'IL RESTE UN COUP
======================================== */

function hasAvailableMove(
  board: Board,
  pieces: (OfferedPiece | null)[],
) {

  for (const piece of pieces) {

    if (!piece) {
      continue
    }

    for (
      let y = 0;
      y < GRID_SIZE;
      y++
    ) {

      for (
        let x = 0;
        x < GRID_SIZE;
        x++
      ) {

        if (
          canPlaceShape(
            board,
            piece.shape,
            x,
            y,
          )
        ) {

          return true

        }

      }

    }

  }

  return false

}


/* ========================================
   POSER UNE PIÈCE

   Le plateau est préparé
   AVANT et APRÈS l'animation.
======================================== */

function placeShape(
  game: GameData,
  pieceIndex: number,
  anchorX: number,
  anchorY: number,
): PlacementResult | null {

  const piece =
    game.pieces[pieceIndex]

  if (!piece) {
    return null
  }

  if (
    !canPlaceShape(
      game.board,
      piece.shape,
      anchorX,
      anchorY,
    )
  ) {

    return null

  }


  /* PLACER LES CARTONS */

  const placedBoard =
    game.board.map(row => [...row])

  for (const cell of piece.shape.cells) {

    const x =
      anchorX + cell.x

    const y =
      anchorY + cell.y

    placedBoard[y][x] = true

  }


  /* LIGNES COMPLÈTES */

  const completedRows: number[] = []

  for (
    let y = 0;
    y < GRID_SIZE;
    y++
  ) {

    if (placedBoard[y].every(Boolean)) {

      completedRows.push(y)

    }

  }


  /* COLONNES COMPLÈTES */

  const completedColumns: number[] = []

  for (
    let x = 0;
    x < GRID_SIZE;
    x++
  ) {

    if (
      placedBoard.every(row => row[x])
    ) {

      completedColumns.push(x)

    }

  }


  /* CASES À ANIMER */

  const clearingCells =
    new Set<string>()

  for (const y of completedRows) {

    for (
      let x = 0;
      x < GRID_SIZE;
      x++
    ) {

      clearingCells.add(`${x}-${y}`)

    }

  }

  for (const x of completedColumns) {

    for (
      let y = 0;
      y < GRID_SIZE;
      y++
    ) {

      clearingCells.add(`${x}-${y}`)

    }

  }


  /* PLATEAU APRÈS EFFACEMENT */

  const finalBoard =
    placedBoard.map(row => [...row])

  for (const key of clearingCells) {

    const [x, y] =
      key.split('-').map(Number)

    finalBoard[y][x] = false

  }


  /* SCORE */

  const clearedLineCount =
    completedRows.length +
    completedColumns.length

  const placementPoints =
    piece.shape.cells.length *
    POINTS_PER_BOX

  const linePoints =
    clearedLineCount *
    POINTS_PER_LINE

  const comboBonus =
    clearedLineCount > 1
      ? (clearedLineCount - 1) * 50
      : 0

  const nextScore =
    game.score +
    placementPoints +
    linePoints +
    comboBonus

  const nextLinesCleared =
    game.linesCleared +
    clearedLineCount


  /* RETIRER LA PIÈCE UTILISÉE */

  let nextPieces =
    [...game.pieces]

  nextPieces[pieceIndex] = null

  if (
    nextPieces.every(
      piece => piece === null,
    )
  ) {

    nextPieces =
      createRandomPieces()

  }


  /* COMMENTAIRE */

  const message =
    clearedLineCount >= 4
      ? 'STOCK MASTER !'
      : clearedLineCount === 3
        ? 'TRIPLE COMBO !'
        : clearedLineCount === 2
          ? 'DOUBLE RANGEMENT !'
          : 'RÉSERVE OPTIMISÉE !'


  return {

    visibleGame: {

      board: placedBoard,

      pieces: nextPieces,

      score: nextScore,

      linesCleared: nextLinesCleared,

    },

    finalGame: {

      board: finalBoard,

      pieces: nextPieces,

      score: nextScore,

      linesCleared: nextLinesCleared,

    },

    clearAnimation:
      clearedLineCount > 0
        ? {

            cells: [...clearingCells],

            count: clearedLineCount,

            message,

          }
        : null,

  }

}


/* ========================================
   AFFICHER UNE FORME
======================================== */

function PieceShape({
  shape,
  cellSize,
  className = '',
}: {

  shape: Shape
  cellSize: number
  className?: string

}) {

  const width =
    getShapeWidth(shape)

  const height =
    getShapeHeight(shape)

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
        (cell, index) => (

          <div
            key={
              `${cell.x}-${cell.y}-${index}`
            }

            className="stock-piece-box"

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
   COMPOSANT PRINCIPAL
======================================== */

function StockAndStack({
  onFullscreenChange,
}: StockAndStackProps) {
  const { setMusicVolume, getEffectsOutput } = useGameAudio()


  const navigate =
    useNavigate()

    const [countdown, setCountdown] = useState(3)


  /* ========================================
     ÉTATS
  ======================================== */
const [
  showRecord,
  setShowRecord,
] = useState(false)

const [
  tournamentState,
  setTournamentState,
] = useState<SoloTournamentState | null>(null)

  const [
    gameState,
    setGameState,
  ] = useState<GameState>(
    'ready',
  )

  const [paused, setPaused] = useState(false)
  const [remainingSeconds, setRemainingSeconds] = useState(STOCK_TOURNAMENT_DURATION_SECONDS)
  const remainingSecondsRef = useRef(STOCK_TOURNAMENT_DURATION_SECONDS)

  const [
    game,
    setGame,
  ] = useState<GameData>(
    createNewGame,
  )

  const [
    bestScore,
    setBestScore,
  ] = useState(() => {

    const saved =
      localStorage.getItem(
        BEST_SCORE_KEY,
      )

    const value =
      Number(saved)

    return Number.isFinite(value)
      ? value
      : 0

  })

  const [
    drag,
    setDrag,
  ] = useState<DragData | null>(
    null,
  )

  /*
    Contenu du commentaire et
    coordonnées des cases animées.
  */

  const [
    clearAnimation,
    setClearAnimation,
  ] = useState<ClearAnimation | null>(
    null,
  )

  /*
    true pendant les 750 ms
    du flash et des paillettes.

    false ensuite, même si le
    commentaire reste visible.
  */

  const [
    isClearing,
    setIsClearing,
  ] = useState(false)


  /* ========================================
     REFS
  ======================================== */
const recordToBeatRef = useRef(bestScore)

const recordCelebratedRef = useRef(false)

const recordTimerRef = useRef<number | null>(null)

  const gridRef =
    useRef<HTMLDivElement | null>(
      null,
    )

  const gameRef =
    useRef<GameData>(
      game,
    )

  const dragRef =
    useRef<DragData | null>(
      null,
    )

  const gameStateRef =
    useRef<GameState>(
      gameState,
    )

  /*
    Empêche un nouveau placement
    pendant l'effacement.
  */

  const clearAnimationRef =
    useRef<ClearAnimation | null>(
      null,
    )

  /*
    Minuteur des cartons.
  */

  const clearTimerRef =
    useRef<number | null>(
      null,
    )

  /*
    Minuteur du commentaire.
  */

  const clearMessageTimerRef =
    useRef<number | null>(
      null,
    )

    const audioContextRef =
  useRef<AudioContext | null>(null)

const pharmaMusicRef =
  useRef<HTMLAudioElement | null>(null)

  /* ========================================
     SYNCHRONISATION
  ======================================== */

  useEffect(() => {

    gameRef.current = game

  }, [game])


  useEffect(() => {

    gameStateRef.current =
      gameState

  }, [gameState])


  /* ========================================
     PLEIN ÉCRAN
  ======================================== */

  useEffect(() => {

    onFullscreenChange?.(
      gameState === 'countdown' ||
gameState === 'playing'
    )

    return () => {

      onFullscreenChange?.(false)

    }

  }, [
    gameState,
    onFullscreenChange,
  ])


  /* ========================================
     MEILLEUR SCORE
  ======================================== */

  useEffect(() => {

    if (
      game.score <= bestScore
    ) {

      return

    }

    setBestScore(game.score)

    localStorage.setItem(
      BEST_SCORE_KEY,
      String(game.score),
    )

  }, [
    game.score,
    bestScore,
  ])


  /* ========================================
   NETTOYER LES MINUTEURS
======================================== */

useEffect(() => {

  return () => {

    if (
      clearTimerRef.current !== null
    ) {

      window.clearTimeout(
        clearTimerRef.current,
      )

      clearTimerRef.current = null

    }

    if (
      clearMessageTimerRef.current !== null
    ) {

      window.clearTimeout(
        clearMessageTimerRef.current,
      )

      clearMessageTimerRef.current = null

    }

    /* NOUVEAU RECORD */

    if (
      recordTimerRef.current !== null
    ) {

      window.clearTimeout(
        recordTimerRef.current,
      )

      recordTimerRef.current = null

    }

  }

}, [])


  /* ========================================
     ANNULER LES ANCIENS MINUTEURS
  ======================================== */

  function cancelAnimationTimers() {

    if (
      clearTimerRef.current !== null
    ) {

      window.clearTimeout(
        clearTimerRef.current,
      )

      clearTimerRef.current = null

    }

    if (
      clearMessageTimerRef.current !== null
    ) {

      window.clearTimeout(
        clearMessageTimerRef.current,
      )

      clearMessageTimerRef.current = null

    }

  }

  /* ========================================
   AUDIO STOCK & STACK
======================================== */

function getAudioContext() {

  if (!audioContextRef.current) {
    audioContextRef.current =
      new AudioContext()
  }

  const context = audioContextRef.current

  if (context.state === 'suspended') {
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

  const context = audioContextRef.current

  if (!context) return

  const oscillator = context.createOscillator()
  const gain = context.createGain()

  const start = context.currentTime + delay

  oscillator.type = type
  oscillator.frequency.value = frequency

  gain.gain.setValueAtTime(0.0001, start)

  gain.gain.exponentialRampToValueAtTime(
    volume,
    start + 0.01,
  )

  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    start + duration,
  )

  oscillator.connect(gain)
  gain.connect(getEffectsOutput(context))

  oscillator.start(start)
  oscillator.stop(start + duration + 0.01)
}

function playCountdownSound(value: number) {

  const frequency =
    value === 0 ? 980 :
    value === 1 ? 720 :
    value === 2 ? 620 : 520

  playTone(
    frequency,
    value === 0 ? 0.22 : 0.11,
    value === 0 ? 0.16 : 0.11,
  )
}

function playPlacementSound() {

  playTone(330, 0.09, 0.075, 0, 'triangle')
  playTone(440, 0.10, 0.045, 0.035)
}

function playClearSound(lines: number) {

  const notes = [
    523.25,
    659.25,
    783.99,
    1046.5,
  ]

  const count = Math.min(lines + 2, notes.length)

  for (let i = 0; i < count; i++) {

    playTone(
      notes[i],
      i === count - 1 ? 0.36 : 0.15,
      0.085,
      i * 0.095,
      'triangle',
    )
  }

  if (lines >= 2) {
    playTone(1318.51, 0.35, 0.055, 0.29)
  }
}

function playGameOverSound() {

  playTone(440, 0.24, 0.10)
  playTone(330, 0.28, 0.09, 0.20)
  playTone(220, 0.40, 0.09, 0.43)
}

function playRecordSound() {

  const notes = [
    523.25,
    659.25,
    783.99,
    1046.5,
  ]

  notes.forEach((frequency, index) => {

    playTone(
      frequency,
      index === notes.length - 1
        ? 0.42
        : 0.15,
      0.10,
      index * 0.12,
      'triangle',
    )

  })

}

/* ========================================
   MUSIQUE PHARMA
======================================== */

function preparePharmaMusic() {

  if (pharmaMusicRef.current) {
    return pharmaMusicRef.current
  }

  const audio = new Audio(pharmaMusic)

  audio.loop = true
  setMusicVolume(audio, 0.001)
  audio.preload = 'auto'

  pharmaMusicRef.current = audio

  return audio
}

function stopPharmaMusic() {

  const audio = pharmaMusicRef.current

  if (!audio) return

  audio.pause()
  audio.currentTime = 0
}

/* ========================================
   CLASSEMENT MONDIAL STOCK & STACK
======================================== */

function saveStockLeaderboard(
  finalScore: number,
) {

  /* Manche d'un tournoi solo : score enregistré. */

  const updatedTournament = recordSoloRound(
    'stock-and-stack',
    finalScore,
  )

  setTournamentState(updatedTournament ?? getSoloTournament())

}

function triggerNewRecord() {

  if (recordCelebratedRef.current) {
    return
  }

  if (recordToBeatRef.current <= 0) {
    return
  }

  recordCelebratedRef.current = true

  setShowRecord(true)

  playRecordSound()

  if (recordTimerRef.current !== null) {
    window.clearTimeout(recordTimerRef.current)
  }

  recordTimerRef.current =
    window.setTimeout(() => {

      setShowRecord(false)

      recordTimerRef.current = null

    }, 2000)

}

  function startGame() {
  remainingSecondsRef.current = STOCK_TOURNAMENT_DURATION_SECONDS
  setRemainingSeconds(STOCK_TOURNAMENT_DURATION_SECONDS)
  setPaused(false)

  cancelAnimationTimers()

  if (recordTimerRef.current !== null) {
  window.clearTimeout(recordTimerRef.current)
  recordTimerRef.current = null
}

recordToBeatRef.current = bestScore
recordCelebratedRef.current = false

setShowRecord(false)

  clearAnimationRef.current = null

  setClearAnimation(null)
  setIsClearing(false)

  const newGame = createNewGame()

  gameRef.current = newGame
  setGame(newGame)

  dragRef.current = null
  setDrag(null)

  /*
    Déverrouiller les sons pendant
    le clic : important sur iPhone.
  */

  getAudioContext()

  const music = preparePharmaMusic()

  setMusicVolume(music, 0.001)

  if (music.paused) {
    void music.play().catch(error => {
      console.warn(
        'Musique pharma bloquée :',
        error,
      )
    })
  }

  /*
    Démarrer le compte à rebours.
  */

  setCountdown(3)
  playCountdownSound(3)

  gameStateRef.current = 'countdown'
  setGameState('countdown')

}

/* ========================================
   COUNTDOWN
======================================== */

useEffect(() => {

  if (gameState !== 'countdown') {
    return
  }

  if (countdown === 0) {

    const timer = window.setTimeout(() => {

      const music = pharmaMusicRef.current

      if (music) {
        setMusicVolume(music, 0.18)
      }

      gameStateRef.current = 'playing'
      setGameState('playing')

    }, 650)

    return () => window.clearTimeout(timer)
  }

  const timer = window.setTimeout(() => {

    const nextValue = countdown - 1

    playCountdownSound(nextValue)
    setCountdown(nextValue)

  }, 800)

  return () => window.clearTimeout(timer)

}, [gameState, countdown, setMusicVolume])


  /* Chronomètre du tournoi solo : 3 minutes de jeu effectif. */
  useEffect(() => {
    if (gameState !== 'playing' || paused) return
    let previousTick = Date.now()
    const interval = window.setInterval(() => {
      const now = Date.now()
      const elapsed = (now - previousTick) / 1000
      previousTick = now
      const next = Math.max(0, remainingSecondsRef.current - elapsed)
      remainingSecondsRef.current = next
      setRemainingSeconds(Math.ceil(next))
      if (next > 0 || gameStateRef.current !== 'playing') return
      gameStateRef.current = 'gameover'
      cancelAnimationTimers()
      cancelDrag()
      stopPharmaMusic()
      saveStockLeaderboard(gameRef.current.score)
      setGameState('gameover')
    }, 200)
    return () => window.clearInterval(interval)
  }, [gameState, paused])

  /* ========================================
     RETOUR SOLO
  ======================================== */

  function returnToSolo() {

    cancelAnimationTimers()

    onFullscreenChange?.(false)

    stopPharmaMusic()

    navigate(getSoloTournamentReturnPath('stock-and-stack'))

  }

  function pauseGame() {
    cancelDrag()
    stopPharmaMusic()
    setPaused(true)
  }

  function resumeGame() {
    setPaused(false)
    const music = preparePharmaMusic()
    if (music.paused) {
      void music.play().catch(() => {})
    }
  }


  /* ========================================
     ANNULER UN DÉPLACEMENT
  ======================================== */

  function cancelDrag() {

    dragRef.current = null

    setDrag(null)

  }


  /* ========================================
     POSITION DU DOIGT
     
     Calcul conservé comme dans
     ton jeu actuel pour ne pas
     modifier l'alignement.
  ======================================== */

  function calculateDragPosition(
    currentDrag: DragData,
    clientX: number,
    clientY: number,
  ): DragData {

    const grid =
      gridRef.current

    if (!grid) {

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
  Math.min(rect.width, rect.height) / GRID_SIZE

    const shapeWidth =
      getShapeWidth(
        currentDrag.piece.shape,
      )

    const shapeHeight =
      getShapeHeight(
        currentDrag.piece.shape,
      )


    const floatingLeft =
      clientX -
      (
        shapeWidth * cellSize
      ) / 2

    const floatingTop =
      clientY -
      DRAG_LIFT -
      (
        shapeHeight * cellSize
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
        shapeWidth * cellSize >
        rect.left &&

      floatingLeft <
        rect.right &&

      floatingTop +
        shapeHeight * cellSize >
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
        gameRef.current.board,

        currentDrag.piece.shape,

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
     PRENDRE UNE PIÈCE
  ======================================== */

  function handlePiecePointerDown(
    event:
      ReactPointerEvent<HTMLDivElement>,

    pieceIndex: number,
  ) {

    if (
      gameStateRef.current !== 'playing' ||
      clearAnimationRef.current !== null ||
      dragRef.current !== null
    ) {

      return

    }


    const piece =
      gameRef.current.pieces[
        pieceIndex
      ]

    if (!piece) {
      return
    }

    event.preventDefault()


    const initialDrag: DragData = {

      pointerId: event.pointerId,

      pieceIndex,

      piece,

      clientX: event.clientX,

      clientY: event.clientY,

      anchor: null,

      valid: false,

      cellSize: 0,

    }


    const positionedDrag =
      calculateDragPosition(
        initialDrag,

        event.clientX,

        event.clientY,
      )

    dragRef.current =
      positionedDrag

    setDrag(positionedDrag)

  }


  /* ========================================
     DÉPLACER / LÂCHER LA PIÈCE
  ======================================== */

  useEffect(() => {

    if (gameState !== 'playing') {

      return

    }


    /* DÉPLACER */

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

      setDrag(nextDrag)

    }


    /* LÂCHER */

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


      /* POSITION EXACTE AU RELÂCHEMENT */

      const finalDrag =
        calculateDragPosition(
          currentDrag,

          event.clientX,

          event.clientY,
        )


      /* PLACEMENT IMPOSSIBLE */

      if (
        !finalDrag.valid ||
        !finalDrag.anchor
      ) {

        cancelDrag()

        return

      }


      /* CALCUL DU PLACEMENT */

      const placement =
        placeShape(
          gameRef.current,

          finalDrag.pieceIndex,

          finalDrag.anchor.x,

          finalDrag.anchor.y,
        )

      if (!placement) {

        cancelDrag()

        return

      }


      /*
        Ces constantes ne peuvent
        pas être nulles après le
        test précédent.
      */

      const visibleGame =
        placement.visibleGame

      const finalGame =
        placement.finalGame

      const clearEffect =
        placement.clearAnimation

        if (
  !recordCelebratedRef.current &&
  recordToBeatRef.current > 0 &&
  finalGame.score > recordToBeatRef.current
) {

  triggerNewRecord()

}

        if (clearEffect) {

  playClearSound(clearEffect.count)

} else {

  playPlacementSound()

}

      /* ANNULER UN ANCIEN MESSAGE */

      if (
        clearMessageTimerRef.current !== null
      ) {

        window.clearTimeout(
          clearMessageTimerRef.current,
        )

        clearMessageTimerRef.current = null

      }


      /* AFFICHER LES CARTONS POSÉS */

      gameRef.current = visibleGame

      setGame(visibleGame)

      cancelDrag()


      /* ====================================
         TERMINER LE PLACEMENT
      ==================================== */

      function finishPlacement() {

        /*
          Retirer effectivement
          les lignes du plateau.
        */

        gameRef.current = finalGame

        setGame(finalGame)


        /*
          Arrêter le flash et les
          paillettes immédiatement.
        */

        setIsClearing(false)

        /*
          Autoriser le joueur
          à reprendre une pièce.
        */

        clearAnimationRef.current = null

        clearTimerRef.current = null


        /*
          Garder seulement le panneau
          jusqu'à 1,25 seconde au total.
        */

        if (clearEffect) {

          clearMessageTimerRef.current =
            window.setTimeout(
              () => {

                setClearAnimation(null)

                clearMessageTimerRef.current = null

              },

              CLEAR_MESSAGE_DURATION -
                CLEAR_ANIMATION_DURATION,
            )

        } else {

          setClearAnimation(null)

        }


        /* FIN DE PARTIE */

        if (
          !hasAvailableMove(
            finalGame.board,
            finalGame.pieces,
          )
        ) {

          /*
            Si un combo vient d'avoir
            lieu, laisser le temps
            de lire le commentaire
            avant l'écran de fin.
          */

          if (clearEffect) {

            gameStateRef.current = 'gameover'

            /*
              Le jeu reste affiché
              jusqu'à la fin du panneau.
            */

            if (
              clearMessageTimerRef.current !== null
            ) {

              window.clearTimeout(
                clearMessageTimerRef.current,
              )

            }

            clearMessageTimerRef.current =
              window.setTimeout(
                () => {

                  setClearAnimation(null)

                  clearMessageTimerRef.current = null

stopPharmaMusic()
playGameOverSound()

saveStockLeaderboard(
  finalGame.score,
)

setGameState('gameover')

                },

                CLEAR_MESSAGE_DURATION -
                  CLEAR_ANIMATION_DURATION,
              )

          } else {

            gameStateRef.current = 'gameover'
stopPharmaMusic()
playGameOverSound()

saveStockLeaderboard(
  finalGame.score,
)

setGameState('gameover')

          }

        }

      }


      /* ====================================
         LANCER L'ANIMATION
      ==================================== */

      if (clearEffect) {

        /*
          Déclencher le flash,
          les paillettes et le panneau.
        */

        clearAnimationRef.current =
          clearEffect

        setClearAnimation(clearEffect)

        setIsClearing(true)


        /*
          Les cartons restent
          visibles pendant 750 ms.
        */

        clearTimerRef.current =
          window.setTimeout(
            finishPlacement,
            CLEAR_ANIMATION_DURATION,
          )

      } else {

        /*
          Pas de ligne complétée :
          pas d'animation.
        */

        finishPlacement()

      }

    }


    /* ANNULER LE POINTEUR */

    function handlePointerCancel(
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

      cancelDrag()

    }


    /* ÉCOUTEURS GLOBAUX */

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

  }, [gameState])


  /* ========================================
     PRÉVISUALISATION
  ======================================== */

  const previewCells =
    new Set<string>()

  if (
    drag?.anchor &&
    drag.valid
  ) {

    for (
      const cell of
      drag.piece.shape.cells
    ) {

      const x =
        drag.anchor.x + cell.x

      const y =
        drag.anchor.y + cell.y

      previewCells.add(
        `${x}-${y}`,
      )

    }

  }


  /* ========================================
     CASES ANIMÉES
     
     Elles s'arrêtent à 750 ms.

     Le panneau peut rester affiché
     sans relancer les paillettes.
  ======================================== */

  const clearingCells =
    new Set<string>(
      isClearing
        ? clearAnimation?.cells ?? []
        : [],
    )


  /* ========================================
     CASES DU PLATEAU
  ======================================== */

  const boardCells =
    Array.from(
      {
        length:
          GRID_SIZE * GRID_SIZE,
      },

      (_, index) => {

        const x =
          index % GRID_SIZE

        const y =
          Math.floor(
            index / GRID_SIZE,
          )

        return { x, y }

      },
    )


  /* ========================================
     AFFICHAGE
  ======================================== */

  return (

    <section
      className={
        `stock-game-page stock-state-${gameState}`
      }
    >

      <TournamentSoloPlayersHud active={gameState === 'playing'} humanScore={game.score} />
      {gameState === 'playing' && (
        <div className="stock-tournament-clock" role="timer" aria-label="Temps restant">
          ⏱ {Math.floor(remainingSeconds / 60).toString().padStart(2, '0')}:
          {(remainingSeconds % 60).toString().padStart(2, '0')}
        </div>
      )}


      {gameState === 'playing' && (
        <SoloPauseMenu
          paused={paused}
          onPause={pauseGame}
          onResume={resumeGame}
          onReturn={returnToSolo}
          label="Stock & Stack"
        />
      )}


      {/* =================================
          MENU DE DÉPART
      ================================= */}

      {gameState === 'ready' && (

        <div className="stock-play-area">

          <div className="stock-start-screen">

            <div className="stock-menu-best">

              <span>
                {tr("MEILLEUR SCORE")}</span>

              <strong>
                {bestScore.toLocaleString(getLanguage())}
              </strong>

            </div>


            <div className="stock-start-icon">

              <svg
    viewBox="0 0 31.711 31.71"
    fill="#70e5f4"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label={tr("Logo Stock & Stack")}
    width="75%"
    height="75%"
  >
    <g>
      <path d="M31.076,12.891c0.642-0.413,0.828-1.268,0.415-1.911l-4.714-7.33c-0.198-0.309-0.511-0.526-0.869-0.604
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
        v-0.598l2.858-0.557L17.285,25.902L17.285,25.902z" />
    </g>
  </svg>

            </div>


            <p className="stock-mode">
              {tr("PHARMACIE")}</p>


            <h1>

              Stock{' '}

              <span>
                &amp; Stack
              </span>

            </h1>


            <p className="stock-instructions">

              {tr("Range les cartons, remplis les lignes et libère la réserve !")}</p>


            <button
              className="stock-start-button"
              type="button"
              onClick={startGame}
            >

              {tr("Commencer")}<span>
                →
              </span>

            </button>

          </div>

        </div>

      )}

{/* =================================
    3, 2, 1, GO
================================= */}

{gameState === 'countdown' && (

  <div className="stock-countdown">

    <span className="stock-countdown-label">
      {tr("PRÊT ?")}</span>

    <strong key={countdown}>
      {countdown === 0 ? tr('GO') : countdown}
    </strong>

  </div>

)}

      {/* =================================
          PARTIE
      ================================= */}

      {gameState === 'playing' && (

        <div className="stock-playing-screen">




          {/* =================================
              RÉSERVE PHARMACEUTIQUE
          ================================= */}

          <div className="stock-board-wrapper">

            <div className="stock-board">


              {/* IMAGE DE FOND */}

              <img
                className="stock-board-background"
                src={fondPharma}
                alt=""
                draggable={false}
              />


              {/* GRILLE 8 × 8 */}

              <div
                ref={gridRef}
                className="stock-grid"
              >

                {boardCells.map(
                  cell => {

                    const cellKey =
                      `${cell.x}-${cell.y}`

                    const occupied =
                      game.board[
                        cell.y
                      ][
                        cell.x
                      ]

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
                        key={cellKey}

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
                              'stock-piece-box stock-board-box'
                            }
                          >

                            <img
                              src={pieceImage}
                              alt=""
                              draggable={false}
                            />

                          </div>

                        )}


                        {/* PRÉVISUALISATION */}

                        {preview && (

                          <div
                            className={
                              'stock-piece-box stock-board-box stock-preview-box'
                            }
                          >

                            <img
                              src={pieceImage}
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
                              { length: 6 },

                              (_, index) => (

                                <span
                                  key={index}

                                  style={
                                    {
                                      '--spark-index': index,
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


              {/* COMMENTAIRE DE COMBO */}

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

              {/* =================================
    NOUVEAU RECORD
================================= */}

{showRecord && (

  <div className="stock-record-overlay">

    <div className="stock-record-burst">

      <span className="stock-record-kicker">
        {tr("NOUVEAU RECORD")}</span>

      <strong>
        {game.score.toLocaleString(getLanguage())}
      </strong>

      <p>
        {tr("Tu viens de battre ton meilleur score !")}</p>

      <span className="stock-record-star">
        ✦
      </span>

    </div>

  </div>

)}

            </div>

          </div>


          {/* =================================
              TROIS PIÈCES PROPOSÉES
          ================================= */}

          <div className="stock-pieces-area">

            <p className="stock-pieces-label">
              {tr("CHOISIS UN LOT DE CARTONS")}</p>


            <div className="stock-pieces-tray">

              {game.pieces.map(
                (piece, index) => {

                  const isDragging =
                    drag?.pieceIndex === index

                  return (

                    <div
                      key={
                        piece
                          ? piece.id
                          : `empty-${index}`
                      }

                      className={
                        `stock-piece-slot ${
                          isDragging
                            ? 'is-dragging'
                            : ''
                        } ${
                          !piece
                            ? 'is-empty'
                            : ''
                        }`
                      }

                      onPointerDown={
                        event => {

                          if (!piece) {
                            return
                          }

                          handlePiecePointerDown(
                            event,
                            index,
                          )

                        }
                      }
                    >

                      {piece && (

                        <PieceShape
                          shape={piece.shape}
                          cellSize={23}
                          className="stock-tray-shape"
                        />

                      )}

                    </div>

                  )

                },
              )}

            </div>

          </div>


          {/* =================================
              PIÈCE FLOTTANTE
          ================================= */}

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
                  drag.clientY - DRAG_LIFT,

              }}
            >

              <PieceShape
                shape={drag.piece.shape}

                cellSize={
                  drag.cellSize > 0
                    ? drag.cellSize
                    : 40
                }

                className="stock-floating-shape"
              />

            </div>

          )}

        </div>

      )}


      {/* =================================
          FIN DE PARTIE
      ================================= */}

      {gameState === 'gameover' && (

        <div className="stock-play-area">

          <div className="stock-game-over">

            <p className="stock-mode">
              {tr("MANCHE TERMINÉE")}</p>


            <h2>
              {game.score.toLocaleString(getLanguage())}
            </h2>


            <span className="stock-game-over-points">
              {tr("points marqués")}</span>


            {tournamentState && (
              <>
                <TournamentBoard
                  players={tournamentState.players}
                  currentPlayerId={tournamentState.human_player_id}
                />

                <button
                  className="stock-start-button"
                  type="button"
                  onClick={returnToSolo}
                >

                  {tournamentState.status === 'finished'
                    ? tr("Voir le classement final")
                    : tr("Manche suivante")}
                  <span>
                    →
                  </span>

                </button>
              </>
            )}

          </div>

        </div>

      )}

    </section>

  )

}

export default StockAndStack
