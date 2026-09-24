/* ========================================
   TI'DOC GAMES
   DICTIONNAIRES DE TRADUCTION

   - fr : source de vérité (toutes les clés)
   - ro : interface roumaine (les textes des
          jeux et documents sont dans gameText.ro.ts)
   - en : interface anglaise complète
   - es : interface espagnole complète
   - it : interface italienne complète

   Pour ajouter une langue :
   1. créer src/i18n/xx.ts avec les clés
   2. l'importer ici
   3. l'ajouter au tableau translations
======================================== */

import { fr } from './fr'

import { ro } from './ro'
import { en } from './en'
import { es } from './es'
import { it } from './it'

import type { Language } from './languages'


/* Clés disponibles (définies par le français). */
export type TranslationKey =
  keyof typeof fr


export type TranslationDict =
  Partial<Record<TranslationKey, string>>


/* ========================================
   TABLEAU DES DICTIONNAIRES
======================================== */

export const translations:
  Record<Language, TranslationDict> = {

    fr,

    ro,

    en,

    es,

    it,

  }


/* ========================================
   TRADUIRE UNE CLÉ

   Priorité :
   1. dictionnaire de la langue choisie
   2. français (langue par défaut)
   3. la clé elle-même (jamais de trou)
======================================== */

export function translate(
  language: Language,
  key: TranslationKey,
): string {

  return (

    translations[language]?.[key]

    ?? fr[key]

    ?? String(key)

  )

}
