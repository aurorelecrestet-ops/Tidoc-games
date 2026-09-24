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


/* ========================================
   COULEURS DES JOUEURS

   Même ordre que les autres jeux :
   1 = vert
   2 = rouge
   3 = jaune
   4 = violet
======================================== */

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


/* ========================================
   STOCK & STACK — LOBBY
======================================== */

function StockAndStackLobby() {

  const navigate =
    useNavigate()

  const {
    code = '',
  } = useParams()


  /* ========================================
     ÉTATS
  ======================================== */

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
    isStarting,
    setIsStarting,
  ] = useState(false)

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('')


  /* ========================================
     CHARGEMENT DU LOBBY
  ======================================== */

  useEffect(() => {

    let active =
      true


    async function loadLobby() {

      try {

        setLoading(
          true,
        )

        setErrorMessage(
          '',
        )


        const roomData =
          await getGameRoomByCode(
            code,
          )


        if (!roomData) {

          throw new Error(
            'Partie introuvable.',
          )

        }


        /*
          Empêche d'ouvrir ce lobby
          avec le code d'un autre jeu.
        */

        if (
          roomData.game !==
          'stock-and-stack'
        ) {

          throw new Error(
            'Cette salle appartient à un autre jeu.',
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


        /*
          Le joueur doit appartenir
          à cette salle.
        */

        const isMember =
          roomPlayers.some(
            player =>
              player.player_id ===
              playerId,
          )


        if (!isMember) {

          throw new Error(
            'Tu ne participes pas à cette partie.',
          )

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
          Si la partie a déjà commencé,
          aller directement au jeu.

          Si elle est terminée,
          la page du jeu pourra afficher
          le classement final.
        */

        if (
          roomData.status ===
            'playing' ||
          roomData.status ===
            'finished'
        ) {

          navigate(
            `/multiplayer/stock-and-stack/game/${roomData.code}`,
          )

        }

      } catch (error) {

        if (!active) {
          return
        }


        console.error(
          'Erreur lobby Stock & Stack :',
          error,
        )


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


    let active =
      true


    const channel =
      supabase
        .channel(
          `stock-stack-lobby-${room.id}`,
        )


        /*
          JOUEURS

          Met à jour les quatre
          emplacements lorsqu'un ami
          rejoint la salle.
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

              const updatedPlayers =
                await getRoomPlayers(
                  room.id,
                )


              if (!active) {
                return
              }


              setPlayers(
                updatedPlayers,
              )

            } catch (error) {

              console.error(
                'Erreur actualisation des joueurs :',
                error,
              )

            }

          },
        )


        /*
          SALLE

          Dès que l'hôte démarre,
          tous les joueurs rejoignent
          automatiquement la partie.
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

            if (!active) {
              return
            }


            const updatedRoom =
              payload.new as GameRoom


            setRoom(
              updatedRoom,
            )


            if (
              updatedRoom.status ===
                'playing' ||
              updatedRoom.status ===
                'finished'
            ) {

              navigate(
                `/multiplayer/stock-and-stack/game/${updatedRoom.code}`,
              )

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
    navigate,
  ])


  /* ========================================
     DÉMARRER LA PARTIE
  ======================================== */

  async function handleStartGame() {

    if (
      !room ||
      isStarting ||
      loading
    ) {
      return
    }


    /*
      Le bouton est réservé à l'hôte.
      Au moins deux joueurs sont requis.
    */

    if (
      currentPlayerId !==
        room.host_id ||
      players.length < 2 ||
      players.length > 4 ||
      room.status !== 'waiting'
    ) {
      return
    }


    setIsStarting(
      true,
    )

    setErrorMessage(
      '',
    )


    try {

      /*
        Réutilise la fonction commune
        de démarrage du multijoueur.

        L'état de la grille Stock & Stack
        sera initialisé par le composant
        du jeu, à l'étape suivante.
      */

      await startGameRoom(
        room.id,
      )


      /*
        Ne pas attendre uniquement
        l'événement Realtime :
        l'hôte peut naviguer aussitôt.
      */

      navigate(
        `/multiplayer/stock-and-stack/game/${room.code}`,
      )

    } catch (error) {

      console.error(
        'Erreur démarrage Stock & Stack :',
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

      setIsStarting(
        false,
      )

    }

  }


  /* ========================================
     AFFICHAGE
  ======================================== */

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
            '/multiplayer/stock-and-stack',
          )
        }
      >

        {tr("← Quitter")}</button>


      {/* ========================================
          TITRE
      ======================================== */}

      <div className="ecg-lobby-heading">

        <p className="ecg-lobby-eyebrow">
          {tr("STOCK & STACK • SALLE MULTIJOUEUR")}</p>


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
          CHARGEMENT
      ======================================== */}

      {loading && (

        <p className="ecg-lobby-status">

          {tr("Chargement...")}</p>

      )}


      {/* ========================================
          ERREUR
      ======================================== */}

      {errorMessage && (

        <p
          className="ecg-lobby-error"
          role="alert"
        >

          {tr(errorMessage)}

        </p>

      )}


      {/* ========================================
          JOUEURS
      ======================================== */}

      {!loading &&
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


                      {/* NUMÉRO */}

                      <div className="ecg-lobby-player-number">

                        {tr("JOUEUR ")}{index + 1}

                      </div>


                      {/* COULEUR */}

                      <div className="ecg-lobby-color-dot" />


                      {/* PSEUDO */}

                      {player ? (

                        <>

                          <strong>

                            {player.pseudo}

                          </strong>


                          <span>

                            {tr(color.label)}

                            {player.player_id ===
                              currentPlayerId
                              ? tr(' • TOI')
                              : ''}

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

                {players.length} / {room.max_players} {tr(" joueurs")}</p>


              {/* BOUTON DE L'HÔTE */}

              {currentPlayerId ===
                room.host_id && (

                <button

                  type="button"

                  disabled={
                    isStarting ||
                    players.length < 2 ||
                    players.length > 4 ||
                    room.status !== 'waiting'
                  }

                  onClick={
                    handleStartGame
                  }

                >

                  {isStarting
                    ? tr('Démarrage...')
                    : tr('Démarrer la partie')}


                  {!isStarting && (

                    <span>
                      →
                    </span>

                  )}

                </button>

              )}

            </div>


          </>

        )}

    </section>

  )

}


export default StockAndStackLobby
