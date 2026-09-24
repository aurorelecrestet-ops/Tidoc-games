import { getLanguage } from '../i18n/languages'
import { tr } from '../i18n/gameText'

import {
  useEffect,
  useState,
} from 'react'

import {
  useNavigate,
} from 'react-router-dom'

import {
  getLeaderboard,
  type LeaderboardEntry,
} from '../lib/player'

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

import './Classements.css'
import './ECGGame.css'


/* ========================================
   AVATARS
======================================== */

const leaderboardAvatars = [
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


/* ========================================
   CLASSEMENT SURGICALLY INSANE
======================================== */

function SurgicallyLeaderboard() {

  const navigate =
    useNavigate()

  const [
    leaderboard,
    setLeaderboard,
  ] = useState<LeaderboardEntry[]>([])

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    error,
    setError,
  ] = useState(false)


  /* ========================================
     CHARGEMENT DU CLASSEMENT
  ======================================== */

  useEffect(() => {

    let active = true

    async function loadLeaderboard() {

      try {

        setLoading(true)
        setError(false)

        const entries =
          await getLeaderboard(
            'surgically-insane',
            10,
          )

        if (active) {

          setLeaderboard(
            entries,
          )

        }

      } catch (loadError) {

        console.error(
          'Erreur classement Surgically Insane :',
          loadError,
        )

        if (active) {

          setError(true)

        }

      } finally {

        if (active) {

          setLoading(false)

        }

      }

    }

    void loadLeaderboard()

    return () => {

      active = false

    }

  }, [])


  /* ========================================
     AFFICHAGE
  ======================================== */

  return (

    <section className="rankings-page">


      {/* ========================================
          TITRE
      ======================================== */}

      <div className="rankings-heading">

        <p className="rankings-eyebrow">
          {tr("CLASSEMENT")}</p>

        <h1>
          Surgically <span>Insane</span>
        </h1>

        <p className="rankings-subtitle">
          {tr("Découvre les meilleurs scores de la communauté Ti'Doc.")}</p>

      </div>


      {/* ========================================
          CLASSEMENT MONDIAL
      ======================================== */}

      <div className="ecg-leaderboard">

        <div className="ecg-leaderboard-heading">

          <div>

            <span className="ecg-leaderboard-kicker">
              {tr("CLASSEMENT MONDIAL")}</span>

            <strong>
              Surgically Insane
            </strong>

          </div>


          {/* TROPHÉE */}

          <div className="ecg-leaderboard-trophy">

            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >

              <path
                d="M22,3H19V2a1,1,0,0,0-1-1H6A1,1,0,0,0,5,2V3H2A1,1,0,0,0,1,4V6a4.994,4.994,0,0,0,4.276,4.927A7.009,7.009,0,0,0,11,15.92V18H7a1,1,0,0,0-.949.684l-1,3A1,1,0,0,0,6,23H18a1,1,0,0,0,.948-1.316l-1-3A1,1,0,0,0,17,18H13V15.92a7.009,7.009,0,0,0,5.724-4.993A4.994,4.994,0,0,0,23,6V4A1,1,0,0,0,22,3ZM5,8.829A3.006,3.006,0,0,1,3,6V5H5ZM16.279,20l.333,1H7.387l.334-1ZM17,9A5,5,0,0,1,7,9V3H17Zm4-3a3.006,3.006,0,0,1-2,2.829V5h2ZM10.667,8.667,9,7.292,11,7l1-2,1,2,2,.292L13.333,8.667,13.854,11,12,9.667,10.146,11Z"
              />

            </svg>

          </div>

        </div>


        {/* ========================================
            CHARGEMENT / ERREUR
        ======================================== */}

        {loading ? (

          <div className="ecg-leaderboard-loading">
            {tr("Chargement du classement...")}</div>

        ) : error ? (

          <div className="ecg-leaderboard-loading">
            {tr("Impossible de charger le classement.")}</div>

        ) : leaderboard.length === 0 ? (

          <div className="ecg-leaderboard-loading">
            {tr("Aucun score pour le moment.")}</div>

        ) : (

          <div className="ecg-ranking-list">


            {/* ========================================
                JOUEURS
            ======================================== */}

            {leaderboard.map(
              (
                entry,
                index,
              ) => {

                const rank =
                  index + 1

                const avatarIndex =
                  Math.max(
                    0,
                    Math.min(
                      leaderboardAvatars.length - 1,
                      entry.avatar - 1,
                    ),
                  )

                return (

                  <div
                    key={entry.player_id}

                    className={
                      `ecg-ranking-row ${
                        rank <= 3
                          ? `ecg-ranking-top ecg-ranking-${rank}`
                          : ''
                      } ${
                        entry.isCurrentPlayer
                          ? 'ecg-ranking-me'
                          : ''
                      }`
                    }
                  >


                    {/* POSITION */}

                    <div className="ecg-ranking-position">

                      {rank === 1
                        ? '🥇'
                        : rank === 2
                          ? '🥈'
                          : rank === 3
                            ? '🥉'
                            : rank}

                    </div>


                    {/* AVATAR */}

                    <img
                      className="ecg-ranking-avatar"

                      src={
                        leaderboardAvatars[
                          avatarIndex
                        ]
                      }

                      alt=""
                    />


                    {/* JOUEUR */}

                    <div className="ecg-ranking-player">

                      <strong>
                        {entry.pseudo}
                      </strong>

                      {entry.isCurrentPlayer && (

                        <span>
                          {tr("TOI")}</span>

                      )}

                    </div>


                    {/* SCORE */}

                    <div className="ecg-ranking-score">

                      <strong>
                        {entry.score.toLocaleString(
                          getLanguage(),
                        )}
                      </strong>

                      <span>
                        {tr("PTS")}</span>

                    </div>

                  </div>

                )

              },
            )}

          </div>

        )}

      </div>


      {/* ========================================
          RETOUR
      ======================================== */}

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: '25px',
        }}
      >

        <button
          type="button"

          className="ecg-back-button"

          onClick={() =>
            navigate(
              '/classements',
            )
          }
        >

          {tr("Retour aux classements")}</button>

      </div>

    </section>

  )

}

export default SurgicallyLeaderboard
