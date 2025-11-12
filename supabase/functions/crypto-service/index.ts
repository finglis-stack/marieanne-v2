// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Fonction pour convertir une clé en format CryptoKey
async function getEncryptionKey(): Promise<CryptoKey> {
  const keyString = Deno.env.get('ENCRYPTION_KEY');
  if (!keyString) {
    throw new Error('ENCRYPTION_KEY not configured');
  }
  
  // Convertir la clé hexadécimale en ArrayBuffer
  const keyData = new Uint8Array(keyString.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
  
  return await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Fonction de chiffrement
async function encrypt(plaintext: string): Promise<string> {
  const key = await getEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96 bits pour GCM
  
  const encodedText = new TextEncoder().encode(plaintext);
  
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encodedText
  );
  
  // Combiner IV + ciphertext et encoder en base64
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

// Fonction de déchiffrement
async function decrypt(encryptedData: string): Promise<string> {
  const key = await getEncryptionKey();
  
  // Décoder depuis base64
  const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
  
  // Extraire IV et ciphertext
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );
  
  return new TextDecoder().decode(decrypted);
}

// 📊 Fonction de logging sécurisé
function logSecurityEvent(event: string, userId: string, email: string, action: string, success: boolean) {
  const timestamp = new Date().toISOString();
  console.log(JSON.stringify({
    timestamp,
    event,
    userId,
    email,
    action,
    success,
    service: 'crypto-service'
  }));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const startTime = Date.now();
  let userId = 'anonymous';
  let userEmail = 'unknown';

  try {
    // 🔒 VÉRIFICATION DE L'AUTHENTIFICATION
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      logSecurityEvent('AUTH_FAILED', 'anonymous', 'unknown', 'missing_header', false);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Missing Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Vérifier le JWT avec Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      logSecurityEvent('AUTH_FAILED', 'anonymous', 'unknown', 'invalid_token', false);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    userId = user.id;
    userEmail = user.email || 'no-email';

    const { action, data } = await req.json();

    if (action === 'encrypt') {
      const encrypted = await encrypt(data);
      const duration = Date.now() - startTime;
      logSecurityEvent('ENCRYPT', userId, userEmail, 'single', true);
      console.log(`[PERF] Encryption took ${duration}ms`);
      return new Response(
        JSON.stringify({ encrypted }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'decrypt') {
      const decrypted = await decrypt(data);
      const duration = Date.now() - startTime;
      logSecurityEvent('DECRYPT', userId, userEmail, 'single', true);
      console.log(`[PERF] Decryption took ${duration}ms`);
      return new Response(
        JSON.stringify({ decrypted }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'encrypt_batch') {
      const results: { [key: string]: string } = {};
      const fieldCount = Object.keys(data).length;
      
      for (const [key, value] of Object.entries(data)) {
        if (value && typeof value === 'string') {
          results[key] = await encrypt(value);
        }
      }
      
      const duration = Date.now() - startTime;
      logSecurityEvent('ENCRYPT_BATCH', userId, userEmail, `${fieldCount}_fields`, true);
      console.log(`[PERF] Batch encryption (${fieldCount} fields) took ${duration}ms`);
      
      return new Response(
        JSON.stringify({ encrypted: results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'decrypt_batch') {
      const results: { [key: string]: string } = {};
      const fieldCount = Object.keys(data).length;
      
      for (const [key, value] of Object.entries(data)) {
        if (value && typeof value === 'string') {
          results[key] = await decrypt(value);
        }
      }
      
      const duration = Date.now() - startTime;
      logSecurityEvent('DECRYPT_BATCH', userId, userEmail, `${fieldCount}_fields`, true);
      console.log(`[PERF] Batch decryption (${fieldCount} fields) took ${duration}ms`);
      
      return new Response(
        JSON.stringify({ decrypted: results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logSecurityEvent('INVALID_ACTION', userId, userEmail, action, false);
    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const duration = Date.now() - startTime;
    logSecurityEvent('ERROR', userId, userEmail, 'exception', false);
    console.error(`[ERROR] Crypto service error after ${duration}ms:`, error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})