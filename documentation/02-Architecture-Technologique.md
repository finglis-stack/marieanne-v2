# Chapitre 2 : Architecture Technologique

Ce chapitre plonge au cœur de la conception technique du Système de Gestion du Café Marie Anne. Il détaille les choix architecturaux, les technologies employées et la manière dont les différents composants interagissent pour former une plateforme cohérente, performante et sécurisée.

---

## 2.1. Vue d'Ensemble de l'Architecture

L'architecture du système est conçue pour être à la fois moderne, scalable et facile à maintenir. Elle repose sur une séparation claire des responsabilités entre le client (frontend) et les services backend, en adoptant une approche **Backend-as-a-Service (BaaS)** fournie par Supabase. Ce choix stratégique permet de déléguer la gestion complexe de l'infrastructure (serveurs, bases de données, scaling) pour se concentrer sur la logique métier et la sécurité applicative.

### 2.1.1. Schéma d'Architecture Logique à Trois Niveaux

L'architecture peut être visualisée comme une série de couches logiques, où chaque couche communique principalement avec ses voisines immédiates.

```
┌─────────────────────────────────────────────────────────────┐
│                     NIVEAU 1 : CLIENT (Frontend)            │
│   - Application React 18 (SPA)                              │
│   - Build Tool: Vite avec TypeScript                        │
│   - UI: Tailwind CSS + shadcn/ui                            │
│   - State Management: React Hooks + @tanstack/react-query   │
│   - Logique de Sécurité Client-Side:                        │
│     - e2e-encryption.ts (Gestion des clés RSA)              │
│     - device-fingerprint.ts (Biométrie d'appareil)          │
│     - honeypot.ts (Déclencheurs d'alertes)                  │
└─────────────────────────────┬───────────────────────────────┘
                              │ API Calls (HTTPS/WSS)
                              │ - Authentification via JWT Bearer Token
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  NIVEAU 2 : PASSERELLE API (Supabase)       │
│   - Point d'Entrée Unique pour toutes les requêtes          │
│   - Validation automatique des JWT                          │
│   - Application des politiques de Rate Limiting             │
│   - Routage des requêtes vers les services appropriés :     │
│     - PostgREST API → PostgreSQL (CRUD)                     │
│     - GoTrue API → Service d'Authentification               │
│     - Storage API → Gestion des fichiers                    │
│     - Realtime API → WebSockets pour PostgreSQL             │
│     - Edge Functions Gateway → Fonctions Deno               │
└─────────────────────────────┬───────────────────────────────┘
                              │ Appels internes sécurisés au sein du VPC Supabase
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  NIVEAU 3 : SERVICES BACKEND (Supabase)     │
│   - Base de Données PostgreSQL 15 :                         │
│     - Schéma de données relationnel                         │
│     - Politiques Row Level Security (RLS) sur TOUTES les tables │
│   - Service d'Authentification :                            │
│     - Table `auth.users` gérée par Supabase                 │
│   - Service de Stockage d'Objets :                          │
│     - Bucket `product-images` avec politiques d'accès       │
│   - Environnement d'exécution Deno pour les Edge Functions :│
│     - `crypto-service` : Accès exclusif à `ENCRYPTION_KEY`  │
└─────────────────────────────────────────────────────────────┘
```

### 2.1.2. Description des Composants Majeurs

1.  **Application Cliente (Frontend)** : C'est l'unique point d'interaction pour les utilisateurs. Construite en **React**, elle est responsable de toute la logique de présentation. Elle opère selon un principe de "zéro confiance" envers le backend, validant les entrées et gérant sa propre logique de sécurité (ex: validation de format de carte, gestion des clés de chiffrement E2E). Elle communique avec Supabase via une API RESTful standard et des WebSockets pour les mises à jour en temps réel.

2.  **Passerelle API Supabase** : C'est le gardien de l'écosystème backend. Chaque requête provenant du client doit d'abord passer par cette passerelle. Elle valide systématiquement le JWT (JSON Web Token) présent dans l'en-tête `Authorization`. Si le token est valide et non expiré, la passerelle transmet la requête au service interne approprié, en y ajoutant le contexte d'authentification de l'utilisateur. C'est cette passerelle qui applique les politiques RLS en se basant sur l'identité de l'utilisateur extraite du JWT.

3.  **Services Backend Supabase** : C'est le cerveau et la mémoire de l'application.
    -   **PostgreSQL** : Le cœur du système. L'utilisation de **Row Level Security (RLS)** est non négociable et constitue la principale ligne de défense contre les fuites de données. Même si un attaquant parvenait à obtenir une clé API valide, il ne pourrait voir que les données autorisées par les politiques RLS associées à son rôle et à son ID utilisateur.
    -   **Edge Functions** : Des fonctions serverless (écrites en Deno/TypeScript) qui s'exécutent dans un environnement isolé et sécurisé. Leur principal avantage est qu'elles peuvent accéder à des secrets (variables d'environnement) qui ne sont jamais exposés au client. Notre `crypto-service` est l'exemple parfait : il est le seul composant de toute l'architecture à connaître la clé de chiffrement `ENCRYPTION_KEY`, agissant comme un coffre-fort numérique pour les opérations de chiffrement et de déchiffrement.

---

## 2.2. Architecture Frontend (Application Cliente)

Le frontend est une **Single-Page Application (SPA)** moderne, conçue pour la performance, la sécurité et une expérience utilisateur fluide.

### 2.2.1. Fondations : React 18, Vite, et TypeScript

-   **React 18** : Utilisé pour son modèle de composants déclaratifs qui simplifie la création d'interfaces complexes. Les hooks (`useState`, `useEffect`, `useContext`) sont utilisés pour gérer l'état local et le cycle de vie des composants.
-   **Vite** : Choisi pour sa rapidité exceptionnelle en développement. Il utilise `esbuild` pour le pré-bundling des dépendances et sert les modules ES natifs au navigateur, ce qui résulte en un Hot Module Replacement (HMR) quasi instantané.
-   **TypeScript** : Le projet est entièrement typé. Le `tsconfig.json` est configuré avec des options strictes (`"strict": true`) pour attraper un maximum d'erreurs potentielles (comme les `null` ou `undefined` non gérés) au moment de la compilation.

### 2.2.2. Gestion de l'État et des Données Serveur (`@tanstack/react-query`)

Le système fait une distinction claire entre l'état client et l'état serveur.
-   **État Client** (ex: l'ouverture d'une modale, le contenu d'un champ de formulaire) est géré par `useState`.
-   **État Serveur** (toutes les données provenant de Supabase) est géré par `@tanstack/react-query`. Ce choix est stratégique :
    -   **Évite la complexité d'un store global** (comme Redux) pour des données qui sont en réalité une copie locale de la base de données.
    -   **Fournit nativement** : le caching, la déduplication des requêtes, la mise à jour des données en arrière-plan, et la gestion des états de chargement et d'erreur pour chaque requête.
    -   **Mutations et Invalidation du Cache** : Les opérations d'écriture (création, mise à jour, suppression) sont gérées via `useMutation`. Après une mutation réussie, les requêtes (`queries`) pertinentes sont invalidées (`queryClient.invalidateQueries`), ce qui déclenche automatiquement un rafraîchissement des données et assure que l'interface est toujours à jour.

### 2.2.3. Système de Routage (`react-router-dom`)

-   **Routes Centralisées** : Le fichier `App.tsx` contient la définition de toutes les routes, offrant une vue d'ensemble claire de la navigation.
-   **Protection des Routes** : Chaque page sensible (tout sauf la page de connexion) inclut une logique dans un `useEffect` qui vérifie la présence d'une session utilisateur active. Si l'utilisateur n'est pas connecté, il est immédiatement redirigé vers la page de connexion (`/`) via le hook `useNavigate`.

### 2.2.4. Système de Design (Tailwind CSS, shadcn/ui)

-   **Tailwind CSS** : L'approche "utility-first" permet un prototypage rapide et assure une consistance stylistique sans avoir à écrire de CSS personnalisé. La configuration (`tailwind.config.ts`) est étendue pour inclure les couleurs et les thèmes spécifiques à l'application.
-   **shadcn/ui** : La philosophie de `shadcn/ui` est cruciale : ce n'est pas une bibliothèque de composants, mais une collection de recettes de code. Les composants sont copiés dans le projet (`src/components/ui`), ce qui donne un contrôle total sur leur code, leur style et leur comportement, évitant la dépendance à une librairie externe et facilitant la personnalisation.

---

## 2.3. Architecture Backend (Services Supabase)

### 2.3.1. Base de Données PostgreSQL et Politiques RLS

-   **PostgreSQL** : La puissance de PostgreSQL est exploitée via des types de données avancés comme `JSONB` (pour stocker les `items` d'une commande) et `TIMESTAMP WITH TIME ZONE` (pour une gestion précise des dates).
-   **Row Level Security (RLS)** : C'est la fonctionnalité de sécurité la plus importante. Chaque requête API (via PostgREST) est exécutée dans le contexte de l'utilisateur authentifié. Les politiques RLS agissent comme une clause `WHERE` invisible et inaltérable ajoutée à chaque requête.

    *Exemple de politique RLS détaillée sur la table `customer_profiles` :*
    ```sql
    -- Activer RLS sur la table
    ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;

    -- Politique de SELECT : Un utilisateur authentifié ne peut voir que les profils
    -- qui sont liés à des commandes qu'il a lui-même créées.
    -- (Note: Dans notre cas, l'accès est plus large car l'admin voit tout,
    -- mais c'est un exemple de politique restrictive)
    CREATE POLICY "Users can view profiles linked to their orders"
    ON public.customer_profiles FOR SELECT
    TO authenticated
    USING (
      id IN (
        SELECT customer_profile_id FROM orders WHERE user_id = auth.uid()
      )
    );
    ```
    La fonction `auth.uid()` est fournie par Supabase et retourne l'UUID de l'utilisateur actuellement authentifié.

### 2.3.2. Service d'Authentification (Supabase Auth)

-   **Cycle de Vie du JWT** :
    1.  `signInWithPassword()` : L'utilisateur envoie email/mdp.
    2.  Supabase Auth valide et génère un JWT signé avec un secret serveur.
    3.  Le JWT est retourné au client.
    4.  Le client stocke le JWT (dans le `localStorage` pour la persistance de session).
    5.  Pour chaque requête API subséquente, le client ajoute l'en-tête `Authorization: Bearer <JWT>`.
    6.  La passerelle API de Supabase intercepte, valide la signature et l'expiration du JWT, puis exécute la requête avec l'identité de l'utilisateur.

### 2.3.3. Service de Stockage d'Objets (Supabase Storage)

-   **Bucket `product-images`** : Un conteneur unique pour toutes les images.
-   **Politiques de Sécurité du Bucket** : Des politiques sont définies pour que seuls les utilisateurs authentifiés (`authenticated`) puissent téléverser (`INSERT`) des images. La lecture (`SELECT`) est publique pour que les images puissent être affichées facilement dans l'application sans nécessiter de token d'accès pour chaque image.

### 2.3.4. Fonctions Edge Serverless (Deno)

-   **Environnement Deno** : Les fonctions s'exécutent dans un environnement TypeScript/JavaScript sécurisé, distinct de Node.js.
-   **`crypto-service` comme Enclave Sécurisée** : Cette fonction est le seul endroit où la `ENCRYPTION_KEY` est accessible. Le code client n'a jamais, à aucun moment, connaissance de cette clé. Il ne fait qu'envoyer des données en clair à un endpoint authentifié et reçoit en retour des données chiffrées. Ce modèle est essentiel pour le chiffrement au repos et la conformité à la Loi 25.

---

## 2.4. Structure Détaillée du Code Source

### 2.4.1. Analyse du Répertoire `src`

-   `components/` : Contient des composants "intelligents" (avec de la logique) et "bêtes" (purement présentationnels), organisés par domaine fonctionnel.
-   `pages/` : Assemble les composants pour créer des vues complètes. C'est ici que la plupart des appels à `react-query` (`useQuery`, `useMutation`) sont effectués pour récupérer et modifier les données de la page.
-   `lib/` : Contient la logique métier la plus critique et réutilisable. C'est le "cerveau" de l'application côté client.
-   `integrations/` : Isole la configuration des services tiers. Si on changeait de BaaS, seul ce répertoire serait massivement impacté.
-   `utils/` : Fonctions pures et génériques, sans dépendance à l'état de l'application (ex: formater une date, afficher une notification).

### 2.4.2. Analyse du Répertoire `lib`

-   `crypto.ts` : Agit comme un SDK pour notre service de chiffrement. Il expose des fonctions (`encryptBatch`, `decryptBatch`) qui encapsulent les appels `fetch` vers l'Edge Function, en y ajoutant automatiquement le token d'authentification.
-   `tokenization.ts` : Orchestre la logique complexe de la double tokenisation. Il interagit avec la table `card_tokens` pour créer, valider et invalider les tokens.
-   `audit.ts` : Centralise toutes les écritures dans la table `audit_logs`. Chaque action importante dans l'application (connexion, vente, etc.) doit appeler une fonction de ce module.
-   `device-fingerprint.ts` : Intègre la librairie `FingerprintJS` et communique avec la table `device_fingerprints` pour appliquer la logique de biométrie d'appareil.

### 2.4.3. Analyse du Répertoire `supabase`

-   `functions/crypto-service/index.ts` : C'est le code qui s'exécute côté serveur. Il importe la librairie `crypto` de Deno, récupère la clé secrète depuis les variables d'environnement, et expose une API simple pour chiffrer/déchiffrer des données. Il inclut également une vérification d'authentification pour s'assurer que seul un utilisateur connecté peut l'utiliser.

---

## 2.5. Analyse des Flux de Données Critiques

### 2.5.1. Flux 1 : Processus de Connexion et d'Autorisation d'Appareil

1.  **Client** : `supabase.auth.signInWithPassword()` est appelé.
2.  **Supabase** : Valide les identifiants, retourne un JWT.
3.  **Client** : Appelle `countAuthorizedDevices(userId)`.
4.  **`countAuthorizedDevices`** : Fait un `SELECT count()` sur `device_fingerprints` où `user_id` correspond.
5.  **Si `count` > 0** :
    -   **Client** : Appelle `isDeviceAuthorized(userId)`.
    -   **`isDeviceAuthorized`** : Appelle `generateDeviceFingerprint()` pour obtenir l'empreinte actuelle, puis fait un `SELECT` sur `device_fingerprints` pour trouver une correspondance.
    -   Si une correspondance est trouvée, la connexion est réussie.
    -   Sinon, la connexion est refusée (sauf si le mode déverrouillé est actif).

### 2.5.2. Flux 2 : Cycle de Vie d'une Transaction au Point de Vente

1.  **Client** : L'état du panier est géré localement avec `useState`.
2.  **Client** : Au paiement, un objet `order` est construit.
3.  **Client** : `useMutation` de `react-query` est appelé pour insérer la commande.
4.  **La fonction de mutation** :
    -   Appelle `supabase.from('orders').insert(order)`.
    -   Si des articles sont à préparer, appelle `supabase.from('preparation_queue').insert(...)`.
    -   Si une carte a été utilisée, appelle `supabase.from('customer_profiles').update(...)` pour les points et `supabase.from('card_tokens').update(...)` pour invalider le token.
    -   Appelle `createAuditLog()` pour tracer l'événement.
5.  **`onSuccess` de la mutation** : Invalide les requêtes pertinentes (ex: `queryClient.invalidateQueries(['orders'])`) pour rafraîchir les données.

### 2.5.3. Flux 3 : Création d'une Fiche Client (avec Chiffrement)

1.  **Client** : `CreateCardDialog` collecte les données en clair.
2.  **Client** : Appelle `encryptBatch({ ... })`.
3.  **`encryptBatch`** : Fait un `fetch` vers l'URL de l'Edge Function `crypto-service`, en passant le JWT dans l'en-tête `Authorization` et les données en clair dans le corps.
4.  **Edge Function** : Reçoit la requête, valide le JWT, chiffre les données avec la `ENCRYPTION_KEY`, et retourne les données chiffrées.
5.  **Client** : Reçoit les données chiffrées et procède à une série d'appels `supabase.from(...).insert(...)` dans l'ordre suivant pour respecter les contraintes de clés étrangères :
    1.  `customer_profiles` (avec les données chiffrées)
    2.  `reward_cards` (en utilisant l'ID du profil créé à l'étape 1)
    3.  `card_tokens` (en utilisant l'ID de la carte créée à l'étape 2)

### 2.5.4. Flux 4 : Validation d'une Carte et Génération de Token

1.  **Client** : Saisie du code de carte (ex: `AB 12 3`).
2.  **Client** : `validateLuhnAlphanumeric(cleanCardCode('AB 12 3'))` est appelé pour une validation instantanée.
3.  **Client** : Si valide, `SELECT` sur `reward_cards` avec `WHERE card_code = 'AB123'`.
4.  **Client** : Avec l'ID de la carte, `SELECT` sur `card_tokens` avec `WHERE reward_card_id = <id> AND token_type = 'permanent'`.
5.  **Client** : Appelle `generateTemporaryToken(permanentToken)`.
6.  **`generateTemporaryToken`** :
    -   Génère un token aléatoire.
    -   Calcule `expires_at = new Date() + 5 minutes`.
    -   `INSERT` dans `card_tokens` avec le nouveau token, le type `temporary` et la date d'expiration.
7.  Le token temporaire est stocké dans l'état React du `CheckoutDialog`.