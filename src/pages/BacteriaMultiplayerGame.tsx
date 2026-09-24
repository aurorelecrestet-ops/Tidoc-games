import { getLanguage } from '../i18n/languages'
import { tr } from '../i18n/gameText'
import ReturnToGamesButton from '../components/ReturnToGamesButton'
import { useGameAudio } from '../hooks/useGameAudio'
import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'

import {
  useNavigate,
  useParams,
} from 'react-router-dom'

import './BacteriaSlash.css'
import './BacteriaMultiplayerGame.css'
import './Classements.css'

import bacteriaMusic
  from '../assets/audio/bacteria-music.mp3'

/* ========================================
   BACTÉRIES
======================================== */

import eColi
  from '../assets/bactéries/EColi.png'

import hPylori
  from '../assets/bactéries/HPylori.png'

import klebsPneumo
  from '../assets/bactéries/KlebsPneumo.png'

import pseudoAeru
  from '../assets/bactéries/PseudoAeru.png'

import salmoEnterica
  from '../assets/bactéries/SalmoEnterica.png'

import staphDore
  from '../assets/bactéries/StaphDore.png'

import streptoPneumo
  from '../assets/bactéries/StreptoPneumo.png'


/* ========================================
   AVATARS
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


/* ========================================
   SUPABASE / MULTIJOUEUR
======================================== */

import {
  supabase,
} from '../lib/supabase'

import {
  getCurrentPlayerId,
  getGameRoomByCode,
  getRoomPlayers,
  updateMultiplayerScore,
  type GameRoom,
  type LobbyPlayer,
} from '../lib/multiplayer'


type BacteriaMultiplayerGameProps = {
  onFullscreenChange?: (
    fullscreen: boolean
  ) => void
}


type GameState =
  | 'loading'
  | 'countdown'
  | 'playing'
  | 'results'


type PlayerColor =
  | 'green'
  | 'red'
  | 'yellow'
  | 'purple'


type BacteriaDefinition = {
  name: string
  image: string
}


type SpawnEvent = {
  id: number

  spawnAt: number

  name: string
  image: string

  color: PlayerColor

  xPercent: number
  driftPercent: number

  vy: number

  size: number

  rotation: number
  spin: number
}


type VisibleBacteria = SpawnEvent & {
  x: number
  y: number
  currentRotation: number
}


type Explosion = {
  id: number

  x: number
  y: number

  color: PlayerColor

  name: string
}


const GAME_DURATION =
  60_000

const GRAVITY =
  1180

const BACTERIA_POINTS =
  100

const PENALTY_POINTS =
  100


const bacteriaList:
BacteriaDefinition[] = [

  {
    name:
      'Escherichia coli',

    image:
      eColi,
  },

  {
    name:
      'Staphylococcus aureus',

    image:
      staphDore,
  },

  {
    name:
      'Pseudomonas aeruginosa',

    image:
      pseudoAeru,
  },

  {
    name:
      'Streptococcus pneumoniae',

    image:
      streptoPneumo,
  },

  {
    name:
      'Klebsiella pneumoniae',

    image:
      klebsPneumo,
  },

  {
    name:
      'Salmonella Enteritidis',

    image:
      salmoEnterica,
  },

  {
    name:
      'Helicobacter pylori',

    image:
      hPylori,
  },
]


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


/* ========================================
   RANDOM DÉTERMINISTE

   Même seed =
   mêmes bactéries pour tout le monde.
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


/* ========================================
   GÉNÉRATION DE LA PARTIE

   Tout est calculé dès le départ.
   Donc tous les appareils ont
   exactement la même partie.
======================================== */

function createSpawnEvents(
  seed: number,
  players: LobbyPlayer[],
) {

  const random =
    createSeededRandom(
      seed,
    )


  const orderedPlayers =
    [...players]
      .sort(
        (a, b) =>
          a.player_order -
          b.player_order,
      )


  const playerColors =
    orderedPlayers.map(
      player =>
        player.color as PlayerColor,
    )


  const events:
  SpawnEvent[] = []


  let id =
    0

  let spawnAt =
    600


  while (
    spawnAt <
    GAME_DURATION - 700
  ) {

    /*
      Plus la partie avance,
      plus les bactéries arrivent vite.
    */

    const progress =
      spawnAt /
      GAME_DURATION


    const baseDelay =
      900 -
      progress * 280


    const variation =
      random() *
      280


    spawnAt +=
      Math.max(
        380,
        baseDelay -
        variation,
      )


    const bacteria =
      bacteriaList[
        Math.floor(
          random() *
          bacteriaList.length,
        )
      ]


    const color =
      playerColors[
        Math.floor(
          random() *
          playerColors.length,
        )
      ] ?? 'green'


    const direction =
      random() <
      0.5
        ? -1
        : 1


    events.push({
      id:
        id++,

      spawnAt,

      name:
        bacteria.name,

      image:
        bacteria.image,

      color,

      xPercent:
        14 +
        random() *
        72,

      driftPercent:
        direction *
        (
          3 +
          random() *
          10
        ),

      vy:
        850 +
        random() *
        200,

      size:
        78 +
        random() *
        30,

      rotation:
        random() *
        360,

      spin:
        (
          random() <
          0.5
            ? -1
            : 1
        ) *
        (
          45 +
          random() *
          110
        ),
    })
  }


  return events
}


function BacteriaMultiplayerGame({
  onFullscreenChange,
}: BacteriaMultiplayerGameProps) {
  const { setMusicVolume, setMusicMuted } = useGameAudio()


  const navigate =
    useNavigate()


  const {
    code = '',
  } =
    useParams()


  /* ========================================
     STATE
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


  const [
    remainingMs,
    setRemainingMs,
  ] = useState(
    GAME_DURATION,
  )


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
    visibleBacteria,
    setVisibleBacteria,
  ] = useState<VisibleBacteria[]>([])


  const [
    explosions,
    setExplosions,
  ] = useState<Explosion[]>([])


  const [
    errorMessage,
    setErrorMessage,
  ] = useState('')


  /* ========================================
     REFS
  ======================================== */

  const boardRef =
    useRef<HTMLDivElement | null>(
      null,
    )


  const roomRef =
    useRef<GameRoom | null>(
      null,
    )


  const playersRef =
    useRef<LobbyPlayer[]>([])


  const currentPlayerIdRef =
    useRef<string | null>(
      null,
    )


  const scoreRef =
    useRef(0)


  const gameStartedAtRef =
    useRef<number | null>(
      null,
    )


  const spawnEventsRef =
    useRef<SpawnEvent[]>([])


  const hitIdsRef =
    useRef<Set<number>>(
      new Set(),
    )


  const animationRef =
    useRef<number | null>(
      null,
    )


  const explosionIdRef =
    useRef(0)


  const audioRef =
    useRef<HTMLAudioElement | null>(
      null,
    )


  const audioUnlockedRef =
    useRef(false)


  const realtimeChannelRef =
    useRef<ReturnType<
      typeof supabase.channel
    > | null>(
      null,
    )


  const finishRequestedRef =
    useRef(false)


  const currentPlayer =
    players.find(
      player =>
        player.player_id ===
        currentPlayerId,
    )


  /* ========================================
     PLEIN ÉCRAN
  ======================================== */

  useEffect(() => {

    const fullscreen =
      gameState ===
        'countdown' ||
      gameState ===
        'playing'


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

  function prepareMusic() {

    if (
      audioRef.current
    ) {

      return audioRef.current
    }


    const audio =
      new Audio(
        bacteriaMusic,
      )


    audio.loop =
      true

    setMusicVolume(audio, 0.18)

    audio.preload =
      'auto'



    audioRef.current =
      audio


    return audio
  }


  function startMusic() {

    const audio =
      prepareMusic()


    setMusicMuted(audio, false)

    setMusicVolume(audio, 0.18)


    if (
      !audioUnlockedRef.current
    ) {

      audioUnlockedRef.current =
        true
    }


    void audio
      .play()
      .catch(
        error => {

          console.warn(
            'Musique Bacteria multi bloquée :',
            error,
          )
        },
      )
  }


  function stopMusic() {

    const audio =
      audioRef.current


    if (!audio) {
      return
    }


    audio.pause()

    audio.currentTime =
      0
  }


  /*
    Sur iPhone, le premier clic pendant
    la partie permet également de
    déverrouiller la musique si iOS
    avait bloqué l'autoplay.
  */

  function ensureMusicStarted() {

    const audio =
      prepareMusic()


    if (
      audio.paused
    ) {

      startMusic()
    }
  }


  /* ========================================
     CHARGEMENT ROOM
  ======================================== */

  useEffect(() => {

    let active =
      true


    async function loadGame() {

      try {

        setErrorMessage('')


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


        setRoom(
          roomData,
        )

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


        const ownPlayer =
          roomPlayers.find(
            player =>
              player.player_id ===
              playerId,
          )


        if (
          ownPlayer
        ) {

          scoreRef.current =
            ownPlayer.score ?? 0

          setScore(
            ownPlayer.score ?? 0,
          )
        }


        if (
          roomData.status ===
          'finished'
        ) {

          await showFinishedRoom(roomData)

          return
        }


        if (
          roomData.status !==
          'playing'
        ) {

          navigate(
            `/multiplayer/bacteria/lobby/${roomData.code}`,
          )

          return
        }


        if (
          roomData.game_seed ===
            null ||
          !roomData.started_at
        ) {

          throw new Error(
            'Synchronisation impossible.',
          )
        }


        gameStartedAtRef.current =
          new Date(
            roomData.started_at,
          ).getTime()


        spawnEventsRef.current =
          createSpawnEvents(
            Number(
              roomData.game_seed,
            ),
            roomPlayers,
          )


        hitIdsRef.current =
          new Set()


        finishRequestedRef.current =
          false


        const now =
          Date.now()


        if (
          now <
          gameStartedAtRef.current
        ) {

          setGameState(
            'countdown',
          )

        } else {

          const elapsed =
            now -
            gameStartedAtRef.current


          if (
            elapsed >=
            GAME_DURATION
          ) {

            setGameState(
              'results',
            )

          } else {

            setGameState(
              'playing',
            )

            startMusic()
          }
        }


      } catch (error) {

        const message =
          error &&
          typeof error ===
            'object' &&
          'message' in error
            ? String(
                error.message,
              )
            : 'Impossible de charger la partie.'


        setErrorMessage(
          message,
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
   PRÉSENCE MULTIJOUEUR

   Envoie un signal toutes les
   10 secondes pendant la partie.

   Aucun forfait ni Game Over
   n'est déclenché à cette étape.
======================================== */

  async function showFinishedRoom(finishedRoom: GameRoom) {
    roomRef.current = finishedRoom
    setRoom(finishedRoom)
    stopMusic()

    // On bloque immédiatement le moteur, même si les requêtes prennent du temps.
    setGameState('results')

    try {
      const finalPlayers = await getRoomPlayers(finishedRoom.id)
      setPlayers(finalPlayers)
      playersRef.current = finalPlayers
    } catch (error) {
      console.error('Erreur scores fin Bacteria :', error)
    }

  }

  /* ========================================
     RATTRAPAGE SI REALTIME EST MANQUÉ
  ======================================== */

  useEffect(() => {
    if (!room?.id || room.status !== 'playing') return

    let active = true

    const check = async () => {
      try {
        const freshRoom = await getGameRoomByCode(code)
        if (!active || !freshRoom) return
        if (freshRoom.status === 'finished') {
          await showFinishedRoom(freshRoom)
        }
      } catch (error) {
        console.error('Erreur vérification room Bacteria :', error)
      }
    }

    const interval = window.setInterval(() => { void check() }, 3000)
    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [room?.id, room?.status, code])

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
          `bacteria-game-${room.id}`,
        )


        /*
          SCORES DES JOUEURS
        */

        .on(
          'postgres_changes',
          {
            event:
              '*',

            schema:
              'public',

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


              setPlayers(
                freshPlayers,
              )

              playersRef.current =
                freshPlayers

            } catch (error) {

              console.error(
                'Erreur mise à jour joueurs :',
                error,
              )
            }
          },
        )


        /*
          FIN DE PARTIE
        */

        .on(
          'postgres_changes',
          {
            event:
              'UPDATE',

            schema:
              'public',

            table:
              'game_rooms',

            filter:
              `id=eq.${room.id}`,
          },
          async payload => {

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

              await showFinishedRoom(freshRoom)
            }
          },
        )


        /*
          UNE BACTÉRIE A ÉTÉ
          TOUCHÉE PAR UN JOUEUR
        */

        .on(
          'broadcast',
          {
            event:
              'bacteria-hit',
          },
          payload => {

            const bacteriaId =
              Number(
                payload.payload
                  ?.bacteriaId,
              )


            if (
              !Number.isFinite(
                bacteriaId,
              )
            ) {
              return
            }


            hitIdsRef.current.add(
              bacteriaId,
            )
          },
        )


        .subscribe()


    realtimeChannelRef.current =
      channel


    return () => {

      realtimeChannelRef.current =
        null


      void supabase
        .removeChannel(
          channel,
        )
    }

  }, [
    room?.id,
  ])


  /* ========================================
     COUNTDOWN SYNCHRONISÉ
  ======================================== */

  useEffect(() => {

    if (
      gameState !==
      'countdown' ||
      !gameStartedAtRef.current
    ) {
      return
    }


    function updateCountdown() {

      const start =
        gameStartedAtRef.current


      if (!start) {
        return
      }


      const remaining =
        start -
        Date.now()


      if (
  remaining <= 0
) {

  setCountdown(0)

  if (
    remaining <= -650
  ) {

    setGameState(
      'playing',
    )

    startMusic()
  }

  return
}


      setCountdown(
        Math.max(
          1,
          Math.ceil(
            remaining /
            1000,
          ),
        ),
      )
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


    const playerId =
      currentPlayerIdRef.current


    if (
      playerId
    ) {

      playersRef.current =
        playersRef.current.map(
          player =>
            player.player_id ===
            playerId
              ? {
                  ...player,
                  score:
                    newScore,
                }
              : player,
        )


      setPlayers([
        ...playersRef.current,
      ])
    }


    const currentRoom =
      roomRef.current


    if (
      currentRoom
    ) {

      void updateMultiplayerScore(
        currentRoom.id,
        newScore,
      )
        .catch(
          error => {

            console.error(
              'Erreur score Bacteria multi :',
              error,
            )
          },
        )
    }
  }


  /* ========================================
     FIN DU CHRONO
  ======================================== */

  async function finishGame() {

    if (
      finishRequestedRef.current
    ) {
      return
    }


    finishRequestedRef.current =
      true


    stopMusic()


    const currentRoom =
      roomRef.current


    if (!currentRoom) {
      return
    }


    /*
      On enregistre une dernière fois
      notre score avant le classement.
    */

    try {

      await updateMultiplayerScore(
        currentRoom.id,
        scoreRef.current,
      )

    } catch (error) {

      console.error(
        'Erreur score final :',
        error,
      )
    }


    /*
      L'hôte termine officiellement
      la room.

      Les autres joueurs recevront
      ensuite le changement via realtime.
    */

    if (
      currentPlayerIdRef.current ===
      currentRoom.host_id
    ) {

      try {

        const {
          error,
        } =
          await supabase
            .from(
              'game_rooms',
            )
            .update({
              status:
                'finished',
            })
            .eq(
              'id',
              currentRoom.id,
            )


        if (error) {
          throw error
        }

      } catch (error) {

        console.error(
          'Erreur fin partie Bacteria :',
          error,
        )
      }

    } else {

      /*
        Le joueur non-hôte reste
        sur l'écran de jeu jusqu'à
        réception du statut finished.
      */

      setRemainingMs(
        0,
      )
    }
  }


  /* ========================================
     MOTEUR DE JEU
  ======================================== */

  useEffect(() => {

    if (
      gameState !==
      'playing'
    ) {
      return
    }


    function frame() {

      const board =
        boardRef.current


      const start =
        gameStartedAtRef.current


      if (
        !board ||
        !start
      ) {
        return
      }


      const elapsed =
        Date.now() -
        start


      const remaining =
        Math.max(
          0,
          GAME_DURATION -
          elapsed,
        )


      setRemainingMs(
        remaining,
      )


      if (
        remaining <= 0
      ) {

        setVisibleBacteria([])

        void finishGame()

        return
      }


      const width =
        board.clientWidth


      const height =
        board.clientHeight


      const nextVisible:
      VisibleBacteria[] = []


      for (
        const item of
        spawnEventsRef.current
      ) {

        if (
          hitIdsRef.current.has(
            item.id,
          )
        ) {
          continue
        }


        const ageMs =
          elapsed -
          item.spawnAt


        if (
          ageMs < 0
        ) {
          continue
        }


        const age =
          ageMs /
          1000


        /*
          Mouvement type Fruit Ninja :
          montée puis chute.
        */

        const y =
          -item.size +
          item.vy *
          age -
          0.5 *
          GRAVITY *
          age *
          age


        /*
          L'objet a fini sa trajectoire.
        */

        if (
          age > 0.5 &&
          y <
          -item.size -
          80
        ) {
          continue
        }


        if (
          y >
          height +
          item.size
        ) {
          continue
        }


        const startX =
          (
            item.xPercent /
            100
          ) *
          width


        const drift =
          (
            item.driftPercent /
            100
          ) *
          width *
          age


        const half =
          item.size /
          2


        const x =
          Math.max(
            half + 4,
            Math.min(
              width -
              half -
              4,
              startX +
              drift,
            ),
          )


        nextVisible.push({
          ...item,

          x,

          y,

          currentRotation:
            item.rotation +
            item.spin *
            age,
        })
      }


      setVisibleBacteria(
        nextVisible,
      )


      animationRef.current =
        requestAnimationFrame(
          frame,
        )
    }


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
    }

  }, [
    gameState,
  ])


  /* ========================================
     TOUCHER UNE BACTÉRIE
  ======================================== */

  function hitBacteria(
    event:
      ReactPointerEvent<HTMLButtonElement>,
    bacteria:
      VisibleBacteria,
  ) {

    event.preventDefault()

    event.stopPropagation()


    if (
      gameState !==
        'playing' ||
      !currentPlayer
    ) {
      return
    }


    ensureMusicStarted()


    /*
      COULEUR ADVERSE
      → -100
      → bactérie disparaît pour tous.
    */

    /* Une bactérie ne peut être touchée qu'une fois sur cet appareil. */
    if (hitIdsRef.current.has(bacteria.id)) {
      return
    }

    const isOwnColor =
      bacteria.color === currentPlayer.color

    hitIdsRef.current.add(
      bacteria.id,
    )


    changeScore(
      isOwnColor ? BACTERIA_POINTS : -PENALTY_POINTS,
    )


    /*
      Explosion locale.
    */

    const explosion:
    Explosion = {

      id:
        explosionIdRef.current++,

      x:
        bacteria.x,

      y:
        bacteria.y,

      color:
        bacteria.color,

      name:
        bacteria.name,
    }


    setExplosions(
      current => [
        ...current,
        explosion,
      ],
    )


    window.setTimeout(
      () => {

        setExplosions(
          current =>
            current.filter(
              item =>
                item.id !==
                explosion.id,
            ),
        )

      },
      650,
    )


    /*
      On indique immédiatement aux
      autres appareils que cette
      bactérie est éliminée.
    */

    const channel =
      realtimeChannelRef.current


    if (
      channel
    ) {

      void channel.send({
        type:
          'broadcast',

        event:
          'bacteria-hit',

        payload: {
          bacteriaId:
            bacteria.id,
        },
      })
    }
  }


  /* ========================================
     CLEANUP
  ======================================== */

  useEffect(() => {

    return () => {

      stopMusic()


      if (
        animationRef.current !==
        null
      ) {

        cancelAnimationFrame(
          animationRef.current,
        )
      }
    }

  }, [])


  /* ========================================
     CLASSEMENT FINAL
  ======================================== */

  const sortedResults =
    [...players]
      .sort(
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
    errorMessage
  ) {

    return (

      <section className="bacteria-multi-loading">

        <strong>
          {tr("Erreur")}</strong>

        <p>
          {tr(errorMessage)}
        </p>

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

      <section className="bacteria-multi-loading">

        <p>
          {tr("Chargement de la partie...")}</p>

      </section>
    )
  }


  /* ========================================
     RÉSULTATS
  ======================================== */

  if (
    gameState ===
    'results'
  ) {

    return (

      <section className="rankings-page bacteria-multi-results-page">


        <div className="rankings-heading">

          <p className="rankings-eyebrow">
            {tr("PARTIE TERMINÉE")}</p>

          <h1>
            {tr("Classement de la ")}<span>{tr("partie")}</span>
          </h1>

          <p className="rankings-subtitle">
            {tr("Le joueur ayant éliminé le plus de bactéries de sa couleur remporte la partie.")}</p>

        </div>


        <div className="rankings-games">

          <article className="rankings-game-card bacteria-multi-final-card">


            <div className="rankings-card-top">

              <div className="rankings-specialty-icon">

  <svg
    viewBox="0 -64 640 640"
    aria-hidden="true"
  >

    <path
      fill="currentColor"
      d="M272.35,226.4A17.71,17.71,0,0,0,281.46,203l-4-9.08a121.29,121.29,0,0,1,12.36-3.08A83.34,83.34,0,0,0,323.57,177l10,9a17.76,17.76,0,1,0,23.92-26.27l-9.72-8.76a83.12,83.12,0,0,0,11.65-48.18l11.85-3.51a17.73,17.73,0,1,0-10.15-34l-11.34,3.36a84,84,0,0,0-36.38-35.57l2.84-10.85a17.8,17.8,0,0,0-34.47-8.93l-2.82,10.78a83.25,83.25,0,0,0-16.74,1.1C250.83,27,240,30.22,229.1,33.39l-3.38-9.46a17.8,17.8,0,0,0-33.56,11.89l3.49,9.8a286.74,286.74,0,0,0-43.94,23.57l-6.32-8.43a17.9,17.9,0,0,0-24.94-3.6A17.69,17.69,0,0,0,116.84,82l6.45,8.61a286.59,286.59,0,0,0-34.95,35.33l-8.82-6.42a17.84,17.84,0,0,0-24.89,3.86,17.66,17.66,0,0,0,3.88,24.77l8.88,6.47a286.6,286.6,0,0,0-23,43.91l-10.48-3.59a17.73,17.73,0,1,0-11.59,33.52L32.67,232c-2.79,10-5.79,19.84-7.52,30.22a83.16,83.16,0,0,0-.82,19l-11.58,3.43a17.73,17.73,0,1,0,10.13,34l11.27-3.33a83.51,83.51,0,0,0,36.39,35.43l-2.88,11.06a17.81,17.81,0,0,0,34.48,8.92l2.87-11c1,0,2.07.26,3.1.26a83.39,83.39,0,0,0,45.65-13.88l8.59,8.8a17.77,17.77,0,0,0,25.56-24.7l-9.14-9.37a83.41,83.41,0,0,0,12.08-31.05,119.08,119.08,0,0,1,3.87-15.53l9,4.22a17.74,17.74,0,1,0,15.15-32.09l-8.8-4.11c.67-1,1.2-2.08,1.9-3.05a119.89,119.89,0,0,1,7.87-9.41,121.73,121.73,0,0,1,11.65-11.4,119.49,119.49,0,0,1,9.94-7.82c1.12-.77,2.32-1.42,3.47-2.15l3.92,8.85a17.86,17.86,0,0,0,16.32,10.58A18.14,18.14,0,0,0,272.35,226.4ZM128,256a32,32,0,1,1,32-32A32,32,0,0,1,128,256Zm80-96a16,16,0,1,1,16-16A16,16,0,0,1,208,160Zm431.26,45.3a17.79,17.79,0,0,0-17.06-12.69,17.55,17.55,0,0,0-5.08.74l-11.27,3.33a83.61,83.61,0,0,0-36.39-35.43l2.88-11.06a17.81,17.81,0,0,0-34.48-8.91l-2.87,11c-1,0-2.07-.26-3.1-.26a83.32,83.32,0,0,0-45.65,13.89l-8.59-8.81a17.77,17.77,0,0,0-25.56,24.7l9.14,9.37a83.28,83.28,0,0,0-12.08,31.06,119.34,119.34,0,0,1-3.87,15.52l-9-4.22a17.74,17.74,0,1,0-15.15,32.09l8.8,4.11c-.67,1-1.2,2.08-1.89,3.05a117.71,117.71,0,0,1-7.94,9.47,119,119,0,0,1-11.57,11.33,121.59,121.59,0,0,1-10,7.83c-1.12.77-2.32,1.42-3.47,2.15l-3.92-8.85a17.86,17.86,0,0,0-16.32-10.58,18.14,18.14,0,0,0-7.18,1.5A17.71,17.71,0,0,0,358.54,309l4,9.08a118.71,118.71,0,0,1-12.36,3.08,83.34,83.34,0,0,0-33.77,13.9l-10-9a17.77,17.77,0,1,0-23.92,26.28l9.72,8.75a83.12,83.12,0,0,0-11.65,48.18l-11.86,3.51a17.73,17.73,0,1,0,10.16,34l11.34-3.36A84,84,0,0,0,326.61,479l-2.84,10.85a17.8,17.8,0,0,0,34.47,8.93L361.06,488a83.3,83.3,0,0,0,16.74-1.1c11.37-1.89,22.24-5.07,33.1-8.24l3.38,9.46a17.8,17.8,0,0,0,33.56-11.89l-3.49-9.79a287.66,287.66,0,0,0,43.94-23.58l6.32,8.43a17.88,17.88,0,0,0,24.93,3.6A17.67,17.67,0,0,0,523.16,430l-6.45-8.61a287.37,287.37,0,0,0,34.95-35.34l8.82,6.42a17.76,17.76,0,1,0,21-28.63l-8.88-6.46a287.17,287.17,0,0,0,23-43.92l10.48,3.59a17.73,17.73,0,1,0,11.59-33.52L607.33,280c2.79-10,5.79-19.84,7.52-30.21a83.27,83.27,0,0,0,.82-19.05l11.58-3.43A17.7,17.7,0,0,0,639.26,205.3ZM416,416a32,32,0,1,1,32-32A32,32,0,0,1,416,416Z"
    />

  </svg>

</div>

            </div>


            <div className="rankings-card-content">

              <p className="rankings-specialty">
                {tr("INFECTIOLOGIE • MULTIJOUEUR")}</p>

              <h2>
                Bacteria Slash
              </h2>

              <p>{tr("Classement final de cette partie.")}</p>

            </div>


            <div className="bacteria-multi-match-ranking">

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
                            `bacteria-multi-ranking-dot bacteria-color-${player.color}`
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

    <section className="bacteria-multi-game-page">

      <div
        ref={
          boardRef
        }
        className="bacteria-multi-board"
      >


        {/* =================================
            COUNTDOWN
        ================================= */}

        {gameState ===
          'countdown' && (

          <div className="bacteria-countdown">

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

        {gameState ===
          'playing' && (

          <div className="bacteria-multi-hud">


            {/* CHRONO */}

            <div className="bacteria-multi-timer">

              <span>
                {tr("TEMPS")}</span>

              <strong>
                {Math.ceil(
                  remainingMs /
                  1000,
                )}
              </strong>

            </div>


            {/* JOUEURS */}

            <div className="bacteria-multi-players">

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
                        `bacteria-multi-hud-player ${
                          player.player_id ===
                          currentPlayerId
                            ? 'is-me'
                            : ''
                        }`
                      }
                    >

                      <span
                        className={
                          `bacteria-multi-player-dot bacteria-color-${player.color}`
                        }
                      />

                      <strong>
                        {player.pseudo}
                      </strong>

                      <span>
                        {player.player_id ===
                          currentPlayerId
                            ? score
                            : player.score}
                      </span>

                    </div>

                  ),
                )}

            </div>

          </div>

        )}


        {/* =================================
            BACTÉRIES
        ================================= */}

        {gameState ===
          'playing' &&
          visibleBacteria.map(
            bacteria => (

              <button
                key={
                  bacteria.id
                }

                type="button"

                className={
                  `bacteria-object is-bacteria bacteria-multi-object bacteria-target-${bacteria.color}`
                }

                style={{
                  width:
                    `${bacteria.size}px`,

                  height:
                    `${bacteria.size}px`,

                  left:
                    `${bacteria.x}px`,

                  bottom:
                    `${bacteria.y}px`,

                  transform:
                    `translateX(-50%) rotate(${bacteria.currentRotation}deg)`,
                }}

                onPointerDown={
                  event =>
                    hitBacteria(
                      event,
                      bacteria,
                    )
                }
              >

                <img
                  src={
                    bacteria.image
                  }

                  alt={
                    bacteria.name
                  }

                  draggable={
                    false
                  }
                />

              </button>

            ),
          )}


        {/* =================================
            EXPLOSIONS
        ================================= */}

        {explosions.map(
          explosion => (

            <div
              key={
                explosion.id
              }

              className={
                `bacteria-explosion bacteria-multi-explosion bacteria-explosion-${explosion.color}`
              }

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

          ),
        )}


        {/* =================================
            RAPPEL DE TA COULEUR
        ================================= */}

        {gameState ===
          'playing' &&
          currentPlayer && (

          <div className="bacteria-multi-my-color">

            <span
              className={
                `bacteria-multi-player-dot bacteria-color-${currentPlayer.color}`
              }
            />

            <div>
              <span>
                {tr("TA COULEUR")}</span>

              <strong>
                {currentPlayer.color === 'green'
                  ? tr('VERT')
                  : currentPlayer.color === 'red'
                    ? tr('ROUGE')
                    : currentPlayer.color === 'yellow'
                      ? tr('JAUNE')
                      : tr('VIOLET')}
              </strong>
            </div>

          </div>

        )}


        {/* =================================
            CONSIGNE
        ================================= */}

        {gameState ===
          'playing' && (

          <div className="bacteria-multi-hint">

            <span>
              {tr("Ta couleur")}<strong>
                +100
              </strong>
            </span>

            <span>
              {tr("Couleur adverse")}<strong>
                −100
              </strong>
            </span>

          </div>

        )}

      </div>

    </section>
  )
}


export default BacteriaMultiplayerGame