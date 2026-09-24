import { useGameAudio } from '../hooks/useGameAudio'
import {
  useEffect,
  useRef,
} from 'react'

import backgroundMusic
  from '../assets/audio/background-music.mp3'


const MUSIC_VOLUME = 0.18


function BackgroundMusic() {
  const { setMusicVolume } = useGameAudio()


  const audioRef =
    useRef<HTMLAudioElement | null>(
      null
    )


  useEffect(() => {

    const audio =
      new Audio(
        backgroundMusic
      )

    audio.loop = true

    setMusicVolume(audio, MUSIC_VOLUME)

    audio.preload =
      'auto'

    audioRef.current =
      audio


    /*
      iPhone / iPad empêchent
      généralement le démarrage
      automatique du son.

      On attend donc la première
      interaction de l'utilisateur.
    */

    const startMusic =
      async () => {

        try {

          await audio.play()

          removeListeners()

        } catch {

          /*
            Si iOS refuse encore,
            on conserve les listeners
            pour réessayer à la prochaine
            interaction.
          */

        }

      }


    const removeListeners =
      () => {

        window.removeEventListener(
          'pointerdown',
          startMusic,
        )

        window.removeEventListener(
          'touchstart',
          startMusic,
        )

        window.removeEventListener(
          'keydown',
          startMusic,
        )

      }


    window.addEventListener(
      'pointerdown',
      startMusic,
      {
        passive: true,
      },
    )

    window.addEventListener(
      'touchstart',
      startMusic,
      {
        passive: true,
      },
    )

    window.addEventListener(
      'keydown',
      startMusic,
    )


    return () => {

      removeListeners()

      audio.pause()

      audio.src = ''

      audioRef.current =
        null

    }

  }, [setMusicVolume])


  return null
}


export default BackgroundMusic