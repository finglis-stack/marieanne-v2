# Chapitre 5 : Schéma de Base de Données et Modèles de Données

Ce chapitre fournit une description exhaustive du schéma de la base de données PostgreSQL qui sous-tend le Système de Gestion du Café Marie Anne.

---

## 5.1. Schéma Global de la Base de Données

*(Voir diagramme existant, ajout de la table suspended_items)*

---

## 5.2. Description Détaillée des Tables

### 5.2.1 à 5.2.7
*(Voir documentation existante)*

---

### 5.2.8. Table `audit_logs`

**Objectif :** Enregistrer chaque action significative avec une intégrité cryptographique (Blockchain).

| Colonne | Type | Description | Contraintes / Défaut |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Identifiant unique du log. | `PRIMARY KEY` |
| `user_id` | `UUID` | Lien vers l'utilisateur. | `FOREIGN KEY` |
| `action` | `TEXT` | Type d'action effectuée. | `NOT NULL` |
| `resource_type` | `TEXT` | Type de ressource affectée. | `NOT NULL` |
| `details` | `JSONB` | Données contextuelles. | `Nullable` |
| `hash` | `TEXT` | **[NOUVEAU]** Hash SHA-256 de l'entrée actuelle. | `NOT NULL` |
| `previous_hash` | `TEXT` | **[NOUVEAU]** Hash de l'entrée précédente (chaînage). | `Nullable` |
| `created_at` | `TIMESTAMP` | Date et heure de l'action. | `DEFAULT now()` |

---

### 5.2.13. Table `suspended_items` (Nouvelle)

**Objectif :** Gérer les items du "Café Suspendu" (dons).

| Colonne | Type | Description | Contraintes / Défaut |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Identifiant unique du don. | `PRIMARY KEY`, `gen_random_uuid()` |
| `product_id` | `UUID` | Lien vers le produit offert. | `NOT NULL`, `FOREIGN KEY (products.id)` |
| `order_id` | `UUID` | Lien vers la commande d'achat originale. | `NOT NULL`, `FOREIGN KEY (orders.id)` |
| `donor_name` | `TEXT` | Nom affiché du donateur (ou "Anonyme"). | `Nullable` |
| `message` | `TEXT` | Message d'encouragement. | `Nullable` |
| `status` | `TEXT` | État du don : `'available'` ou `'claimed'`. | `DEFAULT 'available'` |
| `claimed_at` | `TIMESTAMP` | Date de la réclamation par un élève. | `Nullable` |
| `created_at` | `TIMESTAMP` | Date du don. | `DEFAULT now()` |

**Politiques RLS :**
- Lecture publique (pour le mur).
- Modification restreinte (seul le système peut marquer comme réclamé).

---

## 5.3. Relations Entre les Tables

-   `suspended_items` (1) → (1) `products`
-   `suspended_items` (1) → (1) `orders`
-   ... (autres relations existantes)