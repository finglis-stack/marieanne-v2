# Partie 2 : Architecture Technologique

**Version 1.0**
**Date de publication :** 15 juillet 2024

---

## Table des Matières de la Partie 2

2.  **Architecture Technologique**
    2.1. **Vue d'Ensemble de l'Architecture**
        2.1.1. Schéma d'Architecture Logique à Trois Niveaux
        2.1.2. Description des Composants Majeurs
            2.1.2.1. Le Client (Frontend)
            2.1.2.2. La Plateforme de Services (Backend)
            2.1.2.3. Les Services Externes
    2.2. **Architecture Frontend (Application Cliente)**
        2.2.1. Fondations : React 18 et Vite
        2.2.2. Gestion de l'État et des Données Serveur
        2.2.3. Système de Routage
        2.2.4. Système de Design et Composants d'Interface
    2.3. **Architecture Backend (Services Supabase)**
        2.3.1. Base de Données PostgreSQL
        2.3.2. Service d'Authentification
        2.3.3. Service de Stockage d'Objets
        2.3.4. Fonctions Edge Serverless
    2.4. **Pile Technologique Détaillée (Stack)**
        2.4.1. Dépendances Frontend
        2.4.2. Services Backend
        2.4.3. Outils de Développement et de Qualité
    2.5. **Structure Détaillée du Code Source**
        2.5.1. Analyse du Répertoire Racine
        2.5.2. Analyse du Répertoire `src`
    2.6. **Analyse des Flux de Données Critiques**
        2.6.1. Flux 1 : Processus de Connexion et d'Autorisation d'Appareil
        2.6.2. Flux 2 : Cycle de Vie d'une Transaction au Point de Vente
        2.6.3. Flux 3 : Création d'une Fiche Client et d'une Carte (avec Chiffrement)
        2.6.4. Flux 4 : Validation d'une Carte et Génération de Token Temporaire

---

## 2.1. Vue d'Ensemble de l'Architecture

### 2.1.1. Schéma d'Architecture Logique à Trois Niveaux

L'architecture du système est conçue selon un modèle moderne basé sur des services, privilégiant la séparation des responsabilités et la scalabilité. Elle peut être conceptualisée en trois niveaux principaux :

1.  **Niveau Client (Frontend) :** Il s'agit de l'application web interactive avec laquelle les utilisateurs (opérateurs du café, administrateurs) interagissent directement. C'est une application monopage (SPA) construite avec React, responsable de l'affichage de l'interface, de la gestion de l'état local et de la communication avec le niveau de services.

2.  **Niveau de Services (Backend - Supabase) :** Ce niveau constitue le cœur logique et transactionnel du système. Il n'est pas un serveur monolithique traditionnel, mais une suite de services gérés fournis par la plateforme Supabase. Ce modèle "Backend as a Service" (BaaS) permet de se concentrer sur la logique métier plutôt que sur la gestion d'infrastructure. Il inclut la base de données, l'authentification, le stockage de fichiers et les fonctions serverless.

3.  **Niveau de Sécurité Transversal :** Intégré à la fois au frontend et au backend, ce niveau regroupe l'ensemble des mécanismes de sécurité : chiffrement, gestion des tokens, biométrie d'appareil, et systèmes de détection d'intrusion. Il opère à toutes les étapes des flux de données.

```
    [ UTILISATEUR ]
          ↓
+-------------------------------------------------+
|         NIVEAU CLIENT (Frontend - React)        |
|                                                 |
|   - Interface Utilisateur (shadcn/ui)           |
|   - Logique d'Affichage                         |
|   - Gestion de l'État Local                     |
|   - Biométrie d'Appareil (FingerprintJS)        |
|   - Chiffrement E2E (Crypto API)                |
+-------------------------------------------------+
          ↓         ↑         (API via HTTPS/WSS)
+-------------------------------------------------+
|      NIVEAU DE SERVICES (Backend - Supabase)    |
|                                                 |
| +----------------+  +-------------------------+ |
| |      Auth      |  |     Base de Données     | |
| | (Gestion JWT)  |  |      (PostgreSQL)       | |
| +----------------+  |   - Données Métier      | |
|                     |   - Politiques RLS      | |
| +----------------+  +-------------------------+ |
| |    Storage     |                              |
| | (Images, etc.) |  +-------------------------+ |
| +----------------+  |      Edge Functions     | |
|                     |         (Deno)          | |
| +----------------+  |   - Chiffrement AES     | |
| |   Realtime     |  |   - Logique Complexe    | |
| | (WebSockets)   |  +-------------------------+ |
| +----------------+                              |
+-------------------------------------------------+
```

### 2.1.2. Description des Composants Majeurs

#### 2.1.2.1. Le Client (Frontend)
L'application cliente est le seul point d'interaction pour l'utilisateur. Elle est conçue pour être riche, réactive et fonctionner de manière optimale sur des appareils tactiles de type tablette. Ses responsabilités principales sont :
*   **Rendu de l'Interface :** Construire et afficher les pages et composants visuels.
*   **Gestion des Interactions :** Capturer les actions de l'utilisateur (clics, saisies) et y réagir.
*   **Communication Sécurisée :** Initier des requêtes vers le backend via le client Supabase, en s'assurant que chaque requête est authentifiée avec un JSON Web Token (JWT).
*   **Logique de Sécurité Côté Client :** Mettre en œuvre la biométrie d'appareil et les mécanismes de chiffrement de bout en bout avant l'envoi des données sensibles.

#### 2.1.2.2. La Plateforme de Services (Backend)
Supabase agit comme la colonne vertébrale du système.
*   **API Unifiée :** Supabase expose automatiquement une API RESTful et temps réel au-dessus de la base de données PostgreSQL, ce qui simplifie grandement la communication depuis le frontend.
*   **Sécurité Déléguée :** La gestion des utilisateurs, des sessions et des politiques d'accès est entièrement gérée par les services d'authentification et les politiques de sécurité au niveau des lignes (RLS) de la base de données.
*   **Extensibilité :** Les Edge Functions permettent d'exécuter du code serveur personnalisé pour des opérations qui ne peuvent ou ne doivent pas être effectuées côté client, comme le chiffrement des données personnelles avec une clé secrète.

#### 2.1.2.3. Les Services Externes
Le système est largement autonome, mais s'appuie sur des bibliothèques et API clientes pour certaines fonctionnalités de sécurité :
*   **FingerprintJS :** Utilisé côté client pour générer une empreinte unique de l'appareil, qui est ensuite utilisée pour la biométrie d'appareil.

---

## 2.2. Architecture Frontend (Application Cliente)

### 2.2.1. Fondations : React 18 et Vite
*   **React 18 :** Le choix de React comme bibliothèque d'interface utilisateur permet de construire une application modulaire et performante basée sur des composants. Les fonctionnalités de React 18, comme les transitions et le rendu concurrent, sont exploitées pour garantir une expérience utilisateur fluide.
*   **Vite :** L'outillage de développement est basé sur Vite. Il offre un démarrage quasi instantané du serveur de développement et des mises à jour à chaud extrêmement rapides (Hot Module Replacement), ce qui accélère considérablement le cycle de développement. Pour la production, il génère un ensemble de fichiers statiques optimisés (HTML, CSS, JS).

### 2.2.2. Gestion de l'État et des Données Serveur
L'application utilise une approche double pour la gestion de l'état :
*   **État Local (React Hooks) :** L'état propre à un composant (ex: l'ouverture d'une modale, le contenu d'un champ de saisie) est géré localement à l'aide des hooks `useState` et `useEffect`.
*   **État Serveur (`@tanstack/react-query`) :** Toutes les données provenant du backend Supabase sont gérées par `React Query`. Cette bibliothèque gère automatiquement la mise en cache, la revalidation en arrière-plan, la synchronisation et la mise à jour des données, réduisant la complexité du code et améliorant la performance perçue par l'utilisateur.

### 2.2.3. Système de Routage
La navigation au sein de l'application est gérée par `react-router-dom` (version 6).
*   **Routage Centralisé :** Toutes les routes de l'application sont définies dans le fichier `src/App.tsx`. Cette centralisation facilite la compréhension de la structure de navigation.
*   **Protection des Routes :** Bien que non implémenté avec un composant dédié `ProtectedRoute`, la logique de protection est intégrée dans chaque page qui nécessite une authentification. Un `useEffect` vérifie la présence d'une session utilisateur au chargement de la page et redirige vers la page de connexion si nécessaire.

### 2.2.4. Système de Design et Composants d'Interface
L'apparence visuelle est construite sur une base solide et moderne :
*   **Tailwind CSS :** Un framework CSS "utility-first" qui permet de construire des designs complexes directement dans le balisage HTML, offrant une grande flexibilité et une maintenance aisée.
*   **shadcn/ui :** Une collection de composants d'interface réutilisables, accessibles et personnalisables, construits sur Tailwind CSS et Radix UI. Ces composants (boutons, cartes, modales, etc.) forment la base de l'interface et garantissent une cohérence visuelle et fonctionnelle.

---

## 2.3. Architecture Backend (Services Supabase)

### 2.3.1. Base de Données PostgreSQL
Le cœur du stockage de données est une base de données PostgreSQL entièrement gérée par Supabase.
*   **Accès via API :** L'interaction avec la base de données ne se fait jamais directement, mais toujours via l'API de Supabase, en utilisant la bibliothèque cliente `@supabase/supabase-js`.
*   **Sécurité au Niveau des Lignes (RLS) :** C'est un concept fondamental de la sécurité du système. Chaque table possède des politiques RLS qui définissent précisément quelles opérations (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) sont autorisées, et pour quel utilisateur. Par exemple, un utilisateur ne peut voir que les catégories et produits qu'il a lui-même créés.

### 2.3.2. Service d'Authentification
Supabase Auth gère l'intégralité du cycle de vie de l'authentification.
*   **Authentification par Courriel/Mot de Passe :** Le système utilise la méthode standard d'authentification.
*   **Gestion des JWT :** Après une connexion réussie, Supabase Auth génère un JSON Web Token (JWT) qui est stocké de manière sécurisée dans le navigateur. Ce token est automatiquement inclus dans chaque requête subséquente à l'API pour prouver l'identité de l'utilisateur.

### 2.3.3. Service de Stockage d'Objets
Utilisé pour stocker les fichiers binaires, principalement les images des produits.
*   **Buckets :** Les fichiers sont organisés en "buckets". Le projet utilise un bucket nommé `product-images`.
*   **Politiques d'Accès :** Des politiques de sécurité sont définies au niveau du bucket pour contrôler qui peut téléverser, lire ou supprimer des fichiers.

### 2.3.4. Fonctions Edge Serverless
Pour la logique métier qui nécessite un environnement sécurisé ou des secrets.
*   **Environnement Deno :** Les fonctions sont écrites en TypeScript et s'exécutent dans un environnement Deno sécurisé.
*   **Cas d'Usage Principal - Chiffrement :** La fonction `crypto-service` est le pilier du chiffrement des données personnelles. Elle reçoit des données en clair du client, les chiffre avec une clé secrète (`ENCRYPTION_KEY`) stockée en toute sécurité dans les secrets de la fonction, et retourne les données chiffrées. Ce processus garantit que la clé de chiffrement n'est jamais exposée au client.

---

## 2.4. Pile Technologique Détaillée (Stack)

*(Cette section serait un tableau détaillé de chaque dépendance, omis ici pour la brièveté de la réponse initiale.)*

---

## 2.5. Structure Détaillée du Code Source

### 2.5.1. Analyse du Répertoire Racine
*   `documentation/` : Contient la documentation complète du logiciel.
*   `public/` : Fichiers statiques accessibles publiquement.
*   `src/` : Cœur du code source de l'application.
*   `supabase/` : Contient le code des Edge Functions.
*   `package.json` : Définit les dépendances et les scripts du projet.
*   `tailwind.config.ts` : Fichier de configuration pour Tailwind CSS.
*   `vite.config.ts` : Fichier de configuration pour l'outil de build Vite.

### 2.5.2. Analyse du Répertoire `src`
*   `components/` : Contient tous les composants React réutilisables.
    *   `ui/` : Composants de base fournis par shadcn/ui.
    *   `pos/`, `inventory/`, etc. : Composants spécifiques à un module fonctionnel.
*   `pages/` : Chaque fichier correspond à une page de l'application (une route).
*   `lib/` : Contient la logique métier, les utilitaires complexes et les abstractions. C'est ici que se trouvent les modules de chiffrement, de tokenisation, d'audit, etc.
*   `integrations/` : Code spécifique à l'intégration avec des services externes, comme le client Supabase.
*   `hooks/` : Hooks React personnalisés pour encapsuler une logique réutilisable.
*   `App.tsx` : Composant racine qui définit la structure des routes.
*   `main.tsx` : Point d'entrée de l'application qui effectue le rendu du composant racine.

---

## 2.6. Analyse des Flux de Données Critiques

### 2.6.1. Flux 1 : Processus de Connexion et d'Autorisation d'Appareil
1.  **Utilisateur** saisit ses identifiants.
2.  **Frontend** envoie les identifiants à **Supabase Auth**.
3.  **Supabase Auth** valide les identifiants et retourne un JWT.
4.  **Frontend** reçoit le JWT et l'ID utilisateur.
5.  **Frontend** génère une empreinte d'appareil via **FingerprintJS**.
6.  **Frontend** interroge la table `device_fingerprints` pour savoir si l'empreinte est déjà autorisée pour cet utilisateur.
7.  **Si oui**, la connexion est finalisée.
8.  **Si non**, le frontend vérifie si le mode "Ajouter un appareil" est activé (entrée `TEMPORARY_UNLOCK` dans la table).
9.  **Si le mode est activé**, une modale demande à l'utilisateur de confirmer l'ajout. Sur confirmation, l'empreinte est ajoutée à la table.
10. **Si le mode est désactivé**, la session est détruite et l'accès est refusé.

### 2.6.2. Flux 2 : Cycle de Vie d'une Transaction au Point de Vente
1.  **Opérateur** ajoute des produits au panier (état local dans le composant `POS`).
2.  **Opérateur** clique sur "Finaliser".
3.  **Frontend** calcule le total.
4.  (Optionnel) **Frontend** valide une carte récompense (voir Flux 4).
5.  **Opérateur** sélectionne le mode de paiement.
6.  **Frontend** construit un objet `order` avec tous les détails.
7.  **Frontend** envoie une requête `INSERT` à la table `orders` via le client Supabase.
8.  Si la commande contient des produits à préparer, une requête `INSERT` est également envoyée à la table `preparation_queue`.
9.  Si une carte a été utilisée, une requête `UPDATE` est envoyée à `customer_profiles` pour ajouter les points.
10. Le panier est vidé côté client.

### 2.6.3. Flux 3 : Création d'une Fiche Client et d'une Carte (avec Chiffrement)
1.  **Admin** remplit le formulaire de création (numéro de fiche, prénom).
2.  **Frontend** envoie les données personnelles à l'**Edge Function `crypto-service`**.
3.  **Edge Function** chiffre les données avec la clé secrète AES-256 et retourne les données chiffrées.
4.  **Frontend** envoie une requête `INSERT` à la table `customer_profiles` avec les données chiffrées.
5.  **Frontend** génère un code de carte valide avec l'algorithme de Luhn.
6.  **Frontend** envoie une requête `INSERT` à la table `reward_cards`, liant la nouvelle carte au profil client créé.
7.  **Frontend** appelle la fonction `createPermanentCardToken` qui génère un token unique et l'insère dans la table `card_tokens`.

### 2.6.4. Flux 4 : Validation d'une Carte et Génération de Token Temporaire
1.  **Opérateur** saisit le code de la carte (ex: `AB 12 3`).
2.  **Frontend** valide le format et le checksum Luhn du code.
3.  **Frontend** interroge la table `reward_cards` pour trouver la carte correspondante.
4.  **Frontend** récupère le `permanent_token` associé à cette carte depuis la table `card_tokens`.
5.  **Frontend** appelle la fonction `generateTemporaryToken`, qui :
    a. Valide le token permanent.
    b. Génère un nouveau token unique.
    c. Insère ce nouveau token dans `card_tokens` avec `token_type = 'temporary'` et une date d'expiration de 5 minutes.
6.  Ce token temporaire est stocké dans l'état du composant de checkout et sera utilisé lors de la création de la commande.