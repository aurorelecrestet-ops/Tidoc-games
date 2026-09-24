import { useEffect, useState } from 'react'
import { subscribeAudioSettings } from '../lib/audioSettings'
import { createGameAudio } from '../lib/gameAudio'

export function useGameAudio() {
  const [audio] = useState(createGameAudio)
  useEffect(() => {
    audio.applySettings()
    const unsubscribe = subscribeAudioSettings(audio.applySettings)
    return () => {
      unsubscribe()
      audio.dispose()
    }
  }, [audio])
  return audio
}
