import { supabase } from '@/integrations/supabase/client';

const CRYPTO_FUNCTION_URL = 'https://mtnhoyrlvnotwypctrsp.supabase.co/functions/v1/crypto-service';

export const encryptData = async (plaintext: string): Promise<string> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  const response = await fetch(CRYPTO_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify({
      action: 'encrypt',
      data: plaintext,
    }),
  });

  if (!response.ok) {
    throw new Error('Encryption failed');
  }

  const result = await response.json();
  return result.encrypted;
};

export const decryptData = async (encryptedData: string): Promise<string> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  const response = await fetch(CRYPTO_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify({
      action: 'decrypt',
      data: encryptedData,
    }),
  });

  if (!response.ok) {
    throw new Error('Decryption failed');
  }

  const result = await response.json();
  return result.decrypted;
};

export const encryptBatch = async (data: { [key: string]: string }): Promise<{ [key: string]: string }> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  const response = await fetch(CRYPTO_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify({
      action: 'encrypt_batch',
      data,
    }),
  });

  if (!response.ok) {
    throw new Error('Batch encryption failed');
  }

  const result = await response.json();
  return result.encrypted;
};

export const decryptBatch = async (data: { [key: string]: string }): Promise<{ [key: string]: string }> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  const response = await fetch(CRYPTO_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify({
      action: 'decrypt_batch',
      data,
    }),
  });

  if (!response.ok) {
    throw new Error('Batch decryption failed');
  }

  const result = await response.json();
  return result.decrypted;
};