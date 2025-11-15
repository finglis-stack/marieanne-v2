# Documentation Complète du Système de Gestion du Café Marie Anne

**Version 1.0**
**Date de publication :** 15 juillet 2024

---

## Table des Matières Générale

Cette documentation est structurée en plusieurs parties distinctes, chacune abordant un aspect fondamental du logiciel. Chaque partie est contenue dans un fichier Markdown séparé pour en faciliter la consultation, la maintenance et la conversion.

### Partie 1 : Introduction et Vision d'Ensemble
*Fichier : `01-Introduction.md`*

Ce chapitre pose les fondations conceptuelles du projet. Il détaille la raison d'être du logiciel, ses objectifs stratégiques, le contexte opérationnel spécifique au milieu scolaire, ainsi que les principes philosophiques qui ont guidé sa conception.

1.  **Introduction et Vision d'Ensemble**
    1.1. **Mission et Objectifs du Logiciel**
        1.1.1. Énoncé de la Mission Principale
        1.1.2. Analyse Sémantique de la Mission
        1.1.3. Objectifs Stratégiques et Opérationnels
    1.2. **Contexte d'Application : Le Café Scolaire**
        1.2.1. Analyse de l'Environnement Opérationnel
        1.2.2. Contraintes Spécifiques et Implications Techniques
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

Ce chapitre dissèque la structure technique du logiciel. Il présente une vue d'ensemble de l'architecture, détaille la pile technologique, explique l'organisation du code source et illustre les flux de données critiques qui animent le système.

2.  **Architecture Technologique**
    2.1. **Vue d'Ensemble de l'Architecture**
        2.1.1. Schéma d'Architecture Logique à Trois Niveaux
        2.1.2. Description des Composants Majeurs
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

*(Les chapitres suivants seront détaillés et ajoutés progressivement)*

### Partie 3 : Guide Fonctionnel Détaillé
*Fichier : `03-Guide-Fonctionnel.md`*

### Partie 4 : Architecture de Sécurité
*Fichier : `04-Architecture-Securite.md`*

### Partie 5 : Système d'Audit et de Traçabilité
*Fichier : `05-Systeme-Audit.md`*

### Partie 6 : Guide de Déploiement et d'Opérations
*Fichier : `06-Guide-Deploiement.md`*

### Partie 7 : Guide d'Utilisation par Module
*Fichier : `07-Guide-Utilisation.md`*