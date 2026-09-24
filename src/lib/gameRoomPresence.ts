import { supabase } from './supabase'


/* ========================================
   TI'DOC GAMES
   PRÉSENCE MULTIJOUEUR

   Fonction commune aux quatre jeux.

   Envoie un signal à Supabase
   toutes les 10 secondes.

   Ne supprime aucune salle.
   Ne déclare aucun Game Over.
======================================== */


const HEARTBEAT_INTERVAL_MS =
  10_000


/* ========================================
   ENVOYER UN SIGNAL DE PRÉSENCE
======================================== */

export async function sendGameRoomHeartbeat(
  roomId: string
): Promise<void> {

  const {
    error,
  } = await supabase.rpc(
    'heartbeat_game_room',
    {
      p_room_id: roomId,
    }
  )

  if (error) {
    throw error
  }

}


/* ========================================
   DÉMARRER LE SUIVI D'UNE SALLE

   À appeler lorsque le joueur
   entre dans une salle multijoueur.

   Retourne une fonction permettant
   d'arrêter le suivi.
======================================== */

export function startGameRoomPresence(
  roomId: string
): () => void {

  let stopped = false

  let heartbeatInProgress = false


  /* ========================================
     ENVOI SÉCURISÉ
  ======================================== */

  const heartbeat = async () => {

    if (
      stopped ||
      heartbeatInProgress
    ) {
      return
    }

    /*
      Éviter un appel inutile
      lorsque le navigateur indique
      qu'il n'a plus de connexion.
    */

    if (!navigator.onLine) {
      return
    }

    heartbeatInProgress = true

    try {

      await sendGameRoomHeartbeat(
        roomId
      )

    } catch (error) {

      /*
        Une erreur réseau ne signifie
        pas immédiatement un abandon.

        Le serveur décidera plus tard
        si le joueur a dépassé
        le délai de grâce.
      */

      console.warn(
        '[TiDoc Games] Présence multijoueur :',
        error
      )

    } finally {

      heartbeatInProgress = false

    }

  }


  /* ========================================
     SIGNAL IMMÉDIAT

     Dès l'entrée dans la salle.
  ======================================== */

  void heartbeat()


  /* ========================================
     SIGNAL TOUTES LES 10 SECONDES
  ======================================== */

  const intervalId =
    window.setInterval(
      () => {
        void heartbeat()
      },
      HEARTBEAT_INTERVAL_MS
    )


  /* ========================================
     RETOUR DEPUIS UN AUTRE ONGLET
     OU UNE AUTRE APPLICATION
  ======================================== */

  const handleVisibilityChange = () => {

    if (
      document.visibilityState ===
      'visible'
    ) {

      void heartbeat()

    }

  }


  /* ========================================
     RETOUR DE LA CONNEXION INTERNET
  ======================================== */

  const handleOnline = () => {

    void heartbeat()

  }


  document.addEventListener(
    'visibilitychange',
    handleVisibilityChange
  )

  window.addEventListener(
    'online',
    handleOnline
  )


  /* ========================================
     ARRÊTER LE SUIVI

     À appeler lorsque le composant
     quitte la salle.

     ATTENTION :
     arrêter le suivi ne signifie
     pas encore déclarer forfait.
  ======================================== */

  return () => {

    stopped = true

    window.clearInterval(
      intervalId
    )

    document.removeEventListener(
      'visibilitychange',
      handleVisibilityChange
    )

    window.removeEventListener(
      'online',
      handleOnline
    )

  }

}