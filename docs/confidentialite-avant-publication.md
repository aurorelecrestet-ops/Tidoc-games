# Politique de confidentialité Ti’Doc — préparation

Le document intégré à l’application est un brouillon. Il distingue les fonctions constatées dans Ti’Doc Games des formulaires du site du congrès, absents de ce dépôt. Il n’atteste pas de la conformité du déploiement.

## Informations confirmées par le porteur du projet

- Nom utilisé : Ti’Doc. Association responsable : Association Ti’Doc, 520 route de Boucieu, 07270 Le Crestet, France.
- Contact : `tidoc.congres@gmail.com`.
- Le site Ti’Doc Games est hébergé sur GitHub Pages.
- Les données multijoueurs sont stockées dans Supabase, dont la base de données du projet est hébergée dans la région West EU.
- Aucune durée définitive de conservation ni suppression après chaque congrès n’a été décidée.
- Le jeu est ouvert à tous les publics, y compris aux mineurs, et est indépendant du congrès : il peut être utilisé avant, pendant et après celui-ci.
- Certaines musiques du jeu proviennent de la rubrique musique Electro de Pixabay et sont intégrées comme éléments d’une œuvre interactive ; conserver les liens des pistes, les fichiers téléchargés et les justificatifs associés.

## Informations à compléter

- Base légale retenue pour chaque finalité. L’association est identifiée et son adresse est confirmée ; un responsable de traitement peut être l’association elle-même, sans désigner artificiellement une personne physique ou un DPO.
- Pour chaque finalité : base légale retenue, nécessité, données obligatoires/facultatives et conséquences d’un refus. Examiner spécialement la création d’une session dès l’ouverture et l’exposition des scores aux autres utilisateurs.
- Durées précises ou critères opérationnels pour les profils, scores, salles, états de jeu, présence, résultats à consulter, journaux et sauvegardes. Déterminer le point de départ et mettre en œuvre la suppression ou l’anonymisation correspondante ; une phrase dans une politique ne crée pas de purge.
- Services Google effectivement utilisés, sous-traitants et contrats. GitHub Pages est confirmé comme hébergeur du site Ti’Doc Games et Supabase comme hébergeur de la base dans la région West EU ; vérifier aussi les accès, les transferts hors EEE et les garanties associées.
- Demandes reçues par e-mail : prestataire de messagerie, accès habilités, base légale et durée de conservation des échanges.
- Configuration réelle des journaux, traceurs, outils d’audience et éventuels services embarqués, au-delà du code de ce dépôt.
- Vérifier les adaptations nécessaires à l’accueil des mineurs et les informations destinées à ce public.
- Procédure de réponse aux demandes de droits : retrouver un profil pseudonyme, vérifier l’identité de façon proportionnée, exporter/rectifier/effacer, respecter les délais applicables. Ne pas demander de jeton de session.

## Constats techniques du dépôt

- `src/lib/player.ts` : authentification Supabase sans formulaire d’identité ; profil avec pseudo, avatar et dernière activité ; envoi de meilleurs scores et lecture des classements.
- `src/components/Header.tsx` : initialisation automatique du profil à son montage. La notice devrait être accessible dès la première collecte ; examiner si cette initialisation doit attendre une action explicite de jeu.
- `src/lib/multiplayer.ts`, les pages multijoueurs et la migration de présence : salles, participants, états, scores et gestion des déconnexions/résultats.
- `src/lib/audioSettings.ts` : réglages audio dans le stockage local, sans échéance.
- Musiques : source déclarée dans la politique de confidentialité, rubrique Electro de Pixabay : https://pixabay.com/fr/music/search/electro/ ; licence : https://pixabay.com/service/license-summary/.
- Pages solo : quatre records locaux, sans échéance ; effacement ciblé disponible dans les préférences de confidentialité, après confirmation, sans effacement du profil ni des scores serveur.
- `src/lib/supabase.ts` : persistance de la session dans le navigateur. Effacer le stockage local ne supprime pas les données serveur.
- Pas de bibliothèque d’audience ni de publicité repérée dans les sources examinées ; cela ne démontre pas l’absence de traceurs dans le déploiement.
- Pages légales accessibles directement sans monter le Header ni le contrôle de résultats ; pas de création de profil par ces pages.

## À effectuer avant publication finale

1. Compléter les informations ci-dessus et remplacer les paragraphes provisoires par les pratiques validées.
2. Aligner le registre des traitements, les contrats et la configuration effective sur le texte.
3. Vérifier les règles d’accès Supabase avec plusieurs utilisateurs et une session sans connexion ; les valeurs de clés publiques du frontend ne remplacent pas les règles RLS.
4. Mettre en œuvre et vérifier les durées et la procédure de droits. Ne pas annoncer de mesures de sécurité non contrôlées.
5. Rédiger les mentions propres aux inscriptions, workshops, conférences et newsletter sur leurs formulaires, en incluant les données et prestataires effectivement utilisés.
6. Vérifier les stockages et traceurs. Les exemptions de consentement dépendent de la finalité et de la stricte nécessité ; ne pas ajouter un bandeau de consentement fictif qui n’empêche aucun dépôt.
7. Retirer le statut brouillon et mettre à jour la date uniquement après finalisation du contenu.

## Sources officielles consultées le 22 septembre 2026

- CNIL, information et transparence : https://www.cnil.fr/fr/conformite-rgpd-information-des-personnes-et-transparence
- CNIL, exemples de mentions : https://www.cnil.fr/fr/rgpd-exemples-de-mentions-dinformation
- CNIL, cookies et traceurs : https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies/que-dit-la-loi

La CNIL demande notamment l’identité du responsable, les finalités et bases légales, les destinataires, les durées ou leurs critères, les droits et le contact, ainsi que les transferts et garanties lorsqu’ils existent. Les traceurs d’authentification ou certaines personnalisations peuvent être exemptés de consentement sous conditions ; l’utilisation de stockage local n’écarte pas cette analyse.
