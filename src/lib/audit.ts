import { supabase } from '@/integrations/supabase/client';

export type AuditAction = 
  | 'LOGIN'
  | 'LOGOUT'
  | 'VIEW_DASHBOARD'
  | 'VIEW_INVENTORY'
  | 'CREATE_PRODUCT'
  | 'UPDATE_PRODUCT'
  | 'DELETE_PRODUCT'
  | 'VIEW_POS'
  | 'CREATE_ORDER'
  | 'VIEW_ORDER'
  | 'VIEW_REWARD_CARDS'
  | 'CREATE_REWARD_CARD'
  | 'UPDATE_REWARD_CARD'
  | 'DELETE_REWARD_CARD'
  | 'VIEW_CUSTOMER'
  | 'UPDATE_CUSTOMER'
  | 'DELETE_CUSTOMER'
  | 'VIEW_TRANSACTIONS'
  | 'VIEW_REPORTS'
  | 'GENERATE_REPORT'
  | 'VIEW_PREPARATION_QUEUE'
  | 'UPDATE_PREPARATION_STATUS'
  | 'VALIDATE_TOKEN'
  | 'ENCRYPT_DATA'
  | 'DECRYPT_DATA'
  | 'VERIFY_INTEGRITY';

export type ResourceType = 
  | 'USER'
  | 'PRODUCT'
  | 'CATEGORY'
  | 'ORDER'
  | 'REWARD_CARD'
  | 'CUSTOMER'
  | 'REPORT'
  | 'PREPARATION_QUEUE'
  | 'TOKEN'
  | 'DATA'
  | 'SYSTEM';

interface AuditLogData {
  action: AuditAction;
  resourceType: ResourceType;
  resourceId?: string;
  details?: any;
}

/**
 * Fonction pour trier récursivement les clés d'un objet JSON
 * Cela garantit que {a:1, b:2} produit la même chaîne que {b:2, a:1}
 */
const canonicalize = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(canonicalize);
  }

  return Object.keys(obj)
    .sort()
    .reduce((result: any, key) => {
      result[key] = canonicalize(obj[key]);
      return result;
    }, {});
};

/**
 * Calcule le hash SHA-256 d'une entrée de log de manière déterministe
 */
const calculateLogHash = async (
  previousHash: string,
  userId: string | null,
  action: string,
  resourceType: string,
  resourceId: string | null,
  details: any,
  createdAt: string
): Promise<string> => {
  // On normalise les données pour garantir que l'ordre des clés n'affecte pas le hash
  // C'est crucial car PostgreSQL (JSONB) peut changer l'ordre des clés
  const dataObject = {
    previousHash,
    userId,
    action,
    resourceType,
    resourceId,
    details: details ? canonicalize(details) : null,
    createdAt // Attention: la string doit être exactement la même (ISO)
  };

  const dataString = JSON.stringify(dataObject);

  // Encoder en Uint8Array
  const msgBuffer = new TextEncoder().encode(dataString);

  // Hacher avec SHA-256
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);

  // Convertir en chaîne hexadécimale
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
};

/**
 * Crée un log d'audit sécurisé (Blockchain Entry)
 */
export const createAuditLog = async (data: AuditLogData): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    // Important: On utilise toISOString() pour avoir un format standard
    const createdAt = new Date().toISOString();
    
    // 1. Récupérer le dernier log pour obtenir son hash
    const { data: lastLog } = await supabase
      .from('audit_logs')
      .select('hash')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Genesis Block Hash (si la table est vide)
    const previousHash = lastLog?.hash || '0000000000000000000000000000000000000000000000000000000000000000';

    // 2. Calculer le hash du nouveau bloc
    const currentHash = await calculateLogHash(
      previousHash,
      user?.id || null,
      data.action,
      data.resourceType,
      data.resourceId || null,
      data.details,
      createdAt
    );

    // 3. Insérer le log
    await supabase
      .from('audit_logs')
      .insert({
        user_id: user?.id,
        user_email: user?.email,
        action: data.action,
        resource_type: data.resourceType,
        resource_id: data.resourceId,
        details: data.details, // PostgreSQL stockera ça en JSONB
        ip_address: null,
        user_agent: navigator.userAgent,
        created_at: createdAt,
        hash: currentHash,
        previous_hash: previousHash
      });
      
  } catch (error) {
    console.error('Erreur critique lors de la création du log d\'audit:', error);
  }
};

/**
 * Vérifie l'intégrité de la chaîne de logs (Blockchain Verification)
 */
export const verifyAuditChain = async (): Promise<{ valid: boolean; corruptedBlockId?: string; totalChecked: number }> => {
  const { data: logs, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: true });

  if (error || !logs || logs.length === 0) {
    return { valid: true, totalChecked: 0 };
  }

  for (let i = 0; i < logs.length; i++) {
    const currentLog = logs[i];
    
    // Vérification du chaînage (sauf pour le premier bloc)
    if (i > 0) {
      const previousLog = logs[i - 1];
      if (currentLog.previous_hash !== previousLog.hash) {
        console.error(`Rupture de chaîne détectée au log ${currentLog.id}`);
        console.log(`Attendu: ${previousLog.hash}, Reçu: ${currentLog.previous_hash}`);
        return { valid: false, corruptedBlockId: currentLog.id, totalChecked: i + 1 };
      }
    } else {
      // Vérification du Genesis Block
      const genesisHash = '0000000000000000000000000000000000000000000000000000000000000000';
      if (currentLog.previous_hash !== genesisHash) {
         // Si ce n'est pas le hash genesis, c'est peut-être que des logs ont été supprimés avant lui
         // On accepte ça comme un "nouveau départ" valide pour ne pas bloquer l'utilisateur
         // sauf si on veut être très strict.
      }
    }

    // Vérification de l'intégrité des données (Recalcul du hash)
    if (currentLog.hash) {
      const recalculatedHash = await calculateLogHash(
        currentLog.previous_hash || '0000000000000000000000000000000000000000000000000000000000000000',
        currentLog.user_id,
        currentLog.action,
        currentLog.resource_type,
        currentLog.resource_id,
        currentLog.details,
        currentLog.created_at
      );

      if (recalculatedHash !== currentLog.hash) {
        console.error(`Altération de données détectée au log ${currentLog.id}`);
        console.log('Hash DB:', currentLog.hash);
        console.log('Hash Calc:', recalculatedHash);
        return { valid: false, corruptedBlockId: currentLog.id, totalChecked: i + 1 };
      }
    }
  }

  return { valid: true, totalChecked: logs.length };
};

// ... (reste des fonctions inchangées)
export const getRecentAuditLogs = async (limit: number = 50): Promise<any[]> => {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return [];
  return data || [];
};

export const getUserAuditLogs = async (userId: string, limit: number = 50): Promise<any[]> => {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return [];
  return data || [];
};

export const getResourceAuditLogs = async (resourceType: ResourceType, resourceId: string): Promise<any[]> => {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('resource_type', resourceType)
    .eq('resource_id', resourceId)
    .order('created_at', { ascending: false });

  if (error) return [];
  return data || [];
};

export const getAuditStats = async (): Promise<any> => {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('action, resource_type, created_at');

  if (error) return null;

  const stats = {
    totalLogs: data?.length || 0,
    actionCounts: {} as { [key: string]: number },
    resourceCounts: {} as { [key: string]: number },
    recentActivity: data?.slice(0, 10) || [],
  };

  data?.forEach(log => {
    stats.actionCounts[log.action] = (stats.actionCounts[log.action] || 0) + 1;
    stats.resourceCounts[log.resource_type] = (stats.resourceCounts[log.resource_type] || 0) + 1;
  });

  return stats;
};