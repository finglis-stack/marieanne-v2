# ☕ Café Marie Anne - Système de Gestion

<div align="center">

**Système de point de vente moderne avec gestion de cartes récompenses, file d'attente de préparation et sécurité avancée**

[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-2.81.1-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.11-06B6D4?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Security](https://img.shields.io/badge/Security-Advanced-red?style=for-the-badge&logo=shield)](https://github.com/)

[🚀 Voir le logiciel](https://www.cafemarieanne.ca/) • [📖 Documentation](#table-des-matières) • [🐛 Signaler un bug](#)

</div>

---

## 📋 Table des matières

- [🎯 À propos du projet](#-à-propos-du-projet)
- [📸 Aperçu](#-aperçu)
- [✨ Fonctionnalités principales](#-fonctionnalités-principales)
- [🏗️ Architecture technique](#️-architecture-technique)
- [🔒 Sécurité](#-sécurité)
  - [🛡️ Chiffrement AES-256-GCM](#️-chiffrement-aes-256-gcm)
  - [🎫 Système de tokenisation](#-système-de-tokenisation)
  - [🍯 Honeypot & Canary Tokens](#-honeypot--canary-tokens)
  - [🔗 Audit Blockchain](#-audit-blockchain)
- [🚀 Installation](#-installation)
- [📱 Utilisation](#-utilisation)
- [🗄️ Structure de la base de données](#️-structure-de-la-base-de-données)
- [📊 Système d'audit](#-système-daudit)
- [🎨 Interface utilisateur](#-interface-utilisateur)
- [🛠️ Technologies utilisées](#️-technologies-utilisées)
- [📝 Licence](#-licence)

---

## 🎯 À propos du projet

**Café Marie Anne** est un système de gestion complet conçu pour un café scolaire. Il combine un point de vente (POS), un système de cartes récompenses avec chiffrement AES-256-GCM, une file d'attente de préparation en temps réel, un système d'audit complet, et des **mécanismes de sécurité avancés** incluant honeypots, canary tokens et chiffrement de bout en bout.

### 🎓 Contexte

Ce système a été développé pour gérer efficacement les opérations d'un café dans un environnement scolaire, avec un accent particulier sur :
- La **protection des données personnelles** des élèves (Loi 25 - Québec)
- La **rapidité des transactions** pendant les heures de pointe
- La **traçabilité complète** de toutes les opérations
- La **solidarité** via le module de Café Suspendu
- La **détection d'intrusion** automatique avec honeypots

---

## 📸 Aperçu

<div align="center">
  <img src="docs/screenshots/dashboard.png" alt="Tableau de bord" width="800" />
  <p><em>Tableau de bord en temps réel avec statistiques et accès rapide</em></p>
  
  <br />
  
  <img src="docs/screenshots/reward-cards.png" alt="Gestion des cartes" width="800" />
  <p><em>Gestion sécurisée des cartes récompenses et profils clients</em></p>
</div>

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

### ❤️ Café Suspendu (Nouveau)

- ✅ **Mur de la Bonté** : Visualisation des dons disponibles
- ✅ **Achat de dons** : Ajout facile d'items au mur (avec ou sans carte récompense)
- ✅ **Réclamation intelligente** : 
  - Items simples : Don immédiat
  - Items préparés (Sandwich/Pizza) : Intégration automatique à la file d'attente de cuisine
- ✅ **Messages personnalisés** : Les donateurs peuvent laisser un mot d'encouragement

### 🎁 Cartes Récompenses

- ✅ Création de fiches clients avec chiffrement AES-256-GCM
- ✅ Génération de codes de carte avec validation Luhn (format: `XX 00 0`)
- ✅ Système de tokenisation à deux niveaux :
  - **Token permanent** (stocké sur la carte physique)
  - **Token temporaire** (5 minutes, usage unique)
- ✅ Déverrouillage par mot de passe pour voir les données sensibles
- ✅ Gestion des points de fidélité

### 👨‍🍳 File d'attente de préparation

- ✅ Système de numéros de commande
- ✅ Gestion de deux types de préparation :
  - **Sandwichs** : 4min 30s, max 4 simultanés
  - **Pizzas** : 13min, max 4 simultanés
- ✅ Calcul automatique du temps d'attente
- ✅ Affichage en temps réel sur écran dédié
- ✅ Statuts : En attente → En préparation → Prêt → Livré

### 🔍 Grand Livre d'audit (Blockchain)

- ✅ **Chaînage cryptographique** : Chaque log contient le hash du précédent
- ✅ **Vérification d'intégrité** : Détection automatique de toute altération des logs
- ✅ Traçabilité complète de toutes les actions
- ✅ Logs horodatés avec utilisateur, action, ressource
- ✅ Export CSV

### 🛡️ Sécurité avancée

- ✅ **Honeypot accounts** : Faux comptes qui alertent si connexion
- ✅ **Canary tokens** : Tokens invisibles qui détectent les scrapers
- ✅ **Détection de scraping** : Blocage automatique des bots
- ✅ **Chiffrement E2E** : RSA-4096 + AES-256-GCM pour messages
- ✅ **Biométrie d'appareil** : Empreinte unique par appareil
- ✅ **Centre de sécurité** : Dashboard dédié aux menaces

---

## 🗄️ Structure de la base de données

### 📊 Schéma principal

```
customer_profiles (Fiches clients)
├── id (UUID)
├── customer_number (TEXT, chiffré)
├── first_name (TEXT, chiffré)
├── points_balance (INTEGER)
└── ...

suspended_items (Café Suspendu) 🆕
├── id (UUID)
├── product_id (UUID)
├── donor_name (TEXT)
├── message (TEXT)
├── status ('available' | 'claimed')
└── ...

audit_logs (Grand Livre Blockchain) 🆕
├── id (UUID)
├── action (TEXT)
├── details (JSONB)
├── hash (TEXT) 🆕
├── previous_hash (TEXT) 🆕
└── ...

// ... (autres tables: orders, products, reward_cards, etc.)
```

---

## 📝 Licence

Ce projet est sous licence **MIT**.

---

<div align="center">

**Fait avec ❤️ et 🔒 pour Café Marie Anne**

**Sécurité : Avancée 🛡️**

</div>