# Chapitre 3 : Guide Fonctionnel Détaillé par Module

Ce chapitre est le cœur de la documentation. Il offre une exploration exhaustive de chaque module de l'application, en faisant le pont entre l'expérience utilisateur (ce que l'on voit et ce que l'on fait) et l'implémentation technique (quels composants, fonctions et logiques sont à l'œuvre).

---

## 3.1. Module d'Authentification et de Connexion (`/`)

Le point d'entrée sécurisé de l'application.

### 3.1.1. Interface de Connexion (`FuturisticLogin.tsx`)
-   **Design :** Interface immersive avec arrière-plan animé (`ParticleBackground`) pour renforcer l'aspect moderne.
-   **Champs :** Email et Mot de passe.

### 3.1.2. Processus de Saisie des Identifiants
-   Validation locale des champs.
-   Détection anti-scraping : Si les tentatives sont trop rapides, le système bloque l'action.

### 3.1.3. Gestion de l'Affichage du Mot de Passe
-   Bouton "Oeil" pour révéler/masquer le mot de passe, améliorant l'utilisabilité sur tablette.

### 3.1.4. Logique de Soumission du Formulaire
1.  Vérification si l'email est un **Honeypot**. Si oui, déclenchement d'une alerte silencieuse.
2.  Authentification via Supabase Auth.
3.  Vérification de l'empreinte de l'appareil (`device-fingerprint.ts`).
4.  Si l'appareil est inconnu et que le compte n'est pas en mode "Déverrouillage temporaire", l'accès est refusé.

### 3.1.5. Redirection vers le Tableau de Bord
-   En cas de succès, redirection vers `/dashboard` avec une notification de bienvenue.

### 3.1.6. Lien d'Accès Rapide à la File d'Attente
-   Un bouton permet d'accéder directement à l'écran public `/preparation-queue` sans se connecter, pour l'affichage en cuisine ou en salle.

---

## 3.2. Tableau de Bord (`/dashboard`)

Le centre de commandement pour les opérations quotidiennes.

### 3.2.1. Affichage des Statistiques du Jour
-   Cartes affichant : Ventes totales, Nombre de commandes, Clients uniques, Produits vendus.
-   Comparaison automatique avec la veille (indicateurs de tendance vert/rouge).

### 3.2.2. Calcul et Affichage des Tendances
-   Calculé en temps réel basé sur les données `orders` de la journée courante vs la journée précédente (00:00 à 23:59 EST).

### 3.2.3. Grille d'Actions Rapides (Navigation)
-   Boutons d'accès direct aux modules principaux : POS, Inventaire, Cartes, Transactions, etc.

### 3.2.4. Widget d'Audit en Temps Réel (`AuditFooter.tsx`)
-   Petit widget en bas de page montrant les 3 dernières actions système pour une surveillance passive.

### 3.2.5. Processus de Déconnexion
-   Bouton de déconnexion qui détruit la session locale et redirige vers la page de login.

---

## 3.3. Point de Vente (POS) (`/pos`)

L'interface principale pour les ventes.

### 3.3.1. Grille de Produits (`ProductGrid.tsx`)
-   Affichage des produits par catégories.
-   Filtrage visuel : Les produits non disponibles (selon l'horaire) sont grisés.
-   Recherche rapide par nom.

### 3.3.2. Panneau de Commande (`CheckoutPanel.tsx`)
-   Liste des items dans le panier.
-   Ajustement des quantités (+/-).
-   Calcul automatique des taxes (TPS/TVQ) et du total.

### 3.3.3. Affichage de la File d'Attente (`PreparationDisplay.tsx`)
-   Mini-vue de la file d'attente intégrée au POS pour informer le client du temps d'attente estimé.

### 3.3.4. Modale de Finalisation de Commande (`CheckoutDialog.tsx`)
-   **Étape 1 :** Demande si le client a une carte récompense.
-   **Étape 2 (Optionnelle) :** Saisie du code carte (XX 00 0). Validation Luhn et génération de token temporaire.
-   **Étape 3 :** Choix du mode de paiement (Comptant / Carte).

### 3.3.5. Modale de Paiement Comptant (`CashPaymentDialog.tsx`)
-   Calculatrice intégrée pour aider l'opérateur à rendre la monnaie.
-   Boutons rapides pour les coupures (5$, 10$, 20$).

### 3.3.6. Modale de Numéro de Commande (`OrderNumberDialog.tsx`)
-   Si la commande contient des items à préparer (Sandwich/Pizza), cette modale affiche le **Numéro de Commande** à communiquer au client.

---

## 3.4. Gestion d'Inventaire (`/inventory`)

Module d'administration des produits.

### 3.4.1. Affichage des Catégories (`CategoryCard.tsx`)
-   Organisation visuelle des produits par catégorie.

### 3.4.2. Affichage des Produits (`ProductCard.tsx`)
-   Cartes produits avec image, prix et indicateur de taxes.
-   Boutons d'édition et de suppression.

### 3.4.3. Fonctionnalité de Glisser-Déposer (Drag & Drop)
-   Utilisation de `@dnd-kit` pour réorganiser les produits et les catégories par simple glisser-déposer.

### 3.4.4. Modale d'Ajout de Catégorie (`AddCategoryDialog.tsx`)
-   Création simple d'une nouvelle catégorie.

### 3.4.5. Modale d'Ajout de Produit (`AddProductDialog.tsx`)
-   Formulaire complet : Nom, Prix, Image, Taxes.
-   **Configuration Préparation :** Définir si le produit nécessite une préparation (Sandwich/Pizza) pour la file d'attente.

### 3.4.6. Gestionnaire de Disponibilité (`AvailabilityManager.tsx`)
-   Définition des plages horaires de disponibilité par jour de la semaine (ex: Pizza seulement le vendredi).

---

## 3.5. Gestion des Cartes Récompenses (`/reward-cards`)

Administration du programme de fidélité.

### 3.5.1. Affichage des Fiches Clients (`CustomerCard.tsx`)
-   Liste des clients avec leur solde de points et nombre de cartes.
-   Données sensibles (Nom, Numéro de fiche) masquées par défaut.

### 3.5.2. Modale de Création de Carte (`CreateCardDialog.tsx`)
-   Création simultanée d'un profil client et d'une carte physique.
-   Chiffrement automatique des données personnelles avant envoi au serveur.

### 3.5.3. Pagination et Recherche
-   Recherche par code de carte (toujours disponible).
-   Recherche par nom (disponible uniquement après déverrouillage).

### 3.5.4. Fonctionnalité de Déverrouillage des Données Sensibles
-   Bouton "Déverrouiller" demandant le mot de passe administrateur pour déchiffrer et afficher les noms des élèves.

---

## 3.6. Détail d'une Fiche Client (`/reward-cards/:customerId`)

Vue approfondie d'un client.

### 3.6.1. Affichage des Informations du Client
-   Solde de points, date d'inscription.
-   Données personnelles (chiffrées/déchiffrées selon l'état).

### 3.6.2. Historique des Commandes du Client
-   Liste chronologique de tous les achats effectués avec les cartes de ce client.

### 3.6.3. Liste des Cartes Associées
-   Toutes les cartes liées à ce compte (actives et inactives).

### 3.6.4. Actions sur les Cartes
-   Possibilité de désactiver une carte perdue ou de la réactiver.

---

## 3.7. Historique des Transactions (`/transactions`)

Journal complet des ventes.

### 3.7.1. Affichage de la Liste des Commandes
-   Liste triée par date décroissante.
-   Indicateurs visuels pour le mode de paiement et le statut.

### 3.7.2. Statistiques Globales
-   Résumé en haut de page : Revenu total, répartition comptant/carte.

### 3.7.3. Recherche et Pagination
-   Recherche par ID de commande ou montant.

---

## 3.8. Détail d'une Commande (`/orders/:orderId`)

Preuve d'achat numérique.

### 3.8.1. Affichage des Détails de la Commande
-   Date, Heure, Numéro unique.

### 3.8.2. Récapitulatif des Articles
-   Liste des produits, quantités, prix unitaires et sous-totaux.

### 3.8.3. Informations sur le Client et la Carte
-   Si la commande est liée à un client, affichage du lien vers sa fiche.

---

## 3.9. File d'Attente de Préparation (Écran Public) (`/preparation-queue`)

Interface destinée aux écrans en cuisine ou en salle.

### 3.9.1. Affichage des Commandes
-   Deux colonnes principales : **Sandwichs** et **Pizzas**.
-   Sous-sections : **En préparation** (avec barre de progression du temps) et **Prêt à livrer** (numéro clignotant).

### 3.9.2. Mise à Jour en Temps Réel
-   Utilisation des souscriptions Supabase Realtime pour mettre à jour l'écran instantanément sans rechargement.

---

## 3.10. Module de Rapports (`/reports`)

Outils d'analyse pour la gestion.

### 3.10.1. Sélection de la Période et des Métriques
-   Choix des dates de début et de fin.
-   Cases à cocher pour choisir les données à inclure (Ventes, Produits, Clients...).

### 3.10.2. Génération de Rapports PDF
-   Création d'un document imprimable propre avec les statistiques sélectionnées.

### 3.10.3. Export de Données CSV
-   Téléchargement des données brutes pour analyse dans Excel.

---

## 3.11. Grand Livre d'Audit (`/audit-logs`)

Le journal de sécurité immuable.

### 3.11.1. Affichage et Vérification
-   **Liste des Logs :** Affiche l'historique des actions (connexions, ventes, modifications) avec leur hash cryptographique.
-   **Vérification d'Intégrité :** Un bouton permet de lancer une vérification de la chaîne de blocs (Blockchain). Le système recalcule les hashs pour garantir qu'aucune donnée n'a été altérée.

### 3.11.2. Export CSV
-   Permet d'exporter les logs d'audit pour archivage externe.

---

## 3.12. Gestion des Appareils (`/device-management`)

Contrôle d'accès biométrique.

### 3.12.1. Liste des Appareils Autorisés
-   Affiche les appareils (PC, Tablettes) autorisés à se connecter au système.

### 3.12.2. Mode d'Ajout d'Appareil
-   Bouton pour déverrouiller temporairement (5 min) l'ajout d'un nouvel appareil.

### 3.12.3. Actions sur les Appareils
-   Révoquer (bloquer l'accès) ou Supprimer un appareil.

---

## 3.13. Centre de Sécurité (`/security-dashboard`)

Tableau de bord pour l'administrateur sécurité.

### 3.13.1. Tableau de Bord des Alertes
-   Vue d'ensemble des menaces détectées.

### 3.13.2. Liste des Alertes de Sécurité
-   Historique des déclenchements de Honeypots ou de tentatives d'intrusion.

### 3.13.3. Liste des Canary Tokens
-   État des tokens pièges disséminés dans l'application.

### 3.13.4. Résolution des Alertes
-   Possibilité de marquer une alerte comme "Résolue".

---

## 3.14. Module Café Suspendu (`/suspended-coffee`)

Nouveau module pour la gestion des dons "Payez au suivant".

### 3.14.1. Le Mur de la Bonté (`SuspendedWall`)
-   **Affichage :** Grille de cartes montrant les produits offerts disponibles.
-   **Détails :** Chaque carte affiche le produit, le nom du donateur et un message optionnel.
-   **Réclamation :**
    -   Clic sur "Donner cet item" ou "Lancer préparation".
    -   Confirmation via une modale sécurisée.
    -   Si l'item nécessite une préparation (ex: Sandwich), il est automatiquement ajouté à la file d'attente et un numéro de commande est affiché.

### 3.14.2. Ajout d'un Don (`AddSuspendedDialog`)
-   Permet d'acheter un produit pour l'ajouter au mur.
-   **Flux :**
    1.  Sélection du produit à offrir.
    2.  Saisie optionnelle du nom du donateur et d'un message.
    3.  Validation optionnelle d'une carte récompense (pour accumuler des points sur le don).
    4.  Paiement (Comptant ou Carte).
-   Une fois payé, l'item apparaît instantanément sur le Mur de la Bonté.