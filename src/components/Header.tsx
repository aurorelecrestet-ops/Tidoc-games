import { tr, formatGameText } from '../i18n/gameText'
import { useTranslation } from '../hooks/useTranslation'
import TrophyIcon from './TrophyIcon'
import {
  useEffect,
  useState,
} from 'react'

import {
  useLocation,
  useNavigate,
} from 'react-router-dom'

import tidocLogo from '../assets/tidoc-logo.png'

import avatar1 from '../assets/avatars/avatar-1.png'
import avatar2 from '../assets/avatars/avatar-2.png'
import avatar3 from '../assets/avatars/avatar-3.png'
import avatar4 from '../assets/avatars/avatar-4.png'
import avatar5 from '../assets/avatars/avatar-5.png'
import avatar6 from '../assets/avatars/avatar-6.png'
import avatar7 from '../assets/avatars/avatar-7.png'
import avatar8 from '../assets/avatars/avatar-8.png'
import avatar9 from '../assets/avatars/avatar-9.png'
import avatar10 from '../assets/avatars/avatar-10.png'

import {
  initializePlayer,
  updatePlayerAvatar,
  updatePlayerPseudo,
  type Player,
} from '../lib/player'

const avatars = [
  avatar1,
  avatar2,
  avatar3,
  avatar4,
  avatar5,
  avatar6,
  avatar7,
  avatar8,
  avatar9,
  avatar10,
]

function Header() {
  const { t } = useTranslation()


  const navigate =
    useNavigate()

  const location =
    useLocation()

  /* ========================================
     PROFIL
  ======================================== */

  const [
    profileOpen,
    setProfileOpen,
  ] = useState(false)

  const [
    player,
    setPlayer,
  ] = useState<Player | null>(null)

  const [
    loadingPlayer,
    setLoadingPlayer,
  ] = useState(true)

  const [
    profileError,
    setProfileError,
  ] = useState('')

  /* ========================================
     MODIFICATION DU PSEUDO
  ======================================== */

  const [
    editingPseudo,
    setEditingPseudo,
  ] = useState(false)

  const [
    pseudoDraft,
    setPseudoDraft,
  ] = useState('')

  const [
    savingPseudo,
    setSavingPseudo,
  ] = useState(false)

  /* ========================================
     INITIALISATION DU JOUEUR
  ======================================== */

  useEffect(() => {

    let cancelled = false

    async function loadPlayer() {

      try {

        setLoadingPlayer(true)
        setProfileError('')

        const loadedPlayer =
          await initializePlayer()

        if (cancelled) {
          return
        }

        setPlayer(
          loadedPlayer
        )

        setPseudoDraft(
          loadedPlayer.pseudo
        )

      } catch (error) {

  console.error(
    'Erreur initialisation joueur :',
    error,
  )

  if (!cancelled) {

    if (error instanceof Error) {

      setProfileError(error.message)

    } else {

      setProfileError(
        `ERREUR SUPABASE : ${JSON.stringify(error)}`
      )

    }

  }

} finally {

        if (!cancelled) {
          setLoadingPlayer(false)
        }

      }

    }

    loadPlayer()

    return () => {
      cancelled = true
    }

  }, [])

  /* ========================================
     COMMENCER À MODIFIER LE PSEUDO
  ======================================== */

  function startPseudoEditing() {

    if (!player) {
      return
    }

    setProfileError('')

    setPseudoDraft(
      player.pseudo
    )

    setEditingPseudo(true)
  }

  /* ========================================
     SAUVEGARDER LE PSEUDO
  ======================================== */

  async function savePseudo() {

    if (
      !player ||
      savingPseudo
    ) {
      return
    }

    const cleanedPseudo =
      pseudoDraft.trim()

    /*
      Aucun changement :
      on ferme simplement l'éditeur.
    */

    if (
      cleanedPseudo ===
      player.pseudo
    ) {

      setEditingPseudo(false)

      return
    }

    try {

      setSavingPseudo(true)
      setProfileError('')

      const updatedPlayer =
        await updatePlayerPseudo(
          cleanedPseudo
        )

      setPlayer(
        updatedPlayer
      )

      setPseudoDraft(
        updatedPlayer.pseudo
      )

      setEditingPseudo(false)

    } catch (error) {

      console.error(
        'Erreur modification pseudo :',
        error
      )

      if (
        error instanceof Error
      ) {

        setProfileError(
          error.message
        )

      } else {

        setProfileError(
          t('header.pseudoError')
        )

      }

    } finally {

      setSavingPseudo(false)

    }

  }

  /* ========================================
     CHANGER L'AVATAR
  ======================================== */

  async function selectAvatar(
    index: number
  ) {

    if (!player) {
      return
    }

    const avatarNumber =
      index + 1

    if (
      avatarNumber ===
      player.avatar
    ) {
      return
    }

    try {

      setProfileError('')

      const updatedPlayer =
        await updatePlayerAvatar(
          avatarNumber
        )

      setPlayer(
        updatedPlayer
      )

    } catch (error) {

      console.error(
        'Erreur modification avatar :',
        error
      )

      setProfileError(
        t('header.avatarError')
      )

    }

  }

  /* ========================================
     AVATAR ACTUEL
  ======================================== */

  const selectedAvatarIndex =
    player
      ? Math.max(
          0,
          Math.min(
            avatars.length - 1,
            player.avatar - 1
          )
        )
      : 0

  return (

    <header className="header">

      {/* =================================
          LOGO
      ================================= */}

      <div className="brand">

        <div className="logo-showcase">

          <img
            src={tidocLogo}
            alt="Ti'Doc"
            className="tidoc-logo"
          />

          <div className="brand-divider" />

          <div className="brand-manifesto">

            <span>
              {t('header.manifestoLearn')}
            </span>

            <span>
              {t('header.manifestoPlay')}
            </span>

            <span>
              {t('header.manifestoGrow')}
            </span>

            <i />

          </div>

        </div>

      </div>

      {/* =================================
          PARTIE DROITE
      ================================= */}

      <div className="header-right">

        {/* =================================
            NAVIGATION
        ================================= */}

        <nav>

          {/* ACCUEIL */}

          <button
            className={
              location.pathname === '/'
                ? 'nav-active'
                : ''
            }
            onClick={() =>
              navigate('/')
            }
          >

            <svg
              className="nav-icon"
              viewBox="0 0 16 16"
              aria-hidden="true"
            >

              <path d="M1 6V15H6V11C6 9.89543 6.89543 9 8 9C9.10457 9 10 9.89543 10 11V15H15V6L8 0L1 6Z" />

            </svg>

            {t('nav.home')}

          </button>

          <button
            type="button"
            className={location.pathname.startsWith('/classements') ? 'nav-active' : ''}
            aria-current={location.pathname.startsWith('/classements') ? 'page' : undefined}
            onClick={() => {
              setProfileOpen(false)
              navigate('/classements')
            }}
          >
            <TrophyIcon className="nav-icon" />
            {t('nav.leaderboard')}
          </button>

          {/* PARAMÈTRES */}

<button
  type="button"
  className={
    location.pathname === '/parametres'
      ? 'nav-active'
      : ''
  }
  onClick={() => {
    setProfileOpen(false)
    navigate('/parametres')
  }}
>

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

            {t('nav.settings')}

          </button>

          {/* AIDE */}

          <button
            type="button"
            onClick={() => {
              setProfileOpen(false)
              navigate('/aide')
            }}
            className={location.pathname === '/aide' ? 'nav-active' : ''}
            aria-current={location.pathname === '/aide' ? 'page' : undefined}
          >

            <svg
              className="nav-icon"
              viewBox="0 0 29.536 29.536"
              aria-hidden="true"
            >

              <path d="M14.768,0C6.611,0,0,6.609,0,14.768c0,8.155,6.611,14.767,14.768,14.767s14.768-6.612,14.768-14.767C29.535,6.609,22.924,0,14.768,0z M14.768,27.126c-6.828,0-12.361-5.532-12.361-12.359c0-6.828,5.533-12.362,12.361-12.362c6.826,0,12.359,5.535,12.359,12.362C27.127,21.594,21.594,27.126,14.768,27.126z" />

              <path d="M14.385,19.337c-1.338,0-2.289.951-2.289,2.34c0,1.336.926,2.339,2.289,2.339c1.414,0,2.314-1.003,2.314-2.339C16.672,20.288,15.771,19.337,14.385,19.337z" />

              <path d="M14.742,6.092c-1.824,0-3.34.513-4.293,1.053l.875,2.804c.668-.462,1.697-.772,2.545-.772c1.285.027,1.879.644,1.879,1.543c0,.85-.67,1.697-1.494,2.701c-1.156,1.364-1.594,2.701-1.516,4.012l.025.669h3.42v-.463c-.025-1.158.387-2.162,1.311-3.215c.979-1.08,2.211-2.366,2.211-4.321C19.705,7.968,18.139,6.092,14.742,6.092z" />

            </svg>

            {t('nav.help')}

          </button>

        </nav>

        {/* =================================
            PROFIL
        ================================= */}

        <div className="profile-wrapper">

          <button
            className="profile-avatar-button"
            onClick={() =>
              setProfileOpen(
                !profileOpen
              )
            }
            aria-label={t('header.openProfile')}
            
          >

            <img
              src={
                avatars[
                  selectedAvatarIndex
                ]
              }
              alt={t('header.myAvatar')}
            />

          </button>

          {/* =================================
              FENÊTRE DU PROFIL
          ================================= */}

          {profileOpen && (

            <div className="profile-menu">

              <button
                className="profile-close"
                onClick={() =>
                  setProfileOpen(false)
                }
                aria-label={t('header.closeProfile')}
              >
                ×
              </button>

              <div className="profile-menu-header">

                <img
                  src={
                    avatars[
                      selectedAvatarIndex
                    ]
                  }
                  alt={t('header.selectedAvatar')}
                  className="profile-menu-avatar"
                />

                <div className="pseudo-area">

                  {loadingPlayer ? (

                    <strong>
                      {t('header.loading')}
                    </strong>

                  ) : editingPseudo ? (

                    <input
                      type="text"
                      value={pseudoDraft}
                      maxLength={16}
                      autoFocus
                      disabled={savingPseudo}
                      onChange={(event) =>
                        setPseudoDraft(
                          event.target.value
                        )
                      }
                      onBlur={() => {
                        void savePseudo()
                      }}
                      onKeyDown={(event) => {

                        if (
                          event.key ===
                          'Enter'
                        ) {

                          event.preventDefault()

                          void savePseudo()

                        }

                        if (
                          event.key ===
                          'Escape'
                        ) {

                          setPseudoDraft(
                            player?.pseudo ?? ''
                          )

                          setEditingPseudo(
                            false
                          )

                          setProfileError('')

                        }

                      }}
                    />

                  ) : (

                    <strong>
                      {
                        player?.pseudo ??
                        'TiDoc'
                      }
                    </strong>

                  )}

                  {!loadingPlayer && (
                    <button
                      className="edit-pseudo"
                      onClick={
                        startPseudoEditing
                      }
                      aria-label={t('header.editPseudo')}
                      disabled={
                        savingPseudo ||
                        !player
                      }
                    >
                      ✎
                    </button>
                  )}

                </div>

              </div>

              {/* ERREUR PROFIL (discrète, le jeu reste utilisable) */}

              {profileError && (
                <p
                  style={{
                    margin: '12px 0 0',
                    color: '#ffb8b8',
                    fontSize: '12px',
                    fontWeight: 600,
                    overflowWrap: 'anywhere',
                  }}
                >
                  {tr(profileError)}
                </p>
              )}

              <div className="profile-separator" />

              <p className="avatar-title">
                {t('header.chooseAvatar')}
              </p>

              <div className="avatar-grid">

                {avatars.map(
                  (
                    avatar,
                    index
                  ) => (

                    <button
                      key={index}
                      className={
                        selectedAvatarIndex ===
                        index
                          ? 'avatar-choice selected'
                          : 'avatar-choice'
                      }
                      onClick={() => {
                        void selectAvatar(
                          index
                        )
                      }}
                      disabled={
                        loadingPlayer ||
                        !player
                      }
                      aria-label={
                        `${t('header.chooseAvatarNumber')} ${
                          index + 1
                        }`
                      }
                    >

                      <img
                        src={avatar}
                        alt={
                          formatGameText("Avatar {0}", index + 1)
                        }
                      />

                    </button>

                  )
                )}

              </div>

            </div>

          )}

        </div>

      </div>

    </header>
  )
}

export default Header
