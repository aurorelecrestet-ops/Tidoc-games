import { tr } from '../i18n/gameText'

import { Link, useNavigate } from 'react-router-dom'

import './Parametres.css'

import './ConditionsUtilisation.css'

/* ========================================
   TI'DOC GAMES
   CONDITIONS D'UTILISATION
======================================== */

function ConditionsUtilisation() {

  const navigate = useNavigate()

  return (

    <section className="settings-page settings-legal-page">

      {/* ========================================
          RETOUR
      ======================================== */}

      <button
        type="button"
        className="settings-back"
        onClick={() =>
          navigate('/parametres')
        }
      >
        {tr("← Retour aux paramètres")}</button>


      {/* ========================================
          EN-TÊTE
      ======================================== */}

      <div className="settings-heading">

        <p className="settings-eyebrow">
          TI'DOC GAMES
        </p>

        <h1>
          {tr("Conditions")}{' '}
          <span>{tr("d’utilisation")}</span>
        </h1>

        <p className="settings-subtitle">
          {tr("Les règles d’utilisation de Ti’Doc Games.")}</p>

      </div>


      {/* ========================================
          CONTENU
      ======================================== */}

      <div className="settings-content">

        <article className="settings-card settings-legal-document">


          {/* INTRODUCTION */}

          <section className="settings-legal-section">

            <h2>
              {tr("1. Présentation de Ti’Doc Games")}</h2>

            <p>
              {tr("Ti’Doc Games est une application de jeux inspirés de l’univers médical. Elle permet notamment de jouer en solo, de participer à des parties multijoueurs et de consulter des classements.")}</p>

            <p>
              {tr("L’application est éditée par l’Association Ti’Doc.")}</p>

            <p>
              {tr("La conception et le développement de Ti’Doc Games ont été réalisés par ")}<strong>Aurore Bouquet</strong>.
            </p>

          </section>


          {/* ACCÈS */}

          <section className="settings-legal-section">

            <h2>
              {tr("2. Accès à l’application")}</h2>

            <p>
              {tr("Ti’Doc Games est destiné à tout public, y compris aux mineurs. Le jeu est indépendant du congrès et peut être utilisé avant, pendant ou après celui-ci.")}</p>

            <p>
              {tr("Certaines fonctionnalités nécessitent une connexion internet, notamment les parties multijoueurs, la synchronisation des scores et les classements.")}</p>

            <p>
              {tr("L’accès à une fonctionnalité peut être temporairement interrompu pour des raisons techniques, de maintenance ou de sécurité.")}</p>

          </section>


          {/* PROFIL */}

          <section className="settings-legal-section">

            <h2>
              {tr("3. Profil joueur")}</h2>

            <p>
              {tr("L’application permet d’utiliser un pseudo et un avatar pour identifier un joueur dans les jeux et les classements.")}</p>

            <p>
              {tr("Le pseudo choisi ne doit pas usurper l’identité d’une autre personne, contenir de propos injurieux, discriminatoires ou porter atteinte aux droits d’autrui.")}</p>

            <p>
              {tr("Les joueurs sont invités à ne pas utiliser leur nom complet ni à communiquer d’informations personnelles sensibles dans leur pseudo.")}</p>

          </section>


          {/* JEUX */}

          <section className="settings-legal-section">

            <h2>
              {tr("4. Règles des jeux")}</h2>

            <p>
              {tr("Chaque jeu possède ses propres règles, objectifs et modalités de calcul des points.")}</p>

            <p>
              {tr("Dans les parties multijoueurs, les joueurs doivent respecter le déroulement prévu : nombre de participants, ordre des tours, conditions de victoire et règles propres à chaque jeu.")}</p>

            <p>
              {tr("Les scores et les classements sont liés au fonctionnement des jeux. Ils ne constituent pas une évaluation des compétences médicales ou professionnelles des participants.")}</p>

          </section>


          {/* COMPORTEMENT */}

          <section className="settings-legal-section">

            <h2>
              {tr("5. Utilisation loyale")}</h2>

            <p>
              {tr("Chaque utilisateur s’engage à utiliser l’application de manière respectueuse et conforme à sa finalité.")}</p>

            <p>
              {tr("Il est notamment demandé de ne pas :")}</p>

            <ul>

              <li>
                {tr("chercher à modifier artificiellement les scores ou les résultats ;")}</li>

              <li>
                {tr("perturber les parties d’autres joueurs ;")}</li>

              <li>
                {tr("exploiter volontairement une faille pour obtenir un avantage déloyal ;")}</li>

              <li>
                {tr("tenter d’accéder aux données ou aux parties d’autres utilisateurs sans autorisation ;")}</li>

              <li>
                {tr("compromettre le fonctionnement ou la sécurité de l’application.")}</li>

            </ul>

          </section>


          {/* CONTENU MÉDICAL */}

          <section className="settings-legal-section">

            <h2>
              {tr("6. Contenu médical et pédagogique")}</h2>

            <p>
              {tr("Ti’Doc Games est conçu pour proposer une expérience ludique autour de la médecine.")}</p>

            <p>
              {tr("Les contenus présents dans les jeux ne constituent ni un avis médical personnalisé, ni un diagnostic, ni une recommandation de traitement.")}</p>

            <p>
              {tr("Ils ne remplacent pas une formation médicale, des recommandations professionnelles ou une consultation auprès d’un professionnel de santé.")}</p>

          </section>


          {/* PROPRIÉTÉ INTELLECTUELLE */}

          <section className="settings-legal-section">

            <h2>
              {tr("7. Contenus et propriété intellectuelle")}</h2>

            <p>
              {tr("L’application réunit du code, des éléments graphiques, des textes, des sons et des éléments de jeu.")}</p>

            <p>
              {tr("Leur réutilisation doit respecter les droits de leurs titulaires et, lorsqu’elles existent, les licences applicables.")}</p>

            <p>
              {tr("La conception et le développement de Ti’Doc Games ont été réalisés par")}<strong> Aurore Bouquet</strong>.
            </p>

            <p>
              {tr("Les bibliothèques et ressources tierces utilisées par l’application peuvent relever de licences distinctes.")}</p>

          </section>


          {/* DISPONIBILITÉ */}

          <section className="settings-legal-section">

            <h2>
              {tr("8. Évolution et disponibilité")}</h2>

            <p>
              {tr("Ti’Doc Games peut évoluer : nouveaux jeux, corrections, changements de règles, améliorations techniques ou modifications des fonctionnalités existantes.")}</p>

            <p>
              {tr("Des dysfonctionnements ou interruptions temporaires peuvent survenir.")}</p>

            <p>
              {tr("Les utilisateurs peuvent signaler un problème à l’adresse de contact indiquée ci-dessous.")}</p>

          </section>


          {/* DONNÉES */}

          <section className="settings-legal-section">

            <h2>
              {tr("9. Données personnelles")}</h2>

            <p>
              {tr("Certaines fonctionnalités impliquent le traitement de données liées aux joueurs et aux parties.")}</p>

            <p>
              {tr("Les informations relatives aux données personnelles sont détaillées dans la")}<Link to="/parametres/politique-confidentialite">
                {tr("Politique de confidentialité")}</Link>.
            </p>

          </section>


          {/* CONTACT */}

          <section className="settings-legal-section">

            <h2>
              {tr("10. Contact")}</h2>

            <p>
              {tr("Pour toute question concernant Ti’Doc Games, son fonctionnement ou les présentes conditions, vous pouvez contacter l’Association Ti’Doc :")}</p>

            <a
              className="settings-legal-email"
              href="mailto:tidoc.congres@gmail.com"
            >
              tidoc.congres@gmail.com
            </a>

          </section>

        </article>


        {/* ========================================
            SIGNATURE
        ======================================== */}

        <div className="settings-legal-footer">

          <strong>
            Ti’Doc Games
          </strong>

          <span>
            {tr("Édité par l’Association Ti’Doc")}</span>

          <span>
            {tr("Conception et développement : Aurore Bouquet")}</span>

          <p>
            {tr("APPRENDRE • JOUER • SE DÉPASSER")}</p>

        </div>

      </div>

    </section>

  )

}

export default ConditionsUtilisation
