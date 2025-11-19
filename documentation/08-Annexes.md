# Chapitre 8 : Annexes

Ce chapitre final sert de référence technique et de complément aux informations présentées dans les sections précédentes. Il contient un glossaire des termes techniques, la liste exhaustive des dépendances du projet, et des exemples concrets de requêtes API.

---

## 8.1. Glossaire des Termes Techniques

-   **AES-GCM (Advanced Encryption Standard - Galois/Counter Mode) :** Algorithme de chiffrement symétrique standardisé et robuste. Le mode GCM fournit à la fois le chiffrement des données et leur authentification, garantissant confidentialité et intégrité. Utilisé pour chiffrer les données personnelles au repos.

-   **BaaS (Backend-as-a-Service) :** Modèle de cloud computing où les développeurs externalisent toute la gestion de l'infrastructure backend (serveurs, bases de données, authentification) à un fournisseur tiers, comme Supabase.

-   **Biométrie d'Appareil (Device Fingerprinting) :** Technique de sécurité qui consiste à créer un identifiant unique et stable pour un appareil (ordinateur, tablette) en se basant sur une multitude de ses caractéristiques matérielles et logicielles. Utilisé pour s'assurer que seuls les appareils autorisés peuvent se connecter.

-   **Canary Token :** Un type de honeypot. C'est une ressource numérique (un token, un fichier, une URL) conçue pour être invisible et inutile pour un utilisateur légitime, mais attrayante pour un attaquant. Si cette ressource est accédée, une alerte est immédiatement déclenchée.

-   **Chiffrement de Bout en Bout (E2E Encryption) :** Méthode de communication sécurisée où les données sont chiffrées sur l'appareil de l'expéditeur et ne peuvent être déchiffrées que par l'appareil du destinataire. Personne entre les deux, y compris les serveurs, ne peut lire les données.

-   **Edge Function :** Une fonction serverless qui s'exécute géographiquement proche de l'utilisateur ("at the edge"). Dans notre cas, utilisée comme une enclave sécurisée pour les opérations de chiffrement, car elle peut accéder à des secrets qui ne sont jamais exposés au client.

-   **Honeypot (Pot de Miel) :** Un mécanisme de sécurité qui agit comme un leurre pour attirer et détecter les attaquants. Il peut s'agir d'un faux compte utilisateur, d'un faux endpoint API ou d'autres ressources qui semblent vulnérables.

-   **JWT (JSON Web Token) :** Un standard ouvert pour créer des jetons d'accès qui affirment un certain nombre de "claims" (revendications). Utilisé par Supabase Auth pour gérer les sessions utilisateur de manière sécurisée et stateless.

-   **Luhn (Algorithme de) :** Un algorithme de somme de contrôle simple, utilisé pour valider une variété de numéros d'identification, comme les numéros de carte de crédit. Dans notre cas, il est adapté pour valider les codes de carte alphanumériques et prévenir les erreurs de saisie.

-   **Perfect Forward Secrecy (PFS) :** Une propriété des protocoles d'échange de clés qui garantit que la compromission d'une clé à long terme (ex: la clé privée RSA d'un utilisateur) ne compromet pas la confidentialité des sessions de communication passées. Obtenu en utilisant des clés de session éphémères.

-   **PostgREST :** Un serveur web autonome qui transforme directement une base de données PostgreSQL en une API RESTful. C'est le composant de Supabase qui expose les tables de la base de données via une API HTTP.

-   **RLS (Row Level Security) :** Une fonctionnalité de PostgreSQL qui permet de définir des politiques de contrôle d'accès directement sur les lignes d'une table. C'est le principal mécanisme de contrôle d'accès aux données dans notre architecture.

-   **RSA-OAEP (Rivest-Shamir-Adleman - Optimal Asymmetric Encryption Padding) :** Algorithme de chiffrement asymétrique utilisé pour l'échange sécurisé de clés. Le padding OAEP est une norme qui prévient plusieurs types d'attaques cryptographiques sur RSA.

-   **SPA (Single-Page Application) :** Une application web qui charge une seule page HTML et met à jour dynamiquement son contenu via JavaScript, sans recharger la page entière. Notre application React est une SPA.

---

## 8.2. Liste Complète des Dépendances

Cette liste est extraite du fichier `package.json` et détaille les bibliothèques utilisées dans le projet.

### Dépendances de Production (`dependencies`)

| Paquet | Version | Description |
| :--- | :--- | :--- |
| `@dnd-kit/core` | ^6.3.1 | Boîte à outils légère pour le glisser-déposer (Drag & Drop). |
| `@fingerprintjs/fingerprintjs`| ^5.0.1 | Bibliothèque pour la génération d'empreintes d'appareil (biométrie). |
| `@radix-ui/*` | various | Collection de primitives UI accessibles et non stylisées (base de shadcn/ui). |
| `@supabase/supabase-js` | ^2.81.1 | Client JavaScript officiel pour interagir avec l'API de Supabase. |
| `@tanstack/react-query` | ^5.56.2 | Bibliothèque pour la gestion de l'état serveur (fetching, caching, synchronisation). |
| `class-variance-authority` | ^0.7.1 | Utilitaire pour créer des variantes de classes Tailwind CSS. |
| `clsx` | ^2.1.1 | Utilitaire pour construire des chaînes de classes conditionnelles. |
| `lucide-react` | ^0.462.0 | Bibliothèque d'icônes open-source. |
| `react` | ^18.3.1 | Bibliothèque principale pour la construction de l'interface utilisateur. |
| `react-dom` | ^18.3.1 | Permet de monter les composants React dans le DOM. |
| `react-router-dom` | ^6.26.2 | Bibliothèque pour la gestion du routage côté client. |
| `sonner` | ^1.5.0 | Bibliothèque de notifications (toasts) élégante. |
| `tailwind-merge` | ^2.5.2 | Utilitaire pour fusionner intelligemment les classes Tailwind sans conflits. |
| `tailwindcss-animate` | ^1.0.7 | Plugin Tailwind pour les animations. |

### Dépendances de Développement (`devDependencies`)

| Paquet | Version | Description |
| :--- | :--- | :--- |
| `@vitejs/plugin-react-swc` | ^3.9.0 | Plugin Vite pour une compilation React ultra-rapide avec SWC. |
| `autoprefixer` | ^10.4.20 | Plugin PostCSS pour ajouter les préfixes vendeurs au CSS. |
| `eslint` | ^9.9.0 | Outil d'analyse de code statique pour trouver les problèmes. |
| `postcss` | ^8.4.47 | Outil pour transformer le CSS avec des plugins. |
| `tailwindcss` | ^3.4.11 | Framework CSS "utility-first" pour le design. |
| `typescript` | ^5.5.3 | Sur-ensemble de JavaScript qui ajoute le typage statique. |
| `vite` | ^6.3.4 | Outil de build frontend nouvelle génération. |

---

## 8.3. Exemples de Requêtes API

Bien que le client Supabase (`supabase-js`) abstraie les appels HTTP directs, il est utile de comprendre à quoi ils correspondent.

### Exemple 1 : Récupérer tous les produits (SELECT)

**Code Client (`supabase-js`) :**
```typescript
const { data: products, error } = await supabase
  .from('products')
  .select('*')
  .order('position');
```

**Requête HTTP sous-jacente :**
-   **Méthode :** `GET`
-   **URL :** `https://<project-ref>.supabase.co/rest/v1/products?select=*&order=position`
-   **En-têtes :**
    -   `apikey: <supabase_anon_key>`
    -   `Authorization: Bearer <jwt_token>`

**Processus :**
1.  Le client `supabase-js` construit l'URL de l'API PostgREST.
2.  Il ajoute la clé `anon` et le JWT de l'utilisateur aux en-têtes.
3.  La passerelle Supabase reçoit la requête, valide le JWT.
4.  La politique RLS sur la table `products` est appliquée, ajoutant une clause `WHERE user_id = auth.uid()` à la requête SQL.
5.  Les résultats sont retournés au client au format JSON.

### Exemple 2 : Créer une nouvelle commande (INSERT)

**Code Client (`supabase-js`) :**
```typescript
const { data: newOrder, error } = await supabase
  .from('orders')
  .insert({
    total_amount: 25.50,
    payment_method: 'card',
    items: [{ product_id: 'uuid', quantity: 2 }]
  })
  .select()
  .single();
```

**Requête HTTP sous-jacente :**
-   **Méthode :** `POST`
-   **URL :** `https://<project-ref>.supabase.co/rest/v1/orders?select=*`
-   **En-têtes :**
    -   `apikey: <supabase_anon_key>`
    -   `Authorization: Bearer <jwt_token>`
    -   `Content-Type: application/json`
    -   `Prefer: return=representation` (pour que l'API retourne l'objet créé)
-   **Corps (Body) :**
    ```json
    {
      "total_amount": 25.50,
      "payment_method": "card",
      "items": [{ "product_id": "uuid", "quantity": 2 }]
    }
    ```

### Exemple 3 : Appeler l'Edge Function de chiffrement

Ceci est un appel `fetch` direct, encapsulé dans la fonction `encryptBatch` de `lib/crypto.ts`.

**Code Client (encapsulé) :**
```typescript
const response = await fetch(CRYPTO_FUNCTION_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token}`,
  },
  body: JSON.stringify({
    action: 'encrypt_batch',
    data: { first_name: "Marie", customer_number: "12345" },
  }),
});
```

**Requête HTTP :**
-   **Méthode :** `POST`
-   **URL :** `https://<project-ref>.supabase.co/functions/v1/crypto-service`
-   **En-têtes :**
    -   `Authorization: Bearer <jwt_token>`
    -   `Content-Type: application/json`
-   **Corps (Body) :**
    ```json
    {
      "action": "encrypt_batch",
      "data": {
        "first_name": "Marie",
        "customer_number": "12345"
      }
    }
    ```

**Réponse attendue :**
-   **Statut :** `200 OK`
-   **Corps (Body) :**
    ```json
    {
      "encrypted": {
        "first_name": "base64_encrypted_string...",
        "customer_number": "base64_encrypted_string..."
      }
    }
    ```