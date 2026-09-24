import { tr } from '../i18n/gameText'
import { Link, useNavigate } from 'react-router-dom'
import './Parametres.css'
import './ConditionsUtilisation.css'
import './PolitiqueConfidentialite.css'

const sections = [
  ['responsable', 'Responsable et contact'],
  ['donnees', 'Données et usages'],
  ['bases', 'Bases légales'],
  ['conservation', 'Conservation'],
  ['destinataires', 'Accès et hébergement'],
  ['stockage', 'Stockage sur ton appareil'],
  ['droits', 'Tes droits'],
  ['securite', 'Sécurité et mises à jour'],
] as const

export default function PolitiqueConfidentialite() {
  const navigate = useNavigate()
  return (
    <section className="settings-page settings-legal-page privacy-page">
      <button type="button" className="settings-back" onClick={() => navigate('/parametres')}>
        {tr("← Retour aux paramètres")}</button>
      <div className="settings-heading">
        <p className="settings-eyebrow">TI’DOC GAMES</p>
        <h1>{tr("Politique de ")}<span>{tr("confidentialité")}</span></h1>
        <p className="settings-subtitle">{tr("Comprendre les données utilisées pour ton profil, tes scores et tes parties.")}</p>
        <p className="privacy-updated">{tr("Dernière mise à jour : ")}<time dateTime="2026-09-22">{tr("22 septembre 2026")}</time></p>
      </div>
      <div className="settings-content">
        <aside className="privacy-draft" aria-labelledby="privacy-draft-title">
          <strong id="privacy-draft-title">{tr("Brouillon — informations à compléter avant publication")}</strong>
          <p>{tr("Le nom utilisé Ti’Doc, l’adresse de contact, l’adresse de l’association, l’hébergement sur GitHub Pages, la région West EU de la base Supabase et l’accès du jeu à tous les publics sont confirmés. Les bases légales et les durées de conservation restent à préciser avant publication.")}</p>
        </aside>
        <section className="privacy-overview" aria-labelledby="privacy-overview-title">
          <h2 id="privacy-overview-title">{tr("Tes données dans le jeu")}</h2>
          <dl>
            <div><dt>{tr("Ton profil")}</dt><dd>{tr("Un identifiant, un pseudo et un avatar permettent de retrouver ton joueur, sans formulaire demandant ton nom ou ton e-mail.")}</dd></div>
            <div><dt>{tr("Tes scores")}</dt><dd>{tr("Ton pseudo, ton avatar et tes scores peuvent apparaître dans les classements et les parties multijoueurs.")}</dd></div>
            <div><dt>{tr("Sur ton appareil")}</dt><dd>{tr("Le navigateur conserve ta session, tes réglages audio et tes records solo. Effacer les records locaux ne supprime pas les scores en ligne.")}</dd></div>
          </dl>
          <Link className="privacy-preferences-link" to="/parametres/preferences-confidentialite">{tr("Gérer mes préférences de confidentialité ")}<span aria-hidden="true">→</span></Link>
        </section>
        <nav className="privacy-summary" aria-label={tr("Sommaire de la politique de confidentialité")}>
          {sections.map(([id, title]) => <a key={id} href={`#${id}`}>{tr(title)}</a>)}
        </nav>
        <article className="settings-card settings-legal-document">
          <section id="responsable" className="settings-legal-section">
            <h2>{tr("1. Responsable et périmètre")}</h2>
            <p>{tr("Ti’Doc Games est un jeu édité par l’Association Ti’Doc, dont l’adresse est : 520 route de Boucieu, 07270 Le Crestet, France.")}</p>
            <p>{tr("Pour toute question relative à tes données, le contact Ti’Doc est :")}</p>
            <a className="settings-legal-email" href="mailto:tidoc.congres@gmail.com">tidoc.congres@gmail.com</a>
            <p>{tr("Cette page concerne Ti’Doc Games, qui est un jeu distinct des activités du congrès. Il peut être utilisé avant, pendant et après le congrès, et reste accessible à toute personne. Les inscriptions au congrès, aux conférences et aux workshops ainsi que la newsletter doivent faire l’objet d’informations adaptées sur les formulaires qui les proposent. Le jeu ne comporte actuellement aucun de ces formulaires et ne demande pas ton nom, ton prénom ou ton adresse e-mail pour jouer.")}</p>
            <p><strong>{tr("Public concerné :")}</strong> {tr(" Ti’Doc Games est ouvert à tous les publics, y compris aux mineurs.")}</p>
          </section>
          <section id="donnees" className="settings-legal-section">
            <h2>{tr("2. Données utilisées et finalités")}</h2>
            <ul>
              <li><strong>{tr("Profil et session :")}</strong> {tr(" un identifiant technique, un pseudonyme, un avatar, les dates de création et de modification du profil et une date de dernière activité permettent de retrouver ton joueur. Une session peut être créée automatiquement à l’ouverture de l’application, sans formulaire d’inscription.")}</li>
              <li><strong>{tr("Scores :")}</strong> {tr(" les meilleurs scores sont conservés pour afficher tes records et les classements.")}</li>
              <li><strong>{tr("Parties multijoueurs :")}</strong> {tr(" la salle, ses participants, les scores, les vies, l’état du jeu et les horaires de partie servent à synchroniser les joueurs et à calculer les résultats.")}</li>
              <li><strong>{tr("Présence et résultats :")}</strong> {tr(" les signaux de présence, les déconnexions et la confirmation de consultation des résultats servent à gérer les forfaits et à afficher les résultats au retour du joueur.")}</li>
              <li><strong>{tr("Préférences locales :")}</strong> {tr(" les volumes et les choix d’activation des musiques et effets, ainsi que des records solo, sont enregistrés dans ton navigateur.")}</li>
            </ul>
            <p>{tr("Un identifiant sans nom réel reste une donnée personnelle lorsqu’il permet de distinguer ou de retrouver un joueur. Le profil est donc pseudonymisé, et non totalement anonyme.")}</p>
            <p>{tr("L’identifiant et les données de partie sont nécessaires aux fonctions en ligne. La personnalisation du pseudo et de l’avatar est facultative : des valeurs sont proposées automatiquement. Évite d’utiliser ton nom complet, des coordonnées ou des informations de santé dans ton pseudo.")}</p>
            <p>{tr("Les contenus médicaux des jeux sont des éléments de jeu ; ils ne servent pas à recueillir un dossier médical.")}</p>
            <p>{tr("Les données techniques traitées par l’hébergeur et les prestataires, notamment les éventuels journaux de connexion et adresses IP, restent à inventorier selon la configuration effectivement utilisée.")}</p>
          </section>
          <section id="bases" className="settings-legal-section">
            <h2>{tr("3. Bases légales — à confirmer")}</h2>
            <p>{tr("Chaque usage doit reposer sur une base légale déterminée par l’association. Les choix ci-dessous sont des pistes de rédaction, à valider avant publication :")}</p>
            <ul>
              <li><strong>{tr("Fourniture du jeu demandé :")}</strong> {tr(" l’exécution du contrat d’utilisation peut être envisagée pour les traitements objectivement nécessaires au service. La création automatique d’un profil dès l’ouverture et la publication des classements doivent être examinées spécifiquement.")}</li>
              <li><strong>{tr("Sécurité et prévention des abus :")}</strong> {tr(" l’intérêt légitime peut être envisagé après examen de la nécessité du traitement et de son équilibre avec les droits des joueurs.")}</li>
            </ul>
            <p>{tr("La simple consultation de cette politique ne vaut pas consentement à des traitements facultatifs.")}</p>
          </section>
          <section id="conservation" className="settings-legal-section">
            <h2>{tr("4. Durées de conservation — à définir")}</h2>
            <p>{tr("Aucune durée définitive ni règle de suppression selon la période d’utilisation du jeu n’a encore été retenue. Les durées et leur point de départ restent à définir pour les profils, scores et parties, puis à mettre en œuvre. Cette version n’annonce donc pas de suppression automatique à une échéance déterminée.")}</p>
            <div className="privacy-table-wrap" role="region" aria-label={tr("Durées de conservation à compléter")} tabIndex={0}>
              <table className="privacy-table">
                <caption>{tr("Décisions à compléter avant publication")}</caption>
                <thead><tr><th scope="col">{tr("Catégorie")}</th><th scope="col">{tr("Durée et point de départ")}</th></tr></thead>
                <tbody>
                  <tr><th scope="row">{tr("Profils et identifiants de session")}</th><td>{tr("À définir, notamment après une période d’inactivité.")}</td></tr>
                  <tr><th scope="row">{tr("Scores et classements")}</th><td>{tr("À définir selon la période pendant laquelle les classements sont proposés.")}</td></tr>
                  <tr><th scope="row">{tr("Parties, présence et résultats")}</th><td>{tr("À définir à partir de la fin de la partie ; distinguer les détails de jeu et les résultats encore à consulter.")}</td></tr>
                  <tr><th scope="row">{tr("Journaux techniques et sauvegardes")}</th><td>{tr("À vérifier auprès de chaque prestataire et dans ses paramètres.")}</td></tr>
                  <tr><th scope="row">{tr("Préférences audio et records locaux")}</th><td>{tr("Pas de date d’expiration prévue par le code actuel ; conservation jusqu’à leur effacement ou celui des données du site par le navigateur.")}</td></tr>
                </tbody>
              </table>
            </div>
          </section>
          <section id="destinataires" className="settings-legal-section">
            <h2>{tr("5. Destinataires, hébergement et transferts")}</h2>
            <p>{tr("Ton pseudonyme, ton avatar et tes scores peuvent être visibles par les autres utilisateurs dans les classements et par les participants à tes parties. Les données de partie nécessaires au jeu sont partagées avec les participants concernés.")}</p>
            <p>{tr("Les membres habilités de l’équipe Ti’Doc et les prestataires techniques peuvent avoir accès aux données nécessaires à leurs missions. Les habilitations et les contrats doivent être vérifiés par l’association.")}</p>
            <ul>
              <li><strong>{tr("Supabase :")}</strong> {tr(" utilisé par le jeu pour les sessions, les profils, les scores et les parties. La base de données du projet est hébergée dans la région West EU. Les journaux, les sauvegardes et les conditions de traitement restent à vérifier.")}</li>
              <li><strong>{tr("GitHub Pages :")}</strong> {tr(" héberge le site Ti’Doc Games. Les données techniques traitées pour cet hébergement restent à préciser.")}</li>
            </ul>
            <p>{tr("Si tu contactes Ti’Doc par e-mail, le contenu de ta demande et ton adresse e-mail servent à traiter ton message. Le service de messagerie utilisé, les personnes habilitées à consulter les demandes et leur durée de conservation restent à préciser.")}</p>
            <p>{tr("Les éventuels transferts ou accès depuis un pays extérieur à l’Espace économique européen et les garanties associées restent à vérifier. Cette version ne garantit pas que toutes les données restent dans l’Union européenne.")}</p>
          </section>
          <section id="stockage" className="settings-legal-section">
            <h2>{tr("6. Stockage sur ton appareil et liens externes")}</h2>
            <p>{tr("Le jeu utilise le stockage du navigateur pour conserver la session de connexion, les réglages audio et les records solo. Ces mécanismes doivent être examinés selon leur finalité, même lorsqu’ils n’utilisent pas de cookies.")}</p>
            <p><strong>{tr("Musiques du jeu :")}</strong> {tr(" certaines musiques utilisées par Ti’Doc Games ont été téléchargées depuis la rubrique musique Electro de ")}<a href="https://pixabay.com/fr/music/search/electro/" target="_blank" rel="noopener noreferrer">Pixabay</a>{tr(". Leur utilisation est encadrée par la ")}<a href="https://pixabay.com/service/license-summary/" target="_blank" rel="noopener noreferrer">{tr("licence de contenu Pixabay")}</a>{tr(". Les fichiers sont intégrés au jeu comme éléments d’une œuvre interactive et ne sont pas proposés séparément au téléchargement. Les titres, liens de pistes et justificatifs de téléchargement doivent être conservés par l’association.")}</p>
            <p>{tr("Dans les ")}<Link to="/parametres/preferences-confidentialite">{tr("préférences de confidentialité")}</Link>{tr(", tu peux effacer les quatre records solo de ce navigateur après confirmation. Ton profil, ta session, tes réglages audio et les scores en ligne sont conservés. De nouveaux records locaux pourront être enregistrés lors de tes prochaines parties.")}</p>
            <p>{tr("Effacer les données du site dans ton navigateur supprime les réglages et la session qui y sont stockés. Tu peux alors perdre l’accès à ton ancien profil. Cela ne supprime pas automatiquement les données déjà enregistrées sur le serveur.")}</p>
            <p>{tr("Aucun outil publicitaire ou de mesure d’audience n’a été identifié dans le code du jeu examiné pour ce brouillon. La configuration du site déployé et des services externes reste à vérifier. Si des traceurs nécessitant un consentement sont ajoutés, ils devront attendre ton choix et permettre son retrait.")}</p>
            <p>{tr("Les liens vers le site du congrès, Instagram et TikTok ouvrent des services distincts, soumis à leurs propres politiques de confidentialité.")}</p>
          </section>
          <section id="droits" className="settings-legal-section">
            <h2>{tr("7. Tes droits et comment les exercer")}</h2>
            <p>{tr("Selon le traitement et les conditions prévues par la réglementation, tu peux demander l’accès, la rectification ou l’effacement de tes données, la limitation du traitement, t’y opposer ou demander leur portabilité. Si un traitement repose sur ton consentement, tu peux le retirer pour l’avenir.")}</p>
            <p>{tr("Pour faire une demande, écris à ")}<a href="mailto:tidoc.congres@gmail.com">tidoc.congres@gmail.com</a> {tr(" en précisant ta demande et le pseudo concerné. Ne transmets jamais ton jeton de session ou un mot de passe. L’association pourra demander les éléments strictement nécessaires pour retrouver ton profil et vérifier que la demande te concerne.")}</p>
            <p>{tr("Le délai de réponse prévu par la réglementation est d’un mois à compter de la réception de la demande. Il peut être prolongé de deux mois en raison de la complexité ou du nombre de demandes ; dans ce cas, tu dois être informé de la prolongation et de ses motifs pendant le premier mois.")}</p>
            <p>{tr("Tu peux aussi adresser une réclamation à la ")}<a href="https://www.cnil.fr/fr/adresser-une-plainte" target="_blank" rel="noopener noreferrer">CNIL</a>.</p>
          </section>
          <section id="securite" className="settings-legal-section">
            <h2>{tr("8. Sécurité et mises à jour")}</h2>
            <p>{tr("Le jeu utilise une session d’authentification pour identifier le joueur auprès du service de données. Les règles d’accès à la base, les habilitations de l’équipe, les sauvegardes et les mesures de sécurité du déploiement doivent être vérifiées ; aucune sécurité absolue n’est promise.")}</p>
            <p>{tr("Cette politique doit être mise à jour lorsque les fonctionnalités, les destinataires ou les usages des données changent. La date affichée en haut de page correspond à la dernière révision du texte.")}</p>
          </section>
        </article>
        <div className="settings-legal-footer">
          <strong>Ti’Doc Games</strong>
          <span>Ti’Doc</span>
          <p>{tr("APPRENDRE • JOUER • SE DÉPASSER")}</p>
        </div>
      </div>
    </section>
  )
}
