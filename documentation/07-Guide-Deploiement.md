# Chapitre 7 : Guide de Déploiement et d'Opérations

Ce chapitre est un guide pratique destiné aux administrateurs système, aux équipes DevOps et aux développeurs chargés de déployer, de configurer et de maintenir le Système de Gestion du Café Marie Anne en environnement de production.

---

## 7.1. Prérequis au Déploiement

Avant de commencer, assurez-vous de disposer des outils et des accès suivants :

-   **Contrôle de Version :**
    -   Git installé localement.
    -   Un compte sur une plateforme Git (GitHub, GitLab, Bitbucket) où le code source est hébergé.
-   **Environnement de Développement :**
    -   Node.js (version 18 ou supérieure).
    -   Un gestionnaire de paquets (`npm` ou `yarn`).
-   **Comptes de Services Cloud :**
    -   Un compte **Supabase** avec un projet créé.
    -   Un compte sur une plateforme d'hébergement frontend comme **Vercel** ou **Netlify**.
-   **Outils en Ligne de Commande (CLI) :**
    -   La **Supabase CLI** installée globalement.
        ```bash
        npm install supabase --global
        ```

---

## 7.2. Configuration de l'Environnement Supabase

Cette section détaille la configuration initiale du projet Supabase.

### 1. Création du Projet

-   Connectez-vous à votre tableau de bord Supabase.
-   Cliquez sur "New Project" et suivez les instructions pour créer un nouveau projet. Choisissez une région de serveur proche de vos utilisateurs (ex: `ca-central-1` pour le Canada).
-   **Important :** Conservez précieusement le mot de passe de la base de données que vous définissez.

### 2. Configuration de la Base de Données

-   Naviguez vers `SQL Editor` dans le tableau de bord de votre projet.
-   Exécutez les scripts SQL nécessaires pour créer le schéma de la base de données. Ces scripts incluent la création de toutes les tables (`customer_profiles`, `orders`, `security_alerts`, etc.) et l'activation de la **Row Level Security (RLS)** sur chacune d'entre elles.
    *Note : Les fichiers de migration complets se trouvent dans le répertoire `supabase/migrations` du projet.*

### 3. Configuration du Stockage (Storage)

-   Naviguez vers `Storage` dans le menu de gauche.
-   Cliquez sur "New Bucket".
-   Créez un bucket nommé `product-images`.
-   Assurez-vous que l'option "Public bucket" est **cochée**. Cela permet un accès public en lecture aux images.
-   Après la création, allez dans les politiques (`Policies`) du bucket et assurez-vous que les politiques suivantes sont en place (ou ajoutez-les) :
    -   **Lecture (`SELECT`) :** Accès public pour tout le monde.
    -   **Écriture (`INSERT`, `UPDATE`, `DELETE`) :** Accès restreint aux utilisateurs authentifiés (`authenticated`).

### 4. Configuration des Tâches Planifiées (Cron Jobs)

-   Naviguez vers `Database` > `Functions`.
-   Assurez-vous que la fonction `cleanup_expired_tokens()` a été créée lors des migrations SQL.
-   Naviguez vers `Database` > `Cron Jobs`.
-   Cliquez sur "New Job".
-   **Nom :** `Nettoyage des Tokens Expirés`
-   **Expression Cron :** `0 0 * * *` (s'exécute tous les jours à minuit UTC).
-   **Fonction à appeler :** Sélectionnez `cleanup_expired_tokens`.

---

## 7.3. Déploiement du Frontend (Vercel/Netlify)

Le frontend est une application Vite/React qui peut être déployée sur n'importe quelle plateforme d'hébergement statique moderne.

1.  **Connecter le Dépôt Git :**
    -   Dans votre tableau de bord Vercel ou Netlify, créez un nouveau projet.
    -   Connectez-le au dépôt Git où se trouve le code source de l'application.

2.  **Configurer les Paramètres de Build :**
    -   **Framework Preset :** Sélectionnez `Vite`.
    -   **Build Command :** `npm run build` (ou `vite build`).
    -   **Output Directory :** `dist`.

3.  **Configurer les Variables d'Environnement :**
    -   Dans les paramètres du projet sur Vercel/Netlify, ajoutez les variables d'environnement suivantes. Celles-ci sont nécessaires pour que l'application cliente puisse communiquer avec Supabase.
        -   `VITE_SUPABASE_URL` : L'URL de votre projet Supabase.
        -   `VITE_SUPABASE_ANON_KEY` : La clé publique (`anon`) de votre projet.
    -   Vous trouverez ces valeurs dans le tableau de bord Supabase sous `Project Settings` > `API`.
    -   **Important :** Seules les variables préfixées par `VITE_` sont exposées au client. Ne mettez **jamais** de clés secrètes ici.

4.  **Configurer les Redirections (Rewrites) :**
    -   Le fichier `vercel.json` à la racine du projet contient déjà la configuration nécessaire pour une Single-Page Application (SPA). Il redirige toutes les requêtes non trouvées vers `index.html`, permettant à `react-router-dom` de gérer le routage côté client.
        ```json
        {
          "rewrites": [
            { "source": "/(.*)", "destination": "/index.html" }
          ]
        }
        ```

5.  **Déployer :**
    -   Lancez le premier déploiement. Les déploiements suivants seront automatiques à chaque `push` sur la branche principale.

---

## 7.4. Déploiement des Edge Functions

L'Edge Function `crypto-service` doit être déployée séparément à l'aide de la Supabase CLI.

1.  **Se Connecter à Supabase :**
    ```bash
    supabase login
    ```
    Suivez les instructions pour vous authentifier.

2.  **Lier le Projet Local au Projet Supabase :**
    ```bash
    supabase link --project-ref <votre-project-ref>
    ```
    Le `<project-ref>` est l'identifiant de votre projet, visible dans l'URL du tableau de bord Supabase.

3.  **Déployer la Fonction :**
    ```bash
    supabase functions deploy crypto-service --no-verify-jwt
    ```
    -   `crypto-service` est le nom du dossier de la fonction.
    -   `--no-verify-jwt` est **crucial**. Il indique à la passerelle Supabase de ne pas vérifier le JWT automatiquement, car nous le faisons manuellement à l'intérieur de la fonction pour une sécurité accrue.

---

## 7.5. Gestion des Variables d'Environnement et des Secrets

La gestion correcte des secrets est la pierre angulaire de la sécurité du système.

### 1. Secrets Côté Serveur (Edge Functions)

Le secret le plus important est la `ENCRYPTION_KEY`. Il ne doit **jamais** être stocké dans le code source.

-   **Génération d'une Clé Sécurisée :**
    Utilisez OpenSSL pour générer une clé de 256 bits (64 caractères hexadécimaux) :
    ```bash
    openssl rand -hex 32
    ```

-   **Configuration du Secret via la CLI (Recommandé) :**
    ```bash
    supabase secrets set ENCRYPTION_KEY=<votre_cle_generee>
    ```

-   **Configuration via le Tableau de Bord :**
    1.  Naviguez vers `Edge Functions` dans votre projet Supabase.
    2.  Cliquez sur la fonction `crypto-service`.
    3.  Allez dans l'onglet `Secrets` et ajoutez la variable `ENCRYPTION_KEY`.

### 2. Variables Côté Client (Frontend)

Comme mentionné dans la section 7.3, les seules variables exposées au client sont `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`. Elles sont publiques par nature et leur sécurité est assurée par les politiques RLS de la base de données.

---

## 7.6. Procédures de Maintenance

### 1. Mises à Jour du Logiciel

-   **Frontend :** Poussez simplement vos modifications sur la branche principale de votre dépôt Git. Vercel/Netlify détectera le changement et déclenchera automatiquement un nouveau build et déploiement.
-   **Edge Functions :** Après avoir modifié le code de la fonction, redéployez-la avec la CLI :
    ```bash
    supabase functions deploy crypto-service --no-verify-jwt
    ```
-   **Schéma de la Base de Données :** Pour des modifications de schéma, utilisez les migrations Supabase :
    1.  Créez un nouveau fichier de migration : `supabase migration new <nom_de_la_migration>`
    2.  Écrivez vos changements SQL dans le fichier généré.
    3.  Appliquez la migration à votre base de données de production : `supabase db push`

### 2. Rotation des Clés de Chiffrement

La rotation de la `ENCRYPTION_KEY` est une opération de sécurité critique qui doit être effectuée avec une extrême prudence (ex: annuellement).

**Procédure Recommandée :**

1.  **Mettre l'application en mode maintenance.**
2.  **Créer une nouvelle clé de 256 bits.**
3.  **Ajouter la nouvelle clé** comme un nouveau secret dans Supabase, par exemple `NEW_ENCRYPTION_KEY`.
4.  **Créer une fonction de migration** (une Edge Function temporaire ou un script local) qui :
    a. Lit chaque ligne des tables contenant des données chiffrées (`customer_profiles`).
    b. Appelle l'Edge Function `crypto-service` pour déchiffrer les données avec l'ancienne clé (`ENCRYPTION_KEY`).
    c. Appelle une version modifiée de l'Edge Function pour ré-chiffrer les données avec la nouvelle clé (`NEW_ENCRYPTION_KEY`).
    d. Met à jour la ligne dans la base de données avec les nouvelles données chiffrées.
5.  **Promouvoir la nouvelle clé :** Une fois toutes les données migrées, mettez à jour le secret `ENCRYPTION_KEY` avec la valeur de la nouvelle clé et supprimez `NEW_ENCRYPTION_KEY`.
6.  **Redéployer l'Edge Function `crypto-service`** pour qu'elle prenne en compte la nouvelle clé.
7.  **Retirer l'application du mode maintenance.**

### 3. Sauvegardes (Backups)

-   Supabase effectue des **sauvegardes quotidiennes automatiques** de votre base de données.
-   Vous pouvez accéder à ces sauvegardes et les restaurer depuis le tableau de bord Supabase sous `Database` > `Backups`.
-   Il est recommandé de télécharger périodiquement une sauvegarde manuelle pour un archivage hors site.

### 4. Surveillance (Monitoring)

-   **Tableau de Bord Supabase :** Utilisez les sections `Reports` et `Logs` pour surveiller l'état de santé de votre API, de votre base de données et de vos fonctions.
-   **Grand Livre d'Audit :** Consultez régulièrement la page `/audit-logs` de l'application pour surveiller les actions des utilisateurs.
-   **Centre de Sécurité :** La page `/security-dashboard` est votre principal outil pour la surveillance des menaces. Vérifiez-la quotidiennement pour toute nouvelle alerte (`security_alerts`) ou canary token déclenché. Mettez en place un processus pour investiguer et résoudre chaque alerte.