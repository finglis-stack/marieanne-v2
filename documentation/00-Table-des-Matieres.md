# Documentation Complète du Système de Gestion du Café Marie Anne

**Version 1.0**
**Date de publication :** 15 Novembre 2025

---

## Table des Matières Générale Détaillée

### Partie 1 : Introduction et Vision d'Ensemble

1.  **Introduction et Vision d'Ensemble**
    1.1. **Mission et Objectifs du Logiciel**
        1.1.1. Énoncé de la Mission Principale
        1.1.2. Analyse Sémantique de la Mission
            1.1.2.1. "Plateforme Technologique" : Un Écosystème Intégré
            1.1.2.2. "Robuste" : Fiabilité et Tolérance aux Pannes
            1.1.2.3. "Sécurisée" : La Sécurité comme Fondement
            1.1.2.4. "Efficiente" : Optimisation des Flux Opérationnels
        1.1.3. Objectifs Stratégiques et Opérationnels
            1.1.3.1. Axe 1 : Optimisation de l'Efficacité Opérationnelle
            1.1.3.2. Axe 2 : Amélioration de l'Expérience Client
            1.1.3.3. Axe 3 : Renforcement de la Sécurité et de la Conformité
            1.1.3.4. Axe 4 : Fourniture d'Outils d'Aide à la Décision
    1.2. **Contexte d'Application : Le Café Scolaire**
        1.2.1. Analyse de l'Environnement Opérationnel
        1.2.2. Contraintes Spécifiques et Implications Techniques
            1.2.2.1. Gestion des Pics d'Achalandage
            1.2.2.2. Nature de la Clientèle (Mineurs)
            1.2.2.3. Exigences Réglementaires (Loi 25)
            1.2.2.4. Rotation du Personnel et Simplicité d'Utilisation
    1.3. **Public Cible de la Documentation**
        1.3.1. Profil 1 : Développeurs et Équipes de Maintenance
        1.3.2. Profil 2 : Administrateurs Système et Opérations (DevOps)
        1.3.3. Profil 3 : Responsables de la Sécurité de l'Information (RSSI)
        1.3.4. Profil 4 : Gestionnaires et Parties Prenantes Métier
    1.4. **Philosophie Générale et Principes Directeurs**
        1.4.1. Principe 1 : La Sécurité par Conception ("Security by Design")
        1.4.2. Principe 2 : La Performance et la Fiabilité Inconditionnelles
        1.4.3. Principe 3 : La Simplicité d'Utilisation comme Priorité
        1.4.4. Principe 4 : La Modularité pour l'Évolutivité Future

---

### Partie 2 : Architecture Technologique
*Fichier : `02-Architecture-Technologique.md`*

2.  **Architecture Technologique**
    2.1. **Vue d'Ensemble de l'Architecture**
        2.1.1. Schéma d'Architecture Logique à Trois Niveaux
        2.1.2. Description des Composants Majeurs
    2.2. **Architecture Frontend (Application Cliente)**
        2.2.1. Fondations : React 18, Vite, et TypeScript
        2.2.2. Gestion de l'État et des Données Serveur (`@tanstack/react-query`)
        2.2.3. Système de Routage (`react-router-dom`)
        2.2.4. Système de Design (Tailwind CSS, shadcn/ui)
    2.3. **Architecture Backend (Services Supabase)**
        2.3.1. Base de Données PostgreSQL et Politiques RLS
        2.3.2. Service d'Authentification (Supabase Auth)
        2.3.3. Service de Stockage d'Objets (Supabase Storage)
        2.3.4. Fonctions Edge Serverless (Deno)
    2.4. **Structure Détaillée du Code Source**
        2.4.1. Analyse du Répertoire `src`
        2.4.2. Analyse du Répertoire `lib`
        2.4.3. Analyse du Répertoire `supabase`
    2.5. **Analyse des Flux de Données Critiques**
        2.5.1. Flux 1 : Processus de Connexion et d'Autorisation d'Appareil
        2.5.2. Flux 2 : Cycle de Vie d'une Transaction au Point de Vente
        2.5.3. Flux 3 : Création d'une Fiche Client (avec Chiffrement)
        2.5.4. Flux 4 : Validation d'une Carte et Génération de Token

---

### Partie 3 : Guide Fonctionnel Détaillé par Module
*Fichier : `03-Guide-Fonctionnel.md`*

3.  **Guide Fonctionnel Détaillé par Module**
    3.1. **Module d'Authentification et de Connexion (`/`)**
        3.1.1. Interface de Connexion (`FuturisticLogin.tsx`)
        3.1.2. Processus de Saisie des Identifiants
        3.1.3. Gestion de l'Affichage du Mot de Passe
        3.1.4. Logique de Soumission du Formulaire
        3.1.5. Redirection vers le Tableau de Bord
        3.1.6. Lien d'Accès Rapide à la File d'Attente
    3.2. **Tableau de Bord (`/dashboard`)**
        3.2.1. Affichage des Statistiques du Jour
        3.2.2. Calcul et Affichage des Tendances
        3.2.3. Grille d'Actions Rapides (Navigation)
        3.2.4. Widget d'Audit en Temps Réel (`AuditFooter.tsx`)
        3.2.5. Processus de Déconnexion
    3.3. **Point de Vente (POS) (`/pos`)**
        3.3.1. Grille de Produits (`ProductGrid.tsx`)
        3.3.2. Panneau de Commande (`CheckoutPanel.tsx`)
        3.3.3. Affichage de la File d'Attente (`PreparationDisplay.tsx`)
        3.3.4. Modale de Finalisation de Commande (`CheckoutDialog.tsx`)
        3.3.5. Modale de Paiement Comptant (`CashPaymentDialog.tsx`)
        3.3.6. Modale de Numéro de Commande (`OrderNumberDialog.tsx`)
    3.4. **Gestion d'Inventaire (`/inventory`)**
        3.4.1. Affichage des Catégories (`CategoryCard.tsx`)
        3.4.2. Affichage des Produits (`ProductCard.tsx`)
        3.4.3. Fonctionnalité de Glisser-Déposer (Drag & Drop)
        3.4.4. Modale d'Ajout de Catégorie (`AddCategoryDialog.tsx`)
        3.4.5. Modale d'Ajout de Produit (`AddProductDialog.tsx`)
        3.4.6. Gestionnaire de Disponibilité (`AvailabilityManager.tsx`)
    3.5. **Gestion des Cartes Récompenses (`/reward-cards`)**
        3.5.1. Affichage des Fiches Clients (`CustomerCard.tsx`)
        3.5.2. Modale de Création de Carte (`CreateCardDialog.tsx`)
        3.5.3. Pagination et Recherche
        3.5.4. Fonctionnalité de Déverrouillage des Données Sensibles
    3.6. **Détail d'une Fiche Client (`/reward-cards/:customerId`)**
        3.6.1. Affichage des Informations du Client
        3.6.2. Historique des Commandes du Client
        3.6.3. Liste des Cartes Associées
        3.6.4. Actions sur les Cartes (Activer/Désactiver/Supprimer)
    3.7. **Historique des Transactions (`/transactions`)**
        3.7.1. Affichage de la Liste des Commandes
        3.7.2. Statistiques Globales (Revenu, Nombre de transactions)
        3.7.3. Recherche et Pagination
    3.8. **Détail d'une Commande (`/orders/:orderId`)**
        3.8.1. Affichage des Détails de la Commande
        3.8.2. Récapitulatif des Articles
        3.8.3. Informations sur le Client et la Carte (si applicable)
    3.9. **File d'Attente de Préparation (Écran Public) (`/preparation-queue`)**
        3.9.1. Affichage des Commandes en Préparation et Prêtes
        3.9.2. Mise à Jour en Temps Réel via Supabase Realtime
    3.10. **Module de Rapports (`/reports`)**
        3.10.1. Sélection de la Période et des Métriques
        3.10.2. Génération de Rapports PDF
        3.10.3. Export de Données CSV
    3.11. **Grand Livre d'Audit (`/audit-logs`)**
        3.11.1. Affichage des Logs d'Audit
        3.11.2. Recherche et Filtrage
        3.11.3. Export CSV des Logs
    3.12. **Gestion des Appareils (`/device-management`)**
        3.12.1. Liste des Appareils Autorisés
        3.12.2. Mode d'Ajout d'Appareil (Déverrouillage Temporaire)
        3.12.3. Actions sur les Appareils (Révoquer, Supprimer)
    3.13. **Centre de Sécurité (`/security-dashboard`)**
        3.13.1. Tableau de Bord des Alertes
        3.13.2. Liste des Alertes de Sécurité
        3.13.3. Liste des Canary Tokens
        3.13.4. Résolution des Alertes

---

### Partie 4 : Architecture de Sécurité
*Fichier : `04-Architecture-Securite.md`*

4.  **Architecture de Sécurité**
    4.1. **Chiffrement des Données Sensibles (AES-256-GCM)**
        4.1.1. Rôle de l'Edge Function `crypto-service`
        4.1.2. Processus de Chiffrement (`encryptBatch`)
        4.1.3. Processus de Déchiffrement (`decryptBatch`)
        4.1.4. Gestion de la Clé de Chiffrement (`ENCRYPTION_KEY`)
    4.2. **Système de Tokenisation à Double Niveau**
        4.2.1. Le Token Permanent (Associé à la carte physique)
        4.2.2. Le Token Temporaire (Validité de 5 minutes)
        4.2.3. Flux de Génération et de Validation (`tokenization.ts`)
        4.2.4. Nettoyage Automatique des Tokens Expirés
    4.3. **Biométrie d'Appareil (`device-fingerprint.ts`)**
        4.3.1. Génération de l'Empreinte d'Appareil (`FingerprintJS`)
        4.3.2. Processus d'Autorisation d'un Nouvel Appareil
        4.3.3. Mode de Déverrouillage Temporaire du Compte
        4.3.4. Vérification de l'Appareil à Chaque Connexion
    4.4. **Mécanismes de Détection d'Intrusion (`honeypot.ts`)**
        4.4.1. Honeypot Accounts (Comptes Appâts)
        4.4.2. Canary Tokens (Tokens Sentinelles)
        4.4.3. Honeypot Endpoints (Points d'Accès Piégés)
        4.4.4. Détection de Scraping
    4.5. **Chiffrement de Bout en Bout (E2E) (`e2e-encryption.ts`)**
        4.5.1. Architecture Hybride : RSA-4096 + AES-256-GCM
        4.5.2. Gestion des Paires de Clés Utilisateur
        4.5.3. Principe de "Perfect Forward Secrecy" (PFS)
    4.6. **Validation des Données et Algorithmes**
        4.6.1. Algorithme de Luhn pour les Codes de Carte (`card-validation.ts`)
    4.7. **Contrôle d'Accès Basé sur les Rôles (RBAC) via RLS**
        4.7.1. Analyse des Politiques de Sécurité au Niveau des Lignes (RLS)
        4.7.2. Principe du Moindre Privilège Appliqué à la Base de Données

---

### Partie 5 : Schéma de Base de Données et Modèles de Données
*Fichier : `05-Schema-Base-de-Donnees.md`*

5.  **Schéma de Base de Données et Modèles de Données**
    5.1. **Schéma Global de la Base de Données**
    5.2. **Description Détaillée des Tables**
        5.2.1. Table `customer_profiles`
        5.2.2. Table `reward_cards`
        5.2.3. Table `card_tokens`
        5.2.4. Table `orders`
        5.2.5. Table `preparation_queue`
        5.2.6. Table `products`
        5.2.7. Table `categories`
        5.2.8. Table `audit_logs`
        5.2.9. Table `device_fingerprints`
        5.2.10. Table `canary_tokens`
        5.2.11. Table `security_alerts`
        5.2.12. Table `user_encryption_keys`
    5.3. **Relations Entre les Tables (Clés Étrangères)**
    5.4. **Types de Données et Contraintes**

---

### Partie 6 : Système d'Audit et de Traçabilité
*Fichier : `06-Systeme-Audit.md`*

6.  **Système d'Audit et de Traçabilité**
    6.1. **Objectifs du Système d'Audit**
    6.2. **Architecture du Module d'Audit (`audit.ts`)**
    6.3. **Liste Exhaustive des Actions Auditées**
    6.4. **Structure d'un Log d'Audit**
    6.5. **Intégration avec les Mécanismes de Sécurité**

---

### Partie 7 : Guide de Déploiement et d'Opérations
*Fichier : `07-Guide-Deploiement.md`*

7.  **Guide de Déploiement et d'Opérations**
    7.1. **Prérequis au Déploiement**
    7.2. **Configuration de l'Environnement Supabase**
    7.3. **Déploiement du Frontend (Vercel/Netlify)**
    7.4. **Déploiement des Edge Functions**
    7.5. **Gestion des Variables d'Environnement et des Secrets**
    7.6. **Procédures de Maintenance**

---

### Partie 8 : Annexes
*Fichier : `08-Annexes.md`*

8.  **Annexes**
    8.1. **Glossaire des Termes Techniques**
    8.2. **Liste Complète des Dépendances**
    8.3. **Exemples de Requêtes API**