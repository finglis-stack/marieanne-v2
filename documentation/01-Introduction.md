# Partie 1 : Introduction et Vision d'Ensemble

Ce document constitue le point de départ de la documentation technique et fonctionnelle du système de gestion pour le Café Marie Anne. Il a pour vocation de présenter la mission, les objectifs, le contexte d'application et les principes directeurs qui ont guidé la conception et le développement de la solution.

---

## 1.1. Mission et Objectifs du Logiciel

### Mission Principale

La mission fondamentale du système de gestion du Café Marie Anne est de fournir une plateforme technologique robuste, sécurisée et efficiente pour l'ensemble des opérations commerciales du café. Le logiciel vise à moderniser et à optimiser la gestion quotidienne, en passant d'un modèle opérationnel potentiellement manuel à un écosystème numérique intégré.

L'objectif est de transformer l'expérience transactionnelle tant pour le personnel que pour la clientèle étudiante, en mettant l'accent sur la rapidité, la fiabilité et la sécurité des données.

### Objectifs Stratégiques

Les objectifs stratégiques qui découlent de cette mission sont les suivants :

1.  **Optimisation de l'Efficacité Opérationnelle :**
    *   Réduire de manière significative le temps de traitement de chaque transaction au point de vente.
    *   Automatiser le calcul des ventes, des taxes et des totaux journaliers pour éliminer les erreurs manuelles.
    *   Centraliser la gestion de l'inventaire, des produits et des catégories pour une mise à jour simplifiée.

2.  **Amélioration de l'Expérience Client :**
    *   Instaurer un programme de fidélité moderne et engageant via un système de cartes récompenses.
    *   Offrir une visibilité en temps réel sur l'état de préparation des commandes nécessitant une attente.
    *   Assurer une expérience de paiement fluide et rapide, adaptée au contexte d'un milieu scolaire où le temps est limité.

3.  **Renforcement de la Sécurité et de la Conformité :**
    *   Garantir la protection absolue des renseignements personnels collectés, en conformité avec les cadres réglementaires québécois (notamment la Loi 25).
    *   Mettre en place une architecture de sécurité multi-niveaux pour prévenir les accès non autorisés et protéger l'intégrité du système.
    *   Assurer une traçabilité complète de toutes les opérations via un système d'audit immuable.

4.  **Fourniture d'Outils d'Aide à la Décision :**
    *   Permettre la génération de rapports de ventes et d'activités pour analyser les performances.
    *   Identifier les produits les plus populaires et les tendances de consommation.
    *   Fournir des données fiables pour la gestion des stocks et la planification financière.

---

## 1.2. Contexte d'Application : Le Café Scolaire

Le logiciel est spécifiquement conçu pour opérer dans le contexte d'un café en milieu scolaire. Cet environnement présente des défis et des contraintes uniques qui ont directement influencé l'architecture de la solution :

*   **Volume de Transactions Élevé sur de Courtes Périodes :** Les pauses et l'heure du dîner génèrent des pics d'achalandage intenses. Le système doit être capable de traiter un grand nombre de transactions rapidement et sans latence.

*   **Clientèle Répétitive :** La base de clients est majoritairement composée d'élèves et de membres du personnel qui fréquentent l'établissement quotidiennement. Cela justifie pleinement l'implantation d'un programme de fidélité.

*   **Sécurité des Données Accrue :** La collecte de toute information, même minimale, concernant des élèves (mineurs pour la plupart) impose des exigences de sécurité et de confidentialité extrêmement élevées.

*   **Besoin de Simplicité :** L'interface utilisateur doit être intuitive pour permettre une prise en main rapide par le personnel (potentiellement des élèves bénévoles) avec une formation minimale.

*   **Gestion de Produits avec Préparation :** Le café offre des produits nécessitant un temps de préparation (sandwichs, pizzas), ce qui requiert un système de file d'attente visible pour gérer les attentes des clients.

---

## 1.3. Public Cible de la Documentation

Cette documentation est destinée à plusieurs profils d'intervenants :

*   **Développeurs et Mainteneurs :** Pour comprendre l'architecture, les choix technologiques, les conventions de code et la logique métier afin d'assurer la maintenance évolutive et corrective du système.

*   **Administrateurs Système :** Pour comprendre comment déployer, configurer et superviser l'application, notamment la gestion de la base de données Supabase, les Edge Functions et les variables d'environnement.

*   **Responsables de la Sécurité :** Pour auditer les mécanismes de protection des données, comprendre les flux de chiffrement, et analyser les journaux d'audit et les alertes de sécurité.

*   **Gestionnaires du Café :** Pour obtenir une vue d'ensemble des fonctionnalités, comprendre le potentiel analytique de l'outil et participer à la définition des futures évolutions.

---

## 1.4. Philosophie Générale de la Solution

La conception du logiciel repose sur quatre piliers fondamentaux :

1.  **La Sécurité par Conception ("Security by Design") :** La sécurité n'est pas une fonctionnalité ajoutée, mais le fondement de l'architecture. Chaque fonctionnalité a été pensée en amont avec la protection des données comme priorité absolue. Cela se traduit par le chiffrement systématique, la validation des accès à plusieurs niveaux et la traçabilité de chaque action.

2.  **La Performance et la Fiabilité :** L'interface doit être réactive en toutes circonstances. Les choix technologiques (React, Vite, Supabase) ont été faits pour garantir une expérience utilisateur fluide, même lors des pics d'achalandage.

3.  **La Simplicité d'Utilisation :** Malgré la complexité de ses mécanismes internes, le logiciel doit présenter une interface épurée, intuitive et facile à maîtriser. L'objectif est de réduire la charge cognitive pour l'opérateur et de minimiser le risque d'erreur.

4.  **La Modularité et l'Évolutivité :** L'architecture est conçue pour être modulaire, permettant d'ajouter de nouvelles fonctionnalités ou de modifier des modules existants avec un impact minimal sur le reste du système. Cela garantit la pérennité de la solution face aux besoins futurs du Café Marie Anne.