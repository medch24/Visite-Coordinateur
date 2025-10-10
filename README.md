# Teacher Evaluation System

Un système web pour l'évaluation des enseignants avec interface bilingue (Français/Anglais).

## Fonctionnalités

- **Authentification sécurisée** pour coordinateurs et enseignants
- **Interface bilingue** (Français/Anglais)
- **Évaluations détaillées** avec critères standardisés
- **Tableau de bord coordinateur** pour gérer les évaluations
- **Tableau de bord enseignant** pour consulter les rapports
- **Base de données MongoDB** pour la persistance des données

## Structure du Projet

```
├── index.js              # Serveur Express principal
├── package.json          # Dépendances et configuration
├── vercel.json           # Configuration de déploiement Vercel
├── .env.example          # Variables d'environnement exemple
├── public/
│   ├── index.html        # Interface utilisateur principale
│   └── styles.css        # Styles CSS
└── README.md             # Documentation
```

## Installation et Développement Local

1. Installer les dépendances :
```bash
npm install
```

2. Copier le fichier d'environnement :
```bash
cp .env.example .env
```

3. Configurer votre base de données MongoDB dans le fichier `.env`

4. Démarrer le serveur :
```bash
npm start
```

## Déploiement sur Vercel

Ce projet est configuré pour un déploiement facile sur Vercel :

1. Connecter votre repository Git à Vercel
2. Configurer la variable d'environnement `MONGODB_URI` dans Vercel
3. Déployer automatiquement

## Utilisateurs par Défaut

### Coordinateurs :
- **Mohamed** / Mohamed@86 (Enseignants assignés: Morched, Kamel, Abas, etc.)
- **Zohra** / Zohra@40 (Enseignants assignés: Aichetou, Inas, Anwar, etc.)
- **Rasha** / Rasha@26 (Enseignants assignés: Amal, Rouba, Rayan, etc.)

### Enseignants :
Les enseignants utilisent leur nom comme identifiant et mot de passe.

## Technologies Utilisées

- **Backend**: Node.js + Express.js
- **Base de données**: MongoDB + Mongoose
- **Frontend**: HTML5 + CSS3 + JavaScript Vanilla
- **Déploiement**: Vercel (Serverless Functions)

## Architecture

Le système utilise une architecture serverless compatible avec Vercel, avec :
- Connexions MongoDB mises en cache
- Gestion d'erreurs robuste
- Routes API RESTful
- Interface utilisateur responsive

## Support

Pour toute question ou problème, veuillez créer une issue dans le repository du projet.