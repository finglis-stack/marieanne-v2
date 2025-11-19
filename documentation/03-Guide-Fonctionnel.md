# Chapitre 3 : Guide Fonctionnel Détaillé par Module

Ce chapitre est le cœur de la documentation. Il offre une exploration exhaustive de chaque module de l'application, en faisant le pont entre l'expérience utilisateur (ce que l'on voit et ce que l'on fait) et l'implémentation technique (quels composants, fonctions et logiques sont à l'œuvre).

---

## 3.1. Module d'Authentification et de Connexion (`/`)
*(Voir documentation existante)*

---

## 3.2. Tableau de Bord (`/dashboard`)
*(Voir documentation existante)*

---

## 3.3. Point de Vente (POS) (`/pos`)
*(Voir documentation existante)*

---

## 3.4. Gestion d'Inventaire (`/inventory`)
*(Voir documentation existante)*

---

## 3.5. Gestion des Cartes Récompenses (`/reward-cards`)
*(Voir documentation existante)*

---

## 3.6. Détail d'une Fiche Client (`/reward-cards/:customerId`)
*(Voir documentation existante)*

---

## 3.7. Historique des Transactions (`/transactions`)
*(Voir documentation existante)*

---

## 3.8. Détaile d'une Commande (`/orders/:orderId`)
*(Voir documentation existante)*

---

## 3.9. File d'Attente de Préparation (Écran Public) (`/preparation-queue`)
*(Voir documentation existante)*

---

## 3.10. Module de Rapports (`/reports`)
*(Voir documentation existante)*

---

## 3.11. Grand Livre d'Audit (`/audit-logs`)

Le Grand Livre a été amélioré pour inclure des fonctionnalités de type "Blockchain" pour garantir l'intégrité des données.

### 3.11.1. Affichage et Vérification
-   **Liste des Logs :** Affiche l'historique des actions avec leur hash cryptographique.
-   **Vérification d'Intégrité :** Un bouton permet de lancer une vérification complète de la chaîne de blocs. Le système recalcule les hashs de chaque entrée pour s'assurer qu'aucune donnée n'a été altérée manuellement dans la base de données.
-   **Export CSV :** Permet d'exporter les logs pour une analyse externe.

---

## 3.12. Gestion des Appareils (`/device-management`)
*(Voir documentation existante)*

---

## 3.13. Centre de Sécurité (`/security-dashboard`)
*(Voir documentation existante)*

---

## 3.14. Module Café Suspendu (`/suspended-coffee`)

Ce nouveau module permet de gérer le système de dons "Payez au suivant".

-   **Page Principale :** `src/pages/SuspendedCoffee.tsx`
-   **Composants Clés :** `SuspendedWall.tsx`, `AddSuspendedDialog.tsx`

### 3.14.1. Le Mur de la Bonté (`SuspendedWall`)
-   Affiche sous forme de cartes tous les items disponibles (statut `available`).
-   Chaque carte montre le produit, le nom du donateur et un message optionnel.
-   **Réclamation d'un don :**
    -   L'opérateur clique sur le bouton d'action de la carte.
    -   Une modale de confirmation (`AlertDialog`) apparaît.
    -   **Cas 1 : Item sans préparation (ex: Muffin)** : L'item est marqué comme `claimed` et une notification de succès s'affiche.
    -   **Cas 2 : Item avec préparation (ex: Sandwich)** : Le système ajoute automatiquement l'item à la `preparation_queue`, calcule le temps d'attente, et affiche une modale avec le **Numéro de Commande** pour l'élève.

### 3.14.2. Ajout d'un Don (`AddSuspendedDialog`)
-   Permet d'acheter un produit pour le mettre sur le mur.
-   **Flux :** Sélection du produit -> (Optionnel) Validation Carte Récompense -> Paiement.
-   Si une carte récompense est utilisée, le donateur accumule des points pour son don.
-   Une commande est créée dans `orders` avec le flag `is_donation`, et l'item est ajouté à `suspended_items`.