# Chapitre 6 : Système d'Audit et de Traçabilité

Ce chapitre est dédié à l'un des piliers de la sécurité et de la conformité du système : le Grand Livre d'audit.

---

## 6.1. Objectifs du Système d'Audit
*(Voir documentation existante)*

---

## 6.2. Architecture du Module d'Audit (`audit.ts`)

L'architecture a été renforcée pour inclure une vérification d'intégrité de type Blockchain.

-   **Chaînage Cryptographique :** Chaque nouvelle entrée dans `audit_logs` contient un champ `previous_hash` qui correspond au `hash` de l'entrée précédente.
-   **Calcul du Hash :** Le hash est calculé (via un Trigger PostgreSQL ou côté serveur) en concaténant les données critiques du log (action, user_id, details, timestamp) et le hash précédent, puis en appliquant SHA-256.
-   **Vérification :** La fonction `verifyAuditChain` permet de parcourir toute la chaîne pour s'assurer qu'aucun enregistrement n'a été modifié ou supprimé silencieusement. Si un hash ne correspond pas aux données, la chaîne est considérée comme corrompue.

---

## 6.3. Liste Exhaustive des Actions Auditées

Le type `AuditAction` définit l'ensemble des événements traçables. Voici les ajouts récents :

| Action (`AuditAction`) | Description | Ressource |
| :--- | :--- | :--- |
| ... | ... | ... |
| `VERIFY_INTEGRITY` | Lancement d'une vérification de la blockchain d'audit. | `SYSTEM` |
| `PURCHASE_SUSPENDED` | Achat d'un item pour le Café Suspendu. | `ORDER` |
| `CLAIM_SUSPENDED` | Réclamation (don) d'un item suspendu à un élève. | `PRODUCT` |

---

## 6.4. Structure d'un Log d'Audit
*(Voir documentation existante, noter l'ajout des champs hash)*

---

## 6.5. Intégration avec les Mécanismes de Sécurité
*(Voir documentation existante)*