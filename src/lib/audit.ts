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
 * Calcule le hash SHA-256 d'une entrée de log
 * CORRECTION : On utilise timestampEpoch au lieu de la string de date pour éviter les erreurs de format DB
 */
const calculateLogHash = async (
  previousHash: string,
  userId: string | null,
  action: string,
  resourceType: string,
  resourceId: string | null,
  details: any,
  timestampEpoch: number // Changement ici : nombre au lieu de string
): Promise<string> => {
  const dataObject = {
    previousHash,
    userId,
    action,
    resourceType,
    resourceId,
    details: details ? canonicalize(details) : null,
    timestamp: timestampEpoch // On hache le nombre
  };

  const dataString = JSON.stringify(dataObject);
  const msgBuffer = new TextEncoder().encode(dataString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
};

/**
 * Crée un log d'audit sécurisé
 */
export const createAuditLog = async (data: AuditLogData): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const now = new Date();
    const createdAtISO = now.toISOString();
    const timestampEpoch = now.getTime(); // Précision ms
    
    const { data: lastLog } = await supabase
      .from('audit_logs')
      .select('hash')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const previousHash = lastLog?.hash || '0000000000000000000000000000000000000000000000000000000000000000';

    const currentHash = await calculateLogHash(
      previousHash,
      user?.id || null,
      data.action,
      data.resourceType,
      data.resourceId || null,
      data.details,
      timestampEpoch
    );

    await supabase
      .from('audit_logs')
      .insert({
        user_id: user?.id,
        user_email: user?.email,
        action: data.action,
        resource_type: data.resourceType,
        resource_id: data.resourceId,
        details: data.details,
        ip_address: null,
        user_agent: navigator.userAgent,
        created_at: createdAtISO,
        hash: currentHash,
        previous_hash: previousHash
      });
      
  } catch (error) {
    console.error('Erreur critique lors de la création du log d\'audit:', error);
  }
};

/**
 * Vérifie l'intégrité de la chaîne de logs
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
    
    if (i > 0) {
      const previousLog = logs[i - 1];
      if (currentLog.previous_hash !== previousLog.hash) {
        console.error(`Rupture de chaîne détectée au log ${currentLog.id}`);
        return { valid: false, corruptedBlockId: currentLog.id, totalChecked: i + 1 };
      }
    }

    if (currentLog.hash) {
      // CORRECTION : On convertit la date DB en timestamp Unix pour la vérification
      const dbDate = new Date(currentLog.created_at);
      const timestampEpoch = dbDate.getTime();

      const recalculatedHash = await calculateLogHash(
        currentLog.previous_hash || '0000000000000000000000000000000000000000000000000000000000000000',
        currentLog.user_id,
        currentLog.action,
        currentLog.resource_type,
        currentLog.resource_id,
        currentLog.details,
        timestampEpoch
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