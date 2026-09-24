import { useTranslation } from './hooks/useTranslation'
import LicencesOpenSource from './pages/LicencesOpenSource'
import PreferencesConfidentialite from './pages/PreferencesConfidentialite'
import PolitiqueConfidentialite from './pages/PolitiqueConfidentialite'
import MultiplayerResultGate from './components/MultiplayerResultGate'
import {
  Routes,
  Route,
  useNavigate,
  useLocation,
} from 'react-router-dom'

import ECGLeaderboard from './pages/ECGLeaderboard'

import SurgicallyLeaderboard
  from './pages/SurgicallyLeaderboard'

import StockAndStackMultiplayer
  from './pages/StockAndStackMultiplayer'

import StockAndStackLobby
  from './pages/StockAndStackLobby'

import StockAndStackMultiplayerGame
  from './pages/StockAndStackMultiplayerGame'
  
import ConditionsUtilisation
  from './pages/ConditionsUtilisation'

import {
  useState,
} from 'react'

import Parametres from './pages/Parametres'
import Aide from './pages/Aide'

import StockAndStack from './pages/StockAndStack'

import './App.css'

import SurgicallyMultiplayer
  from './pages/SurgicallyMultiplayer'

import SurgicallyMultiplayerGame
  from './pages/SurgicallyMultiplayerGame'  

import SurgicallyLobby
  from './pages/SurgicallyLobby'

import hospitalBg from './assets/hospital-bg.png'

import Header from './components/Header'

import Multiplayer from './pages/Multiplayer'

import Solo from './pages/Solo'

import ECGGame from './pages/ECGGame'

import Classements from './pages/Classements'

import ECGMultiplayer from './pages/ECGMultiplayer'

import ECGLobby from './pages/ECGLobby'

import ECGMultiplayerGame from './pages/ECGMultiplayerGame'

import BacteriaSlash from './pages/BacteriaSlash'

import BacteriaLeaderboard
  from './pages/BacteriaLeaderboard'

import BacteriaMultiplayer
  from './pages/BacteriaMultiplayer'  

import BacteriaLobby
  from './pages/BacteriaLobby'

import BacteriaMultiplayerGame
  from './pages/BacteriaMultiplayerGame'  

import SurgicallyInsane from './pages/SurgicallyInsane'

import StockAndStackLeaderboard from './pages/StockAndStackLeaderboard'

import { SoloIcon, PlayersIcon } from './components/ModeIcons'

import TournamentMenu from './pages/TournamentMenu'
import TournamentLobby from './pages/TournamentLobby'
import TournamentRound from './pages/TournamentRound'
import TournamentResults from './pages/TournamentResults'
import TournamentSolo from './pages/TournamentSolo'
import ECGTournamentSoloGame from './pages/ECGTournamentSoloGame'
import BacteriaTournamentSoloGame from './pages/BacteriaTournamentSoloGame'
import SurgicallyTournamentSoloGame from './pages/SurgicallyTournamentSoloGame'
import StockAndStackTournamentSoloGame from './pages/StockAndStackTournamentSoloGame'

/* ========================================
   ICÔNE TOURNOIS
======================================== */

function TournamentIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="5" height="5" rx="1" />
    <rect x="2" y="16" width="5" height="5" rx="1" />
    <path d="M7 5.5h5v13H7M12 12h5" />
    <rect x="17" y="9.5" width="5" height="5" rx="1" />
  </svg>
}


/* ========================================
   PAGE D'ACCUEIL
======================================== */

function HomePage() {
  const { t } = useTranslation()


  const navigate =
    useNavigate()

  return (

    <>

      <section className="hero">

        <p className="eyebrow">

          {t('home.eyebrow')}

          <span>
            {' '}TI'DOC
          </span>

        </p>


        <h1>

          Ti'Doc

          <span>
            {' '}Games
          </span>

        </h1>


        <p className="tagline">
          {t('home.tagline')}
        </p>


        <div className="game-options">


          {/* =================================
              SOLO
          ================================= */}

          <article className="game-card featured">

            <div className="card-icon">
  <SoloIcon />
</div>

            <h2>
              {t('home.soloTitle')}
            </h2>

            <p>
              {t('home.soloDescription')}
            </p>

            <button
              type="button"
              onClick={() =>
                navigate('/solo')
              }
            >

              {t('home.play')}

              <span>
                →
              </span>

            </button>

          </article>


          {/* =================================
              MULTIJOUEUR
          ================================= */}

          <article className="game-card">

            <div className="card-icon">
              <PlayersIcon />
            </div>

            <h2>
              {t('home.multiplayerTitle')}
            </h2>

            <p>
              {t('home.multiplayerDescription')}
            </p>

            <button
  type="button"
  onClick={() =>
    navigate('/multiplayer')
  }
>
  {t('home.play')}

  <span>
    →
  </span>
</button>

          </article>


          {/* =================================
              TOURNOIS
          ================================= */}

          <article className="game-card">

            <div className="card-icon">
              <TournamentIcon />
            </div>

            <h2>
              {t('home.tournamentTitle')}
            </h2>

            <p>
              {t('home.tournamentDescription')}
            </p>

            <button
              type="button"
              className="tournament-button"
              onClick={() =>
                navigate('/tournament')
              }
            >
              {t('home.play')}

              <span>
                →
              </span>
            </button>

          </article>

        </div>


        <div className="quote">

          <span>
            “
          </span>

          {t('home.quote')}

          <span>
            ”
          </span>

        </div>

      </section>


      <footer>

        <span>
          Ti'Doc Games
        </span>

        <i>
          •
        </i>

        <span>
          {t('home.footerEdition')}
        </span>

        <small>
          © Ti'Doc
        </small>

      </footer>

    </>
  )
}


/* ========================================
   APPLICATION
======================================== */

function App() {
  // Re-render all routes when the saved interface language changes.
  useTranslation()
  const { pathname } = useLocation()


  /*
    Ce state ne sert PLUS à imposer
    le portrait aux menus.

    Il sert uniquement à masquer le
    Header pendant les phases immersives
    du jeu ECG.
  */

  const [
    gameInProgress,
    setGameInProgress,
  ] = useState(false)

  // Les informations légales restent accessibles sans session ni contrôle réseau.
  const legalPath = pathname.toLowerCase().replace(/\/$/, '')
  const settingsDocument = {
    '/parametres/politique-confidentialite': <PolitiqueConfidentialite />,
    '/parametres/conditions-utilisation': <ConditionsUtilisation />,
    '/parametres/licences-open-source': <LicencesOpenSource />,
    '/parametres/preferences-confidentialite': <PreferencesConfidentialite />,
  }[legalPath]
  if (settingsDocument) {
    return (
      <main className="game-home" style={{ backgroundImage: `url(${hospitalBg})` }}>
        <div className="background-overlay" />
        {settingsDocument}
      </main>
    )
  }


  return (

    <main
      className={
        gameInProgress
          ? 'game-home game-running'
          : 'game-home'
      }

      style={{
        backgroundImage:
          `url(${hospitalBg})`,
      }}
    >



      <div className="background-overlay" />


      {/* =================================
          HEADER

          Visible :
          - accueil
          - menus
          - écran ECG avant partie
          - résultats

          Caché :
          - rotation
          - countdown
          - partie
          - animation record
          - retour portrait téléphone
      ================================= */}

      <MultiplayerResultGate>
      {!gameInProgress && (
        <Header />
      )}


      {/* =================================
          ROUTES
      ================================= */}

      <Routes>

        <Route
          path="/"
          element={
            <HomePage />
          }
        />

        <Route path="/aide" element={<Aide />} />

        {/* ========================================
    CLASSEMENT SURGICALLY INSANE
======================================== */}
<Route
  path="/parametres"
element={
  <Parametres />}
  />

<Route
  path="/classements/stock-and-stack"
  element={<StockAndStackLeaderboard />}
/>

<Route
  path="/classements/surgically-insane"
  element={
    <SurgicallyLeaderboard />
  }
/>

        <Route
  path="/solo/surgically-insane"
  element={
    <SurgicallyInsane
      onFullscreenChange={setGameInProgress}
    />
  }
/>

<Route
  path="/parametres/conditions-utilisation"
  element={
    <ConditionsUtilisation />
  }
/>

{/* ========================================
    STOCK & STACK — PHARMACIE
======================================== */}

<Route
  path="/solo/stock-and-stack"
  element={
    <StockAndStack
      onFullscreenChange={
        setGameInProgress
      }
    />
  }
/>

{/* ========================================
    STOCK & STACK — MULTIJOUEUR
======================================== */}

<Route
  path="/multiplayer/stock-and-stack"
  element={
    <StockAndStackMultiplayer />
  }
/>

<Route
  path="/multiplayer/stock-and-stack/lobby/:code"
  element={
    <StockAndStackLobby />
  }
/>

<Route
  path="/multiplayer/stock-and-stack/game/:code"
  element={
    <StockAndStackMultiplayerGame
      onFullscreenChange={
        setGameInProgress
      }
    />
  }
/>

{/* ========================================
    SURGICALLY INSANE — MULTIJOUEUR
======================================== */}

<Route
  path="/multiplayer/surgically-insane"
  element={
    <SurgicallyMultiplayer />
  }
/>

<Route
  path="/multiplayer/surgically-insane/lobby/:code"
  element={
    <SurgicallyLobby />
  }
/>

        <Route
  path="/multiplayer/bacteria/lobby/:code"
  element={
    <BacteriaLobby />
  }
/>

<Route
  path="/multiplayer/surgically-insane/game/:code"
  element={
    <SurgicallyMultiplayerGame
      onFullscreenChange={setGameInProgress}
    />
  }
/>

<Route
  path="/multiplayer/bacteria/game/:code"
  element={
    <BacteriaMultiplayerGame
      onFullscreenChange={
        setGameInProgress
      }
    />
  }
/>

        <Route
  path="/multiplayer/bacteria"
  element={
    <BacteriaMultiplayer />
  }
/>

        <Route
  path="/classements/bacteria-slash"
  element={
    <BacteriaLeaderboard />
  }
/>

        <Route
  path="/multiplayer/ecg/game/:code"
  element={
    <ECGMultiplayerGame
      onFullscreenChange={
        setGameInProgress
      }
    />
  }
/>


        <Route
          path="/solo"
          element={
            <Solo />
          }
        />

{/* ========================================
    BACTERIA SLASH
======================================== */}

<Route
  path="/solo/bacteria-slash"
  element={

    <BacteriaSlash
      onFullscreenChange={
        setGameInProgress
      }
    />

  }
/>

        <Route
  path="/multiplayer/ecg"
  element={
    <ECGMultiplayer />
  }
/>

<Route
  path="/multiplayer/ecg/lobby/:code"
  element={
    <ECGLobby />
  }
/>

        <Route
  path="/multiplayer"
  element={
    <Multiplayer />
  }
/>

        <Route
  path="/classements"
  element={
    <Classements />
  }
/>

<Route
  path="/tournament"
  element={<TournamentMenu />}
/>

<Route
  path="/tournament/solo"
  element={<TournamentSolo />}
/>

{/* Tournoi solo : copies distinctes des jeux, HUD multijoueur */}
<Route
  path="/tournament/solo/ecg"
  element={
    <ECGTournamentSoloGame
      onFullscreenChange={setGameInProgress}
    />
  }
/>

<Route
  path="/tournament/solo/bacteria-slash"
  element={
    <BacteriaTournamentSoloGame
      onFullscreenChange={setGameInProgress}
    />
  }
/>

<Route
  path="/tournament/solo/surgically-insane"
  element={
    <SurgicallyTournamentSoloGame
      onFullscreenChange={setGameInProgress}
    />
  }
/>

<Route
  path="/tournament/solo/stock-and-stack"
  element={
    <StockAndStackTournamentSoloGame
      onFullscreenChange={setGameInProgress}
    />
  }
/>

<Route
  path="/tournament/lobby/:code"
  element={<TournamentLobby />}
/>

<Route
  path="/tournament/round/:code"
  element={<TournamentRound />}
/>

<Route
  path="/tournament/results/:code"
  element={<TournamentResults />}
/>

<Route
  path="/classements/ecg"
  element={
    <ECGLeaderboard />
  }
/>


        <Route
          path="/solo/ecg"
          element={

            <ECGGame
              onFullscreenChange={
                setGameInProgress
              }
            />

          }
        />

      </Routes>
      </MultiplayerResultGate>

    </main>
  )
}


export default App
