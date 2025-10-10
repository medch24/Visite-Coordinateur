# Guide de Déploiement sur Vercel

## 🚀 Instructions de Déploiement

### 1. Préparation
Le projet est maintenant prêt pour le déploiement sur Vercel avec toutes les corrections appliquées :

✅ **Corrections effectuées :**
- ✅ **PROBLÈME "Cannot GET /" RÉSOLU** - Restructuration complète pour Vercel serverless
- ✅ **Fonctions API individuelles** - /api/login.js, /api/evaluations.js, /api/evaluations/[teacherName].js  
- ✅ **Configuration Vercel native** - vercel.json optimisé pour serverless functions
- ✅ **Headers CORS** configurés sur toutes les fonctions API
- ✅ **Configuration MongoDB** avec base de données en ligne
- ✅ **Support variables d'environnement** pour production
- ✅ **Gestion d'erreurs robuste** pour toutes les routes
- ✅ **Connexion MongoDB mise en cache** pour performance
- ✅ **Initialisation sécurisée** de la base de données

### 2. Déploiement sur Vercel

#### Option A : Via l'interface Vercel (Recommandé)
1. **Se connecter à Vercel** : Aller sur [vercel.com](https://vercel.com)
2. **Import du projet** : Cliquer sur "New Project" et importer depuis GitHub
3. **Sélectionner le repository** : `medch24/Visite-Coordinateur`
4. **Configuration automatique** : Vercel détectera automatiquement la configuration

#### Option B : Via CLI Vercel
```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter à Vercel
vercel login

# Déployer
vercel --prod
```

### 3. Configuration des Variables d'Environnement

⚠️ **IMPORTANT** : Configurer la variable d'environnement MongoDB dans Vercel :

1. Aller dans les settings du projet sur Vercel
2. Section "Environment Variables"
3. Ajouter :
   - **Name** : `MONGODB_URI`
   - **Value** : Votre URL MongoDB Atlas (ex: `mongodb+srv://username:password@cluster0.mongodb.net/teacherEvaluationDB?retryWrites=true&w=majority`)

### 4. Configuration MongoDB Atlas (Recommandé)

Pour obtenir une base MongoDB gratuite :

1. **Créer un compte** sur [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. **Créer un cluster gratuit** (M0 Sandbox)
3. **Configurer l'accès réseau** : Autoriser l'accès depuis n'importe où (`0.0.0.0/0`)
4. **Créer un utilisateur de base de données**
5. **Copier l'URI de connexion**
6. **L'ajouter dans Vercel** comme variable d'environnement

### 5. Test après Déploiement

Une fois déployé, tester les fonctionnalités :

✅ **Vérifications à effectuer :**
- [ ] Page de connexion s'affiche correctement
- [ ] Changement de langue fonctionne
- [ ] Connexion avec les identifiants coordinateur
- [ ] Connexion avec les identifiants enseignant  
- [ ] Formulaire d'évaluation fonctionne
- [ ] Soumission d'évaluation réussie
- [ ] Affichage des rapports pour les enseignants

### 6. Utilisateurs de Test

#### Coordinateurs :
- **Mohamed** / Mohamed@86
- **Zohra** / Zohra@40  
- **Rasha** / Rasha@26

#### Enseignants :
Tous utilisent leur nom comme identifiant et mot de passe (ex: **Morched** / Morched)

### 7. Dépannage

#### Erreurs courantes :
- **Erreur MongoDB** : Vérifier la variable d'environnement `MONGODB_URI`
- **Routes 404** : La configuration Vercel gère automatiquement le routage
- **Erreur de build** : Vérifier que toutes les dépendances sont dans `package.json`

#### Support :
- Vérifier les logs dans l'interface Vercel
- Tester localement avec `vercel dev` (après avoir installé `npm i -g vercel`)
- Vérifier la configuration des variables d'environnement
- **Structure des fichiers :**
  ```
  /api/login.js                    # Fonction d'authentification
  /api/evaluations.js              # CRUD évaluations  
  /api/evaluations/[teacherName].js # Évaluations par enseignant
  /public/index.html               # Interface utilisateur
  /vercel.json                     # Configuration Vercel
  ```

## 🎯 URLs Important

- **Repository GitHub** : https://github.com/medch24/Visite-Coordinateur
- **Vercel Dashboard** : https://vercel.com/dashboard
- **MongoDB Atlas** : https://cloud.mongodb.com/

---

**Note** : Après le déploiement, l'URL Vercel sera fournie et le site sera accessible mondialement avec HTTPS automatique.