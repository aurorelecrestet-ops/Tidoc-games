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
   CLASSEMENT STOCK & STACK
======================================== */

function StockAndStackLeaderboard() {

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

    let active =
      true


    async function loadLeaderboard() {

      try {

        setLoading(
          true
        )

        setError(
          false
        )


        const entries =
          await getLeaderboard(
            'stock-and-stack',
            10
          )


        if (active) {

          setLeaderboard(
            entries
          )

        }

      } catch (loadError) {

        console.error(
          'Erreur classement Stock & Stack :',
          loadError
        )


        if (active) {

          setError(
            true
          )

        }

      } finally {

        if (active) {

          setLoading(
            false
          )

        }

      }

    }


    void loadLeaderboard()


    return () => {

      active =
        false

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
          Stock <span>&amp; Stack</span>
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
              Stock &amp; Stack
            </strong>

          </div>


          <div className="ecg-leaderboard-trophy">

            <svg
    viewBox="0 0 31.711 31.71"
    fill="#70e5f4"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label={tr("Logo Stock & Stack")}
    width="75%"
    height="75%"
  >
    <g>
      <path d="M31.076,12.891c0.642-0.413,0.828-1.268,0.415-1.911l-4.714-7.33c-0.198-0.309-0.511-0.526-0.869-0.604
        s-0.733-0.01-1.042,0.188l-3.29,2.117V1.45c0-0.764-0.619-1.382-1.383-1.382H11.52c-0.764,0-1.382,0.619-1.382,1.382v3.902
        L6.845,3.234c-0.642-0.413-1.497-0.227-1.91,0.415L0.219,10.98c-0.198,0.308-0.266,0.683-0.187,1.042
        c0.077,0.358,0.295,0.671,0.603,0.869l4.609,2.964l-4.608,2.962c-0.309,0.198-0.526,0.511-0.604,0.87
        c-0.078,0.357-0.011,0.732,0.187,1.042l4.716,7.331c0.198,0.309,0.511,0.525,0.869,0.604c0.358,0.078,0.733,0.01,1.041-0.188
        l3.293-2.117v3.9c0,0.765,0.618,1.384,1.382,1.384h8.673c0.764,0,1.383-0.619,1.383-1.384v-3.9l3.29,2.117
        c0.309,0.197,0.684,0.266,1.042,0.188s0.671-0.295,0.869-0.604l4.714-7.332c0.413-0.643,0.227-1.497-0.415-1.911l-4.608-2.962
        L31.076,12.891z M13.834,25.417c-0.483,0-0.941-0.246-1.207-0.66c-0.055-0.084-0.101-0.176-0.139-0.275
        c-0.275-0.743,0.104-1.568,0.846-1.846c0.394-0.145,0.756-0.287,1.093-0.424v-5.367c-1.855-1.088-3.468-2.197-3.827-3.817
        c-0.565-2.529,0.263-3.998,1.056-4.783c0.425-0.422,0.93-0.737,1.476-0.969c0.415-0.175,0.85-0.304,1.296-0.396V5.808
        c0-0.792,0.637-1.435,1.431-1.435c0.793,0,1.428,0.642,1.428,1.435v0.906c0.749,0.043,1.396,0.14,1.831,0.219
        c0.263,0.048,0.447,0.088,0.533,0.108c0.771,0.18,1.25,0.95,1.072,1.721c-0.148,0.636-0.694,1.074-1.312,1.111
        c-0.5-0.102-1.283-0.238-2.124-0.293c-1.006-0.068-2.093-0.019-2.858,0.343c0,0-0.601,0.318-0.793,0.508
        c-0.404,0.401-0.653,1.087-0.233,1.971c0.121,0.255,0.478,0.649,1.026,1.039v-2.968l2.858,0.574v9.773
        c1.149-0.712,1.233-1.104,1.235-1.109c-0.017-0.092-1.057-4.424-1.057-4.424c2.128,1.247,4.086,2.6,3.915,4.663
        c-0.114,1.402-1.19,2.612-3.479,3.825l-0.615,0.271l-2.858,1.258v-0.012c-0.03,0.012-0.062,0.023-0.093,0.035
        C14.167,25.388,14.001,25.417,13.834,25.417z M17.285,25.902c0,0.792-0.635,1.436-1.428,1.436c-0.794,0-1.431-0.643-1.431-1.436
        v-0.598l2.858-0.557L17.285,25.902L17.285,25.902z" />
    </g>
  </svg>

          </div>

        </div>


        {/* CHARGEMENT / ERREUR */}

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

            {leaderboard.map(
              (
                entry,
                index
              ) => {

                const rank =
                  index + 1

                const avatarIndex =
                  Math.max(
                    0,
                    Math.min(
                      leaderboardAvatars.length - 1,
                      entry.avatar - 1
                    )
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
                          getLanguage()
                        )}
                      </strong>

                      <span>
                        {tr("PTS")}</span>

                    </div>


                  </div>

                )
              }
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
              '/classements'
            )
          }
        >
          {tr("Retour aux classements")}</button>

      </div>

    </section>

  )
}


export default StockAndStackLeaderboard
