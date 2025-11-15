# Chapitre 2 : Architecture Technologique

Ce chapitre plonge au cœur de la conception technique du Système de Gestion du Café Marie Anne. Il détaille les choix architecturaux, les technologies employées et la manière dont les différents composants interagissent pour former une plateforme cohérente, performante et sécurisée.

---

## 2.1. Vue d'Ensemble de l'Architecture

L'architecture du système est conçue pour être à la fois moderne, scalable et facile à maintenir. Elle repose sur une séparation claire des responsabilités entre le client (frontend) et les services backend, en adoptant une approche *Backend-as-a-Service* (BaaS) fournie par Supabase.

### 2.1.1. Schéma d'Architecture Logique à Trois Niveaux

L'architecture peut être visualisée comme une série de couches logiques, où chaque couche communique principalement avec ses voisines immédiates.

```
┌─────────────────────────────────────────────────────────────┐
│                     NIVEAU 1 : CLIENT (Frontend)            │
│                                                             │
│   ● Application React (Vite + TypeScript)                   │
│   ● Interface utilisateur (Tailwind CSS + shadcn/ui)        │
│   ● Logique de présentation et gestion de l'état client     │
│   ● Logique de sécurité côté client (Chiffrement E2E, etc.) │
│                                                             │
└─────────────────────────────┬───────────────────────────────┘
                              │ (HTTPS/WSS via API Supabase)
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  NIVEAU 2 : PASSERELLE API (Supabase)       │
│                                                             │
│   ● PostgREST API (Accès direct à la base de données)       │
│   ● GoTrue API (Authentification)                           │
│   ● Storage API (Gestion des fichiers)                      │
│   ● Realtime API (WebSockets pour les mises à jour en direct)│
│   ● Edge Functions Gateway (Invocation des fonctions Deno)  │
│                                                             │
└─────────────────────────────┬───────────────────────────────┘
                              │ (Appels internes sécurisés)
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  NIVEAU 3 : SERVICES BACKEND (Supabase)     │
│                                                             │
│   ● Base de données PostgreSQL avec Row Level Security (RLS)│
│   ● Service d'Authentification (Gestion des utilisateurs)   │
│   ● Service de Stockage (Bucket pour images)                │
│   ● Environnement d'exécution Deno pour les Edge Functions  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.1.2. Description des Composants Majeurs

1.  **Application Cliente (Frontend)** : C'est l'unique point d'interaction pour les utilisateurs. Construite en **React**, elle est responsable de toute la logique de présentation. Elle ne fait aucune confiance implicite au backend et implémente sa propre couche de logique de sécurité (ex: validation de format, gestion des clés E2E). Elle communique avec Supabase via une API RESTful et des WebSockets.

2.  **Passerelle API Supabase** : C'est le point d'entrée unique pour toutes les requêtes du client. Elle agit comme un proxy sécurisé qui route les requêtes vers le service approprié. Elle est responsable de l'application des politiques de sécurité, de la validation des JWT (JSON Web Tokens) et de la limitation du débit (rate limiting).

3.  **Services Backend Supabase** : C'est le cerveau de l'application.
    -   **PostgreSQL** : Le cœur du système, où toutes les données sont stockées. La sécurité est renforcée par des politiques **Row Level Security (RLS)** qui garantissent que les utilisateurs ne peuvent accéder qu'à leurs propres données, même si une requête API malformée était envoyée.
    -   **Auth** : Gère l'identité des utilisateurs, la connexion, la déconnexion et la génération des JWT.
    -   **Storage** : Un service de stockage d'objets S3-compatible, utilisé ici pour stocker les images des produits de manière sécurisée.
    -   **Edge Functions** : Des fonctions serverless (écrites en Deno/TypeScript) qui exécutent de la logique métier sensible dans un environnement sécurisé côté serveur. C'est ici que s'exécute notre service de chiffrement, protégeant la clé principale.

---

## 2.2. Architecture Frontend (Application Cliente)

Le frontend est une **Single-Page Application (SPA)** moderne, conçue pour la performance, la sécurité et une expérience utilisateur fluide.

### 2.2.1. Fondations : React 18, Vite, et TypeScript

-   **React 18** : Utilisé pour sa puissance dans la création d'interfaces utilisateur déclaratives et basées sur les composants. Son Virtual DOM assure des mises à jour performantes de l'interface.
-   **Vite** : Sert de bundler et de serveur de développement. Il offre une expérience de développement ultra-rapide grâce à son Hot Module Replacement (HMR) natif et des temps de démarrage quasi instantanés.
-   **TypeScript** : Apporte un typage statique au projet, ce qui permet de détecter de nombreuses erreurs au moment de la compilation plutôt qu'à l'exécution. Il améliore considérablement la maintenabilité et la robustesse du code.

### 2.2.2. Gestion de l'État et des Données Serveur (`@tanstack/react-query`)

Bien que l'état local simple soit géré avec les hooks de React (`useState`, `useEffect`), la communication avec le serveur et la gestion de cet "état serveur" sont orchestrées par `@tanstack/react-query`.

-   **Caching et Synchronisation :** React Query gère automatiquement le cache des données récupérées du serveur, la synchronisation en arrière-plan et la mise à jour de l'interface lorsque les données changent.
-   **Optimisation des Requêtes :** Il déduplique les requêtes identiques et fournit des mécanismes pour invalider le cache de manière ciblée, garantissant que l'interface affiche toujours des données à jour sans surcharger le backend.

### 2.2.3. Système de Routage (`react-router-dom`)

La navigation au sein de l'application est gérée côté client par `react-router-dom`.

-   **Routes Déclaratives :** Les routes sont définies de manière centralisée dans le composant `App.tsx`, offrant une vue claire de toutes les pages disponibles dans l'application.
-   **Navigation Programmatique :** Le hook `useNavigate` est utilisé pour rediriger les utilisateurs après des actions comme la connexion ou la déconnexion.
-   **Paramètres d'URL :** Le hook `useParams` est utilisé pour récupérer des identifiants depuis l'URL (ex: `/reward-cards/:customerId`), permettant de créer des pages de détail dynamiques.

### 2.2.4. Système de Design (Tailwind CSS, shadcn/ui)

L'esthétique et l'ergonomie de l'application reposent sur une combinaison de deux technologies :

-   **Tailwind CSS** : Un framework CSS "utility-first" qui permet de construire des designs complexes directement dans le HTML/JSX. Il favorise la cohérence et la rapidité de développement.
-   **shadcn/ui** : Une collection de composants d'interface utilisateur réutilisables, accessibles et personnalisables. Plutôt qu'une bibliothèque de composants traditionnelle, `shadcn/ui` fournit du code que l'on copie dans le projet, offrant un contrôle total sur le style et le comportement.

---

## 2.3. Architecture Backend (Services Supabase)

Le backend est entièrement basé sur les services managés de Supabase, ce qui permet de se concentrer sur la logique métier plutôt que sur la gestion d'infrastructure.

### 2.3.1. Base de Données PostgreSQL et Politiques RLS

-   **PostgreSQL** : Une base de données relationnelle open-source puissante et éprouvée. Elle offre des fonctionnalités avancées comme les types de données JSONB, les transactions et les fonctions.
-   **Row Level Security (RLS)** : C'est la pierre angulaire de la sécurité des données. **Toutes les tables** ont le RLS activé. Cela signifie que par défaut, personne ne peut accéder à aucune donnée. Des politiques explicites sont ensuite créées pour autoriser des actions spécifiques (SELECT, INSERT, UPDATE, DELETE) à des utilisateurs spécifiques (ex: uniquement l'utilisateur authentifié dont l'ID correspond à `user_id`).

    *Exemple de politique RLS sur la table `products` :*
    ```sql
    CREATE POLICY "products_select_policy" ON products
    FOR SELECT TO authenticated USING (auth.uid() = user_id);
    ```

### 2.3.2. Service d'Authentification (Supabase Auth)

-   **Gestion des Identités :** Supabase Auth gère l'inscription, la connexion (email/mot de passe), la réinitialisation de mot de passe et la gestion des sessions utilisateur.
-   **JWT (JSON Web Tokens) :** Après une connexion réussie, Supabase Auth génère un JWT qui est stocké de manière sécurisée côté client. Ce token est ensuite inclus dans chaque requête API pour prouver l'identité de l'utilisateur. La passerelle API de Supabase valide automatiquement ce token avant d'autoriser l'accès aux autres services.

### 2.3.3. Service de Stockage d'Objets (Supabase Storage)

-   **Stockage de Fichiers :** Utilisé pour stocker les images des produits. Les fichiers sont organisés dans un "bucket" dédié nommé `product-images`.
-   **Politiques d'Accès :** Des politiques de sécurité sont définies au niveau du bucket pour contrôler qui peut lire ou écrire des fichiers, s'intégrant avec le service d'authentification.

### 2.3.4. Fonctions Edge Serverless (Deno)

-   **Logique Côté Serveur Sécurisée :** Les Edge Functions sont utilisées pour exécuter du code sensible qui ne doit jamais être exposé côté client.
-   **`crypto-service` :** Notre fonction principale, écrite en TypeScript et exécutée sur l'environnement Deno. Son rôle est crucial :
    1.  Elle est la seule à avoir accès à la variable d'environnement `ENCRYPTION_KEY`.
    2.  Elle expose des points d'accès (`/encrypt`, `/decrypt`) qui ne peuvent être appelés que par un utilisateur authentifié.
    3.  Elle reçoit des données en clair du client, les chiffre avec AES-256-GCM en utilisant la clé secrète, et renvoie le texte chiffré. Le processus inverse est effectué pour le déchiffrement.
    -   Cela garantit que la clé de chiffrement principale ne quitte jamais l'environnement sécurisé du serveur.

---

## 2.4. Structure Détaillée du Code Source

La structure du projet est organisée pour être intuitive et scalable, en séparant clairement les préoccupations.

### 2.4.1. Analyse du Répertoire `src`

-   `components/` : Contient tous les composants React réutilisables. Il est subdivisé par fonctionnalité (ex: `pos/`, `inventory/`, `security/`) pour une meilleure organisation. Le sous-répertoire `ui/` contient les composants de base de `shadcn/ui`.
-   `pages/` : Chaque fichier correspond à une page (une route) de l'application. Ces composants assemblent les composants plus petits de `components/` pour construire une vue complète.
-   `lib/` : Le cœur de la logique métier et de la sécurité de l'application. C'est ici que se trouvent les modules les plus critiques.
-   `integrations/` : Contient la configuration des clients pour les services externes, principalement le client Supabase.
-   `utils/` : Fonctions utilitaires génériques qui peuvent être utilisées n'importe où dans l'application (ex: affichage de notifications).

### 2.4.2. Analyse du Répertoire `lib`

Ce répertoire est fondamental pour la sécurité et la logique de l'application.

-   `crypto.ts` : Gère l'interface avec l'Edge Function de chiffrement. Il expose des fonctions simples (`encryptBatch`, `decryptBatch`) qui masquent la complexité des appels API.
-   `tokenization.ts` : Contient toute la logique de création et de validation des tokens permanents et temporaires.
-   `audit.ts` : Fournit les fonctions pour créer et récupérer des logs d'audit, centralisant la logique de traçabilité.
-   `card-validation.ts` : Implémente l'algorithme de Luhn pour la génération et la validation des codes de carte.
-   `device-fingerprint.ts` : Gère la génération d'empreintes d'appareil, l'enregistrement et la vérification des appareils autorisés.
-   `honeypot.ts` : Contient la logique de détection d'intrusion (honeypots, canary tokens, détection de scraping).
-   `e2e-encryption.ts` : Implémente l'architecture de chiffrement de bout en bout (RSA + AES) pour les futures fonctionnalités.

### 2.4.3. Analyse du Répertoire `supabase`

-   `functions/` : Contient le code source des Edge Functions.
    -   `crypto-service/index.ts` : Le code de notre service de chiffrement, qui sera déployé sur l'infrastructure de Supabase.

---

## 2.5. Analyse des Flux de Données Critiques

Cette section décrit, étape par étape, comment les données circulent à travers le système lors d'opérations clés.

### 2.5.1. Flux 1 : Processus de Connexion et d'Autorisation d'Appareil

1.  **Utilisateur** saisit email/mot de passe et soumet le formulaire.
2.  **Frontend** appelle `supabase.auth.signInWithPassword()`.
3.  **Supabase Auth** valide les identifiants. Si corrects, un JWT est retourné.
4.  **Frontend** appelle `countAuthorizedDevices()` avec l'ID de l'utilisateur.
5.  **Si `count` est 0 (première connexion) :**
    -   Le frontend appelle `registerDevice()`.
    -   `registerDevice()` génère une empreinte d'appareil et l'insère dans la table `device_fingerprints`.
    -   L'utilisateur est redirigé vers le Dashboard.
6.  **Si `count` > 0 :**
    -   Le frontend appelle `isDeviceAuthorized()`.
    -   Si `true`, l'utilisateur est redirigé vers le Dashboard.
    -   Si `false`, le frontend appelle `isAccountUnlocked()`.
    -   Si `isAccountUnlocked` est `true`, une modale (`Device Authorization Dialog`) est affichée, demandant à l'utilisateur s'il veut autoriser ce nouvel appareil.
    -   Si `isAccountUnlocked` est `false`, la session est détruite (`supabase.auth.signOut()`) et une erreur "Appareil non autorisé" est affichée.

### 2.5.2. Flux 2 : Cycle de Vie d'une Transaction au Point de Vente

1.  **Opérateur** ajoute des produits au panier (état local React).
2.  **Opérateur** clique sur "Finaliser la commande".
3.  **Frontend** affiche la modale `CheckoutDialog`.
4.  **Si une carte récompense est utilisée :**
    -   L'opérateur saisit le code de la carte.
    -   Le frontend valide le format et l'algorithme de Luhn (`card-validation.ts`).
    -   Le frontend appelle une fonction qui (côté serveur ou via des appels sécurisés) récupère le token permanent associé, génère un token temporaire (`tokenization.ts`), et le retourne.
5.  **Opérateur** sélectionne la méthode de paiement.
6.  **Frontend** envoie une requête `INSERT` à la table `orders` avec tous les détails (articles, total, méthode de paiement, ID client/carte si applicable).
7.  **Si la commande contient des articles à préparer :**
    -   Le frontend calcule le temps d'attente et le prochain numéro de file.
    -   Une requête `INSERT` est envoyée à la table `preparation_queue`.
8.  **Si une carte a été utilisée :**
    -   Le frontend envoie une requête `UPDATE` à la table `customer_profiles` pour ajouter les points.
    -   Le frontend envoie une requête `UPDATE` à la table `card_tokens` pour marquer le token temporaire comme "utilisé".
9.  **Frontend** vide le panier et affiche une confirmation.

### 2.5.3. Flux 3 : Création d'une Fiche Client (avec Chiffrement)

1.  **Opérateur** ouvre la modale `CreateCardDialog` et saisit le prénom et le numéro de fiche.
2.  **Frontend** appelle `encryptBatch({ first_name: '...', customer_number: '...' })` depuis `crypto.ts`.
3.  `crypto.ts` envoie une requête `POST` à l'**Edge Function `crypto-service`** avec les données en clair.
4.  **Edge Function** chiffre les données avec AES-256-GCM et retourne les valeurs chiffrées.
5.  **Frontend** envoie une requête `INSERT` à la table `customer_profiles` avec les données chiffrées.
6.  **Frontend** génère un code de carte valide avec `generateCardCodeWithLuhn()`.
7.  **Frontend** envoie une requête `INSERT` à la table `reward_cards` avec le code et l'ID du nouveau profil.
8.  **Frontend** appelle `createPermanentCardToken()` qui génère un token unique et l'insère dans la table `card_tokens`.
9.  **Frontend** crée un log d'audit pour l'ensemble de l'opération.

### 2.5.4. Flux 4 : Validation d'une Carte et Génération de Token

1.  **Opérateur** saisit un code de carte dans le `CheckoutDialog`.
2.  **Frontend** valide le format et l'algorithme de Luhn (`card-validation.ts`).
3.  **Frontend** envoie une requête `SELECT` à la table `reward_cards` pour trouver la carte correspondante.
4.  **Frontend** envoie une requête `SELECT` à la table `card_tokens` pour trouver le token `permanent` associé à l'ID de la carte.
5.  **Frontend** appelle `generateTemporaryToken()` avec le token permanent.
6.  `generateTemporaryToken()` (`tokenization.ts`) :
    -   Vérifie que le token permanent est valide et actif.
    -   Génère un nouveau token unique.
    -   Calcule une date d'expiration (maintenant + 5 minutes).
    -   Envoie une requête `INSERT` à la table `card_tokens` avec le nouveau token, le type `temporary` et la date d'expiration.
7.  Le token temporaire est retourné au `CheckoutDialog` et stocké dans l'état pour être utilisé lors du paiement final.