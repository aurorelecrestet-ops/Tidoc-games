/* ========================================
   TI'DOC GAMES
   LANGUES DE L'INTERFACE

   - Français par défaut
   - Anglais, espagnol, italien, roumain
   - Sauvegarde locale
   - Synchronisation entre onglets
   - Mise à jour de l'attribut <html lang>
======================================== */


/* ========================================
   TYPES
======================================== */

export type Language =
  | 'fr'
  | 'en'
  | 'es'
  | 'it'
  | 'ro'


export type LanguageListener = (
  language: Language,
) => void


export type LanguageOption = {
  code: Language

  /* Nom de la langue dans elle-même
     (ce que voit l'utilisateur dans le menu). */
  native: string

  /* Nom en anglais (utile pour les
     futurs fichiers de traduction). */
  english: string
}


/* ========================================
   VALEURS PAR DÉFAUT

   Le français reste la langue par défaut,
   quel que soit le navigateur.
======================================== */

export const DEFAULT_LANGUAGE: Language =
  'fr'


/* ========================================
   LANGUES PROPOSÉES DANS PARAMÈTRES
======================================== */

export const LANGUAGES: LanguageOption[] = [
  {
    code: 'fr',
    native: 'Français',
    english: 'French',
  },
  {
    code: 'en',
    native: 'English',
    english: 'English',
  },
  {
    code: 'es',
    native: 'Español',
    english: 'Spanish',
  },
  {
    code: 'it',
    native: 'Italiano',
    english: 'Italian',
  },
  {
    code: 'ro',
    native: 'Română',
    english: 'Romanian',
  },
]


/* ========================================
   STOCKAGE
======================================== */

const STORAGE_KEY =
  'tidoc-games-language'


const listeners:
  Set<LanguageListener> =
    new Set()


/* ========================================
   OUTILS
======================================== */

function isLanguage(
  value: unknown,
): value is Language {

  return LANGUAGES.some(
    option => option.code === value,
  )

}


function loadLanguage(): Language {

  if (
    typeof window === 'undefined'
  ) {

    return DEFAULT_LANGUAGE

  }


  try {

    const saved =
      window.localStorage.getItem(
        STORAGE_KEY,
      )


    return isLanguage(saved)

      ? saved

      : DEFAULT_LANGUAGE

  } catch {

    return DEFAULT_LANGUAGE

  }

}


let currentLanguage: Language =
  loadLanguage()


function applyDocumentLanguage(
  language: Language,
) {

  if (
    typeof document === 'undefined'
  ) {

    return

  }


  document.documentElement.lang =
    language

}


function notifyListeners() {

  listeners.forEach(
    listener => {
      listener(currentLanguage)
    },
  )

}


/* ========================================
   LIRE LA LANGUE COURANTE
======================================== */

export function getLanguage(): Language {

  return currentLanguage

}


/* ========================================
   CHANGER DE LANGUE
======================================== */

export function setLanguage(
  language: Language,
) {

  if (
    !isLanguage(language)
  ) {

    return

  }


  currentLanguage = language


  if (
    typeof window !== 'undefined'
  ) {

    try {

      window.localStorage.setItem(
        STORAGE_KEY,
        language,
      )

    } catch {

      /* Stockage indisponible :
         la langue reste en mémoire. */

    }

  }


  applyDocumentLanguage(language)


  notifyListeners()

}


/* ========================================
   S'ABONNER AUX CHANGEMENTS DE LANGUE

   Utilisé par le hook useTranslation.
======================================== */

export function subscribeLanguage(
  listener: LanguageListener,
): () => void {

  listeners.add(listener)


  return () => {

    listeners.delete(listener)

  }

}


/* ========================================
   DÉMARRAGE

   Applique la langue enregistrée
   au chargement du module.
======================================== */

applyDocumentLanguage(currentLanguage)


/* ========================================
   SYNCHRONISATION ENTRE ONGLETS
======================================== */

if (
  typeof window !== 'undefined'
) {

  window.addEventListener(
    'storage',
    event => {

      if (
        event.key !== STORAGE_KEY
      ) {

        return

      }


      currentLanguage = loadLanguage()


      applyDocumentLanguage(
        currentLanguage,
      )


      notifyListeners()

    },
  )

}
