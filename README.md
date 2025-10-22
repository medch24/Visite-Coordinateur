# Système d'Évaluation des Enseignants - École Internationale Alkawthar

Un système professionnel d'évaluation des enseignants avec stockage automatique MongoDB, génération de documents Word améliorée et support bilingue (FR/EN).

## 🚀 Fonctionnalités

### ✨ Nouvelles Fonctionnalités v4.0
- **🔄 Connexion directe MongoDB** - Intégration simplifiée sans fichiers intermédiaires
- **📥 Chargement automatique amélioré** - Les évaluations se chargent automatiquement depuis MongoDB
- **📄 Génération Word professionnelle** - Documents Word avec design amélioré et formatage professionnel
- **👨‍🏫 Interface coordinateur enrichie** - Affichage des évaluations précédentes avec téléchargement Word direct
- **📊 Tableau de bord enseignant optimisé** - Évaluations organisées par date avec téléchargement facile
- **🌐 Synchronisation en temps réel** - Fonctionne hors ligne avec synchronisation automatique
- **📊 Sauvegarde hybride** - Combine localStorage (hors ligne) et MongoDB (en ligne)
- **🔧 API REST complète** - Endpoints pour toutes les opérations CRUD

### 📋 Fonctionnalités Existantes (Conservées)
- **💯 Système d'évaluation sur 100 points** avec critères détaillés
- **📄 Génération automatique de documents Word** avec tableaux détaillés
- **🌍 Support bilingue** (Français/Anglais) 
- **👥 Gestion multi-utilisateurs** (Coordinateurs et Enseignants)
- **📈 Tableaux de bord interactifs** pour coordinateurs et enseignants
- **📱 Interface responsive** adaptée mobile/tablette/desktop
- **🔐 Authentification sécurisée** avec mémorisation optionnelle
- **📊 Rapports de performance** avec niveaux de performance colorés
- **🎯 Évaluations détaillées** avec forces, améliorations et recommandations

## 📖 Configuration MongoDB

### 1. Configuration MongoDB Atlas (Recommandé)

1. **Créer un compte MongoDB Atlas** : [https://cloud.mongodb.com](https://cloud.mongodb.com)

2. **Créer un nouveau cluster** :
   - Choisissez le plan gratuit (M0 Sandbox)
   - Sélectionnez une région proche
   - Nommez votre cluster

3. **Configurer l'accès** :
   - Créez un utilisateur de base de données
   - Autorisez l'accès depuis toutes les IPs (0.0.0.0/0) pour Vercel
   - Ou ajoutez les IPs spécifiques de Vercel si préféré

4. **Obtenir la chaîne de connexion** :
   - Cliquez sur "Connect"
   - Choisissez "Connect your application"
   - Copiez la chaîne de connexion MongoDB

### 2. Configuration Vercel

1. **Variables d'environnement** :
   - Dans votre projet Vercel, allez dans Settings > Environment Variables
   - Ajoutez : `MONGODB_URI` = votre chaîne de connexion MongoDB

2. **Format de la chaîne de connexion** :
   ```
   mongodb+srv://username:password@cluster.mongodb.net/teacher_evaluation_system?retryWrites=true&w=majority
   ```

### 3. Configuration Locale (Développement)

1. **Copiez le fichier d'exemple** :
   ```bash
   cp .env.local.example .env.local
   ```

2. **Modifiez `.env.local`** avec vos propres valeurs :
   ```env
   MONGODB_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/teacher_evaluation_system?retryWrites=true&w=majority
   ```

## 🛠️ Installation et Déploiement

### Déploiement Vercel (Recommandé)

1. **Clonez le repository** :
   ```bash
   git clone <your-repo-url>
   cd webapp
   ```

2. **Installez Vercel CLI** :
   ```bash
   npm install -g vercel
   ```

3. **Déployez** :
   ```bash
   vercel --prod
   ```

4. **Configurez les variables d'environnement** dans le dashboard Vercel

### Développement Local

1. **Installez les dépendances** :
   ```bash
   npm install
   ```

2. **Configurez `.env.local`** avec votre URI MongoDB

3. **Démarrez le serveur de développement** :
   ```bash
   npm run dev
   ```

4. **Ouvrez** [http://localhost:3000](http://localhost:3000)

## 📋 API Endpoints

### Évaluations
- `GET /api/evaluations` - Récupérer toutes les évaluations
- `GET /api/evaluations?teacherName=xxx` - Évaluations par enseignant
- `POST /api/evaluations` - Créer une nouvelle évaluation
- `GET /api/evaluations/:id` - Récupérer une évaluation spécifique
- `PUT /api/evaluations/:id` - Mettre à jour une évaluation
- `DELETE /api/evaluations/:id` - Supprimer une évaluation

### Système
- `GET /api/health` - Vérification de santé (inclut MongoDB)
- `GET /api/users` - Liste des utilisateurs
- `POST /api/sync-data` - Synchronisation des données localStorage

## 👥 Comptes Utilisateurs

### Coordinateurs
- **Mohamed** / Mohamed@86 - Enseignants assignés : Morched, Kamel, Abas, Zine, Youssef, Oumarou, Tonga, Sylvano, Sami, Mohamed Ali
- **Zohra** / Zohra@40 - Enseignants assignés : Aichetou, Inas, Anwar, Souha, Amal, Shanouja, Jana, Hiba  
- **Rasha** / Rasha@26 - Enseignants assignés : Amal, Rouba, Rayan, Imane, Nesrine, Fatima, Samar, Romana, Nour

### Enseignants
Tous les enseignants utilisent leur prénom comme nom d'utilisateur ET mot de passe.

## 🔧 Fonctionnement Technique

### Système Hybride de Stockage
- **En ligne** : Sauvegarde automatique en MongoDB Atlas
- **Hors ligne** : Fallback vers localStorage du navigateur
- **Synchronisation** : Réconciliation automatique lors de la reconnexion

### Génération de Documents Word
- Utilise la librairie `docx` pour créer des documents .docx natifs
- Tableaux détaillés avec tous les critères d'évaluation
- Formatage professionnel avec en-têtes, scores et commentaires
- Téléchargement automatique via FileSaver.js

### Sécurité
- Variables d'environnement pour les chaînes de connexion sensibles
- Headers CORS configurés pour la compatibilité cross-domain
- Validation des données côté API

## 📊 Structure de la Base de Données

### Collection `evaluations`
```javascript
{
  id: "1634567890123",
  teacherName: "Morched",
  coordinatorName: "Mohamed", 
  class: "6ème A",
  subject: "Mathématiques",
  sessionNumber: "1",
  visitDate: "2024-10-14",
  grandTotal: 87,
  criteriaDetails: { /* structure complète des critères */ },
  rawCriteria: { /* notes brutes 1-5 pour chaque critère */ },
  comments: {
    strengths: "Excellente gestion de classe...",
    toImprove: "Pourrait varier davantage...", 
    recommendations: "Intégrer plus d'activités..."
  },
  date: "2024-10-14T10:30:00.000Z",
  createdAt: "2024-10-14T10:30:00.000Z",
  syncedAt: "2024-10-14T10:30:05.000Z"
}
```

## 📁 Structure du Projet

```
webapp/
├── api/
│   └── index.js              # API MongoDB serverless (Vercel)
├── public/
│   ├── index.html            # Interface principale
│   ├── script.js             # Logique application avec MongoDB direct
│   └── style.css             # Styles CSS
├── package.json              # Dépendances
└── vercel.json               # Configuration Vercel
```

## 🚀 Améliorations v5.0 (Dernière Version)

### 🎯 Améliorations Majeures
1. **✅ Architecture optimisée MongoDB** - Connexion directe avec indexation pour performances maximales
2. **✅ Chargement ultra-rapide** - Les évaluations se chargent instantanément par enseignant
3. **✅ Document Word professionnel redesigné** - Design moderne avec :
   - 📊 Tableau récapitulatif par catégorie
   - 🎨 Couleurs et icônes visuelles
   - 📈 Bordures et mise en forme professionnelle
   - ✨ Notifications de téléchargement animées
4. **✅ Interface coordinateur améliorée** - Affichage automatique des évaluations dès la sélection d'un enseignant
5. **✅ Téléchargement Word direct** - Boutons de téléchargement dans toutes les listes
6. **✅ Interface enseignant optimisée** - Évaluations triées par date avec accès rapide
7. **✅ API REST optimisée** - Requêtes filtrées et limitées pour meilleures performances
8. **✅ Conservation totale des fonctionnalités** - Tous les designs et options préservés
9. **✅ Surveillance réseau intelligente** - Détection automatique en ligne/hors ligne
10. **✅ Sauvegarde hybride sécurisée** - MongoDB + localStorage pour résilience maximale

### 📋 Structure Finale du Projet
```
webapp/
├── api/
│   └── index.js              # API MongoDB serverless optimisée (Vercel)
├── public/
│   ├── index.html            # Interface principale
│   ├── script.js             # Logique application avec MongoDB direct
│   └── style.css             # Styles CSS avec animations
├── package.json              # Dépendances
└── vercel.json               # Configuration Vercel
```

### 🎨 Améliorations de Design Word
- **Émojis visuels** : 🎓 📊 ⭐ 📈 💡
- **Tableaux colorés** : En-têtes bleus (#005A9E), lignes alternées
- **Bordures professionnelles** : Doubles bordures pour sections importantes
- **Catégorisation visuelle** : Tableau récapitulatif avec pourcentages
- **Sections commentaires** : Bordures gauches colorées par type
- **Pied de page moderne** : Date formatée et copyright

## 📞 Support

Pour toute question technique ou problème :
- Vérifiez que MongoDB Atlas est correctement configuré
- Consultez les logs Vercel pour les erreurs d'API
- Testez la connectivité avec `/api/health`

## 📄 Licence

MIT License - Libre d'utilisation pour les établissements éducatifs.