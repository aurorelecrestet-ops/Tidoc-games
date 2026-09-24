import { tr } from '../i18n/gameText'
import {
  useState,
} from 'react'

import {
  useNavigate,
} from 'react-router-dom'

import './ECGMultiplayer.css'

import {
  createGameRoom,
  joinGameRoom,
} from '../lib/multiplayer'

function ECGMultiplayer() {

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
  errorMessage,
  setErrorMessage,
] = useState('')

  async function handleCreateGame() {

  if (isCreating) {
    return
  }

  setIsCreating(true)
  setErrorMessage('')

  try {

    const room =
      await createGameRoom('ecg')

    console.log(
      'Partie créée :',
      room,
    )

    navigate(
  `/multiplayer/ecg/lobby/${room.code}`
)
  } catch (error) {

  console.error(
    'Erreur création partie :',
    error,
  )

  const message =
    error &&
    typeof error === 'object' &&
    'message' in error
      ? String(error.message)
      : JSON.stringify(
          error,
          null,
          2,
        )

  setErrorMessage(
    message
  )

} finally {

    setIsCreating(false)

  }
}


  async function handleJoinGame() {

  const code =
    roomCode
      .trim()
      .toUpperCase()

  if (!code) {
    return
  }

  setErrorMessage('')

  try {

    const room =
      await joinGameRoom(code)

    navigate(
      `/multiplayer/ecg/lobby/${room.code}`
    )

  } catch (error) {

    console.error(
      'Erreur rejoindre partie :',
      error,
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
  }
}


  return (

    <section className="ecg-multi-page">

      <button
        type="button"
        className="ecg-multi-back"
        onClick={() =>
          navigate('/multiplayer')
        }
      >
        {tr("← Retour")}</button>


      <div className="ecg-multi-heading">

        <div className="ecg-multi-icon">

          <svg
  viewBox="0 0 512 512"
  aria-hidden="true"
>
  <g>
    <path
      fill="currentColor"
      d="M435.924,97.105c-4.452-7.72-10.798-14.374-16.971-18.044c-4.12-2.479-7.996-3.6-11.311-3.6
      c-2.652.016-5.036.615-7.743,2.242c-40.553,24.793-74.005,55.727-98.546,90.127
      c-24.557,34.392-40.217,72.217-45.427,110.918c-.813,5.992-6.322,10.183-12.306,9.378
      c-5.999-.797-10.19-6.307-9.393-12.298c5.739-42.593,22.915-83.734,49.302-120.722
      c13.79-19.292,30.105-37.462,48.623-54.149c-6.882-14.019-3.631-28.504,3.363-41.875
      c3.67-7.017,7.562-13.442,10.285-19.844c-.118-.323-.402-.868-.892-1.562
      c-1.042-1.5-3.039-3.561-5.636-5.581c-5.21-4.088-12.787-8.059-19.568-10.332
      c-4.492-1.539-8.699-2.297-11.051-2.258l-.671.008c-.379.718-.828,1.594-1.318,2.589
      c-1.002,2.044-2.233,4.586-3.623,7.324c-2.85,5.487-6.338,11.801-11.162,17.413
      c-3.228,3.726-7.12,7.286-12.353,9.614c-2.96,1.318-6.402,2.163-9.985,2.139
      c-18.456.079-27.627-17.192-29.798-33.089c-.378-2.826-.544-5.289-.544-7.396
      c0-.656,0-1.232,0-1.752c.008-1.76-.087-2.66-.158-2.936c-.102-.293.016-.158-.386-.734
      c-.285-.379-.861-1.01-1.903-1.871c-1.279-1.105-3.994-2.478-7.672-3.362
      c-3.655-.9-8.186-1.373-12.843-1.366c-4.184,0-8.477.364-12.361,1.018
      c-21.391,3.544-17.057,17.113-17.057,34.708c0,4.278-.174,9.108-.727,14.516
      c-.592,6.165-2.162,11.911-4.451,17.208c-2.274,5.288-5.257,10.087-8.659,14.563
      c-6.797,8.936-15.18,16.593-24.099,24.676c-17.855,16.141-38.014,33.831-54.386,63.408
      c-38.851,70.306-31.329,152.912,8.865,220.747c22.772,38.536,55.111,72.525,92.44,93.254
      C220.729,504.012,247.772,512,276.054,512c11.706,0,23.649-1.366,35.79-4.294
      c12.795-3.52,26.064-11.398,38.685-23.104c12.684-11.722,24.663-27.201,34.908-45.292
      c20.523-36.184,34.021-82.778,33.974-130.313c0-36.641-7.949-73.763-26.491-107.674
      c-2.534,2.85-4.957,5.81-7.23,8.904c-5.825,7.948-10.728,16.734-14.256,26.814
      c-2.004,5.714-8.252,8.722-13.952,6.71c-5.706-1.989-8.706-8.225-6.709-13.94
      c4.294-12.322,10.324-23.097,17.282-32.545c6.955-9.456,14.816-17.618,22.868-24.864
      c16.095-14.484,32.971-25.527,45.222-35.662c2.463-2.06,4.057-4.294,5.193-6.93
      c1.106-2.644,1.689-5.746,1.689-9.259C443.091,113.46,440.47,104.809,435.924,97.105z"
    />

    <path
      fill="currentColor"
      d="M90.843,74.412c2.43,4.933,5.098,10.696,7.601,17.026c3.717,9.378,7.119,19.962,8.659,31.006
      c6.748-7.168,13.426-13.49,19.678-19.174c8.628-7.862,16.387-14.658,22.458-21.068
      c-2.731-2.526-5.037-5.352-7.223-8.422c-5.06-7.151-9.519-15.605-13.766-23.325
      c-2.518-4.626-4.934-8.904-7.128-12.33c-.663-.189-1.839-.394-3.394-.386
      c-2.439-.008-5.715.481-9.401,1.76c-3.678,1.279-7.767,3.355-11.966,6.512
      c-5.352,4.002-8.407,7.507-10.025,10.08c-1.594,2.597-1.807,4.168-1.815,5.067
      c0,.726.142,1.137.316,1.484C86.257,65.413,88.427,69.502,90.843,74.412z"
    />
  </g>
</svg>

        </div>

        <p className="ecg-multi-eyebrow">
          {tr("CARDIOLOGIE • MULTIJOUEUR")}</p>

        <h1>
          Beat <span>Catcher</span>
        </h1>

        <p className="ecg-multi-subtitle">
          {tr("Crée une partie ou rejoins tes amis avec un code.")}</p>

      </div>


      <div className="ecg-multi-options">


        {/* CRÉER */}

        <article className="ecg-multi-card">

          <div className="ecg-multi-card-number">
            01
          </div>

          <h2>
            {tr("Créer une partie")}</h2>

          <p>
            {tr("Crée une salle et invite jusqu'à trois autres joueurs.")}</p>

          <div className="ecg-multi-player-count">
            <span>●</span>
            {tr("2 à 4 joueurs")}</div>

          <button
  type="button"
  className="ecg-multi-primary"
  onClick={
    handleCreateGame
  }
  disabled={
    isCreating
  }
>
  {isCreating
    ? tr('Création...')
    : tr('Créer une partie')
  }

  {!isCreating && (
    <span>→</span>
  )}
</button>

{errorMessage && (
  <p className="ecg-multi-error">
    {tr(errorMessage)}
  </p>
)}

        </article>


        {/* REJOINDRE */}

        <article className="ecg-multi-card">

          <div className="ecg-multi-card-number">
            02
          </div>

          <h2>
            {tr("Rejoindre")}</h2>

          <p>
            {tr("Entre le code de la partie communiqué par l'hôte.")}</p>

          <input
            className="ecg-multi-code-input"
            type="text"
            value={
              roomCode
            }
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
                    '',
                  ),
              )
            }
          />

          <button
            type="button"
            className="ecg-multi-secondary"
            disabled={
              roomCode.length === 0
            }
            onClick={
              handleJoinGame
            }
          >
            {tr("Rejoindre la partie")}<span>→</span>
          </button>

        </article>

      </div>

    </section>
  )
}


export default ECGMultiplayer