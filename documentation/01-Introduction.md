# Partie 1 : Introduction et Vision d'Ensemble

**Version 1.0**
**Date de publication :** 15 juillet 2024

---

## Table des Matières de la Partie 1

1.  **Introduction et Vision d'Ensemble**
    1.1. **Mission et Objectifs du Logiciel**
        1.1.1. Énoncé de la Mission Principale
        1.1.2. Analyse Sémantique de la Mission
            1.1.2.1. "Plateforme Technologique"
            1.1.2.2. "Robuste"
            1.1.2.3. "Sécurisée"
            1.1.2.4. "Efficiente"
        1.1.3. Objectifs Stratégiques et Opérationnels
            1.1.3.1. Axe 1 : Optimisation de l'Efficacité Opérationnelle
            1.1.3.2. Axe 2 : Amélioration de l'Expérience Client
            1.1.3.3. Axe 3 : Renforcement de la Sécurité et de la Conformité
            1.1.3.4. Axe 4 : Fourniture d'Outils d'Aide à la Décision
    1.2. **Contexte d'Application : Le Café Scolaire**
        1.2.1. Analyse de l'Environnement Opérationnel
        1.2.2. Contraintes Spécifiques et Implications Techniques
            1.2.2.1. Gestion des Pics d'Achalandage
            1.2.2.2. Nature de la Clientèle
            1.2.2.3. Exigences Réglementaires et Éthiques
            1.2.2.4. Rotation du Personnel et Simplicité d'Utilisation
            1.2.2.5. Diversité de l'Offre de Produits
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

## 1.1. Mission et Objectifs du Logiciel

### 1.1.1. Énoncé de la Mission Principale

La mission fondamentale du système de gestion du Café Marie Anne est de fournir une **plateforme technologique robuste, sécurisée et efficiente** pour l'ensemble des opérations commerciales du café. Le logiciel vise à moderniser et à optimiser la gestion quotidienne, en orchestrant la transition d'un modèle opérationnel potentiellement manuel et fragmenté vers un écosystème numérique intégré et cohérent.

L'objectif final est de transformer l'expérience transactionnelle, tant pour le personnel opérateur que pour la clientèle étudiante, en établissant de nouveaux standards de **rapidité**, de **fiabilité transactionnelle** et de **sécurité des données**.

### 1.1.2. Analyse Sémantique de la Mission

Chaque terme de l'énoncé de mission a été délibérément choisi pour refléter un aspect fondamental de l'architecture et des fonctionnalités du logiciel.

#### 1.1.2.1. "Plateforme Technologique"

Ce terme implique que la solution est plus qu'un simple logiciel de caisse. Il s'agit d'une fondation sur laquelle reposent de multiples modules interconnectés :
*   **Un système de point de vente (POS)** pour la gestion des transactions.
*   **Un système de gestion de la relation client (CRM)** simplifié, axé sur la fidélisation.
*   **Un système de gestion d'inventaire (IMS)** pour les produits et catégories.
*   **Un système de gestion de file d'attente (QMS)** pour les commandes en préparation.
*   **Un module de reporting et d'analyse (BI)** pour l'aide à la décision.
*   **Un module d'audit et de sécurité** pour la traçabilité et la protection.

#### 1.1.2.2. "Robuste"

La robustesse se manifeste par la capacité du système à fonctionner de manière fiable et prévisible, même dans des conditions difficiles.
*   **Tolérance aux Pannes :** L'architecture basée sur les services de Supabase offre une haute disponibilité intrinsèque. Une défaillance d'un service n'entraîne pas une défaillance complète du système.
*   **Gestion des Erreurs :** Le code est conçu pour gérer les erreurs de manière gracieuse, en fournissant des retours clairs à l'utilisateur et en enregistrant les anomalies pour analyse, sans jamais compromettre l'intégrité des données.
*   **Validation des Données :** Des validations strictes sont appliquées à chaque niveau (frontend, API, base de données) pour garantir que seules des données cohérentes et valides sont traitées et stockées.

#### 1.1.2.3. "Sécurisée"

La sécurité est le pilier central de la conception. Ce principe est détaillé en profondeur dans la Partie 4 de cette documentation, mais il inclut :
*   **Confidentialité :** Protection des données personnelles par des mécanismes de chiffrement forts.
*   **Intégrité :** Assurance que les données ne peuvent être modifiées de manière non autorisée, notamment grâce à des signatures numériques et des politiques de base de données strictes.
*   **Disponibilité :** Le système doit rester accessible aux utilisateurs autorisés.
*   **Traçabilité :** Chaque action significative est enregistrée dans un journal d'audit immuable.

#### 1.1.2.4. "Efficiente"

L'efficience concerne l'optimisation des ressources, qu'il s'agisse du temps de l'opérateur, des ressources informatiques ou de la fluidité du parcours client.
*   **Performance de l'Interface :** L'interface utilisateur est conçue pour être extrêmement réactive, avec des temps de chargement minimaux.
*   **Optimisation des Requêtes :** Les interactions avec la base de données sont optimisées pour minimiser la latence.
*   **Ergonomie :** Le nombre de clics et d'actions nécessaires pour accomplir les tâches courantes est réduit au minimum.

### 1.1.3. Objectifs Stratégiques et Opérationnels

#### 1.1.3.1. Axe 1 : Optimisation de l'Efficacité Opérationnelle

*   **Objectif 1.A : Réduction du temps de transaction.**
    *   **Problématique :** Les systèmes manuels ou lents créent des files d'attente, particulièrement critiques pendant les courtes pauses scolaires.
    *   **Solution :** Interface tactile intuitive, recherche de produits rapide, processus de paiement en un minimum d'étapes.
    *   **Métrique :** Temps moyen par transaction (objectif < 30 secondes pour une transaction simple).

*   **Objectif 1.B : Automatisation des calculs.**
    *   **Problématique :** Le calcul manuel des taxes, des totaux et de la monnaie à rendre est une source d'erreurs financières et de perte de temps.
    *   **Solution :** Calcul automatique et instantané des taxes (TPS/TVQ au taux de 14.975%), des sous-totaux et du total. Module d'aide au paiement comptant.
    *   **Métrique :** Taux d'erreur de caisse (objectif = 0%).

*   **Objectif 1.C : Centralisation de la gestion.**
    *   **Problématique :** La gestion dispersée des produits et des prix rend les mises à jour complexes et sujettes à incohérence.
    *   **Solution :** Un module d'inventaire centralisé permet de gérer les catégories et les produits (prix, taxes, disponibilité) depuis une seule interface.
    *   **Métrique :** Temps nécessaire pour mettre à jour le menu complet.

#### 1.1.3.2. Axe 2 : Amélioration de l'Expérience Client

*   **Objectif 2.A : Implémentation d'un programme de fidélité.**
    *   **Problématique :** Absence de mécanisme pour récompenser la clientèle régulière et encourager la rétention.
    *   **Solution :** Système de cartes récompenses basé sur un cumul de points, avec un processus de validation rapide et sécurisé au point de vente.
    *   **Métrique :** Taux d'adoption du programme de fidélité.

*   **Objectif 2.B : Gestion transparente de l'attente.**
    *   **Problématique :** L'attente pour les produits préparés (sandwichs, pizzas) peut être une source de frustration si elle n'est pas gérée.
    *   **Solution :** Un système de file d'attente avec numéro de commande et estimation du temps de préparation, affiché sur un écran dédié.
    *   **Métrique :** Satisfaction client relative au temps d'attente.

#### 1.1.3.3. Axe 3 : Renforcement de la Sécurité et de la Conformité

*   **Objectif 3.A : Conformité avec la Loi 25.**
    *   **Problématique :** La Loi 25 du Québec impose des obligations strictes sur la collecte, l'utilisation et la protection des renseignements personnels.
    *   **Solution :** Chiffrement de bout en bout des données client, minimisation des données collectées (prénom et numéro de fiche uniquement), et journal d'audit pour la traçabilité des accès.
    *   **Métrique :** Conformité validée par audit interne/externe.

*   **Objectif 3.B : Prévention des accès non autorisés.**
    *   **Problématique :** Le système doit être protégé contre les accès internes et externes malveillants.
    *   **Solution :** Authentification forte, politiques de sécurité au niveau de la base de données (Row Level Security), et système de biométrie d'appareil pour restreindre l'accès aux seuls appareils autorisés.
    *   **Métrique :** Nombre d'incidents de sécurité (objectif = 0).

#### 1.1.3.4. Axe 4 : Fourniture d'Outils d'Aide à la Décision

*   **Objectif 4.A : Analyse des performances de vente.**
    *   **Problématique :** Absence de vision claire sur les performances financières et opérationnelles.
    *   **Solution :** Un tableau de bord affichant les indicateurs clés en temps réel et un module de rapports permettant de générer des analyses sur des périodes définies.
    *   **Métrique :** Capacité à générer un rapport de ventes mensuel en moins de 5 minutes.

---

## 1.2. Contexte d'Application : Le Café Scolaire

### 1.2.1. Analyse de l'Environnement Opérationnel

Le logiciel est déployé dans un environnement qui n'est pas un commerce de détail traditionnel. Les spécificités du milieu scolaire sont au cœur de sa conception.

*   **Flux de Clientèle :** Le flux n'est pas constant mais concentré en vagues massives correspondant aux pauses (matin, midi, après-midi). La performance du système durant ces pics est non négociable.
*   **Type de Transaction :** Les transactions sont généralement de faible montant, avec un petit nombre d'articles par panier. La rapidité est plus importante que la complexité des fonctionnalités de vente.
*   **Environnement Matériel :** Le système est prévu pour fonctionner sur du matériel standard (tablette ou ordinateur portable), potentiellement avec un lecteur de code-barres ou un terminal de paiement externe. Il doit être résilient aux contraintes d'un réseau sans-fil potentiellement congestionné.

### 1.2.2. Contraintes Spécifiques et Implications Techniques

#### 1.2.2.1. Gestion des Pics d'Achalandage
*   **Contrainte :** Traiter des dizaines de transactions en quelques minutes.
*   **Implication Technique :**
    *   L'interface doit être une SPA (Single Page Application) pour éviter les rechargements de page.
    *   L'état de l'application doit être géré efficacement côté client pour une réactivité instantanée.
    *   Les requêtes à la base de données doivent être minimales et optimisées. L'utilisation de `TanStack Query` pour la mise en cache des données serveur est essentielle.

#### 1.2.2.2. Nature de la Clientèle
*   **Contrainte :** Clientèle captive et régulière.
*   **Implication Technique :**
    *   Justifie l'investissement dans un système de fidélité robuste.
    *   Le processus d'identification du client doit être extrêmement rapide (ex: scan de carte) pour ne pas ralentir le flux.

#### 1.2.2.3. Exigences Réglementaires et Éthiques
*   **Contrainte :** Protection des données d'une population majoritairement mineure.
*   **Implication Technique :**
    *   Le chiffrement n'est pas une option, c'est une exigence fondamentale. L'architecture doit intégrer une solution de chiffrement forte (AES-256-GCM) gérée côté serveur.
    *   La collecte de données est limitée au strict minimum : un prénom et un numéro de fiche. Aucun nom de famille, adresse courriel ou autre information identifiable n'est stocké.
    *   L'accès aux données déchiffrées doit être une action explicite, contrôlée et auditée.

#### 1.2.2.4. Rotation du Personnel et Simplicité d'Utilisation
*   **Contrainte :** Le personnel peut être composé d'étudiants ou de bénévoles avec peu de formation.
*   **Implication Technique :**
    *   L'interface doit suivre les principes de conception UX/UI les plus intuitifs (parcours utilisateur clair, libellés explicites, guidage visuel).
    *   Les fonctionnalités complexes doivent être accessibles mais pas envahissantes.
    *   Le risque d'erreur humaine doit être minimisé par des confirmations et des validations.

#### 1.2.2.5. Diversité de l'Offre de Produits
*   **Contrainte :** Le café vend à la fois des produits en vente directe et des produits nécessitant une préparation.
*   **Implication Technique :**
    *   La base de données `products` doit inclure des champs spécifiques (`requires_preparation`, `preparation_type`).
    *   Le flux de commande doit être capable de bifurquer pour créer une entrée dans la `preparation_queue` si nécessaire.

---

## 1.3. Public Cible de la Documentation

Cette documentation est structurée pour répondre aux besoins de différents acteurs impliqués dans le cycle de vie du logiciel.

### 1.3.1. Profil 1 : Développeurs et Équipes de Maintenance
*   **Besoins :** Compréhension approfondie du code source, de l'architecture, des flux de données, des conventions de style et des bibliothèques utilisées.
*   **Sections Clés :** Parties 2, 3, 4, 5.

### 1.3.2. Profil 2 : Administrateurs Système et Opérations (DevOps)
*   **Besoins :** Informations sur le déploiement, la configuration des services Supabase, la gestion des variables d'environnement, la supervision et les procédures de sauvegarde.
*   **Sections Clés :** Parties 2, 4, 6.

### 1.3.3. Profil 3 : Responsables de la Sécurité de l'Information (RSSI)
*   **Besoins :** Analyse détaillée de l'architecture de sécurité, des protocoles de chiffrement, des politiques de contrôle d'accès, et des capacités d'audit.
*   **Sections Clés :** Parties 4, 5.

### 1.3.4. Profil 4 : Gestionnaires et Parties Prenantes Métier
*   **Besoins :** Vue d'ensemble fonctionnelle du système, compréhension des capacités et des limites, et guide d'utilisation des modules de reporting.
*   **Sections Clés :** Parties 1, 3, 7.

---

## 1.4. Philosophie Générale et Principes Directeurs

### 1.4.1. Principe 1 : La Sécurité par Conception ("Security by Design")
Ce principe signifie que la sécurité a été intégrée à chaque étape du cycle de développement, et non ajoutée a posteriori.
*   **Analyse de Menaces :** Chaque fonctionnalité a été conçue en anticipant les vecteurs d'attaque potentiels.
*   **Principe du Moindre Privilège :** Les utilisateurs et les composants système n'ont accès qu'aux données et fonctions strictement nécessaires à leur rôle.
*   **Défense en Profondeur :** Plusieurs couches de sécurité sont superposées (authentification, autorisation, chiffrement, audit).

### 1.4.2. Principe 2 : La Performance et la Fiabilité Inconditionnelles
Le système est considéré comme "critique" pendant les heures de service.
*   **Optimisation Précoce :** Les choix architecturaux ont été faits en gardant la performance comme critère principal.
*   **Tests de Charge (Recommandé) :** Des simulations de pics d'achalandage devraient être effectuées pour valider la robustesse de l'infrastructure.
*   **Code Asynchrone :** L'utilisation intensive de `async/await` et de `React Query` garantit que l'interface utilisateur ne se bloque jamais pendant les opérations réseau.

### 1.4.3. Principe 3 : La Simplicité d'Utilisation comme Priorité
La complexité technique est masquée derrière une interface simple et épurée.
*   **Approche "Mobile-First" (Conceptuelle) :** Bien que destiné aux tablettes, le design est pensé pour être clair et concis, comme sur un appareil mobile.
*   **Feedback Visuel Constant :** L'utilisateur est toujours informé de l'état du système (chargement, succès, erreur) via des indicateurs visuels.

### 1.4.4. Principe 4 : La Modularité pour l'Évolutivité Future
Le code est organisé en modules fonctionnels (POS, Inventaire, etc.) faiblement couplés.
*   **Composants Réutilisables :** La bibliothèque de composants (`src/components`) est conçue pour être générique.
*   **Séparation des Préoccupations :** La logique métier (`lib`), l'état de l'interface et la communication avec l'API sont clairement séparés.
*   **Scalabilité de la Base de Données :** Le schéma PostgreSQL est conçu pour pouvoir évoluer sans nécessiter de refontes majeures.