# Chapitre 1 : Introduction et Vision d'Ensemble

Ce document constitue le premier chapitre de la documentation technique et fonctionnelle exhaustive du Système de Gestion pour le Café Marie Anne. Il a pour vocation de poser les fondations conceptuelles du projet, d'en définir la mission, les objectifs et les principes directeurs qui ont guidé chaque décision architecturale et de développement.

---

## 1.1. Mission et Objectifs du Logiciel

La conception et le développement de ce logiciel ne sont pas le fruit du hasard, mais la réponse ciblée à un ensemble de besoins complexes. Cette section dissèque la raison d'être du projet, en partant de son énoncé de mission pour ensuite le décomposer en objectifs stratégiques et opérationnels concrets.

### 1.1.1. Énoncé de la Mission Principale

> **Fournir une plateforme technologique robuste, sécurisée et efficiente pour la gestion intégrale des opérations du Café Marie Anne, en garantissant la protection des données personnelles des élèves conformément à la Loi 25, tout en optimisant l'expérience client et en fournissant des outils d'aide à la décision pour la gestion.**

Cet énoncé n'est pas une simple phrase d'intention ; il est le contrat moral et technique qui lie le logiciel à ses utilisateurs et administrateurs. Chaque mot a été pesé pour refléter une exigence fondamentale du système.

### 1.1.2. Analyse Sémantique de la Mission

Pour saisir la pleine mesure de nos ambitions, il est impératif de décomposer l'énoncé de mission en ses termes clés.

#### 1.1.2.1. "Plateforme Technologique" : Un Écosystème Intégré

Le terme "plateforme" est utilisé délibérément pour signifier que ce logiciel est bien plus qu'une simple application. Il s'agit d'un **écosystème intégré** où chaque module, bien que spécialisé, communique et interagit de manière synergique avec les autres.

-   **Interconnexion des Modules :** Le Point de Vente (POS) dialogue en temps réel avec la Gestion d'Inventaire. Une vente met à jour les stocks (fonctionnalité future) et alimente le module de Rapports. La validation d'une carte récompense interroge le module de gestion des clients et met à jour le solde de points.
-   **Source de Données Unique :** Tous les modules s'appuient sur une base de données centralisée (Supabase PostgreSQL), garantissant la cohérence, l'intégrité et l'unicité de l'information. Il n'y a pas de silos de données.
-   **Expérience Unifiée :** L'interface utilisateur, bien que servant des fonctions diverses, maintient une cohérence ergonomique et visuelle, réduisant la courbe d'apprentissage pour le personnel.
-   **Extensibilité :** L'architecture modulaire permet l'ajout futur de nouvelles fonctionnalités (ex: gestion des stocks avancée, commandes en ligne) sans nécessiter une refonte complète du système existant.

#### 1.1.2.2. "Robuste" : Fiabilité et Tolérance aux Pannes

Dans le contexte d'un café scolaire, la robustesse n'est pas une option, c'est une nécessité absolue. Une panne de système durant la pause du midi de 15 minutes est inacceptable.

-   **Haute Disponibilité :** Le choix de Supabase comme Backend-as-a-Service (BaaS) délègue la gestion de l'infrastructure à un fournisseur spécialisé, garantissant un taux de disponibilité élevé, une scalabilité automatique et des sauvegardes gérées.
-   **Gestion des Erreurs :** L'application cliente est conçue pour gérer les erreurs de manière gracieuse. Les échecs de communication réseau sont interceptés et des messages clairs sont présentés à l'utilisateur, avec des mécanismes de nouvelle tentative lorsque cela est pertinent.
-   **Intégrité des Données :** L'utilisation de transactions de base de données pour les opérations critiques (comme la création d'une commande) assure que les opérations sont atomiques : soit elles réussissent complètement, soit elles échouent sans laisser de données corrompues.
-   **Performance sous Charge :** L'architecture est pensée pour supporter les pics d'activité. Les requêtes sont optimisées, et la structure de l'interface utilisateur permet une réactivité maximale même lorsque de multiples opérations sont en cours.

#### 1.1.2.3. "Sécurisée" : La Sécurité comme Fondement

La sécurité n'est pas une couche ajoutée, mais le **fondement même de l'architecture**. Étant donné que le système traite les données d'élèves, dont plusieurs sont mineurs, une approche de "sécurité de niveau militaire" a été adoptée.

-   **Conformité à la Loi 25 :** Le système est conçu pour répondre et dépasser les exigences de la Loi 25 du Québec sur la protection des renseignements personnels.
-   **Chiffrement Multicouche :**
    -   **Chiffrement au Repos :** Toutes les données personnelles identifiables (nom, numéro de fiche, etc.) sont chiffrées dans la base de données avec l'algorithme **AES-256-GCM** via une Edge Function dédiée.
    -   **Chiffrement en Transit :** Toutes les communications entre le client et Supabase sont sécurisées par TLS (HTTPS).
    -   **Chiffrement de Bout en Bout (E2E) :** Une couche supplémentaire utilisant **RSA-4096** et des clés éphémères **AES-256** est implémentée pour les futures communications ultra-sensibles, garantissant le principe de *Perfect Forward Secrecy*.
-   **Contrôle d'Accès Rigoureux :**
    -   **Biométrie d'Appareil :** Seuls les appareils explicitement autorisés peuvent se connecter.
    -   **Row Level Security (RLS) :** Des politiques strictes au niveau de la base de données garantissent que les utilisateurs ne peuvent accéder qu'aux données auxquelles ils ont droit.
-   **Défense Proactive :**
    -   **Honeypots & Canary Tokens :** Des pièges sont disséminés dans le système pour détecter et alerter immédiatement en cas de tentative d'intrusion ou de scraping.
-   **Traçabilité Totale :** Chaque action est enregistrée dans un Grand Livre d'audit immuable.

#### 1.1.2.4. "Efficiente" : Optimisation des Flux Opérationnels

L'efficience se mesure par la capacité du système à réduire la friction, le temps et les erreurs dans les opérations quotidiennes.

-   **Rapidité d'Exécution :** L'interface du Point de Vente est optimisée pour un nombre minimal de clics. La recherche de produits est instantanée, et l'ajout au panier est immédiat.
-   **Intuitivité :** La disposition des éléments, le code couleur et les icônes sont choisis pour guider l'utilisateur naturellement, réduisant le besoin de formation approfondie.
-   **Automatisation :** Le calcul des taxes, la mise à jour des points de fidélité, et l'ajout à la file d'attente de préparation sont des processus entièrement automatisés, éliminant les risques d'erreur humaine.
-   **Visibilité en Temps Réel :** Le tableau de bord et l'écran de la file d'attente fournissent une vue instantanée de l'état des opérations, permettant des ajustements rapides.

### 1.1.3. Objectifs Stratégiques et Opérationnels

La mission se traduit par quatre axes d'objectifs mesurables.

#### 1.1.3.1. Axe 1 : Optimisation de l'Efficacité Opérationnelle

-   **Objectif 1.1 :** Réduire le temps moyen de transaction de 30% par rapport à un système manuel.
-   **Objectif 1.2 :** Éliminer à 99.9% les erreurs de calcul de prix et de taxes.
-   **Objectif 1.3 :** Centraliser la gestion de l'inventaire pour permettre une mise à jour des produits en moins de 60 secondes.
-   **Objectif 1.4 :** Fournir un système de file d'attente visuel pour optimiser le flux de préparation et réduire le temps d'attente perçu par les clients.

#### 1.1.3.2. Axe 2 : Amélioration de l'Expérience Client

-   **Objectif 2.1 :** Mettre en place un programme de fidélité gamifié et facile à utiliser pour encourager la rétention des clients.
-   **Objectif 2.2 :** Garantir une expérience de paiement rapide et sans friction.
-   **Objectif 2.3 :** Augmenter la satisfaction client en fournissant une visibilité claire sur l'état de leur commande via l'écran de préparation.

#### 1.1.3.3. Axe 3 : Renforcement de la Sécurité et de la Conformité

-   **Objectif 3.1 :** Atteindre et maintenir une conformité totale avec les dispositions de la Loi 25 du Québec.
-   **Objectif 3.2 :** Garantir qu'aucune donnée personnelle identifiable ne soit stockée en clair dans la base de données.
-   **Objectif 3.3 :** Mettre en place un système de détection d'intrusion capable de générer une alerte en moins de 5 secondes suite à une activité suspecte (ex: tentative de connexion à un honeypot).
-   **Objectif 3.4 :** Assurer une traçabilité complète de toutes les actions ayant un impact sur les données ou les finances, via un Grand Livre d'audit non modifiable.

#### 1.1.3.4. Axe 4 : Fourniture d'Outils d'Aide à la Décision

-   **Objectif 4.1 :** Fournir un tableau de bord en temps réel affichant les indicateurs de performance clés (KPIs) de la journée.
-   **Objectif 4.2 :** Permettre la génération de rapports de ventes PDF personnalisables par période et par métrique.
-   **Objectif 4.3 :** Permettre l'export de données de transaction brutes au format CSV pour des analyses approfondies.
-   **Objectif 4.4 :** Identifier les produits les plus populaires pour optimiser les offres et la gestion des stocks.