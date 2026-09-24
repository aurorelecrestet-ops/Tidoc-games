/* ========================================
   TI'DOC GAMES
   HOOK DE TRADUCTION

   const { language, setLanguage, t } =
     useTranslation()

   t('settings.audioTitle') renvoie le
   texte dans la langue choisie dans
   Paramètres (fr par défaut).
======================================== */

import {

  useCallback,

  useEffect,

  useState,

} from 'react'


import {

  getLanguage,

  setLanguage,

  subscribeLanguage,

  type Language,

} from '../i18n/languages'


import {

  translate,

  type TranslationKey,

} from '../i18n'


export function useTranslation() {

  const [
    language,
    setLanguageState,
  ] = useState<Language>(
    () => getLanguage(),
  )


  /* Changement de langue dans Paramètres
     (ou depuis un autre onglet). */
  useEffect(
    () => subscribeLanguage(
      setLanguageState,
    ),
    [],
  )


  const t = useCallback(

    (key: TranslationKey) =>
      translate(language, key),

    [language],

  )


  return {
    language,
    setLanguage,
    t,
  }

}
