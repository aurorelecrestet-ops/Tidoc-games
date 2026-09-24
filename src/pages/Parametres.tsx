import { tr } from '../i18n/gameText'

import {
  useEffect,
  useState,
  type CSSProperties,
} from 'react'

import {
  useNavigate,
} from 'react-router-dom'

import {
  DEFAULT_AUDIO_SETTINGS,
  getAudioSettings,
  subscribeAudioSettings,
  setMusicEnabled,
  setEffectsEnabled,
  setMusicVolume,
  setEffectsVolume,
  muteAllAudio,
  unmuteAllAudio,
  updateAudioSettings,
  type AudioSettings,
} from '../lib/audioSettings'

import { useTranslation } from '../hooks/useTranslation'

import { LANGUAGES } from '../i18n/languages'

import './Parametres.css'


/* ========================================
   TI'DOC GAMES — PARAMÈTRES
======================================== */


/* ========================================
   LIENS TI'DOC

   Vérifier l'adresse de contact
   avant la mise en production.
======================================== */

const CONTACT_EMAIL =
  'tidoc.congres@gmail.com'

const TIDOC_INSTAGRAM =
  'https://www.instagram.com/congres_tidoc/'

const TIDOC_TIKTOK =
  'https://www.tiktok.com/@congres_tidoc'

const TIDOC_WEBSITE =
  'https://tidoccongres.fr/'


/* ========================================
   PETITE ICÔNE FLÈCHE
======================================== */

function ChevronIcon() {

  return (

    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >

      <path d="m9 18 6-6-6-6" />

    </svg>

  )

}


/* ========================================
   ICÔNE AUDIO
======================================== */

function AudioIcon() {

  return (

    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >

      <path d="M11 5 6 9H3v6h3l5 4V5Z" />

      <path d="M15.5 8.5a5 5 0 0 1 0 7" />

      <path d="M19 5a10 10 0 0 1 0 14" />

    </svg>

  )

}


/* ========================================
   ICÔNE PLUS DE PARAMÈTRES
======================================== */

function SettingsIcon() {

  return (

    <svg
              className="nav-icon"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >

              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M14.2788 2.15224C13.9085 2 13.439 2 12.5 2C11.561 2 11.0915 2 10.7212 2.15224C10.2274 2.35523 9.83509 2.74458 9.63056 3.23463C9.53719 3.45834 9.50065 3.7185 9.48635 4.09799C9.46534 4.65568 9.17716 5.17189 8.69017 5.45093C8.20318 5.72996 7.60864 5.71954 7.11149 5.45876C6.77318 5.2813 6.52789 5.18262 6.28599 5.15102C5.75609 5.08178 5.22018 5.22429 4.79616 5.5472C4.47814 5.78938 4.24339 6.1929 3.7739 6.99993C3.30441 7.80697 3.06967 8.21048 3.01735 8.60491C2.94758 9.1308 3.09118 9.66266 3.41655 10.0835C3.56506 10.2756 3.77377 10.437 4.0977 10.639C4.57391 10.936 4.88032 11.4419 4.88029 12C4.88026 12.5581 4.57386 13.0639 4.0977 13.3608C3.77372 13.5629 3.56497 13.7244 3.41645 13.9165C3.09108 14.3373 2.94749 14.8691 3.01725 15.395C3.06957 15.7894 3.30432 16.193 3.7738 17C4.24329 17.807 4.47804 18.2106 4.79606 18.4527C5.22008 18.7756 5.75599 18.9181 6.28589 18.8489C6.52778 18.8173 6.77305 18.7186 7.11133 18.5412C7.60852 18.2804 8.2031 18.27 8.69012 18.549C9.17714 18.8281 9.46533 19.3443 9.48635 19.9021C9.50065 20.2815 9.53719 20.5417 9.63056 20.7654C9.83509 21.2554 10.2274 21.6448 10.7212 21.8478C11.0915 22 11.561 22 12.5 22C13.439 22 13.9085 22 14.2788 21.8478C14.7726 21.6448 15.1649 21.2554 15.3694 20.7654C15.4628 20.5417 15.4994 20.2815 15.5137 19.902C15.5347 19.3443 15.8228 18.8281 16.3098 18.549C16.7968 18.2699 17.3914 18.2804 17.8886 18.5412C18.2269 18.7186 18.4721 18.8172 18.714 18.8488C19.2439 18.9181 19.7798 18.7756 20.2038 18.4527C20.5219 18.2105 20.7566 17.807 21.2261 16.9999C21.6956 16.1929 21.9303 15.7894 21.9827 15.395C22.0524 14.8691 21.9088 14.3372 21.5835 13.9164C21.4349 13.7243 21.2262 13.5628 20.9022 13.3608C20.4261 13.0639 20.1197 12.558 20.1197 11.9999C20.1197 11.4418 20.4261 10.9361 20.9022 10.6392C21.2263 10.4371 21.435 10.2757 21.5836 10.0835C21.9089 9.66273 22.0525 9.13087 21.9828 8.60497C21.9304 8.21055 21.6957 7.80703 21.2262 7C20.7567 6.19297 20.522 5.78945 20.2039 5.54727C19.7799 5.22436 19.244 5.08185 18.7141 5.15109C18.4722 5.18269 18.2269 5.28136 17.8887 5.4588C17.3915 5.71959 16.7969 5.73002 16.3099 5.45096C15.8229 5.17191 15.5347 4.65566 15.5136 4.09794C15.4993 3.71848 15.4628 3.45833 15.3694 3.23463C15.1649 2.74458 14.7726 2.35523 14.2788 2.15224ZM12.5 15C14.1695 15 15.5228 13.6569 15.5228 12C15.5228 10.3431 14.1695 9 12.5 9C10.8305 9 9.47716 10.3431 9.47716 12C9.47716 13.6569 10.8305 15 12.5 15Z"
              />

            </svg>

  )

}


/* ========================================
   ICÔNE LANGUE
======================================== */

function LanguageIcon() {

  return (

    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >

      <circle cx="12" cy="12" r="9" />

      <path d="M3 12h18" />

      <path d="M12 3a13.5 13.5 0 0 1 3.5 9 13.5 13.5 0 0 1-3.5 9 13.5 13.5 0 0 1-3.5-9 13.5 13.5 0 0 1 3.5-9Z" />

    </svg>

  )

}


/* ========================================
   PAGE PARAMÈTRES
======================================== */

function Parametres() {

  const navigate =
    useNavigate()


  /* ========================================
     LANGUE

     Choix de langue enregistré
     dans le menu ci-dessous.
  ======================================== */

  const {
    language,
    setLanguage,
    t,
  } = useTranslation()


  /* Titre coupé au niveau du "|". */
  const [
    titleStart,
    titleEnd = '',
  ] = t('settings.title').split('|')


  /* ========================================
     AUDIO
  ======================================== */

  const [
    audioSettings,
    setAudioSettings,
  ] = useState<AudioSettings>(
    () => getAudioSettings(),
  )


  /* ========================================
     PARTAGE
  ======================================== */

  const [
    shareMessage,
    setShareMessage,
  ] = useState('')


  /* ========================================
     À PROPOS
  ======================================== */

  const [
    aboutOpen,
    setAboutOpen,
  ] = useState(false)


  /* ========================================
     SYNCHRONISATION AUDIO
  ======================================== */

  useEffect(() => {

    setAudioSettings(
      getAudioSettings(),
    )


    return subscribeAudioSettings(
      settings => {

        setAudioSettings(
          settings,
        )

      },
    )

  }, [])


  /* ========================================
     TOUT COUPER / TOUT RÉACTIVER
  ======================================== */

  const allMuted =

    !audioSettings.musicEnabled &&

    !audioSettings.effectsEnabled


  function handleToggleAllAudio() {

    if (
      allMuted
    ) {

      unmuteAllAudio()

    } else {

      muteAllAudio()

    }

  }


  /* ========================================
     RÉINITIALISER UNIQUEMENT
     LA MUSIQUE
  ======================================== */

  function handleResetMusic() {

    updateAudioSettings({

      musicEnabled:
        DEFAULT_AUDIO_SETTINGS
          .musicEnabled,

      musicVolume:
        DEFAULT_AUDIO_SETTINGS
          .musicVolume,

    })

  }


  /* ========================================
     RÉINITIALISER UNIQUEMENT
     LES EFFETS SONORES
  ======================================== */

  function handleResetEffects() {

    updateAudioSettings({

      effectsEnabled:
        DEFAULT_AUDIO_SETTINGS
          .effectsEnabled,

      effectsVolume:
        DEFAULT_AUDIO_SETTINGS
          .effectsVolume,

    })

  }


  /* ========================================
     PARTAGER TI'DOC GAMES

     Sur iPhone / iPad :
     feuille de partage native.

     Sinon :
     copie du lien si disponible.
  ======================================== */

  async function handleShare() {

    setShareMessage(
      '',
    )


    const shareData = {

      title:
        "Ti'Doc Games",

      text:
        t('settings.shareInvite'),

      url:
        window.location.origin,

    }


    try {

      if (
        navigator.share
      ) {

        await navigator.share(
          shareData,
        )


        return

      }


      if (
        navigator.clipboard?.writeText
      ) {

        await navigator.clipboard.writeText(
          shareData.url,
        )


        setShareMessage(
          t('settings.shareCopied'),
        )


        return

      }


      setShareMessage(
        t('settings.shareUnavailable'),
      )

    } catch (
      error
    ) {

      /*
        Une annulation volontaire
        de la feuille de partage
        n'est pas une erreur.
      */

      if (

        error instanceof DOMException &&

        error.name ===
          'AbortError'

      ) {

        return

      }


      console.error(
        'Erreur de partage :',
        error,
      )


      setShareMessage(
        t('settings.shareError'),
      )

    }

  }


  /* ========================================
     CONTACT
  ======================================== */

  function handleContact() {

    const subject =
      encodeURIComponent(
        t('settings.contactSubject'),
      )


    window.location.href =
      `mailto:${CONTACT_EMAIL}?subject=${subject}`

  }


  /* ========================================
     AFFICHAGE
  ======================================== */

  return (

    <section className="settings-page">


      {/* ========================================
          RETOUR
      ======================================== */}

      <button

        type="button"

        className="settings-back"

        onClick={() =>
          navigate('/')
        }

      >

        ← {t('settings.backToHome')}

      </button>


      {/* ========================================
          EN-TÊTE
      ======================================== */}

      <div className="settings-heading">


        <p className="settings-eyebrow">

          TI'DOC GAMES

        </p>


        <h1>

          {titleStart}

          <span>
            {titleEnd}
          </span>

        </h1>


        <p className="settings-subtitle">

          {t('settings.subtitleLine1')}

          <br />

          {t('settings.subtitleLine2')}

        </p>

      </div>


      {/* ========================================
          CONTENU
      ======================================== */}

      <div className="settings-content">


        {/* ========================================
            CARTE AUDIO
        ======================================== */}

        <section

          className="settings-card"

          aria-labelledby="settings-audio-title"

        >


          {/* TITRE */}

          <div className="settings-card-heading">


            <div className="settings-card-icon">

              <AudioIcon />

            </div>


            <div>


              <p className="settings-section-label">

                {t('settings.sectionExperience')}

              </p>


              <h2 id="settings-audio-title">

                {t('settings.audioTitle')}

              </h2>

            </div>

          </div>


          <p className="settings-card-description">

            {t('settings.audioDescription')}

          </p>


          {/* ========================================
              TOUT COUPER
          ======================================== */}

          <div className="settings-master-audio">


            <div>


              <strong>

                {allMuted

                  ? t('settings.allMutedTitle')

                  : t('settings.appSoundTitle')}

              </strong>


              <p>

                {allMuted

                  ? t('settings.allMutedDescription')

                  : t('settings.appSoundDescription')}

              </p>

            </div>


            <button

              type="button"

              className={
                `settings-master-button ${
                  allMuted
                    ? 'is-muted'
                    : ''
                }`
              }

              onClick={
                handleToggleAllAudio
              }

              aria-pressed={
                allMuted
              }

            >

              {allMuted

                ? t('settings.unmuteAll')

                : t('settings.muteAll')}

            </button>

          </div>


          {/* ========================================
              MUSIQUE
          ======================================== */}

          <div className="settings-audio-group">


            <div className="settings-setting-row">


              <div className="settings-setting-description">


                <strong>

                  {t('settings.music')}

                </strong>


                <p>

                  {t('settings.musicDescription')}

                </p>

              </div>


              <button

                type="button"

                className={
                  `settings-switch ${
                    audioSettings.musicEnabled
                      ? 'is-on'
                      : ''
                  }`
                }

                role="switch"

                aria-label={t('settings.toggleMusic')}

                aria-checked={
                  audioSettings.musicEnabled
                }

                onClick={() =>

                  setMusicEnabled(

                    !audioSettings.musicEnabled,

                  )

                }

              >

                <span />

              </button>

            </div>


            {/* VOLUME MUSIQUE */}

            <div

              className={
                `settings-volume-control ${
                  !audioSettings.musicEnabled
                    ? 'is-disabled'
                    : ''
                }`
              }

            >


              <div className="settings-volume-heading">


                <label htmlFor="settings-music-volume">

                  {t('settings.musicVolume')}

                </label>


                <output htmlFor="settings-music-volume">

                  {audioSettings.musicVolume} %

                </output>

              </div>


              <input

                id="settings-music-volume"

                type="range"

                min="0"

                max="100"

                step="1"

                value={
                  audioSettings.musicVolume
                }

                disabled={
                  !audioSettings.musicEnabled
                }

                onChange={event =>

                  setMusicVolume(

                    Number(
                      event.target.value,
                    ),

                  )

                }

                style={{

                  '--settings-progress':
                    `${audioSettings.musicVolume}%`,

                } as CSSProperties}

              />


              {/* RÉINITIALISATION MUSIQUE */}

              <div className="settings-inline-reset">

                <button

                  type="button"

                  className="settings-inline-reset-button"

                  onClick={
                    handleResetMusic
                  }

                >

                  {t('settings.resetMusic')}

                </button>

              </div>

            </div>

          </div>


          <div className="settings-divider" />


          {/* ========================================
              EFFETS SONORES
          ======================================== */}

          <div className="settings-audio-group">


            <div className="settings-setting-row">


              <div className="settings-setting-description">


                <strong>

                  {t('settings.effects')}

                </strong>


                <p>

                  {t('settings.effectsDescription')}

                </p>

              </div>


              <button

                type="button"

                className={
                  `settings-switch ${
                    audioSettings.effectsEnabled
                      ? 'is-on'
                      : ''
                  }`
                }

                role="switch"

                aria-label={t('settings.toggleEffects')}

                aria-checked={
                  audioSettings.effectsEnabled
                }

                onClick={() =>

                  setEffectsEnabled(

                    !audioSettings.effectsEnabled,

                  )

                }

              >

                <span />

              </button>

            </div>


            {/* VOLUME EFFETS */}

            <div

              className={
                `settings-volume-control ${
                  !audioSettings.effectsEnabled
                    ? 'is-disabled'
                    : ''
                }`
              }

            >


              <div className="settings-volume-heading">


                <label htmlFor="settings-effects-volume">

                  {t('settings.effectsVolume')}

                </label>


                <output htmlFor="settings-effects-volume">

                  {audioSettings.effectsVolume} %

                </output>

              </div>


              <input

                id="settings-effects-volume"

                type="range"

                min="0"

                max="100"

                step="1"

                value={
                  audioSettings.effectsVolume
                }

                disabled={
                  !audioSettings.effectsEnabled
                }

                onChange={event =>

                  setEffectsVolume(

                    Number(
                      event.target.value,
                    ),

                  )

                }

                style={{

                  '--settings-progress':
                    `${audioSettings.effectsVolume}%`,

                } as CSSProperties}

              />


              {/* RÉINITIALISATION EFFETS */}

              <div className="settings-inline-reset">

                <button

                  type="button"

                  className="settings-inline-reset-button"

                  onClick={
                    handleResetEffects
                  }

                >

                  {t('settings.resetEffects')}

                </button>

              </div>

            </div>

          </div>

        </section>


        <section className="settings-card" aria-labelledby="settings-language-title">
          <div className="settings-card-heading">
            <div className="settings-card-icon"><LanguageIcon /></div>
            <div>
              <p className="settings-section-label">{t('settings.sectionPreferences')}</p>
              <h2 id="settings-language-title">{t('settings.languageTitle')}</h2>
              <p>{t('settings.languageDescription')}</p>
            </div>
          </div>
          <label className="settings-language-label" htmlFor="settings-language">
            {t('settings.languageLabel')}
          </label>
          <select
            id="settings-language"
            className="settings-language-select"
            value={language}
            onChange={event => {
              const selected = LANGUAGES.find(option => option.code === event.target.value)
              if (selected) setLanguage(selected.code)
            }}
          >
            {LANGUAGES.map(option => (
              <option key={option.code} value={option.code}>{option.native}</option>
            ))}
          </select>
        </section>

        {/* ========================================
            PLUS DE PARAMÈTRES
        ======================================== */}

        <section

          className="settings-card settings-more-card"

          aria-labelledby="settings-more-title"

        >


          <div className="settings-card-heading">


            <div className="settings-card-icon">

              <SettingsIcon />

            </div>


            <div>


              <p className="settings-section-label">

                TI'DOC GAMES

              </p>


              <h2 id="settings-more-title">

                {t('settings.moreTitle')}

              </h2>

            </div>

          </div>


          {/* ========================================
              CONTACT
          ======================================== */}

          <button

            type="button"

            className="settings-link-row"

            onClick={
              handleContact
            }

          >


            <span>

              {t('settings.contact')}

            </span>


            <ChevronIcon />

          </button>


          {/* ========================================
              PARTAGER
          ======================================== */}

          <button

            type="button"

            className="settings-link-row"

            onClick={() => {

              void handleShare()

            }}

          >


            <span>

              {t('settings.share')}

            </span>


            <ChevronIcon />

          </button>


          {shareMessage && (

            <p

              className="settings-share-message"

              role="status"

            >

              {tr(shareMessage)}

            </p>

          )}


          
{/* ========================================
    RÉSEAUX TI'DOC
======================================== */}

<div className="settings-social-section">

  <p className="settings-social-label">
    {t('settings.socialLabel')}
  </p>

  <div className="settings-social-links">

    {/* ========================================
        INSTAGRAM
    ======================================== */}

    <a
      className="settings-social-link"
      href={TIDOC_INSTAGRAM}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t('settings.instagramAria')}
    >

      <span className="settings-social-initial">

        <svg
          viewBox="0 -0.5 25 25"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >

          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M15.5 5H9.5C7.29086 5 5.5 6.79086 5.5 9V15C5.5 17.2091 7.29086 19 9.5 19H15.5C17.7091 19 19.5 17.2091 19.5 15V9C19.5 6.79086 17.7091 5 15.5 5Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12.5 15C10.8431 15 9.5 13.6569 9.5 12C9.5 10.3431 10.8431 9 12.5 9C14.1569 9 15.5 10.3431 15.5 12C15.5 12.7956 15.1839 13.5587 14.6213 14.1213C14.0587 14.6839 13.2956 15 12.5 15Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <rect
            x="15.5"
            y="9"
            width="2"
            height="2"
            rx="1"
            transform="rotate(-90 15.5 9)"
            fill="currentColor"
          />

          <rect
            x="16"
            y="8.5"
            width="1"
            height="1"
            rx="0.5"
            transform="rotate(-90 16 8.5)"
            stroke="currentColor"
            strokeLinecap="round"
          />

        </svg>

      </span>

      <span>
        Instagram
      </span>

    </a>


    {/* ========================================
        TIKTOK
    ======================================== */}

    <a
      className="settings-social-link"
      href={TIDOC_TIKTOK}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t('settings.tiktokAria')}
    >

      <span className="settings-social-initial">

        <svg
          viewBox="0 0 32 32"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >

          <path
            d="M16.656 1.029c1.637-0.025 3.262-0.012 4.886-0.025 0.054 2.031 0.878 3.859 2.189 5.213l-0.002-0.002c1.411 1.271 3.247 2.095 5.271 2.235l0.028 0.002v5.036c-1.912-0.048-3.71-0.489-5.331-1.247l0.082 0.034c-0.784-0.377-1.447-0.764-2.077-1.196l0.052 0.034c-0.012 3.649 0.012 7.298-0.025 10.934-0.103 1.853-0.719 3.543-1.707 4.954l0.020-0.031c-1.652 2.366-4.328 3.919-7.371 4.011l-0.014 0c-0.123 0.006-0.268 0.009-0.414 0.009-1.73 0-3.347-0.482-4.725-1.319l0.040 0.023c-2.508-1.509-4.238-4.091-4.558-7.094l-0.004-0.041c-0.025-0.625-0.037-1.25-0.012-1.862 0.49-4.779 4.494-8.476 9.361-8.476 0.547 0 1.083 0.047 1.604 0.136l-0.056-0.008c0.025 1.849-0.050 3.699-0.050 5.548-0.423-0.153-0.911-0.242-1.42-0.242-1.868 0-3.457 1.194-4.045 2.861l-0.009 0.030c-0.133 0.427-0.21 0.918-0.21 1.426 0 0.206 0.013 0.41 0.037 0.61l-0.002-0.024c0.332 2.046 2.086 3.59 4.201 3.59 0.061 0 0.121-0.001 0.181-0.004l-0.009 0c1.463-0.044 2.733-0.831 3.451-1.994l0.010-0.018c0.267-0.372 0.45-0.822 0.511-1.311l0.001-0.014c0.125-2.237 0.075-4.461 0.087-6.698 0.012-5.036-0.012-10.060 0.025-15.083z"
          />

        </svg>

      </span>

      <span>
        TikTok
      </span>

    </a>


    {/* ========================================
        SITE TI'DOC
    ======================================== */}

    <a
      className="settings-social-link"
      href={TIDOC_WEBSITE}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t('settings.websiteAria')}
    >

      <span className="settings-social-initial">

        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >

          <path
            d="M4 15L20 15"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <path
            d="M4 9L20 9"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <circle
            cx="12"
            cy="12"
            r="9"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <path
            d="M12.0004 20.8182L11.2862 21.5181C11.4742 21.7101 11.7317 21.8182 12.0004 21.8182C12.2691 21.8182 12.5265 21.7101 12.7146 21.5181L12.0004 20.8182ZM12.0004 3.18188L12.7146 2.48198C12.5265 2.29005 12.2691 2.18188 12.0004 2.18188C11.7317 2.18188 11.4742 2.29005 11.2861 2.48198L12.0004 3.18188ZM14.6004 12.0001C14.6004 15.1611 13.3373 18.0251 11.2862 20.1183L12.7146 21.5181C15.1173 19.0662 16.6004 15.7053 16.6004 12.0001H16.6004C16.6004 8.29478 15.1173 4.93389 12.7146 2.48198L11.2861 3.88178ZM9.40039 12.0001C9.40039 8.83903 10.6634 5.97501 12.7146 3.88178L11.2861 2.48198C8.88347 4.93389 7.40039 8.29478 7.40039 12.0001H9.40039ZM12.7146 20.1183C10.6634 17.98179 9.40039 15.1611 9.40039 12.0001H7.40039C7.40039 15.7053 8.88348 19.0662 11.2862 21.5181L12.7146 20.1183Z"
            fill="currentColor"
          />

        </svg>

      </span>

      <span>
        {t('settings.websiteLabel')}
      </span>

    </a>

  </div>

</div>



          {/* ========================================
              INFORMATIONS LÉGALES

              Accès aux documents et informations disponibles.
          ======================================== */}

          <div className="settings-legal-links">


            <button
  type="button"
  className="settings-link-row"
  onClick={() =>
    navigate('/parametres/conditions-utilisation')
  }
>
  <span>
    {t('settings.conditions')}
  </span>

  <ChevronIcon />
</button>


            <button
              type="button"
              className="settings-link-row"
              onClick={() => navigate('/parametres/politique-confidentialite')}
            >
              <span>{t('settings.privacyPolicy')}</span>
              <ChevronIcon />
            </button>


            {/* ========================================
                À PROPOS
            ======================================== */}

            <button

              type="button"

              className="settings-link-row"

              aria-expanded={
                aboutOpen
              }

              onClick={() =>

                setAboutOpen(
                  !aboutOpen,
                )

              }

            >


              <span>

                {t('settings.about')}

              </span>


              <ChevronIcon />

            </button>


            {aboutOpen && (

              <div className="settings-about-details">


                <strong>

                  Ti'Doc Games

                </strong>


                <p>

                  {t('settings.aboutDescription')}

                </p>


                <span>

                  {t('settings.aboutSlogan')}

                </span>

              </div>

            )}


            <button type="button" className="settings-link-row" onClick={() => navigate('/parametres/licences-open-source')}>
              <span>{t('settings.licenses')}</span>
              <ChevronIcon />
            </button>


            <button type="button" className="settings-link-row" onClick={() => navigate('/parametres/preferences-confidentialite')}>
              <span>{t('settings.privacyPreferences')}</span>
              <ChevronIcon />
            </button>

          </div>

        </section>

      </div>

    </section>

  )

}


export default Parametres
