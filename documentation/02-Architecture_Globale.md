# Partie 2 : Architecture de la Solution

## 2.1. Vue d'Ensemble de l'Architecture

L'architecture du système de gestion du Café Marie Anne est conçue selon un modèle moderne et découplé, s'appuyant sur une infrastructure "Backend-as-a-Service" (BaaS). Cette approche permet de séparer clairement les responsabilités entre la logique de présentation (frontend) et la gestion des données et des services (backend).

Le système se décompose en trois strates principales :

1.  **Frontend (Application Cliente) :**
    *   Il s'agit de l'interface utilisateur avec laquelle le personnel interagit. C'est une application web monopage (Single Page Application - SPA) développée en React.
    *   Elle est responsable de l'affichage des données, de la capture des interactions utilisateur et de la communication avec le backend.
    *   Elle ne contient aucune logique métier sensible et ne stocke aucune donnée de manière persistante, à l'exception des jetons de session sécurisés.

2.  **Backend (Supabase - BaaS) :**
    *   Supabase agit comme la colonne vertébrale de l'application. Il ne s'agit pas d'un serveur traditionnel mais d'une suite de services hébergés qui fournissent toutes les fonctionnalités backend nécessaires.
    *   **Base de Données PostgreSQL :** Le cœur du stockage des données. Toutes les informations (commandes, clients, produits, etc.) y sont conservées.
    *   **Authentification :** Gère l'identité des utilisateurs, les connexions et la gestion des sessions via des jetons JWT (JSON Web Tokens).
    *   **Stockage (Storage) :** Un service de stockage d'objets (similaire à Amazon S3) utilisé pour héberger les images des produits.
    *   **Edge Functions :** Des fonctions serverless (écrites en Deno/TypeScript) qui s'exécutent à la périphérie du réseau. Elles sont utilisées pour la logique métier sensible qui ne doit jamais être exposée côté client, comme le chiffrement et le déchiffrement des données.

3.  **Couche de Communication (API) :**
    *   La communication entre le frontend et le backend s'effectue principalement via l'API fournie par Supabase.
    *   Les requêtes vers la base de données sont effectuées via la bibliothèque cliente de Supabase, qui construit des requêtes RESTful sécurisées.
    *   Les appels aux Edge Functions se font via des requêtes HTTPS standards.

### Diagramme Simplifié du Flux Architectural

```
[ Navigateur Web (Utilisateur) ]
       |
       | HTTPS (React SPA)
       ↓
[ Frontend - Application React ]
       |
       |-----------------------------------|
       | (API Supabase via HTTPS)          | (HTTPS)
       ↓                                   ↓
[ Supabase Backend-as-a-Service ]     [ Edge Function (Chiffrement) ]
       |
       |-----------------|-----------------|
       ↓                 ↓                 ↓
[ Auth Service ]  [ PostgreSQL DB ]  [ Storage Service ]
```

---

## 2.2. Stack Technologique Détaillée

### Frontend

| Technologie      | Version  | Rôle                                                              |
| ---------------- | -------- | ----------------------------------------------------------------- |
| **React**        | 18.3.1   | Bibliothèque principale pour la construction de l'interface utilisateur. |
| **TypeScript**   | 5.5.3    | Langage de programmation principal, ajoutant un typage statique à JavaScript. |
| **Vite**         | 6.3.4    | Outil de build et serveur de développement, offrant une performance élevée. |
| **Tailwind CSS** | 3.4.11   | Framework CSS "utility-first" pour un style rapide et cohérent. |
| **shadcn/ui**    | N/A      | Collection de composants d'interface réutilisables et accessibles. |
| **React Router** | 6.26.2   | Bibliothèque pour la gestion de la navigation (routage) côté client. |
| **TanStack Query**| 5.56.2   | Gestion de l'état du serveur, du cache et de la synchronisation des données. |
| **Lucide React** | 0.462.0  | Bibliothèque d'icônes.                                            |
| **dnd-kit**      | 6.3.1    | Boîte à outils pour la fonctionnalité de glisser-déposer (drag & drop). |
| **FingerprintJS**| 5.0.1    | Bibliothèque pour la génération d'empreintes d'appareil uniques. |

### Backend (Supabase)

| Service             | Technologie      | Rôle                                                              |
| ------------------- | ---------------- | ----------------------------------------------------------------- |
| **Base de Données** | PostgreSQL 15    | Système de gestion de base de données relationnelle open-source.    |
| **API**             | PostgREST        | Génère automatiquement une API RESTful à partir du schéma de la base de données. |
| **Authentification**| GoTrue           | Service basé sur JWT pour la gestion des utilisateurs et des accès. |
| **Edge Functions**  | Deno             | Environnement d'exécution pour les fonctions serverless.          |
| **Stockage**        | Supabase Storage | Service de stockage d'objets pour les fichiers (images).          |
| **Realtime**        | Supabase Realtime| Permet de s'abonner aux changements de la base de données en temps réel. |

---

## 2.3. Flux de Données Principal (Exemple : Création d'une Commande)

Pour illustrer le fonctionnement de l'architecture, voici le flux de données lors de la création d'une nouvelle commande :

1.  **Interface Utilisateur (Frontend) :**
    *   L'opérateur ajoute des produits au panier dans le module de Point de Vente.
    *   Il clique sur "Finaliser la commande".
    *   Si une carte récompense est utilisée, le frontend valide le format du code de carte (validation Luhn).
    *   Le frontend appelle l'Edge Function `crypto-service` pour générer un token temporaire sécurisé.
    *   L'opérateur sélectionne la méthode de paiement.

2.  **Communication API (Client Supabase) :**
    *   Le frontend construit un objet `order` contenant les détails de la commande (articles, total, méthode de paiement, ID client si applicable).
    *   La bibliothèque cliente Supabase envoie une requête `INSERT` sécurisée via HTTPS à l'API PostgREST de Supabase.
    *   Le jeton d'authentification (JWT) de l'utilisateur est inclus dans l'en-tête de la requête pour autorisation.

3.  **Traitement Backend (Supabase) :**
    *   **Row Level Security (RLS) :** PostgreSQL vérifie les politiques de sécurité. La politique `orders_insert_policy` s'assure que l'utilisateur authentifié a bien le droit d'insérer une commande.
    *   **Base de Données :** Si la politique est respectée, la nouvelle commande est insérée dans la table `orders`. Un `order_number` est généré automatiquement.
    *   **Mise à jour des Points :** Si des points ont été gagnés, une requête `UPDATE` est envoyée à la table `customer_profiles` pour mettre à jour le solde de points du client.
    *   **File d'attente :** Si la commande contient des produits nécessitant une préparation, une nouvelle entrée est créée dans la table `preparation_queue`.
    *   **Audit :** Le frontend envoie une requête à la table `audit_logs` pour enregistrer l'événement `CREATE_ORDER`.

4.  **Réponse et Mise à Jour de l'Interface :**
    *   Supabase retourne les données de la commande nouvellement créée au frontend.
    *   Le frontend affiche une notification de succès.
    *   Le panier est vidé.
    *   Si un produit doit être préparé, une boîte de dialogue affiche le numéro de commande et le temps d'attente estimé.
    *   Les composants abonnés aux changements en temps réel (comme le widget d'audit ou l'écran de la file d'attente) se mettent à jour automatiquement.