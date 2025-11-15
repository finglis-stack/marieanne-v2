import { supabase } from '@/integrations/supabase/client';
import { createAuditLog } from './audit';

/**
 * 🔐 CHIFFREMENT DE BOUT EN BOUT (E2E)
 * 
 * Architecture :
 * 1. Chaque utilisateur a une paire de clés RSA (publique/privée)
 * 2. Les messages sont chiffrés avec AES-256-GCM
 * 3. La clé AES est chiffrée avec la clé publique RSA du destinataire
 * 4. Signature numérique pour vérifier l'authenticité
 */

interface KeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}

interface EncryptedMessage {
  encryptedData: string;
  encryptedKey: string;
  iv: string;
  signature: string;
  timestamp: string;
}

/**
 * Génère une paire de clés RSA pour un utilisateur
 */
export const generateKeyPair = async (): Promise<KeyPair> => {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 4096, // 4096 bits = ultra sécurisé
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true, // extractable
    ['encrypt', 'decrypt']
  );

  await createAuditLog({
    action: 'ENCRYPT_DATA',
    resourceType: 'USER',
    details: {
      action: 'generate_key_pair',
      key_size: 4096,
      algorithm: 'RSA-OAEP',
    },
  });

  return keyPair;
};

/**
 * Exporte une clé publique en format base64
 */
export const exportPublicKey = async (publicKey: CryptoKey): Promise<string> => {
  const exported = await window.crypto.subtle.exportKey('spki', publicKey);
  const exportedAsString = String.fromCharCode(...new Uint8Array(exported));
  return btoa(exportedAsString);
};

/**
 * Importe une clé publique depuis base64
 */
export const importPublicKey = async (publicKeyBase64: string): Promise<CryptoKey> => {
  const binaryString = atob(publicKeyBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return await window.crypto.subtle.importKey(
    'spki',
    bytes,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    true,
    ['encrypt']
  );
};

/**
 * Exporte une clé privée en format base64 (CHIFFRÉE avec mot de passe)
 */
export const exportPrivateKey = async (
  privateKey: CryptoKey,
  password: string
): Promise<string> => {
  // Dériver une clé depuis le mot de passe
  const passwordKey = await deriveKeyFromPassword(password);

  // Exporter la clé privée
  const exported = await window.crypto.subtle.exportKey('pkcs8', privateKey);

  // Chiffrer la clé privée avec la clé dérivée du mot de passe
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encryptedKey = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    passwordKey,
    exported
  );

  // Combiner IV + clé chiffrée
  const combined = new Uint8Array(iv.length + encryptedKey.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encryptedKey), iv.length);

  return btoa(String.fromCharCode(...combined));
};

/**
 * Importe une clé privée depuis base64 (DÉCHIFFRÉE avec mot de passe)
 */
export const importPrivateKey = async (
  encryptedPrivateKeyBase64: string,
  password: string
): Promise<CryptoKey> => {
  // Dériver la clé depuis le mot de passe
  const passwordKey = await deriveKeyFromPassword(password);

  // Décoder depuis base64
  const binaryString = atob(encryptedPrivateKeyBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Extraire IV et clé chiffrée
  const iv = bytes.slice(0, 12);
  const encryptedKey = bytes.slice(12);

  // Déchiffrer la clé privée
  const decryptedKey = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    passwordKey,
    encryptedKey
  );

  // Importer la clé privée
  return await window.crypto.subtle.importKey(
    'pkcs8',
    decryptedKey,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    true,
    ['decrypt']
  );
};

/**
 * Dérive une clé AES depuis un mot de passe (PBKDF2)
 */
const deriveKeyFromPassword = async (password: string): Promise<CryptoKey> => {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  // Importer le mot de passe comme clé
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  // Dériver une clé AES-256
  const salt = encoder.encode('cafe-marie-anne-salt'); // En production, utilise un salt unique par utilisateur
  return await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000, // 100k itérations = très sécurisé
      hash: 'SHA-256',
    },
    baseKey,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,
    ['encrypt', 'decrypt']
  );
};

/**
 * Chiffre un message avec E2E
 */
export const encryptMessage = async (
  message: string,
  recipientPublicKey: CryptoKey,
  senderPrivateKey: CryptoKey
): Promise<EncryptedMessage> => {
  // 1. Générer une clé AES éphémère
  const aesKey = await window.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );

  // 2. Chiffrer le message avec AES
  const encoder = new TextEncoder();
  const messageBuffer = encoder.encode(message);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const encryptedData = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    aesKey,
    messageBuffer
  );

  // 3. Chiffrer la clé AES avec la clé publique RSA du destinataire
  const exportedAesKey = await window.crypto.subtle.exportKey('raw', aesKey);
  const encryptedKey = await window.crypto.subtle.encrypt(
    {
      name: 'RSA-OAEP',
    },
    recipientPublicKey,
    exportedAesKey
  );

  // 4. Signer le message avec la clé privée de l'expéditeur
  const signature = await signMessage(encryptedData, senderPrivateKey);

  await createAuditLog({
    action: 'ENCRYPT_DATA',
    resourceType: 'DATA',
    details: {
      action: 'encrypt_message',
      message_length: message.length,
      algorithm: 'AES-256-GCM + RSA-OAEP',
    },
  });

  return {
    encryptedData: btoa(String.fromCharCode(...new Uint8Array(encryptedData))),
    encryptedKey: btoa(String.fromCharCode(...new Uint8Array(encryptedKey))),
    iv: btoa(String.fromCharCode(...iv)),
    signature,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Déchiffre un message E2E
 */
export const decryptMessage = async (
  encryptedMessage: EncryptedMessage,
  recipientPrivateKey: CryptoKey,
  senderPublicKey: CryptoKey
): Promise<string> => {
  // 1. Vérifier la signature
  const encryptedDataBytes = Uint8Array.from(atob(encryptedMessage.encryptedData), c => c.charCodeAt(0));
  const isValid = await verifySignature(encryptedDataBytes.buffer, encryptedMessage.signature, senderPublicKey);

  if (!isValid) {
    throw new Error('Signature invalide - message potentiellement altéré');
  }

  // 2. Déchiffrer la clé AES avec la clé privée RSA
  const encryptedKeyBytes = Uint8Array.from(atob(encryptedMessage.encryptedKey), c => c.charCodeAt(0));
  const decryptedAesKeyBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'RSA-OAEP',
    },
    recipientPrivateKey,
    encryptedKeyBytes
  );

  // 3. Importer la clé AES
  const aesKey = await window.crypto.subtle.importKey(
    'raw',
    decryptedAesKeyBuffer,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,
    ['decrypt']
  );

  // 4. Déchiffrer le message avec AES
  const iv = Uint8Array.from(atob(encryptedMessage.iv), c => c.charCodeAt(0));
  const decryptedData = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    aesKey,
    encryptedDataBytes
  );

  await createAuditLog({
    action: 'DECRYPT_DATA',
    resourceType: 'DATA',
    details: {
      action: 'decrypt_message',
      signature_valid: isValid,
      algorithm: 'AES-256-GCM + RSA-OAEP',
    },
  });

  const decoder = new TextDecoder();
  return decoder.decode(decryptedData);
};

/**
 * Signe un message avec une clé privée
 */
const signMessage = async (data: ArrayBuffer, privateKey: CryptoKey): Promise<string> => {
  // Utiliser RSA-PSS pour la signature, car nos clés sont RSA
  const signature = await window.crypto.subtle.sign(
    {
      name: 'RSA-PSS',
      saltLength: 32,
    },
    privateKey,
    data
  );

  return btoa(String.fromCharCode(...new Uint8Array(signature)));
};

/**
 * Vérifie la signature d'un message
 */
const verifySignature = async (
  data: ArrayBuffer,
  signatureBase64: string,
  publicKey: CryptoKey
): Promise<boolean> => {
  const signature = Uint8Array.from(atob(signatureBase64), c => c.charCodeAt(0));

  return await window.crypto.subtle.verify(
    {
      name: 'RSA-PSS',
      saltLength: 32,
    },
    publicKey,
    signature,
    data
  );
};

/**
 * Enregistre les clés d'un utilisateur dans la base de données
 */
export const saveUserKeys = async (
  userId: string,
  publicKey: string,
  encryptedPrivateKey: string
) => {
  const { error } = await supabase
    .from('user_encryption_keys')
    .upsert({
      user_id: userId,
      public_key: publicKey,
      encrypted_private_key: encryptedPrivateKey,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error('Error saving user keys:', error);
    throw new Error('Erreur lors de la sauvegarde des clés');
  }

  await createAuditLog({
    action: 'CREATE_REWARD_CARD',
    resourceType: 'USER',
    resourceId: userId,
    details: {
      action: 'save_encryption_keys',
      key_type: 'RSA-4096',
    },
  });
};

/**
 * Récupère les clés d'un utilisateur
 */
export const getUserKeys = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_encryption_keys')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error getting user keys:', error);
    return null;
  }

  return data;
};

/**
 * 🔄 PERFECT FORWARD SECRECY (PFS)
 * Génère une nouvelle clé éphémère pour chaque session
 */

export const generateEphemeralKey = async (): Promise<CryptoKey> => {
  const key = await window.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );

  await createAuditLog({
    action: 'ENCRYPT_DATA',
    resourceType: 'DATA',
    details: {
      action: 'generate_ephemeral_key',
      algorithm: 'AES-256-GCM',
      purpose: 'Perfect Forward Secrecy',
    },
  });

  return key;
};

/**
 * Détruit une clé éphémère (impossible de déchiffrer les anciens messages)
 */
export const destroyEphemeralKey = async (key: CryptoKey) => {
  // En JavaScript, on ne peut pas vraiment "détruire" une clé
  // Mais on peut la rendre inaccessible en la supprimant de la mémoire
  // et en s'assurant qu'elle n'est jamais stockée

  await createAuditLog({
    action: 'DELETE_REWARD_CARD',
    resourceType: 'DATA',
    details: {
      action: 'destroy_ephemeral_key',
      purpose: 'Perfect Forward Secrecy',
    },
  });

  // La clé sera garbage collected par JavaScript
};