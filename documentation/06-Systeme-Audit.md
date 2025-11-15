# Chapitre 6 : Système d'Audit et de Traçabilité

Ce chapitre est dédié à l'un des piliers de la sécurité et de la conformité du système : le Grand Livre d'audit. Il détaille l'architecture, les objectifs et l'implémentation du module de traçabilité, qui enregistre de manière immuable chaque action significative effectuée au sein de l'application.

---

## 6.1. Objectifs du Système d'Audit

Le système d'audit n'est pas une simple fonctionnalité de journalisation ; c'est une composante stratégique conçue pour répondre à plusieurs objectifs critiques :

1.  **Conformité Réglementaire (Loi 25) :** Fournir une preuve documentée de qui a accédé, modifié ou supprimé des renseignements personnels, et à quel moment. C'est une exigence fondamentale de la Loi 25 du Québec.
2.  **Détection d'Intrusion et Analyse Forensique :** Servir de système d'enregistrement principal pour toutes les alertes de sécurité. En cas d'incident, le Grand Livre est la source de vérité pour comprendre la chronologie des événements, identifier le vecteur d'attaque et évaluer l'étendue des dommages.
3.  **Non-Répudiation :** Garantir qu'une action effectuée par un utilisateur ne peut être niée. Chaque log est lié à un `user_id` authentifié, créant une piste de responsabilité claire.
4.  **Débogage et Support Technique :** Permettre aux développeurs et au personnel de support de reconstituer les actions d'un utilisateur pour diagnostiquer des bugs ou des comportements inattendus.
5.  **Analyse Comportementale et Business Intelligence :** Fournir des données brutes sur l'utilisation des fonctionnalités, permettant d'identifier les modules les plus utilisés, les flux de travail les plus courants et les points de friction potentiels.

---

## 6.2. Architecture du Module d'Audit (`audit.ts`)

Toute la logique d'audit est centralisée dans le fichier `src/lib/audit.ts`. Cette centralisation garantit une méthode de journalisation cohérente et simplifie la maintenance.

-   **Point d'Entrée Unique :** La fonction `createAuditLog` est le seul point d'entrée pour la création de nouveaux logs. Tous les autres modules de l'application (POS, Inventaire, Sécurité, etc.) doivent appeler cette fonction pour enregistrer une action.

    ```typescript
    export const createAuditLog = async (data: AuditLogData): Promise<void> => {
      // ...
    };
    ```

-   **Capture Automatique du Contexte :** La fonction `createAuditLog` enrichit automatiquement chaque log avec des informations contextuelles essentielles :
    1.  **Contexte Utilisateur :** Elle récupère la session utilisateur active via `supabase.auth.getUser()` pour obtenir le `user_id` et le `user_email`. Cela garantit que chaque log est associé à un acteur identifié.
    2.  **Contexte Environnemental :** Elle capture le `navigator.userAgent` pour enregistrer des informations sur le navigateur et le système d'exploitation de l'utilisateur.

-   **Structure des Données (`AuditLogData`) :** L'interface `AuditLogData` impose une structure standardisée pour tous les logs, assurant la cohérence des données :
    -   `action: AuditAction`: Une énumération stricte des actions possibles.
    -   `resourceType: ResourceType`: Une énumération des types de ressources affectées.
    -   `resourceId?: string`: L'identifiant unique de la ressource spécifique.
    -   `details?: any`: Un objet JSONB flexible pour stocker des informations contextuelles riches.

-   **Fonctions d'Accès :** Le module fournit également des fonctions pour interroger le Grand Livre, comme `getRecentAuditLogs`, `getUserAuditLogs`, etc. Ces fonctions encapsulent les requêtes Supabase, offrant une API simple pour accéder aux données d'audit.

---

## 6.3. Liste Exhaustive des Actions Auditées

Le type `AuditAction` définit l'ensemble des événements traçables. Voici une description complète de chaque action :

| Action (`AuditAction`) | Description | Ressource (`ResourceType`) | Exemple de `details` |
| :--- | :--- | :--- | :--- |
| `LOGIN` | Un utilisateur s'est connecté avec succès. | `USER` | `{ "device_authorized": true, "honeypot_triggered": false }` |
| `LOGOUT` | Un utilisateur s'est déconnecté. | `USER` | `{}` |
| `VIEW_DASHBOARD` | Accès au tableau de bord principal. | `USER` | `{}` |
| `VIEW_INVENTORY` | Consultation de la page de gestion d'inventaire. | `PRODUCT` | `{}` |
| `CREATE_PRODUCT` | Un nouveau produit a été ajouté. | `PRODUCT` | `{ "product_name": "Café Latte", "price": 3.50 }` |
| `UPDATE_PRODUCT` | Un produit existant a été modifié. | `PRODUCT` | `{ "product_name": "Café Latte", "changes": ["price"] }` |
| `DELETE_PRODUCT` | Un produit a été supprimé. | `PRODUCT` | `{ "product_name": "Ancien Produit" }` |
| `VIEW_POS` | Accès à l'interface du point de vente. | `ORDER` | `{}` |
| `CREATE_ORDER` | Une nouvelle commande a été finalisée. | `ORDER` | `{ "total_amount": 12.75, "payment_method": "card" }` |
| `VIEW_ORDER` | Consultation des détails d'une commande. | `ORDER` | `{}` |
| `VIEW_REWARD_CARDS` | Accès à la gestion des cartes récompenses. | `REWARD_CARD` | `{}` |
| `CREATE_REWARD_CARD` | Création d'une nouvelle fiche client et carte. | `REWARD_CARD` | `{ "customer_profile_id": "uuid", "luhn_validated": true }` |
| `UPDATE_REWARD_CARD` | Modification d'une carte (ex: activation). | `REWARD_CARD` | `{ "action": "deactivate_card" }` |
| `DELETE_REWARD_CARD` | Suppression d'une carte. | `REWARD_CARD` | `{}` |
| `VIEW_CUSTOMER` | Consultation d'une fiche client. | `CUSTOMER` | `{}` |
| `UPDATE_CUSTOMER` | Modification d'une fiche client. | `CUSTOMER` | `{ "fields_updated": ["notes"] }` |
| `DELETE_CUSTOMER` | Suppression d'une fiche client. | `CUSTOMER` | `{}` |
| `VIEW_TRANSACTIONS` | Accès à l'historique des transactions. | `ORDER` | `{}` |
| `VIEW_REPORTS` | Accès à la page de génération de rapports. | `REPORT` | `{}` |
| `GENERATE_REPORT` | Un rapport PDF ou CSV a été généré. | `REPORT` | `{ "start_date": "...", "end_date": "..." }` |
| `VIEW_PREPARATION_QUEUE`| Accès à la file d'attente. | `PREPARATION_QUEUE` | `{}` |
| `UPDATE_PREPARATION_STATUS`| Changement de statut d'un article en préparation. | `PREPARATION_QUEUE` | `{ "new_status": "ready" }` |
| `VALIDATE_TOKEN` | Un token (permanent ou temporaire) a été validé. | `TOKEN` | `{ "success": true, "token_type": "temporary" }` |
| `ENCRYPT_DATA` | Une opération de chiffrement a été effectuée. | `DATA` | `{ "action": "encrypt_batch", "field_count": 2 }` |
| `DECRYPT_DATA` | Une opération de déchiffrement a été effectuée. | `DATA` | `{ "action": "decrypt_message", "signature_valid": true }` |

---

## 6.4. Structure d'un Log d'Audit

Chaque enregistrement dans la table `audit_logs` suit une structure précise, conçue pour une analyse facile et complète.

| Colonne | Description |
| :--- | :--- |
| `id` | Identifiant unique du log (UUID). |
| `user_id` | L'UUID de l'utilisateur (de `auth.users`) qui a initié l'action. |
| `user_email` | L'email de l'utilisateur, stocké pour faciliter la lecture et la recherche. |
| `action` | L'action effectuée, provenant de l'énumération `AuditAction`. |
| `resource_type` | Le type de ressource principale affectée (ex: `ORDER`, `USER`). |
| `resource_id` | L'UUID de l'instance spécifique de la ressource affectée. |
| `details` | Un champ JSONB flexible contenant toutes les métadonnées pertinentes à l'action. C'est ici que sont stockées les informations spécifiques à l'événement (ex: le montant d'une commande, les champs modifiés, etc.). |
| `ip_address` | L'adresse IP de l'utilisateur (actuellement non implémenté, mais le champ est prêt). |
| `user_agent` | La chaîne User-Agent du navigateur, permettant d'identifier le type d'appareil, l'OS et le navigateur. |
| `created_at` | L'horodatage précis de l'événement, stocké en UTC. |

### Exemple de Log d'Audit (Événement de Sécurité)

Voici à quoi ressemble un log généré par une tentative de connexion sur un compte honeypot. Notez la richesse des informations dans le champ `details`.

```json
{
  "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "user_id": null,
  "user_email": "admin@cafemarieanne.com",
  "action": "LOGIN",
  "resource_type": "USER",
  "resource_id": null,
  "details": {
    "honeypot_triggered": true,
    "attempted_email": "admin@cafemarieanne.com",
    "ip_address": "123.45.67.89",
    "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ...",
    "severity": "CRITICAL",
    "threat_level": "HIGH"
  },
  "ip_address": "123.45.67.89",
  "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ...",
  "created_at": "2025-11-15T14:30:00.123Z"
}
```

---

## 6.5. Intégration avec les Mécanismes de Sécurité

Le système d'audit n'est pas une simple couche de journalisation passive ; il est activement intégré à tous les mécanismes de sécurité pour servir de système d'enregistrement des incidents.

-   **Honeypots :** Lorsqu'un honeypot est déclenché (que ce soit un compte, un endpoint ou un canary token), la fonction `trigger...Alert` appelle immédiatement `createAuditLog`. Le log d'audit n'est pas générique ; il contient des détails spécifiques dans le champ `details` comme `"honeypot_triggered": true` et une sévérité `"CRITICAL"`. Cela transforme le Grand Livre en un **Système de Détection d'Intrusion (IDS)**.

-   **Biométrie d'Appareil :** Chaque étape du cycle de vie d'un appareil est auditée :
    -   `registerDevice` crée un log `CREATE_REWARD_CARD` (action à renommer) avec les détails de l'appareil.
    -   `revokeDevice` crée un log `DELETE_REWARD_CARD` (action à renommer).
    -   `unlockAccountTemporarily` crée un log `UPDATE_REWARD_CARD` (action à renommer).
    Cela fournit une piste d'audit complète pour savoir qui a autorisé quel appareil et quand.

-   **Chiffrement :** Les opérations de chiffrement et de déchiffrement sont elles-mêmes auditées. Un log est créé chaque fois que `encryptMessage` ou `decryptMessage` est appelé. C'est crucial pour la conformité, car cela permet de tracer chaque accès à des données sensibles, même si l'accès est légitime. Si un grand nombre d'opérations de déchiffrement est détecté pour un utilisateur, cela pourrait indiquer une tentative d'exfiltration de données.

-   **Surveillance en Temps Réel :** Le composant `AuditFooter.tsx` utilise Supabase Realtime pour s'abonner aux `INSERT` sur la table `audit_logs`. Cela signifie que toute action auditée, où qu'elle se produise dans le système, est immédiatement poussée vers les clients connectés et affichée dans le widget. Cela offre une surveillance en direct de l'activité du système, y compris des alertes de sécurité.