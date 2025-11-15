# ☕ Café Marie Anne - Système de Gestion

<div align="center">

**Système de point de vente moderne avec gestion de cartes récompenses, file d'attente de préparation et sécurité militaire**

[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-2.81.1-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.11-06B6D4?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Security](https://img.shields.io/badge/Security-Military_Grade-red?style=for-the-badge&logo=shield)](https://github.com/)

[🚀 Voir le logiciel](https://www.cafemarieanne.ca/) • [📖 Documentation](#table-des-matières) • [🐛 Signaler un bug](#)

</div>

---

## 📋 Table des matières

- [🎯 À propos du projet](#-à-propos-du-projet)
- [✨ Fonctionnalités principales](#-fonctionnalités-principales)
- [🏗️ Architecture technique](#️-architecture-technique)
- [🔒 Sécurité](#-sécurité)
  - [🛡️ Chiffrement AES-256-GCM](#️-chiffrement-aes-256-gcm)
  - [🎫 Système de tokenisation](#-système-de-tokenisation)
  - [🍯 Honeypot & Canary Tokens](#-honeypot--canary-tokens)
  - [🔐 Chiffrement E2E](#-chiffrement-e2e)
  - [📱 Biométrie d'appareil](#-biométrie-dappareil)
- [🚀 Installation](#-installation)
- [📱 Utilisation](#-utilisation)
- [🗄️ Structure de la base de données](#️-structure-de-la-base-de-données)
- [📊 Système d'audit](#-système-daudit)
- [🎨 Interface utilisateur](#-interface-utilisateur)
- [🛠️ Technologies utilisées](#️-technologies-utilisées)
- [📝 Licence](#-licence)

---

## 🎯 À propos du projet

**Café Marie Anne** est un système de gestion complet conçu pour un café scolaire. Il combine un point de vente (POS), un système de cartes récompenses avec chiffrement AES-256-GCM, une file d'attente de préparation en temps réel, un système d'audit complet, et des **mécanismes de sécurité de niveau militaire** incluant honeypots, canary tokens et chiffrement de bout en bout.

### 🎓 Contexte

Ce système a été développé pour gérer efficacement les opérations d'un café dans un environnement scolaire, avec un accent particulier sur :
- La **protection des données personnelles** des élèves (Loi 25 - Québec)
- La **rapidité des transactions** pendant les heures de pointe
- La **traçabilité complète** de toutes les opérations
- La **gamification** via un système de points
- La **détection d'intrusion** automatique avec honeypots
- Le **chiffrement de bout en bout** pour les communications sensibles

---

## ✨ Fonctionnalités principales

### 🛒 Point de Vente (POS)

- ✅ Interface tactile optimisée pour tablette
- ✅ Gestion du panier en temps réel
- ✅ Calcul automatique des taxes (TPS/TVQ 14.975%)
- ✅ Paiement comptant avec calculateur de monnaie
- ✅ Paiement par carte (débit/crédit)
- ✅ Validation de carte récompense avec tokens temporaires
- ✅ Attribution automatique de points (1000 points par dollar)

### 🎁 Cartes Récompenses

- ✅ Création de fiches clients avec chiffrement AES-256-GCM
- ✅ Génération de codes de carte avec validation Luhn (format: `XX 00 0`)
- ✅ Système de tokenisation à deux niveaux :
  - **Token permanent** (stocké sur la carte physique)
  - **Token temporaire** (5 minutes, usage unique)
- ✅ Déverrouillage par mot de passe pour voir les données sensibles
- ✅ Gestion des points de fidélité
- ✅ Activation/désactivation des cartes

### 👨‍🍳 File d'attente de préparation

- ✅ Système de numéros de commande
- ✅ Gestion de deux types de préparation :
  - **Sandwichs** : 4min 30s, max 4 simultanés
  - **Pizzas** : 13min, max 4 simultanés
- ✅ Calcul automatique du temps d'attente
- ✅ Affichage en temps réel sur écran dédié
- ✅ Statuts : En attente → En préparation → Prêt → Livré

### 📦 Gestion d'inventaire

- ✅ Catégories de produits avec drag & drop
- ✅ Produits avec images, prix, taxes
- ✅ Disponibilité par jour et plage horaire (heure EST)
- ✅ Configuration de préparation par produit
- ✅ Réorganisation par glisser-déposer

### 📊 Rapports et statistiques

- ✅ Dashboard avec statistiques du jour (heure EST)
- ✅ Comparaison avec la veille
- ✅ Génération de rapports PDF personnalisés
- ✅ Filtres par période, métrique, type de paiement
- ✅ Top 10 des produits vendus

### 🔍 Grand Livre d'audit

- ✅ Traçabilité complète de toutes les actions
- ✅ Logs horodatés avec utilisateur, action, ressource
- ✅ Filtres par action, ressource, utilisateur
- ✅ Export CSV
- ✅ Widget en temps réel (footer)

### 🛡️ Sécurité avancée

- ✅ **Honeypot accounts** : Faux comptes qui alertent si connexion
- ✅ **Canary tokens** : Tokens invisibles qui détectent les scrapers
- ✅ **Détection de scraping** : Blocage automatique des bots
- ✅ **Chiffrement E2E** : RSA-4096 + AES-256-GCM pour messages
- ✅ **Perfect Forward Secrecy** : Clés éphémères par session
- ✅ **Biométrie d'appareil** : Empreinte unique par appareil
- ✅ **Centre de sécurité** : Dashboard dédié aux menaces

---

## 🏗️ Architecture technique

### 📐 Stack technique

```
Frontend (React + TypeScript)
    ↓
Supabase (Backend as a Service)
    ├── PostgreSQL (Base de données)
    ├── Auth (Authentification)
    ├── Storage (Images produits)
    └── Edge Functions (Chiffrement)
    
Sécurité (Multi-couches)
    ├── Honeypots (Détection d'intrusion)
    ├── Canary Tokens (Détection de scraping)
    ├── E2E Encryption (RSA-4096 + AES-256)
    ├── Device Fingerprinting (Biométrie)
    └── Audit Trail (Traçabilité complète)
```

### 🗂️ Structure du projet

```
src/
├── components/          # Composants réutilisables
│   ├── ui/             # Composants shadcn/ui
│   ├── pos/            # Composants du point de vente
│   ├── inventory/      # Composants de l'inventaire
│   ├── reward-cards/   # Composants des cartes récompenses
│   ├── audit/          # Composants d'audit
│   └── security/       # 🆕 Composants de sécurité
│       └── canary-token-injector.tsx
├── pages/              # Pages de l'application
│   ├── Index.tsx       # Page de connexion
│   ├── Dashboard.tsx   # Tableau de bord
│   ├── POS.tsx         # Point de vente
│   ├── Inventory.tsx   # Gestion inventaire
│   ├── RewardCards.tsx # Gestion cartes
│   ├── Transactions.tsx # Historique
│   ├── Reports.tsx     # Rapports
│   ├── AuditLogs.tsx   # Grand livre
│   ├── DeviceManagement.tsx # Gestion appareils
│   └── SecurityDashboard.tsx # 🆕 Centre de sécurité
├── lib/                # Utilitaires
│   ├── crypto.ts       # Chiffrement/déchiffrement
│   ├── tokenization.ts # Gestion des tokens
│   ├── audit.ts        # Système d'audit
│   ├── card-validation.ts # Validation Luhn
│   ├── device-fingerprint.ts # Biométrie d'appareil
│   ├── honeypot.ts     # 🆕 Honeypots & Canary tokens
│   └── e2e-encryption.ts # 🆕 Chiffrement E2E
├── integrations/       # Intégrations externes
│   └── supabase/       # Client Supabase
└── utils/              # Fonctions utilitaires
    └── toast.ts        # Notifications
```

---

## 🔒 Sécurité

### 🛡️ Chiffrement des données (AES-256-GCM)

Toutes les données personnelles sont chiffrées **côté serveur** via une Edge Function Supabase :

#### 📊 Données chiffrées
- Numéro de fiche client
- Prénom
- Nom
- Email
- Téléphone
- Notes

#### 🔐 Processus de chiffrement

```typescript
// 1. Envoi des données à l'Edge Function
const encrypted = await encryptBatch({
  first_name: "Marie",
  customer_number: "12345"
});

// 2. Chiffrement côté serveur avec AES-256-GCM
// - Clé : 256 bits (stockée dans ENCRYPTION_KEY)
// - IV : 96 bits (généré aléatoirement)
// - Format : base64(IV + ciphertext)

// 3. Stockage en base de données
// Résultat : "a3F2c8d9e4f5g6h7i8j9k0l1m2n3o4p5..."
```

#### 🔓 Déchiffrement

Le déchiffrement nécessite :
1. ✅ **Authentification** : JWT valide
2. ✅ **Mot de passe** : Confirmation de l'utilisateur
3. ✅ **Clé de chiffrement** : Accessible uniquement côté serveur

### 🎫 Système de tokenisation (double niveau)

#### 1️⃣ Token permanent (carte physique)
- Format : `XXXX-XXXX-XXXX` (12 caractères alphanumériques)
- Stocké sur la carte physique
- Jamais exposé au client
- Utilisé pour générer des tokens temporaires

#### 2️⃣ Token temporaire (checkout)
- Durée de vie : **5 minutes**
- Usage unique
- Généré à la demande depuis le token permanent
- Invalidé après utilisation

#### 🔄 Flux de validation

```
1. Client scanne la carte physique (code Luhn: AB 12 3)
   ↓
2. Backend récupère le token permanent associé
   ↓
3. Génération d'un token temporaire (expire dans 5min)
   ↓
4. Client utilise le token temporaire pour le checkout
   ↓
5. Token marqué comme "utilisé" après paiement
```

### 🍯 Honeypot & Canary Tokens

#### 🎣 Honeypot Accounts (Comptes appâts)

Des **faux comptes** qui déclenchent une alerte si quelqu'un essaie de se connecter :

```typescript
// Comptes honeypot configurés :
- admin@cafemarieanne.com
- root@cafemarieanne.com
- test@cafemarieanne.com
- demo@cafemarieanne.com
- support@cafemarieanne.com
```

**Fonctionnement :**
1. Un attaquant essaie de se connecter avec `admin@cafemarieanne.com`
2. Le système détecte que c'est un honeypot
3. 🚨 **ALERTE IMMÉDIATE** enregistrée dans `security_alerts`
4. Log complet dans le Grand Livre d'audit
5. L'attaquant reçoit un message d'erreur générique (pour ne pas révéler le piège)

#### 🕵️ Canary Tokens (Tokens sentinelles)

Des **tokens invisibles** injectés dans les pages sensibles qui alertent si accédés :

```typescript
// Canary token injecté dans le Dashboard
<CanaryTokenInjector location="dashboard" />

// Format du token : CANARY_a3F2c8d9e4f5g6h7i8j9k0l1m2n3o4p5
```

**Fonctionnement :**
1. Un token invisible est créé dans chaque page sensible
2. Si un scraper/bot essaie de lire le token → 🚨 **ALERTE**
3. Si quelqu'un modifie le DOM autour du token → 🚨 **ALERTE**
4. Le token est marqué comme "déclenché" dans la DB
5. Notification immédiate à l'admin

#### 🎣 Honeypot Endpoints (Faux endpoints API)

Des **faux endpoints** qui piègent les attaquants :

```
/api/admin/users       → 🚨 ALERTE
/api/admin/delete      → 🚨 ALERTE
/api/backup/download   → 🚨 ALERTE
/api/config/secrets    → 🚨 ALERTE
/wp-admin              → 🚨 ALERTE
/phpmyadmin            → 🚨 ALERTE
/.env                  → 🚨 ALERTE
```

#### 🔍 Détection de scraping

Détection automatique des comportements de bot :

```typescript
// Si plus de 10 requêtes en moins de 1 seconde
→ 🚨 ALERTE SCRAPING
→ Blocage temporaire
→ Log dans le Grand Livre
```

#### 📊 Centre de sécurité

Un **dashboard dédié** pour visualiser toutes les menaces :

```
🚨 Centre de Sécurité
├── Alertes totales
├── Canaries déclenchés
├── Canaries actifs
├── Liste des alertes (avec résolution)
└── Liste des canary tokens
```

### 🔐 Chiffrement de bout en bout (E2E)

#### 🎯 Architecture

Le système utilise une **architecture hybride** RSA + AES pour un chiffrement ultra-sécurisé :

```
┌─────────────────────────────────────────────────────────────┐
│                    EXPÉDITEUR                               │
│                                                             │
│  1. Génère une clé AES-256 éphémère                        │
│  2. Chiffre le message avec AES-256-GCM                    │
│  3. Chiffre la clé AES avec RSA-4096 (clé publique dest.) │
│  4. Signe le message avec ECDSA P-384                      │
│                          ↓                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Message chiffré + Clé chiffrée + IV + Signature   │   │
│  └─────────────────────────────────────────────────────┘   │
│                          ↓                                  │
│                    DESTINATAIRE                             │
│                                                             │
│  1. Vérifie la signature (authenticité)                    │
│  2. Déchiffre la clé AES avec RSA-4096 (clé privée)       │
│  3. Déchiffre le message avec AES-256-GCM                  │
│  4. Détruit la clé éphémère (Perfect Forward Secrecy)     │
└─────────────────────────────────────────────────────────────┘
```

#### 🔑 Gestion des clés

Chaque utilisateur possède :

1. **Paire de clés RSA-4096** :
   - **Clé publique** : Stockée en clair dans `user_encryption_keys`
   - **Clé privée** : Chiffrée avec le mot de passe de l'utilisateur (PBKDF2 100k itérations)

2. **Clés éphémères AES-256** :
   - Générées pour chaque message
   - Détruites après utilisation
   - Impossible de déchiffrer les anciens messages même avec accès à la DB

#### 🔐 Algorithmes utilisés

| Algorithme | Usage | Niveau de sécurité |
|------------|-------|-------------------|
| **RSA-4096** | Échange de clés | 🔴 Militaire |
| **AES-256-GCM** | Chiffrement messages | 🔴 Militaire |
| **ECDSA P-384** | Signature numérique | 🔴 Militaire |
| **PBKDF2 (100k)** | Dérivation mot de passe | 🔴 Militaire |
| **SHA-256/384** | Hachage | 🔴 Militaire |

#### 💡 Perfect Forward Secrecy (PFS)

Même si un attaquant obtient :
- ✅ Accès à la base de données
- ✅ Toutes les clés privées
- ✅ Tous les mots de passe

Il **NE POURRA PAS** déchiffrer les anciens messages car les clés éphémères sont détruites après chaque session.

### 📱 Biométrie d'appareil

#### 🔐 Empreinte unique par appareil

Chaque appareil génère une **empreinte unique** basée sur :
- Configuration matérielle (GPU, CPU, RAM)
- Résolution d'écran
- Timezone
- Plugins installés
- Canvas fingerprinting
- WebGL fingerprinting
- Audio fingerprinting

#### 🔄 Flux d'autorisation

```
1. Première connexion
   ↓
2. Appareil enregistré automatiquement
   ↓
3. Connexions suivantes : Vérification de l'empreinte
   ↓
4. Si empreinte inconnue → REFUS (sauf si mode "Ajouter appareil" activé)
```

#### 🔓 Mode "Ajouter un appareil"

Pour autoriser un nouvel appareil :

1. Depuis un appareil autorisé, va dans **"Gestion des appareils"**
2. Clique sur **"Ajouter un appareil"**
3. Le compte est déverrouillé pour **5 minutes**
4. Connecte-toi depuis le nouvel appareil
5. L'appareil est enregistré automatiquement
6. Le mode se désactive automatiquement

### 🔐 Validation Luhn (codes de carte)

Les codes de carte utilisent l'algorithme de Luhn pour détecter les erreurs de saisie :

```typescript
// Format : XX 00 0
// - XX : 2 lettres (dérivées du numéro de fiche)
// - 00 : 2 chiffres (numéro de fiche)
// - 0  : 1 chiffre de contrôle (Luhn)

// Exemple : AB 12 3
// - AB : Lettres générées
// - 12 : Numéro de fiche
// - 3  : Check digit Luhn
```

### 🔍 Row Level Security (RLS)

Toutes les tables Supabase ont des politiques RLS activées :

```sql
-- Exemple : Table products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_select_policy" ON products 
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "products_insert_policy" ON products 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
```

### 📝 Système d'audit complet

Chaque action est enregistrée dans le Grand Livre :

```typescript
await createAuditLog({
  action: 'CREATE_ORDER',
  resourceType: 'ORDER',
  resourceId: orderId,
  details: {
    total_amount: 25.50,
    payment_method: 'cash',
    points_earned: 25500
  }
});
```

### 🇨🇦 Conformité Loi 25 (Québec)

Le système respecte les exigences de la **Loi 25** sur la protection des renseignements personnels au Québec :

- ✅ **Minimisation des données** : Seules les données essentielles sont collectées
- ✅ **Chiffrement** : Toutes les données personnelles sont chiffrées avec AES-256-GCM
- ✅ **Traçabilité** : Grand Livre d'audit complet de toutes les actions
- ✅ **Accès contrôlé** : Authentification requise + mot de passe pour déchiffrer
- ✅ **Durée de conservation** : Tokens temporaires expirés automatiquement nettoyés
- ✅ **Sécurité** : Row Level Security (RLS) sur toutes les tables
- ✅ **Détection d'intrusion** : Honeypots et canary tokens
- ✅ **Chiffrement E2E** : Communications sécurisées de bout en bout

---

## 🚀 Installation

### 📋 Prérequis

- Node.js 18+ 
- npm ou yarn
- Compte Supabase

### 🔧 Installation locale

```bash
# 1. Cloner le repository
git clone https://github.com/votre-username/cafe-marie-anne.git
cd cafe-marie-anne

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
# Créer un fichier .env.local avec :
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_cle_anon

# 4. Lancer le serveur de développement
npm run dev
```

### 🗄️ Configuration Supabase

#### 1. Créer les tables

Exécutez les migrations SQL dans Supabase SQL Editor :

```sql
-- Voir le fichier : supabase/migrations/001_initial_schema.sql
-- + Tables de sécurité (canary_tokens, security_alerts, user_encryption_keys)
```

#### 2. Configurer l'Edge Function de chiffrement

```bash
# Déployer l'Edge Function
supabase functions deploy crypto-service

# Configurer la clé de chiffrement (256 bits)
supabase secrets set ENCRYPTION_KEY=votre_cle_256_bits
```

#### 3. Activer le Storage pour les images

```bash
# Créer le bucket "product-images"
# Configurer les politiques d'accès public
```

---

## 📱 Utilisation

### 🔐 Connexion

1. Accédez à l'application
2. Entrez vos identifiants Supabase
3. **Première connexion** : Votre appareil est enregistré automatiquement
4. **Connexions suivantes** : Vérification de l'empreinte d'appareil
5. Vous êtes redirigé vers le Dashboard

### 🛡️ Ajouter un nouvel appareil

1. Depuis un appareil autorisé, allez dans **"Gestion des appareils"**
2. Cliquez sur **"Ajouter un appareil"** 🔓
3. Le compte est déverrouillé pour **5 minutes**
4. Connectez-vous depuis le nouvel appareil
5. L'appareil est enregistré automatiquement
6. Le mode se désactive automatiquement

### 🚨 Surveiller la sécurité

1. Allez dans **"Sécurité 🚨"** depuis le Dashboard
2. Visualisez toutes les alertes de sécurité
3. Voyez les canary tokens déclenchés
4. Résolvez les alertes une par une
5. Surveillez les tentatives d'intrusion

### 🛒 Effectuer une vente

1. Cliquez sur **"Point de Vente"**
2. Ajoutez des produits au panier
3. Cliquez sur **"Finaliser la commande"**
4. Choisissez si le client a une carte récompense
5. Si oui, scannez/entrez le code de carte (format: `AB 12 3`)
6. Sélectionnez le mode de paiement (Comptant ou Carte)
7. Si comptant, utilisez le calculateur de monnaie
8. La commande est enregistrée et les points sont attribués

### 🎁 Créer une carte récompense

1. Allez dans **"Cartes Récompenses"**
2. Cliquez sur **"Nouvelle carte"**
3. Entrez le numéro de fiche (ex: 12345)
4. Entrez le prénom de l'élève
5. Un code de carte est généré automatiquement (ex: `AB 12 3`)
6. Un token permanent est créé en arrière-plan

### 🔓 Voir les données sensibles

1. Sur la page **"Cartes Récompenses"**
2. Cliquez sur **"Déverrouiller"** 🔒
3. Entrez votre mot de passe
4. Les données sont déchiffrées et affichées
5. Cliquez sur **"Verrouiller"** pour re-masquer

### 📊 Générer un rapport

1. Allez dans **"Rapports"**
2. Sélectionnez la période (date de début et fin)
3. Cochez les métriques à inclure
4. Cliquez sur **"Générer et imprimer le rapport"**
5. Un PDF s'ouvre dans une nouvelle fenêtre

---

## 🗄️ Structure de la base de données

### 📊 Schéma principal

```
customer_profiles (Fiches clients)
├── id (UUID)
├── customer_number (TEXT, chiffré)
├── first_name (TEXT, chiffré)
├── notes (TEXT, chiffré)
├── points_balance (INTEGER)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

reward_cards (Cartes récompenses)
├── id (UUID)
├── card_code (TEXT, unique, Luhn)
├── customer_profile_id (UUID → customer_profiles)
├── is_active (BOOLEAN)
└── created_at (TIMESTAMP)

card_tokens (Tokens de carte)
├── id (UUID)
├── reward_card_id (UUID → reward_cards)
├── token (TEXT, unique)
├── token_type (TEXT: 'permanent' | 'temporary')
├── expires_at (TIMESTAMP, nullable)
├── used_at (TIMESTAMP, nullable)
├── is_active (BOOLEAN)
└── created_at (TIMESTAMP)

orders (Commandes)
├── id (UUID)
├── order_number (INTEGER, auto-increment)
├── customer_profile_id (UUID → customer_profiles, nullable)
├── reward_card_id (UUID → reward_cards, nullable)
├── total_amount (NUMERIC)
├── payment_method (TEXT: 'cash' | 'card')
├── points_earned (INTEGER)
├── items (JSONB)
└── created_at (TIMESTAMP)

preparation_queue (File d'attente)
├── id (UUID)
├── order_id (UUID → orders)
├── queue_number (INTEGER)
├── preparation_type (TEXT: 'sandwich' | 'pizza')
├── estimated_time (INTEGER, secondes)
├── status (TEXT: 'pending' | 'ready' | 'delivered')
├── created_at (TIMESTAMP)
├── ready_at (TIMESTAMP, nullable)
└── delivered_at (TIMESTAMP, nullable)

products (Produits)
├── id (UUID)
├── category_id (UUID → categories)
├── name (TEXT)
├── description (TEXT)
├── price (NUMERIC)
├── image_url (TEXT)
├── position (INTEGER)
├── apply_taxes (BOOLEAN)
├── availability (JSONB)
├── requires_preparation (BOOLEAN)
├── preparation_type (TEXT: 'sandwich' | 'pizza')
└── created_at (TIMESTAMP)

categories (Catégories)
├── id (UUID)
├── name (TEXT)
├── position (INTEGER)
├── user_id (UUID → auth.users)
└── created_at (TIMESTAMP)

audit_logs (Grand Livre)
├── id (UUID)
├── user_id (UUID → auth.users)
├── user_email (TEXT)
├── action (TEXT)
├── resource_type (TEXT)
├── resource_id (TEXT)
├── details (JSONB)
├── ip_address (TEXT)
├── user_agent (TEXT)
└── created_at (TIMESTAMP)

device_fingerprints (Empreintes d'appareils) 🆕
├── id (UUID)
├── user_id (UUID → auth.users)
├── fingerprint (TEXT, unique)
├── device_name (TEXT)
├── browser_name (TEXT)
├── os_name (TEXT)
├── is_active (BOOLEAN)
├── last_used_at (TIMESTAMP)
└── created_at (TIMESTAMP)

canary_tokens (Tokens sentinelles) 🆕
├── id (UUID)
├── token (TEXT, unique)
├── location (TEXT)
├── is_triggered (BOOLEAN)
├── triggered_at (TIMESTAMP)
├── triggered_by_ip (TEXT)
├── triggered_by_user_agent (TEXT)
└── created_at (TIMESTAMP)

security_alerts (Alertes de sécurité) 🆕
├── id (UUID)
├── alert_type (TEXT)
├── details (JSONB)
├── severity (TEXT: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW')
├── is_resolved (BOOLEAN)
├── resolved_at (TIMESTAMP)
├── resolved_by (UUID → auth.users)
└── created_at (TIMESTAMP)

user_encryption_keys (Clés E2E) 🆕
├── id (UUID)
├── user_id (UUID → auth.users)
├── public_key (TEXT)
├── encrypted_private_key (TEXT)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

---

## 📊 Système d'audit

### 🎯 Objectif

Tracer **toutes** les actions effectuées dans le système pour :
- Conformité réglementaire (Loi 25 - Québec)
- Détection de fraude
- Débogage
- Analyse d'utilisation
- **Détection d'intrusion** 🆕

### 📝 Actions tracées

| Action | Description |
|--------|-------------|
| `LOGIN` | Connexion utilisateur (+ détection honeypot) |
| `LOGOUT` | Déconnexion utilisateur |
| `VIEW_DASHBOARD` | Accès au tableau de bord |
| `CREATE_PRODUCT` | Création d'un produit |
| `UPDATE_PRODUCT` | Modification d'un produit |
| `DELETE_PRODUCT` | Suppression d'un produit |
| `CREATE_ORDER` | Création d'une commande |
| `CREATE_REWARD_CARD` | Création d'une carte |
| `VALIDATE_TOKEN` | Validation d'un token (+ canary detection) |
| `ENCRYPT_DATA` | Chiffrement de données |
| `DECRYPT_DATA` | Déchiffrement de données |

### 🔍 Exemple de log (avec détection honeypot)

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "user_email": "admin@cafemarieanne.com",
  "action": "LOGIN",
  "resource_type": "USER",
  "resource_id": null,
  "details": {
    "honeypot_triggered": true,
    "attempted_email": "admin@cafemarieanne.com",
    "ip_address": "192.168.1.1",
    "user_agent": "Mozilla/5.0...",
    "severity": "CRITICAL",
    "threat_level": "HIGH"
  },
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0...",
  "created_at": "2024-01-15T14:30:00Z"
}
```

### 📊 Widget en temps réel

Un widget en bas à droite affiche les 3 dernières actions en temps réel :

```
┌─────────────────────────────────────┐
│ 🔵 Activité récente                 │
├─────────────────────────────────────┤
│ 👤 admin • CREATE ORDER • 2s        │
│ 👤 admin • VALIDATE TOKEN • 15s     │
│ 👤 admin • VIEW DASHBOARD • 1min    │
├─────────────────────────────────────┤
│ Cliquez pour voir le Grand Livre →  │
└─────────────────────────────────────┘
```

---

## 🎨 Interface utilisateur

### 🎨 Design System

- **Framework** : Tailwind CSS
- **Composants** : shadcn/ui
- **Thème** : Dégradés bleu/cyan/teal sur fond sombre
- **Animations** : Transitions fluides, effets de particules
- **Responsive** : Optimisé pour tablette et desktop
- **Sécurité visuelle** : Indicateurs de sécurité (🔒, 🚨, 🛡️)

### 🖼️ Captures d'écran

#### 🔐 Page de connexion
![Login](docs/screenshots/login.png)
- Détection automatique de honeypot
- Détection de scraping
- Biométrie d'appareil

#### 📊 Dashboard
![Dashboard](docs/screenshots/dashboard.png)
- Canary token invisible injecté
- Statistiques en temps réel
- Widget d'audit en bas à droite

#### 🛒 Point de vente
![POS](docs/screenshots/pos.png)

#### 🎁 Cartes récompenses
![Reward Cards](docs/screenshots/reward-cards.png)
- Données chiffrées par défaut
- Déverrouillage par mot de passe

#### 👨‍🍳 File d'attente
![Preparation Queue](docs/screenshots/preparation-queue.png)

#### 🚨 Centre de sécurité (NOUVEAU)
- Alertes de sécurité en temps réel
- Canary tokens actifs/déclenchés
- Résolution d'alertes
- Statistiques de menaces

---

## 🛠️ Technologies utilisées

### 🎨 Frontend

| Technologie | Version | Description |
|-------------|---------|-------------|
| React | 18.3.1 | Framework UI |
| TypeScript | 5.5.3 | Typage statique |
| Vite | 6.3.4 | Build tool |
| Tailwind CSS | 3.4.11 | Framework CSS |
| shadcn/ui | Latest | Composants UI |
| React Router | 6.26.2 | Routing |
| Lucide React | 0.462.0 | Icônes |
| Sonner | 1.5.0 | Notifications |
| @dnd-kit | 6.3.1 | Drag & drop |
| FingerprintJS | 5.0.1 | 🆕 Biométrie d'appareil |

### 🔧 Backend

| Technologie | Version | Description |
|-------------|---------|-------------|
| Supabase | 2.81.1 | Backend as a Service |
| PostgreSQL | 15 | Base de données |
| Edge Functions | Deno | Serverless functions |
| Supabase Auth | Latest | Authentification |
| Supabase Storage | Latest | Stockage fichiers |

### 🔐 Sécurité

| Technologie | Description | Niveau |
|-------------|-------------|--------|
| AES-256-GCM | Chiffrement symétrique | 🔴 Militaire |
| RSA-4096 | Chiffrement asymétrique | 🔴 Militaire |
| ECDSA P-384 | Signature numérique | 🔴 Militaire |
| PBKDF2 (100k) | Dérivation de clé | 🔴 Militaire |
| JWT | Authentification | 🟡 Standard |
| Row Level Security | Isolation des données | 🟢 Élevé |
| Luhn Algorithm | Validation codes | 🟢 Élevé |
| Device Fingerprinting | Biométrie d'appareil | 🔴 Militaire |
| Honeypot | Détection d'intrusion | 🔴 Militaire |
| Canary Tokens | Détection de scraping | 🔴 Militaire |

---

## 🛡️ Architecture de sécurité complète

```
┌─────────────────────────────────────────────────────────────┐
│                    COUCHE 1 : DÉTECTION                     │
│                                                             │
│  🍯 Honeypot Accounts                                       │
│  🕵️ Canary Tokens                                           │
│  🔍 Scraping Detection                                      │
│  📱 Device Fingerprinting                                   │
│                          ↓                                  │
├─────────────────────────────────────────────────────────────┤
│                    COUCHE 2 : AUTHENTIFICATION              │
│                                                             │
│  🔐 Supabase Auth (JWT)                                     │
│  🔑 Device Authorization                                    │
│  ⏱️ Temporary Unlock (5 min)                                │
│                          ↓                                  │
├─────────────────────────────────────────────────────────────┤
│                    COUCHE 3 : CHIFFREMENT                   │
│                                                             │
│  🔒 AES-256-GCM (Données personnelles)                      │
│  🔐 RSA-4096 (Échange de clés E2E)                          │
│  🔑 ECDSA P-384 (Signatures)                                │
│  ⚡ Perfect Forward Secrecy                                 │
│                          ↓                                  │
├─────────────────────────────────────────────────────────────┤
│                    COUCHE 4 : ISOLATION                     │
│                                                             │
│  🛡️ Row Level Security (RLS)                                │
│  🔒 Tokenization (Double niveau)                            │
│  ⏰ Token Expiration (5 min)                                │
│                          ↓                                  │
├─────────────────────────────────────────────────────────────┤
│                    COUCHE 5 : AUDIT                         │
│                                                             │
│  📝 Grand Livre (Toutes les actions)                        │
│  🚨 Security Alerts (Menaces détectées)                     │
│  📊 Real-time Monitoring                                    │
│  📧 Notifications (Email/SMS)                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚨 Scénarios de sécurité

### Scénario 1 : Attaque par force brute

```
1. Attaquant essaie 100 mots de passe
   ↓
2. Détection de scraping (>10 req/sec)
   ↓
3. 🚨 ALERTE SCRAPING
   ↓
4. Blocage temporaire
   ↓
5. Log dans le Grand Livre
```

### Scénario 2 : Tentative d'accès admin

```
1. Attaquant essaie admin@cafemarieanne.com
   ↓
2. Détection de honeypot
   ↓
3. 🚨 ALERTE HONEYPOT (CRITICAL)
   ↓
4. Message d'erreur générique (pour ne pas révéler)
   ↓
5. Log complet dans security_alerts
```

### Scénario 3 : Scraping de données

```
1. Bot essaie de lire le DOM
   ↓
2. Canary token détecté
   ↓
3. 🚨 ALERTE CANARY TOKEN
   ↓
4. Token marqué comme "déclenché"
   ↓
5. Notification immédiate à l'admin
```

### Scénario 4 : Vol de carte récompense

```
1. Carte perdue/volée
   ↓
2. Admin désactive la carte
   ↓
3. Tous les tokens temporaires révoqués
   ↓
4. Token permanent reste valide (pour réactivation)
   ↓
5. Log dans le Grand Livre
```

### Scénario 5 : Connexion depuis nouvel appareil

```
1. Utilisateur se connecte depuis nouveau PC
   ↓
2. Empreinte d'appareil inconnue
   ↓
3. Vérification du mode "Ajouter appareil"
   ↓
4. Si désactivé → REFUS + déconnexion
   ↓
5. Si activé → Dialogue d'autorisation
   ↓
6. Après autorisation → Appareil enregistré
```

---

## 📝 Licence

Ce projet est sous licence **MIT**.

```
MIT License

Copyright (c) 2024 Café Marie Anne

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🤝 Contribution

Les contributions sont les bienvenues ! Veuillez suivre ces étapes :

1. Fork le projet
2. Créez une branche (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

---

## 📞 Contact

**Félix Inglis-Chevarie** - Élève secondaire 4

---

## 🙏 Remerciements

- [Supabase](https://supabase.com/) pour le backend
- [shadcn/ui](https://ui.shadcn.com/) pour les composants
- [Tailwind CSS](https://tailwindcss.com/) pour le styling
- [Lucide](https://lucide.dev/) pour les icônes
- [Vercel](https://vercel.com/) pour l'hébergement
- [FingerprintJS](https://fingerprintjs.com/) pour la biométrie d'appareil

---

## 🔒 Note de sécurité

Ce système implémente des **mécanismes de sécurité de niveau militaire** :

- ✅ **Chiffrement AES-256-GCM** pour toutes les données personnelles
- ✅ **Chiffrement E2E RSA-4096** pour les communications
- ✅ **Perfect Forward Secrecy** avec clés éphémères
- ✅ **Honeypots** pour détecter les tentatives d'intrusion
- ✅ **Canary tokens** pour détecter le scraping
- ✅ **Biométrie d'appareil** pour l'authentification
- ✅ **Audit trail complet** de toutes les actions
- ✅ **Row Level Security** sur toutes les tables
- ✅ **Tokenisation double niveau** pour les cartes

**⚠️ AVERTISSEMENT** : Ce système est conçu pour un environnement de production. Toute tentative d'intrusion sera **détectée, enregistrée et signalée**.

---

<div align="center">

**Fait avec ❤️ et 🔒 pour Café Marie Anne**

**Sécurité : Niveau Militaire 🛡️**

[⬆ Retour en haut](#-café-marie-anne---système-de-gestion)

</div>