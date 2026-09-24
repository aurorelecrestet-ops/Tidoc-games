import { tr } from '../i18n/gameText'
import {
  useEffect,
  useState,
} from 'react'

import {
  useNavigate,
  useParams,
} from 'react-router-dom'

import {
  getGameRoomByCode,
  getRoomPlayers,
  startGameRoom,
  getCurrentPlayerId,
  type GameRoom,
  type LobbyPlayer,
} from '../lib/multiplayer'

import {
  supabase,
} from '../lib/supabase'

import './ECGLobby.css'


const COLORS = [
  {
    key: 'green',
    label: 'VERT',
  },
  {
    key: 'red',
    label: 'ROUGE',
  },
  {
    key: 'yellow',
    label: 'JAUNE',
  },
  {
    key: 'purple',
    label: 'VIOLET',
  },
] as const


function BacteriaLobby() {

  const navigate =
    useNavigate()


  const {
    code = '',
  } = useParams()


  const [
    currentPlayerId,
    setCurrentPlayerId,
  ] = useState<string | null>(
    null,
  )


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
    loading,
    setLoading,
  ] = useState(true)


  const [
    errorMessage,
    setErrorMessage,
  ] = useState('')


  /* ========================================
     CHARGEMENT
  ======================================== */

  useEffect(() => {

    let active =
      true


    async function loadLobby() {

      try {

        setLoading(true)

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

        setPlayers(
          roomPlayers,
        )

        setCurrentPlayerId(
          playerId,
        )


        /*
          Si la partie a déjà démarré,
          on entre directement dans le jeu.
        */

        if (
          roomData.status ===
          'playing'
        ) {

          navigate(
            `/multiplayer/bacteria/game/${roomData.code}`,
          )
        }


      } catch (error) {

        if (!active) {
          return
        }


        const message =
          error &&
          typeof error === 'object' &&
          'message' in error
            ? String(
                error.message,
              )
            : 'Impossible de charger la partie.'


        setErrorMessage(
          message,
        )


      } finally {

        if (active) {

          setLoading(
            false,
          )
        }
      }
    }


    void loadLobby()


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

    if (!room) {
      return
    }


    const channel =
      supabase
        .channel(
          `bacteria-lobby-${room.id}`,
        )


        /*
          JOUEURS
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


              setPlayers(
                freshPlayers,
              )


            } catch (error) {

              console.error(
                'Erreur mise à jour joueurs Bacteria :',
                error,
              )
            }
          },
        )


        /*
          ROOM
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

            const freshRoom =
              payload.new as GameRoom


            setRoom(
              freshRoom,
            )


            if (
              freshRoom.status ===
              'playing'
            ) {

              navigate(
                `/multiplayer/bacteria/game/${freshRoom.code}`,
              )
            }
          },
        )


        .subscribe()


    return () => {

      void supabase
        .removeChannel(
          channel,
        )
    }

  }, [
    room?.id,
    navigate,
  ])


  /* ========================================
     DÉMARRER
  ======================================== */

  async function handleStartGame() {

    if (!room) {
      return
    }


    try {

      await startGameRoom(
        room.id,
      )


    } catch (error) {

      console.error(
        'Erreur démarrage Bacteria Slash :',
        error,
      )


      const message =
        error &&
        typeof error === 'object' &&
        'message' in error
          ? String(
              error.message,
            )
          : 'Impossible de démarrer la partie.'


      setErrorMessage(
        message,
      )
    }
  }


  return (

    <section className="ecg-lobby-page">


      {/* ========================================
          RETOUR
      ======================================== */}

      <button
        type="button"
        className="ecg-lobby-back"
        onClick={() =>
          navigate(
            '/multiplayer/bacteria',
          )
        }
      >
        {tr("← Quitter")}</button>


      {/* ========================================
          TITRE
      ======================================== */}

      <div className="ecg-lobby-heading">

        <p className="ecg-lobby-eyebrow">
          {tr("BACTERIA SLASH • SALLE MULTIJOUEUR")}</p>

        <h1>
          {tr("Lobby")}</h1>


        <div className="ecg-lobby-code">

          <span>
            {tr("CODE DE LA PARTIE")}</span>

          <strong>
            {code.toUpperCase()}
          </strong>

        </div>

      </div>


      {/* ========================================
          STATUT
      ======================================== */}

      {loading && (

        <p className="ecg-lobby-status">
          {tr("Chargement...")}</p>

      )}


      {errorMessage && (

        <p className="ecg-lobby-error">
          {tr(errorMessage)}
        </p>

      )}


      {/* ========================================
          JOUEURS
      ======================================== */}

      {!loading &&
        !errorMessage &&
        room && (

        <>

          <div className="ecg-lobby-players">

            {COLORS.map(
              (
                color,
                index,
              ) => {

                const player =
                  players.find(
                    item =>
                      item.player_order ===
                      index + 1,
                  )


                return (

                  <article
                    key={
                      color.key
                    }
                    className={
                      `ecg-lobby-player ecg-lobby-${color.key}`
                    }
                  >

                    <div className="ecg-lobby-player-number">
                      {tr("JOUEUR ")}{index + 1}
                    </div>


                    <div className="ecg-lobby-color-dot" />


                    {player ? (

                      <>

                        <strong>
                          {player.pseudo}
                        </strong>

                        <span>
                          {tr(color.label)}
                        </span>

                      </>

                    ) : (

                      <>

                        <strong>
                          {tr("En attente...")}</strong>

                        <span>
                          {tr(color.label)}
                        </span>

                      </>

                    )}

                  </article>

                )
              },
            )}

          </div>


          {/* ========================================
              BAS DU LOBBY
          ======================================== */}

          <div className="ecg-lobby-footer">

            <p>
              {players.length}
              {' / '}
              {room.max_players}
              {' '}
              {tr("joueurs")}</p>


            {currentPlayerId ===
              room.host_id && (

              <button
                type="button"
                disabled={
                  players.length < 2
                }
                onClick={
                  handleStartGame
                }
              >
                {tr("Démarrer la partie")}<span>
                  →
                </span>
              </button>

            )}

          </div>

        </>

      )}

    </section>
  )
}


export default BacteriaLobby