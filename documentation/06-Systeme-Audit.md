# Chapitre 6 : Système d'Audit et de Traçabilité

Ce chapitre est dédié à l'un des piliers de la sécurité et de la conformité du système : le Grand Livre d'audit.

---

## 6.1. Objectifs du Système d'Audit

Le système d'audit vise à répondre à quatre objectifs critiques :
1.  **Traçabilité :** Savoir "qui a fait quoi et quand" pour chaque modification de données.
2.  **Sécurité :** Détecter les comportements suspects (intrusions, abus de droits).
3.  **Conformité :** Répondre aux exigences légales (Loi 25) concernant l'accès aux données personnelles.
4.  **Intégrité :** Garantir que l'historique des actions n'a pas été altéré a posteriori.

---

## 6.2. Architecture du Module d'Audit (`audit.ts`)

L'architecture a été renforcée pour inclure une vérification d'intégrité de type **Blockchain**.

### 6.2.1. Création de Logs
La fonction `createAuditLog` est appelée par l'application cliente pour chaque action significative. Elle envoie les détails (action, ressource, métadonnées) à la base de données.

### 6.2.2. Chaînage Cryptographique (Blockchain)
Pour garantir l'immuabilité :
-   Chaque nouvelle entrée dans `audit_logs` contient un champ `previous_hash` qui correspond au `hash` de l'entrée précédente.
-   Le `hash` de l'entrée actuelle est calculé (via un Trigger PostgreSQL ou côté serveur) en concaténant les données critiques du log (action, user_id, details, timestamp) et le hash précédent, puis en appliquant un algorithme de hachage SHA-256.
-   Cela crée une chaîne ininterrompue. Modifier un vieux log invaliderait tous les hashs suivants.

### 6.2.3. Vérification d'Intégrité
La fonction `verifyAuditChain` permet de parcourir toute la chaîne pour s'assurer qu'aucun enregistrement n'a été modifié ou supprimé silencieusement. Si un hash recalculé ne correspond pas au hash stocké, la chaîne est signalée comme corrompue.

---

## 6.3. Liste Exhaustive des Actions Auditées

Le type `AuditAction` définit l'ensemble des événements traçables :

### Authentification & Sécurité
-   `LOGIN`, `LOGOUT`
-   `VALIDATE_TOKEN` (Validation carte récompense)
-   `ENCRYPT_DATA`, `DECRYPT_DATA` (Accès données sensibles)
-   `VERIFY_INTEGRITY` (Vérification blockchain)

### Gestion Commerciale
-   `CREATE_ORDER`, `VIEW_ORDER`
-   `CREATE_PRODUCT`, `UPDATE_PRODUCT`, `DELETE_PRODUCT`
-   `VIEW_INVENTORY`, `VIEW_POS`

### Clients & Fidélité
-   `CREATE_REWARD_CARD`, `UPDATE_REWARD_CARD`, `DELETE_REWARD_CARD`
-   `VIEW_CUSTOMER`, `UPDATE_CUSTOMER`

### Café Suspendu (Nouveau)
-   `PURCHASE_SUSPENDED` : Achat d'un don.
-   `CLAIM_SUSPENDED` : Réclamation d'un don par un élève.

### Cuisine
-   `UPDATE_PREPARATION_STATUS` : Changement d'état (Prêt/Livré).

---

## 6.4. Structure d'un Log d'Audit

Chaque entrée dans la table `audit_logs` contient :

```json
{
  "id": "uuid...",
  "user_id": "uuid de l'opérateur",
  "action": "CREATE_ORDER",
  "resource_type": "ORDER",
  "resource_id": "uuid de la commande",
  "details": {
    "amount": 15.50,
    "method": "card",
    "items_count": 2
  },
  "ip_address": "192.168.1.x",
  "user_agent": "Mozilla/5.0...",
  "created_at": "2025-11-15T10:00:00Z",
  "hash": "sha256...",
  "previous_hash": "sha256..."
}
```

---

## 6.5. Intégration avec les Mécanismes de Sécurité

Le système d'audit est directement relié aux mécanismes de défense active :
-   Si un **Honeypot** est déclenché, un log d'audit critique est créé.
-   Si un **Canary Token** est touché, l'événement est tracé.
-   Les tentatives de **Scraping** génèrent des logs d'alerte.

Ces logs alimentent ensuite le **Centre de Sécurité** (`/security-dashboard`) pour une visualisation en temps réel des menaces.