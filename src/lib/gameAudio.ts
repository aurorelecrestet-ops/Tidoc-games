import { getEffectsVolume, getMusicVolume } from './audioSettings.ts'

// Conserve les volumes propres au jeu (décompte, démarrage…) et applique
// les préférences globales sans modifier les enveloppes des effets sonores.
export function createGameAudio() {
  const music = new Map<HTMLAudioElement, { volume: number; muted: boolean }>()
  const effects = new Map<AudioContext, GainNode>()

  function applyMusic(audio: HTMLAudioElement) {
    const entry = music.get(audio)!
    const volume = entry.volume * getMusicVolume()
    audio.volume = volume
    // `muted` fonctionne aussi sur les appareils ignorant `volume`.
    audio.muted = entry.muted || volume === 0
  }

  function musicEntry(audio: HTMLAudioElement) {
    let entry = music.get(audio)
    if (!entry) {
      entry = { volume: audio.volume, muted: audio.muted }
      music.set(audio, entry)
    }
    return entry
  }

  return {
    setMusicVolume(audio: HTMLAudioElement, volume: number) {
      musicEntry(audio).volume = Math.max(0, Math.min(1, volume))
      applyMusic(audio)
    },
    setMusicMuted(audio: HTMLAudioElement, muted: boolean) {
      musicEntry(audio).muted = muted
      applyMusic(audio)
    },
    getEffectsOutput(context: AudioContext): GainNode {
      let output = effects.get(context)
      if (!output) {
        output = context.createGain()
        output.gain.value = getEffectsVolume()
        output.connect(context.destination)
        effects.set(context, output)
      }
      return output
    },
    applySettings() {
      music.forEach((_, audio) => applyMusic(audio))
      effects.forEach((output, context) => {
        if (context.state !== 'closed') {
          output.gain.setValueAtTime(getEffectsVolume(), context.currentTime)
        }
      })
    },
    dispose() {
      music.forEach((_, audio) => audio.pause())
      effects.forEach(output => output.disconnect())
      music.clear()
      effects.clear()
    },
  }
}
