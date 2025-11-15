# Chapitre 4 : Architecture de Sécurité

Ce chapitre constitue une analyse technique approfondie de l'architecture de sécurité multicouche du Système de Gestion du Café Marie Anne. Il détaille chaque mécanisme de défense, des algorithmes de chiffrement aux stratégies de détection d'intrusion, en justifiant les choix technologiques et en décrivant les flux d'implémentation.

---

## 4.1. Chiffrement des Données Sensibles (AES-256-GCM)

Conformément à la Loi 25 et au principe de "Privacy by Design", toutes les données personnelles identifiables (PII) sont chiffrées au repos dans la base de données.

### 4.1.1. Rôle de l'Edge Function `crypto-service`

L'Edge Function `crypto-service` (`supabase/functions/crypto-service/index.ts`) agit comme une **enclave de chiffrement sécurisée**. C'est un microservice serverless qui s'exécute dans un environnement Deno isolé.

-   **Isolation des Secrets :** Son rôle principal est d'être le **seul et unique composant** de toute l'architecture à avoir accès à la clé de chiffrement principale (`ENCRYPTION_KEY`). Cette clé est stockée en tant que secret Supabase et n'est jamais exposée côté client.
-   **Surface d'Attaque Minimale :** La fonction n'expose que quatre actions : `encrypt`, `decrypt`, `encrypt_batch`, `decrypt_batch`. Toute autre action est rejetée.
-   **Authentification Requise :** Chaque appel à la fonction doit être accompagné d'un JWT valide. La fonction utilise le `SUPABASE_SERVICE_ROLE_KEY` pour valider le token de l'appelant, garantissant que seul un utilisateur authentifié peut demander une opération de chiffrement/déchiffrement.

### 4.1.2. Processus de Chiffrement (`encryptBatch`)

1.  **Initiation (Client) :** Un composant React (ex: `CreateCardDialog.tsx`) appelle la fonction `encryptBatch` du module `lib/crypto.ts` avec un objet de données en clair.
    ```typescript
    const encryptedData = await encryptBatch({
      customer_number: "12345",
      first_name: "Marie",
    });
    ```
2.  **Appel API (Client) :** Le module `lib/crypto.ts` construit une requête `fetch` vers l'URL de l'Edge Function. Il récupère le JWT de la session Supabase en cours et l'ajoute à l'en-tête `Authorization`.
3.  **Exécution (Serveur - Edge Function) :**
    a. La fonction reçoit la requête, valide le JWT.
    b. Elle récupère la `ENCRYPTION_KEY` depuis les variables d'environnement.
    c. Pour chaque champ de l'objet `data`, elle exécute la fonction `encrypt`.
    d. La fonction `encrypt` utilise l'API Web Crypto de Deno (`crypto.subtle.encrypt`) :
        -   **Algorithme :** `AES-GCM` (Galois/Counter Mode), qui fournit à la fois le chiffrement et l'authentification des données, protégeant contre les attaques de type "bit-flipping".
        -   **Vecteur d'Initialisation (IV) :** Un IV de 96 bits (12 octets) est généré aléatoirement pour chaque opération de chiffrement. C'est crucial pour la sécurité sémantique (le même texte chiffré deux fois donnera des résultats différents).
        -   **Format de Sortie :** Le résultat est `base64(IV + ciphertext)`. L'IV est préfixé au texte chiffré pour être facilement récupéré lors du déchiffrement.
    e. La fonction retourne un objet JSON contenant les champs avec leurs valeurs chiffrées.
4.  **Stockage (Client) :** Le client reçoit l'objet avec les données chiffrées et les insère dans la base de données.

### 4.1.3. Processus de Déchiffrement (`decryptBatch`)

1.  **Initiation (Client) :** Un composant (ex: `RewardCards.tsx`) appelle `decryptBatch` avec les données chiffrées récupérées de la base de données.
2.  **Appel API (Client) :** Similaire au chiffrement, une requête `fetch` authentifiée est envoyée à l'Edge Function.
3.  **Exécution (Serveur - Edge Function) :**
    a. La fonction reçoit la requête et valide le JWT.
    b. Pour chaque champ, elle exécute la fonction `decrypt`.
    c. La fonction `decrypt` :
        -   Décode la chaîne base64 en un `Uint8Array`.
        -   Extrait les 12 premiers octets comme IV.
        -   Extrait le reste des octets comme `ciphertext`.
        -   Appelle `crypto.subtle.decrypt` avec la `ENCRYPTION_KEY`, l'IV et le `ciphertext`.
        -   Retourne le texte en clair.
    d. La fonction retourne un objet JSON avec les données déchiffrées.
4.  **Affichage (Client) :** Le client reçoit les données en clair et les affiche dans l'interface utilisateur.

### 4.1.4. Gestion de la Clé de Chiffrement (`ENCRYPTION_KEY`)

-   **Format :** La clé est une chaîne hexadécimale de 64 caractères, représentant 256 bits (32 octets).
-   **Stockage :** Elle est stockée en tant que "Secret" dans le tableau de bord Supabase, ce qui la rend accessible aux Edge Functions mais pas aux clients.
-   **Rotation :** Pour une sécurité maximale, cette clé devrait être changée périodiquement (ex: tous les ans). Ce processus (non implémenté) nécessiterait une migration de données où toutes les données chiffrées seraient lues, déchiffrées avec l'ancienne clé, puis ré-chiffrées avec la nouvelle clé.

---

## 4.2. Système de Tokenisation à Double Niveau

Ce système est conçu pour permettre l'utilisation de cartes physiques sans jamais exposer un identifiant permanent et sensible lors des transactions.

-   **Fichier Clé :** `src/lib/tokenization.ts`

### 4.2.1. Le Token Permanent

-   **Objectif :** Servir d'identifiant unique et secret pour une carte physique, découplé du code de carte visible.
-   **Format :** `XXXX-XXXX-XXXX` (12 caractères alphanumériques, ex: `A3B7-K9M2-P5Q8`). L'alphabet utilisé exclut les caractères ambigus (0, O, I, 1).
-   **Génération :** Créé via `createPermanentCardToken` lors de la création d'une `reward_card`. La fonction `generateUniqueToken` assure son unicité en vérifiant la base de données.
-   **Stockage :** Dans la table `card_tokens` avec `token_type = 'permanent'`.
-   **Utilisation :** Jamais utilisé directement pour une transaction. Son seul rôle est de servir de "clé mère" pour générer des tokens temporaires.

### 4.2.2. Le Token Temporaire

-   **Objectif :** Servir de "jeton à usage unique" pour une transaction spécifique, avec une durée de vie très courte pour minimiser la fenêtre d'attaque.
-   **Durée de Vie :** **5 minutes**.
-   **Génération :** Créé via `generateTemporaryToken`. Cette fonction prend un token permanent en entrée, vérifie sa validité, puis génère un nouveau token unique.
-   **Stockage :** Dans la table `card_tokens` avec `token_type = 'temporary'` et un champ `expires_at` défini à `NOW() + 5 minutes`.

### 4.2.3. Flux de Génération et de Validation

1.  **Initiation (POS) :** L'opérateur saisit le code de carte (ex: `AB 12 3`).
2.  **Validation du Code :** Le client valide le format et le checksum Luhn via `card-validation.ts`.
3.  **Recherche de la Carte :** Le client interroge la table `reward_cards` pour trouver la carte correspondante au `card_code`.
4.  **Recherche du Token Permanent :** Avec l'ID de la carte, le client recherche dans `card_tokens` le token de type `permanent` associé.
5.  **Génération du Token Temporaire :** Le client appelle `generateTemporaryToken` avec le token permanent. Cette fonction insère le nouveau token temporaire dans la base de données.
6.  **Utilisation :** Le token temporaire est stocké dans l'état du `CheckoutDialog`. Lors de la finalisation de la commande, il est inclus dans les données de la transaction.
7.  **Validation Côté Serveur (Conceptuel) :** Avant de finaliser la commande, une fonction serveur (ou une logique client sécurisée) appellerait `validateTemporaryToken`. Cette fonction vérifie que le token est de type `temporary`, qu'il n'est pas expiré (`expires_at`), et qu'il n'a pas déjà été utilisé (`used_at` est `NULL`).
8.  **Invalidation :** Après une transaction réussie, la fonction `markTokenAsUsed` est appelée. Elle met à jour la ligne du token temporaire en définissant `used_at = NOW()` et `is_active = false`.

### 4.2.4. Nettoyage Automatique des Tokens Expirés

-   Une fonction PostgreSQL `cleanup_expired_tokens()` est définie. Elle exécute une simple requête `DELETE` sur la table `card_tokens` pour supprimer les tokens temporaires dont la date d'expiration est passée.
-   Cette fonction est configurée pour être exécutée périodiquement via un "Cron Job" Supabase, assurant que la table ne s'encombre pas de tokens invalides.

---

## 4.3. Biométrie d'Appareil (`device-fingerprint.ts`)

Ce mécanisme empêche l'accès au compte même si les identifiants sont compromis, en liant la session à un appareil physique autorisé.

### 4.3.1. Génération de l'Empreinte d'Appareil (`FingerprintJS`)

-   La fonction `generateDeviceFingerprint` utilise la bibliothèque `@fingerprintjs/fingerprintjs`.
-   Elle collecte des centaines de signaux du navigateur et du matériel (version du navigateur, polices installées, résolution d'écran, canvas fingerprinting, etc.) pour créer un `visitorId` stable et très unique.
-   En plus de l'empreinte, la fonction extrait des informations lisibles comme le nom du navigateur et de l'OS pour un affichage convivial dans le tableau de bord de gestion.

### 4.3.2. Processus d'Autorisation d'un Nouvel Appareil

1.  **Initiation :** Un utilisateur sur un appareil déjà autorisé navigue vers `/device-management` et clique sur "Ajouter un appareil".
2.  **Déverrouillage :** La fonction `unlockAccountTemporarily` est appelée. Elle insère un enregistrement spécial dans `device_fingerprints` avec `fingerprint = 'TEMPORARY_UNLOCK'` et `user_id` correspondant. Cet enregistrement a une durée de vie implicite de 5 minutes.
3.  **Connexion sur le Nouvel Appareil :** L'utilisateur se connecte depuis le nouvel appareil.
4.  **Vérification :** La logique de `FuturisticLogin.tsx` détecte que l'appareil n'est pas dans la liste des appareils autorisés. Elle appelle alors `isAccountUnlocked`.
5.  **`isAccountUnlocked`** vérifie la présence de l'enregistrement `TEMPORARY_UNLOCK` et s'assure qu'il a été créé il y a moins de 5 minutes.
6.  **Confirmation :** Si le compte est déverrouillé, une modale (`Dialog`) s'affiche, demandant à l'utilisateur de confirmer l'ajout de ce nouvel appareil.
7.  **Enregistrement :** Si l'utilisateur confirme, `registerDevice` est appelé. Cette fonction génère l'empreinte du nouvel appareil, l'insère dans `device_fingerprints`, puis appelle `lockAccount` pour supprimer l'enregistrement `TEMPORARY_UNLOCK`, fermant ainsi la fenêtre d'autorisation.

### 4.3.3. Mode de Déverrouillage Temporaire du Compte

Ce mode est implémenté non pas par une session ou un état côté client, mais par un **enregistrement d'état dans la base de données**. C'est plus sécurisé car l'état est centralisé et ne peut pas être manipulé par le client. La vérification de l'expiration se fait également en comparant le `created_at` de cet enregistrement avec l'heure actuelle du serveur.

### 4.3.4. Vérification de l'Appareil à Chaque Connexion

Le flux est impératif : `supabase.auth.signInWithPassword()` réussit **PUIS** `isDeviceAuthorized()` (ou `isAccountUnlocked()`) doit réussir. Si la deuxième étape échoue, la session Supabase est immédiatement détruite via `supabase.auth.signOut()`, et l'accès est refusé.

---

## 4.4. Mécanismes de Détection d'Intrusion (`honeypot.ts`)

Ces mécanismes sont des pièges conçus pour détecter, alerter et enregistrer les activités malveillantes.

### 4.4.1. Honeypot Accounts

-   **Implémentation :** Une simple liste de chaînes de caractères (`HONEYPOT_EMAILS`).
-   **Déclenchement :** Dans `FuturisticLogin.tsx`, la fonction `isHoneypotEmail` est appelée **avant** toute interaction avec Supabase.
-   **Action :** Si l'email est un honeypot, `triggerHoneypotAlert` est appelé. Cette fonction :
    1.  Crée un log d'audit avec une sévérité `CRITICAL`.
    2.  Insère une nouvelle ligne dans la table `security_alerts`.
    3.  Retourne une erreur générique à l'attaquant pour ne pas révéler le piège.

### 4.4.2. Canary Tokens

-   **Implémentation :** Le composant `CanaryTokenInjector` est placé dans les pages sensibles (ex: `Dashboard.tsx`).
-   **Création :** Au montage, le composant appelle `createCanaryToken`, qui génère un token unique (`CANARY_...`) et l'enregistre dans la table `canary_tokens` avec sa `location`.
-   **Détection :** Le token est rendu dans un `div` invisible. Bien que la détection de la lecture soit difficile côté client, le principal mécanisme de déclenchement serait si ce token était un jour utilisé dans une requête API (par exemple, un bot qui collecte tous les tokens et essaie de les utiliser). La logique de validation de token (`validateTemporaryToken`) devrait inclure un appel à `isCanaryToken`. Si c'est le cas, `triggerCanaryAlert` est appelé.

### 4.4.3. Honeypot Endpoints

-   **Implémentation :** Une liste de chemins d'URL (`HONEYPOT_ENDPOINTS`).
-   **Déclenchement :** La page `NotFound.tsx` (qui intercepte toutes les routes non valides) peut être modifiée pour appeler `isHoneypotEndpoint` avec le chemin demandé.
-   **Action :** Si le chemin correspond à un endpoint piège, `triggerEndpointAlert` est appelé, créant une alerte de sécurité.

### 4.4.4. Détection de Scraping

-   **Implémentation :** Un simple compteur en mémoire (`requestCount`) et un timestamp (`lastRequestTime`).
-   **Déclenchement :** La fonction `detectScraping` est appelée au tout début de `handleSubmit` dans `FuturisticLogin.tsx`. Elle incrémente le compteur et vérifie si le seuil (ex: 10 requêtes en 1 seconde) est dépassé.
-   **Action :** Si le seuil est dépassé, `triggerScrapingAlert` est appelé et la fonction de connexion est interrompue.

---

## 4.5. Chiffrement de Bout en Bout (E2E) (`e2e-encryption.ts`)

Ce module implémente une couche de chiffrement supplémentaire pour des communications futures, garantissant que même les administrateurs de la base de données ne peuvent pas lire les messages.

### 4.5.1. Architecture Hybride : RSA-4096 + AES-256-GCM

-   **RSA-4096 :** Utilisé pour le chiffrement asymétrique. Chaque utilisateur a une paire de clés. La clé publique est utilisée pour chiffrer, la clé privée pour déchiffrer. C'est lent pour de gros volumes de données, donc on ne l'utilise que pour chiffrer la clé de session.
-   **AES-256-GCM :** Utilisé pour le chiffrement symétrique du message lui-même. C'est extrêmement rapide et sécurisé.

### 4.5.2. Gestion des Paires de Clés Utilisateur

-   **Génération :** `generateKeyPair` utilise la Web Crypto API pour créer la paire de clés RSA.
-   **Stockage :**
    -   La clé publique est exportée en format `spki` (base64) et stockée en clair dans `user_encryption_keys`.
    -   La clé privée est d'abord exportée en format `pkcs8`. Ensuite, une clé est dérivée du mot de passe de l'utilisateur via `PBKDF2` (100,000 itérations). Cette clé dérivée est utilisée pour chiffrer la clé privée avec AES-GCM. Le résultat est stocké dans `encrypted_private_key`. L'utilisateur doit donc fournir son mot de passe pour déchiffrer sa propre clé privée.

### 4.5.3. Principe de "Perfect Forward Secrecy" (PFS)

-   **Implémentation :** Pour chaque message, une **nouvelle clé AES-256 est générée aléatoirement** (`generateEphemeralKey`).
-   **Flux :**
    1.  Le message est chiffré avec cette clé AES éphémère.
    2.  La clé AES éphémère est chiffrée avec la clé publique RSA du destinataire.
    3.  Le message chiffré et la clé chiffrée sont envoyés.
    4.  Le destinataire utilise sa clé privée RSA pour déchiffrer la clé AES éphémère, puis utilise cette dernière pour déchiffrer le message.
    5.  La clé AES éphémère est ensuite détruite (`destroyEphemeralKey`).
-   **Avantage :** Si un attaquant compromet une clé privée RSA à long terme, il ne peut pas déchiffrer les messages passés, car les clés AES qui les ont chiffrés n'ont jamais été stockées et n'existent plus.

---

## 4.6. Validation des Données et Algorithmes

### 4.6.1. Algorithme de Luhn pour les Codes de Carte (`card-validation.ts`)

-   **Objectif :** Prévenir les erreurs de saisie manuelle des codes de carte. C'est un algorithme de somme de contrôle (checksum).
-   **Adaptation Alphanumérique :** L'algorithme de Luhn standard ne fonctionne qu'avec des chiffres. Notre implémentation l'étend :
    1.  `alphanumericToNumeric` convertit chaque caractère du code en une représentation numérique (A=10, B=11, etc.).
    2.  `calculateLuhnCheckDigit` applique l'algorithme de Luhn sur cette chaîne numérique pour calculer le chiffre de contrôle.
-   **Génération et Validation :** `generateCardCodeWithLuhn` utilise ce processus pour générer un code valide, et `validateLuhnAlphanumeric` l'utilise pour vérifier un code saisi.

---

## 4.7. Contrôle d'Accès via RLS

### 4.7.1. Analyse des Politiques de Sécurité au Niveau des Lignes (RLS)

-   **Principe :** RLS est activé sur **toutes les tables** contenant des données sensibles ou spécifiques à un utilisateur.
-   **Exemple Concret (`products`) :**
    ```sql
    CREATE POLICY "products_select_policy" ON products
    FOR SELECT TO authenticated USING (auth.uid() = user_id);
    ```
    Lorsqu'un utilisateur authentifié exécute `supabase.from('products').select('*')`, Supabase traduit cela en une requête SQL. Avant d'exécuter la requête, PostgreSQL ajoute automatiquement la condition `WHERE auth.uid() = 'uuid-de-l-utilisateur'`, garantissant que seuls les produits créés par cet utilisateur sont retournés.

### 4.7.2. Principe du Moindre Privilège Appliqué à la Base de Données

-   RLS est l'incarnation de ce principe. Un utilisateur ne se voit pas accorder un accès général à une table, mais seulement un accès aux **lignes spécifiques** qui lui appartiennent.
-   **`WITH CHECK` Clause :** Pour les politiques `INSERT` et `UPDATE`, la clause `WITH CHECK` est utilisée.
    ```sql
    CREATE POLICY "products_insert_policy" ON products
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
    ```
    Cela empêche un utilisateur d'insérer ou de modifier une ligne en lui attribuant un `user_id` qui n'est pas le sien. C'est une protection cruciale contre les tentatives d'escalade de privilèges au niveau des données.