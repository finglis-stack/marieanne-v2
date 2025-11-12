import { supabase } from '@/integrations/supabase/client';
import { createAuditLog } from './audit';

/**
 * Génère un token alphanumérique aléatoire
 * Format: XXXX-XXXX-XXXX (12 caractères + 2 tirets)
 * Exemple: A3B7-K9M2-P5Q8
 */
export const generateToken = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Pas de 0, O, I, 1 pour éviter confusion
  let token = '';
  
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) {
      token += '-';
    }
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return token;
};

/**
 * Vérifie si un token existe déjà
 */
export const tokenExists = async (token: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('card_tokens')
    .select('id')
    .eq('token', token)
    .single();

  return !error && !!data;
};

/**
 * Génère un token unique (vérifie qu'il n'existe pas déjà)
 */
export const generateUniqueToken = async (): Promise<string> => {
  let token = generateToken();
  let attempts = 0;
  const maxAttempts = 10;

  while (await tokenExists(token) && attempts < maxAttempts) {
    token = generateToken();
    attempts++;
  }

  if (attempts >= maxAttempts) {
    throw new Error('Impossible de générer un token unique');
  }

  return token;
};

/**
 * Crée un token PERMANENT pour une carte récompense
 * Ce token est stocké physiquement sur la carte
 */
export const createPermanentCardToken = async (rewardCardId: string): Promise<string> => {
  const token = await generateUniqueToken();

  const { error } = await supabase
    .from('card_tokens')
    .insert({
      reward_card_id: rewardCardId,
      token,
      token_type: 'permanent',
      is_active: true,
    });

  if (error) {
    throw new Error('Erreur lors de la création du token permanent');
  }

  await createAuditLog({
    action: 'CREATE_REWARD_CARD',
    resourceType: 'TOKEN',
    resourceId: rewardCardId,
    details: {
      token_type: 'permanent',
      token_length: token.length,
    },
  });

  return token;
};

/**
 * Génère un token TEMPORAIRE (5 minutes) pour le checkout
 * Ce token est généré à la demande et expire automatiquement
 */
export const generateTemporaryToken = async (permanentToken: string): Promise<string> => {
  // Vérifier que le token permanent existe et est actif
  const { data: permanentTokenData, error: permanentError } = await supabase
    .from('card_tokens')
    .select('reward_card_id, is_active')
    .eq('token', permanentToken)
    .eq('token_type', 'permanent')
    .single();

  if (permanentError || !permanentTokenData) {
    await createAuditLog({
      action: 'VALIDATE_TOKEN',
      resourceType: 'TOKEN',
      details: {
        error: 'Token permanent invalide',
        token: permanentToken,
      },
    });
    throw new Error('Token permanent invalide');
  }

  if (!permanentTokenData.is_active) {
    await createAuditLog({
      action: 'VALIDATE_TOKEN',
      resourceType: 'TOKEN',
      details: {
        error: 'Token permanent inactif',
        token: permanentToken,
      },
    });
    throw new Error('Token permanent inactif');
  }

  // Générer un nouveau token temporaire
  const temporaryToken = await generateUniqueToken();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 5); // Expire dans 5 minutes

  const { error: insertError } = await supabase
    .from('card_tokens')
    .insert({
      reward_card_id: permanentTokenData.reward_card_id,
      token: temporaryToken,
      token_type: 'temporary',
      expires_at: expiresAt.toISOString(),
      is_active: true,
    });

  if (insertError) {
    throw new Error('Erreur lors de la création du token temporaire');
  }

  await createAuditLog({
    action: 'CREATE_REWARD_CARD',
    resourceType: 'TOKEN',
    resourceId: permanentTokenData.reward_card_id,
    details: {
      token_type: 'temporary',
      expires_at: expiresAt.toISOString(),
      generated_from: 'permanent_token',
    },
  });

  return temporaryToken;
};

/**
 * Valide un token TEMPORAIRE pour le checkout
 * Vérifie que le token existe, est actif et n'a pas expiré
 */
export const validateTemporaryToken = async (temporaryToken: string): Promise<any> => {
  const { data: tokenData, error: tokenError } = await supabase
    .from('card_tokens')
    .select('reward_card_id, is_active, expires_at, used_at')
    .eq('token', temporaryToken)
    .eq('token_type', 'temporary')
    .single();

  if (tokenError || !tokenData) {
    await createAuditLog({
      action: 'VALIDATE_TOKEN',
      resourceType: 'TOKEN',
      details: {
        error: 'Token temporaire invalide',
        token: temporaryToken,
      },
    });
    throw new Error('Token temporaire invalide');
  }

  if (!tokenData.is_active) {
    await createAuditLog({
      action: 'VALIDATE_TOKEN',
      resourceType: 'TOKEN',
      details: {
        error: 'Token temporaire inactif',
        token: temporaryToken,
      },
    });
    throw new Error('Token temporaire inactif');
  }

  // Vérifier l'expiration
  const now = new Date();
  const expiresAt = new Date(tokenData.expires_at);
  
  if (now > expiresAt) {
    await createAuditLog({
      action: 'VALIDATE_TOKEN',
      resourceType: 'TOKEN',
      details: {
        error: 'Token temporaire expiré',
        token: temporaryToken,
        expires_at: tokenData.expires_at,
      },
    });
    throw new Error('Token temporaire expiré');
  }

  // Vérifier si le token a déjà été utilisé
  if (tokenData.used_at) {
    await createAuditLog({
      action: 'VALIDATE_TOKEN',
      resourceType: 'TOKEN',
      details: {
        error: 'Token temporaire déjà utilisé',
        token: temporaryToken,
        used_at: tokenData.used_at,
      },
    });
    throw new Error('Token temporaire déjà utilisé');
  }

  // Récupérer les informations de la carte
  const { data: cardData, error: cardError } = await supabase
    .from('reward_cards')
    .select('*, customer_profiles(*)')
    .eq('id', tokenData.reward_card_id)
    .single();

  if (cardError || !cardData) {
    await createAuditLog({
      action: 'VALIDATE_TOKEN',
      resourceType: 'TOKEN',
      details: {
        error: 'Carte non trouvée',
        token: temporaryToken,
      },
    });
    throw new Error('Carte non trouvée');
  }

  await createAuditLog({
    action: 'VALIDATE_TOKEN',
    resourceType: 'TOKEN',
    resourceId: tokenData.reward_card_id,
    details: {
      success: true,
      token_type: 'temporary',
      customer_profile_id: cardData.customer_profile_id,
    },
  });

  return cardData;
};

/**
 * Marque un token temporaire comme utilisé
 * Empêche la réutilisation du même token
 */
export const markTokenAsUsed = async (temporaryToken: string): Promise<void> => {
  const { error } = await supabase
    .from('card_tokens')
    .update({
      used_at: new Date().toISOString(),
      is_active: false,
    })
    .eq('token', temporaryToken)
    .eq('token_type', 'temporary');

  if (error) {
    console.error('Erreur lors du marquage du token comme utilisé:', error);
  }

  await createAuditLog({
    action: 'UPDATE_REWARD_CARD',
    resourceType: 'TOKEN',
    details: {
      action: 'mark_as_used',
      token_type: 'temporary',
    },
  });
};

/**
 * Nettoie les tokens temporaires expirés
 * À appeler périodiquement (cron job ou manuellement)
 */
export const cleanupExpiredTokens = async (): Promise<number> => {
  const { data, error } = await supabase
    .from('card_tokens')
    .delete()
    .eq('token_type', 'temporary')
    .lt('expires_at', new Date().toISOString())
    .select();

  if (error) {
    console.error('Erreur lors du nettoyage des tokens expirés:', error);
    return 0;
  }

  const count = data?.length || 0;

  if (count > 0) {
    await createAuditLog({
      action: 'DELETE_REWARD_CARD',
      resourceType: 'TOKEN',
      details: {
        action: 'cleanup_expired_tokens',
        count,
      },
    });
  }

  return count;
};

/**
 * Valide le format d'un token (permanent ou temporaire)
 */
export const validateTokenFormat = (token: string): boolean => {
  // Format: XXXX-XXXX-XXXX
  const regex = /^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/;
  return regex.test(token);
};

/**
 * Récupère tous les tokens actifs pour une carte
 */
export const getActiveTokensForCard = async (rewardCardId: string): Promise<any[]> => {
  const { data, error } = await supabase
    .from('card_tokens')
    .select('*')
    .eq('reward_card_id', rewardCardId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erreur lors de la récupération des tokens:', error);
    return [];
  }

  return data || [];
};

/**
 * Révoque tous les tokens temporaires pour une carte
 * Utile en cas de perte/vol de carte
 */
export const revokeAllTemporaryTokens = async (rewardCardId: string): Promise<number> => {
  const { data, error } = await supabase
    .from('card_tokens')
    .update({ is_active: false })
    .eq('reward_card_id', rewardCardId)
    .eq('token_type', 'temporary')
    .select();

  if (error) {
    console.error('Erreur lors de la révocation des tokens:', error);
    return 0;
  }

  const count = data?.length || 0;

  if (count > 0) {
    await createAuditLog({
      action: 'UPDATE_REWARD_CARD',
      resourceType: 'TOKEN',
      resourceId: rewardCardId,
      details: {
        action: 'revoke_all_temporary_tokens',
        count,
      },
    });
  }

  return count;
};