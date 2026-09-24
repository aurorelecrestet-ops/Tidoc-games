
/* ========================================
   TI'DOC GAMES
   PARAMÈTRES AUDIO GLOBAUX

   - Musique activée / désactivée
   - Effets activés / désactivés
   - Volume musique
   - Volume effets
   - Tout couper
   - Sauvegarde locale
   - Synchronisation entre onglets
======================================== */


/* ========================================
   TYPES
======================================== */

export type AudioSettings = {

  musicEnabled: boolean

  effectsEnabled: boolean

  musicVolume: number

  effectsVolume: number

}


export type AudioSettingsListener = (
  settings: AudioSettings
) => void


/* ========================================
   VALEURS PAR DÉFAUT

   Les volumes vont de 0 à 100.
======================================== */

export const DEFAULT_AUDIO_SETTINGS:
  AudioSettings = {

    musicEnabled: true,

    effectsEnabled: true,

    musicVolume: 50,

    effectsVolume: 70,

  }


/* ========================================
   STOCKAGE
======================================== */

const STORAGE_KEY =
  'tidoc-games-audio-settings'


/* ========================================
   OUTILS
======================================== */

function clampVolume(
  value: number,
): number {

  if (
    !Number.isFinite(value)
  ) {

    return 0

  }


  return Math.max(

    0,

    Math.min(
      100,
      Math.round(value),
    ),

  )

}


function normalizeSettings(
  value: unknown,
): AudioSettings {

  if (
    !value ||
    typeof value !== 'object'
  ) {

    return {
      ...DEFAULT_AUDIO_SETTINGS,
    }

  }


  const input =
    value as Partial<AudioSettings>


  return {

    musicEnabled:

      typeof input.musicEnabled ===
      'boolean'

        ? input.musicEnabled

        : DEFAULT_AUDIO_SETTINGS
            .musicEnabled,


    effectsEnabled:

      typeof input.effectsEnabled ===
      'boolean'

        ? input.effectsEnabled

        : DEFAULT_AUDIO_SETTINGS
            .effectsEnabled,


    musicVolume:

      typeof input.musicVolume ===
      'number'

        ? clampVolume(
            input.musicVolume,
          )

        : DEFAULT_AUDIO_SETTINGS
            .musicVolume,


    effectsVolume:

      typeof input.effectsVolume ===
      'number'

        ? clampVolume(
            input.effectsVolume,
          )

        : DEFAULT_AUDIO_SETTINGS
            .effectsVolume,

  }

}


/* ========================================
   LIRE LES PRÉFÉRENCES ENREGISTRÉES
======================================== */

function loadAudioSettings():
  AudioSettings {

  if (
    typeof window ===
    'undefined'
  ) {

    return {
      ...DEFAULT_AUDIO_SETTINGS,
    }

  }


  try {

    const saved =
      window.localStorage.getItem(
        STORAGE_KEY,
      )


    if (!saved) {

      return {
        ...DEFAULT_AUDIO_SETTINGS,
      }

    }


    return normalizeSettings(
      JSON.parse(saved),
    )

  } catch (error) {

    console.warn(

      'Impossible de lire les paramètres audio :',

      error,

    )


    return {
      ...DEFAULT_AUDIO_SETTINGS,
    }

  }

}


/* ========================================
   ÉTAT AUDIO COMMUN

   Un seul état partagé par
   toute l'application.
======================================== */

let currentSettings:
  AudioSettings =
    loadAudioSettings()


/* ========================================
   ABONNÉS

   Les composants React et les jeux
   pourront écouter les changements.
======================================== */

const listeners =
  new Set<AudioSettingsListener>()


/* ========================================
   MUSIQUES ENREGISTRÉES

   Lorsqu'une musique est enregistrée,
   son volume peut être modifié
   immédiatement depuis les paramètres.
======================================== */

type RegisteredMusic = {

  audio: HTMLAudioElement

  baseVolume: number

}


const registeredMusic =
  new Set<RegisteredMusic>()


/* ========================================
   VOLUME EFFECTIF
======================================== */

export function getMusicVolume():
  number {

  if (
    !currentSettings.musicEnabled
  ) {

    return 0

  }


  return (
    currentSettings.musicVolume /
    100
  )

}


export function getEffectsVolume():
  number {

  if (
    !currentSettings.effectsEnabled
  ) {

    return 0

  }


  return (
    currentSettings.effectsVolume /
    100
  )

}


/* ========================================
   APPLIQUER LES RÉGLAGES AUX
   MUSIQUES ENREGISTRÉES
======================================== */

function applyMusicSettings() {

  const globalVolume =
    getMusicVolume()


  registeredMusic.forEach(
    entry => {

      entry.audio.volume =
        Math.max(

          0,

          Math.min(

            1,

            entry.baseVolume *
            globalVolume,

          ),

        )

    },
  )

}


/* ========================================
   NOTIFIER L'APPLICATION
======================================== */

function notifyListeners() {

  const snapshot = {
    ...currentSettings,
  }


  listeners.forEach(
    listener => {

      listener(
        snapshot,
      )

    },
  )

}


/* ========================================
   SAUVEGARDER LES PARAMÈTRES
======================================== */

function saveAudioSettings() {

  if (
    typeof window ===
    'undefined'
  ) {

    return

  }


  try {

    window.localStorage.setItem(

      STORAGE_KEY,

      JSON.stringify(
        currentSettings,
      ),

    )

  } catch (error) {

    console.warn(

      'Impossible d’enregistrer les paramètres audio :',

      error,

    )

  }

}


/* ========================================
   METTRE À JOUR LES PARAMÈTRES
======================================== */

export function updateAudioSettings(

  changes:
    Partial<AudioSettings>,

): AudioSettings {

  currentSettings =
    normalizeSettings({

      ...currentSettings,

      ...changes,

    })


  saveAudioSettings()


  applyMusicSettings()


  notifyListeners()


  return {
    ...currentSettings,
  }

}


/* ========================================
   LIRE L'ÉTAT ACTUEL
======================================== */

export function getAudioSettings():
  AudioSettings {

  return {
    ...currentSettings,
  }

}


/* ========================================
   ÉCOUTER LES CHANGEMENTS

   Retourne une fonction pour
   se désabonner.
======================================== */

export function subscribeAudioSettings(

  listener:
    AudioSettingsListener,

): () => void {

  listeners.add(
    listener,
  )


  return () => {

    listeners.delete(
      listener,
    )

  }

}


/* ========================================
   ACTIVER / COUPER LA MUSIQUE
======================================== */

export function setMusicEnabled(
  enabled: boolean,
) {

  return updateAudioSettings({

    musicEnabled:
      enabled,

  })

}


/* ========================================
   ACTIVER / COUPER LES EFFETS
======================================== */

export function setEffectsEnabled(
  enabled: boolean,
) {

  return updateAudioSettings({

    effectsEnabled:
      enabled,

  })

}


/* ========================================
   VOLUME MUSIQUE
======================================== */

export function setMusicVolume(
  volume: number,
) {

  return updateAudioSettings({

    musicVolume:
      clampVolume(
        volume,
      ),

  })

}


/* ========================================
   VOLUME EFFETS
======================================== */

export function setEffectsVolume(
  volume: number,
) {

  return updateAudioSettings({

    effectsVolume:
      clampVolume(
        volume,
      ),

  })

}


/* ========================================
   COUPER TOUS LES SONS

   Les volumes choisis restent
   enregistrés.
======================================== */

export function muteAllAudio() {

  return updateAudioSettings({

    musicEnabled: false,

    effectsEnabled: false,

  })

}


/* ========================================
   RÉACTIVER TOUS LES SONS

   On retrouve les volumes
   précédemment choisis.
======================================== */

export function unmuteAllAudio() {

  return updateAudioSettings({

    musicEnabled: true,

    effectsEnabled: true,

  })

}


/* ========================================
   SAVOIR SI TOUT EST COUPÉ
======================================== */

export function isAllAudioMuted():
  boolean {

  return (

    !currentSettings
      .musicEnabled &&

    !currentSettings
      .effectsEnabled

  )

}


/* ========================================
   REMETTRE LES PARAMÈTRES
   AUDIO PAR DÉFAUT
======================================== */

export function resetAudioSettings() {

  return updateAudioSettings({

    ...DEFAULT_AUDIO_SETTINGS,

  })

}


/* ========================================
   ENREGISTRER UNE MUSIQUE

   Exemple à utiliser dans un jeu :

   const unregisterMusic =
     registerGameMusic(audio, 0.18)

   0.18 correspond au volume propre
   à cette musique, avant réglage global.

   Appeler unregisterMusic()
   lors du démontage du jeu.
======================================== */

export function registerGameMusic(

  audio: HTMLAudioElement,

  baseVolume = 1,

): () => void {

  const entry:
    RegisteredMusic = {

      audio,

      baseVolume:
        Math.max(

          0,

          Math.min(
            1,
            baseVolume,
          ),

        ),

  }


  registeredMusic.add(
    entry,
  )


  applyMusicSettings()


  return () => {

    registeredMusic.delete(
      entry,
    )

  }

}


/* ========================================
   VOLUME POUR LES EFFETS SONORES

   Pour les jeux utilisant AudioContext :

   const volume =
     getEffectGain(0.1)

   Le résultat tient compte du
   volume choisi dans Paramètres.
======================================== */

export function getEffectGain(

  baseVolume = 1,

): number {

  return (

    Math.max(
      0,
      baseVolume,
    )

    *

    getEffectsVolume()

  )

}


/* ========================================
   SYNCHRONISATION ENTRE ONGLETS

   Exemple :
   modifier le volume dans un onglet
   met aussi à jour un autre onglet
   ouvert sur le même site.
======================================== */

if (
  typeof window !==
  'undefined'
) {

  window.addEventListener(

    'storage',

    event => {

      if (
        event.key !==
        STORAGE_KEY
      ) {

        return

      }


      currentSettings =
        loadAudioSettings()


      applyMusicSettings()


      notifyListeners()

    },

  )

}
