# Chapitre 5 : Schéma de Base de Données et Modèles de Données

Ce chapitre fournit une description exhaustive du schéma de la base de données PostgreSQL qui sous-tend le Système de Gestion du Café Marie Anne.

---

## 5.1. Schéma Global de la Base de Données

La base de données est structurée autour de tables relationnelles fortement typées, utilisant des clés étrangères pour garantir l'intégrité référentielle et des politiques RLS pour la sécurité.

---

## 5.2. Description Détaillée des Tables

### 5.2.1. Table `customer_profiles`
Stocke les informations des élèves inscrits au programme de fidélité.
- `id` (UUID, PK) : Identifiant unique.
- `customer_number` (TEXT) : Numéro de fiche (Chiffré).
- `first_name` (TEXT) : Prénom (Chiffré).
- `last_name` (TEXT) : Nom (Chiffré, optionnel).
- `points_balance` (INTEGER) : Solde de points actuel.
- `created_at` (TIMESTAMP) : Date de création.

### 5.2.2. Table `reward_cards`
Représente les cartes physiques distribuées.
- `id` (UUID, PK) : Identifiant unique.
- `card_code` (TEXT) : Code visible sur la carte (ex: AB123).
- `customer_profile_id` (UUID, FK) : Lien vers le profil élève.
- `is_active` (BOOLEAN) : État de la carte.

### 5.2.3. Table `card_tokens`
Gère les tokens de sécurité pour l'authentification des cartes.
- `id` (UUID, PK).
- `reward_card_id` (UUID, FK).
- `token` (TEXT) : Le token lui-même.
- `token_type` (TEXT) : 'permanent' ou 'temporary'.
- `expires_at` (TIMESTAMP) : Pour les tokens temporaires.
- `used_at` (TIMESTAMP) : Date d'utilisation (pour éviter le rejeu).

### 5.2.4. Table `orders`
Historique des transactions.
- `id` (UUID, PK).
- `order_number` (INTEGER) : Numéro séquentiel lisible.
- `total_amount` (NUMERIC) : Montant total.
- `payment_method` (TEXT) : 'cash' ou 'card'.
- `points_earned` (INTEGER) : Points générés.
- `items` (JSONB) : Détail des produits achetés (snapshot).
- `customer_profile_id` (UUID, FK, Nullable).
- `reward_card_id` (UUID, FK, Nullable).

### 5.2.5. Table `preparation_queue`
File d'attente pour la cuisine.
- `id` (UUID, PK).
- `order_id` (UUID, FK).
- `queue_number` (INTEGER) : Numéro d'appel (0-999).
- `preparation_type` (TEXT) : 'sandwich' ou 'pizza'.
- `status` (TEXT) : 'pending', 'ready', 'delivered'.
- `estimated_time` (INTEGER) : Temps en secondes.
- `created_at` (TIMESTAMP).

### 5.2.6. Table `products`
Catalogue des produits.
- `id` (UUID, PK).
- `name` (TEXT).
- `price` (NUMERIC).
- `category_id` (UUID, FK).
- `image_url` (TEXT).
- `requires_preparation` (BOOLEAN).
- `preparation_type` (TEXT).
- `availability` (JSONB) : Horaires de disponibilité.

### 5.2.7. Table `categories`
Catégories de produits.
- `id` (UUID, PK).
- `name` (TEXT).
- `position` (INTEGER) : Pour l'ordre d'affichage.

### 5.2.8. Table `audit_logs`
Grand Livre d'audit (Blockchain).
- `id` (UUID, PK).
- `user_id` (UUID, FK).
- `action` (TEXT) : Type d'action.
- `resource_type` (TEXT).
- `details` (JSONB) : Métadonnées de l'action.
- `hash` (TEXT) : Empreinte cryptographique de l'entrée.
- `previous_hash` (TEXT) : Lien vers l'entrée précédente.
- `created_at` (TIMESTAMP).

### 5.2.9. Table `device_fingerprints`
Appareils autorisés.
- `id` (UUID, PK).
- `user_id` (UUID, FK).
- `fingerprint` (TEXT) : Hash unique de l'appareil.
- `is_active` (BOOLEAN).

### 5.2.10. Table `canary_tokens`
Tokens pièges pour la sécurité.
- `id` (UUID, PK).
- `token` (TEXT).
- `is_triggered` (BOOLEAN).

### 5.2.11. Table `security_alerts`
Journal des alertes de sécurité.
- `id` (UUID, PK).
- `alert_type` (TEXT).
- `severity` (TEXT).
- `details` (JSONB).
- `is_resolved` (BOOLEAN).

### 5.2.12. Table `user_encryption_keys`
Clés de chiffrement E2E des utilisateurs.
- `id` (UUID, PK).
- `user_id` (UUID, FK).
- `public_key` (TEXT).
- `encrypted_private_key` (TEXT).

### 5.2.13. Table `suspended_items` (Nouvelle)
Gestion des dons "Café Suspendu".
- `id` (UUID, PK).
- `product_id` (UUID, FK) : Produit offert.
- `order_id` (UUID, FK) : Commande d'origine.
- `donor_name` (TEXT) : Nom affiché.
- `message` (TEXT) : Message d'encouragement.
- `status` (TEXT) : 'available' ou 'claimed'.
- `claimed_at` (TIMESTAMP).
- `created_at` (TIMESTAMP).

---

## 5.3. Relations Entre les Tables

Le schéma est fortement interconnecté :
- `orders` lie `customer_profiles`, `reward_cards` et contient des snapshots de `products`.
- `preparation_queue` est liée à `orders`.
- `suspended_items` est liée à `orders` (achat) et `products` (référence).
- `card_tokens` est liée à `reward_cards`.
- Toutes les tables sensibles sont liées à `auth.users` (via `user_id` ou implicitement via RLS).

---

## 5.4. Types de Données et Contraintes

- **UUID** : Utilisé partout pour les clés primaires pour éviter les collisions et l'énumération.
- **JSONB** : Utilisé pour les données flexibles (`orders.items`, `audit_logs.details`) permettant une évolution sans migration de schéma lourde.
- **Timestamps** : Toujours stockés avec fuseau horaire (`TIMESTAMPTZ`) pour garantir la précision temporelle.