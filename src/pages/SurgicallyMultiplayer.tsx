import { tr } from '../i18n/gameText'

import {
  useState,
} from 'react'

import {
  useNavigate,
} from 'react-router-dom'

import {
  createGameRoom,
  getGameRoomByCode,
  joinGameRoom,
} from '../lib/multiplayer'

import './SurgicallyMultiplayer.css'


function SurgicallyMultiplayer() {

  const navigate =
    useNavigate()

  const [
    roomCode,
    setRoomCode,
  ] = useState('')

  const [
    isCreating,
    setIsCreating,
  ] = useState(false)

  const [
    isJoining,
    setIsJoining,
  ] = useState(false)

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('')


  /* ========================================
     CRÉER UNE PARTIE
  ======================================== */

  async function handleCreateGame() {

    if (isCreating) {
      return
    }

    setIsCreating(true)
    setErrorMessage('')

    try {

      const room =
        await createGameRoom(
          'surgically-insane'
        )

      navigate(
        `/multiplayer/surgically-insane/lobby/${room.code}`
      )

    } catch (error) {

      console.error(
        'Erreur création partie chirurgie :',
        error
      )

      const message =
        error &&
        typeof error === 'object' &&
        'message' in error
          ? String(error.message)
          : 'Impossible de créer la partie.'

      setErrorMessage(
        message
      )

    } finally {

      setIsCreating(false)

    }
  }


  /* ========================================
     REJOINDRE UNE PARTIE
  ======================================== */


async function handleJoinGame() {

  const code =
    roomCode
      .trim()
      .toUpperCase()

  if (
    !code ||
    isJoining
  ) {
    return
  }

  setIsJoining(true)
  setErrorMessage('')

 try {

  const existingRoom =
    await getGameRoomByCode(code)

  if (!existingRoom) {
    throw new Error(
      'Partie introuvable.'
    )
  }

  if (
    existingRoom.game !==
    'surgically-insane'
  ) {
    throw new Error(
      'Ce code correspond à un autre jeu.'
    )
  }

  const room =
    await joinGameRoom(code)

  navigate(
    `/multiplayer/surgically-insane/lobby/${room.code}`
  )

}
catch (error) {

    console.error(
      'Erreur rejoindre partie chirurgie :',
      error
    )

    const message =
      error &&
      typeof error === 'object' &&
      'message' in error
        ? String(error.message)
        : 'Impossible de rejoindre la partie.'

    setErrorMessage(
      message
    )

  } finally {

    setIsJoining(false)

  }
}



  /* ========================================
     AFFICHAGE
  ======================================== */

  return (

    <section className="surgically-multi-page">

      <button
        type="button"
        className="surgically-multi-back"
        onClick={() =>
          navigate('/multiplayer')
        }
      >
        {tr("← Retour")}</button>


      <div className="surgically-multi-heading">

        <div className="surgically-multi-icon">

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


        <p className="surgically-multi-eyebrow">
          {tr("CHIRURGIE • MULTIJOUEUR")}</p>

        <h1>
          Surgically{' '}
          <span>Insane</span>
        </h1>

        <p className="surgically-multi-subtitle">
          {tr("Crée une partie ou rejoins tes amis avec un code.")}</p>

      </div>


      <div className="surgically-multi-options">

        {/* CRÉER */}

        <article className="surgically-multi-card">

          <div className="surgically-multi-card-number">
            01
          </div>

          <h2>
            {tr("Créer une partie")}</h2>

          <p>
            {tr("Crée une salle et invite jusqu'à trois autres joueurs.")}</p>

          <div className="surgically-multi-player-count">
            <span>●</span>
            {tr("2 à 4 joueurs")}</div>

          <button
            type="button"
            className="surgically-multi-primary"
            onClick={handleCreateGame}
            disabled={isCreating}
          >

            {isCreating
              ? tr('Création...')
              : tr('Créer une partie')}

            {!isCreating && (
              <span>→</span>
            )}

          </button>

        </article>


        {/* REJOINDRE */}

        <article className="surgically-multi-card">

          <div className="surgically-multi-card-number">
            02
          </div>

          <h2>
            {tr("Rejoindre")}</h2>

          <p>
            {tr("Entre le code de la partie communiqué par l'hôte.")}</p>

          <input
            className="surgically-multi-code-input"
            type="text"
            value={roomCode}
            maxLength={6}
            placeholder={tr("CODE")}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            onChange={event =>
              setRoomCode(
                event.target.value
                  .toUpperCase()
                  .replace(
                    /[^A-Z0-9]/g,
                    ''
                  )
              )
            }
          />

          <button
            type="button"
            className="surgically-multi-secondary"
            disabled={
              roomCode.length === 0 ||
              isJoining
            }
            onClick={handleJoinGame}
          >

            {isJoining
              ? tr('Connexion...')
              : tr('Rejoindre la partie')}

            {!isJoining && (
              <span>→</span>
            )}

          </button>

        </article>

      </div>


      {errorMessage && (

        <p
          className="surgically-multi-error"
          role="alert"
        >
          {tr(errorMessage)}
        </p>

      )}

    </section>
  )
}


export default SurgicallyMultiplayer
