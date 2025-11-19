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
  | 'VERIFY_INTEGRITY'; // Nouvelle action pour l'audit de l'audit

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
 * Calcule le hash SHA-256 d'une entrée de log
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
  // Créer une chaîne unique représentant le bloc
  const dataString = JSON.stringify({
    previousHash,
    userId,
    action,
    resourceType,
    resourceId,
    details,
    createdAt
  });

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
    const createdAt = new Date().toISOString();
    
    // 1. Récupérer le dernier log pour obtenir son hash (le "previous_hash" du nouveau bloc)
    const { data: lastLog } = await supabase
      .from('audit_logs')
      .select('hash')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Si c'est le tout premier log (Genesis Block), on utilise un hash de zéros
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

    // 3. Insérer le log avec les preuves cryptographiques
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
        created_at: createdAt,
        hash: currentHash,
        previous_hash: previousHash
      });
      
  } catch (error) {
    console.error('Erreur critique lors de la création du log d\'audit:', error);
    // En cas d'échec de la blockchain, on devrait idéalement alerter les admins
  }
};

/**
 * Vérifie l'intégrité de la chaîne de logs (Blockchain Verification)
 * Retourne true si la chaîne est valide, false sinon.
 * Retourne aussi l'index du bloc corrompu si trouvé.
 */
export const verifyAuditChain = async (): Promise<{ valid: boolean; corruptedBlockId?: string; totalChecked: number }> => {
  // Récupérer tous les logs triés par date (du plus vieux au plus récent)
  // Note: En production avec des millions de logs, on ferait ça par lots (batching)
  const { data: logs, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: true });

  if (error || !logs || logs.length === 0) {
    return { valid: true, totalChecked: 0 };
  }

  // Vérifier le Genesis Block (le premier log)
  // Pour simplifier, on assume que le premier log récupéré a un previous_hash de zéros 
  // ou on commence la vérification à partir du deuxième.
  
  for (let i = 0; i < logs.length; i++) {
    const currentLog = logs[i];
    
    // Si ce n'est pas le premier log, vérifier le lien avec le précédent
    if (i > 0) {
      const previousLog = logs[i - 1];
      
      // Vérification 1 : Le previous_hash doit correspondre au hash du log précédent
      if (currentLog.previous_hash !== previousLog.hash) {
        console.error(`Rupture de chaîne détectée au log ${currentLog.id}`);
        return { valid: false, corruptedBlockId: currentLog.id, totalChecked: i + 1 };
      }
    }

    // Vérification 2 : Recalculer le hash du log actuel pour vérifier qu'il n'a pas été altéré
    // Note: Si le log n'a pas de hash (vieux logs avant la mise à jour), on ignore
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
        return { valid: false, corruptedBlockId: currentLog.id, totalChecked: i + 1 };
      }
    }
  }

  return { valid: true, totalChecked: logs.length };
};

/**
 * Récupère les logs d'audit récents
 */
export const getRecentAuditLogs = async (limit: number = 50): Promise<any[]> => {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Erreur lors de la récupération des logs:', error);
    return [];
  }

  return data || [];
};

/**
 * Récupère les logs d'audit pour un utilisateur
 */
export const getUserAuditLogs = async (userId: string, limit: number = 50): Promise<any[]> => {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Erreur lors de la récupération des logs:', error);
    return [];
  }

  return data || [];
};

/**
 * Récupère les logs d'audit pour une ressource
 */
export const getResourceAuditLogs = async (resourceType: ResourceType, resourceId: string): Promise<any[]> => {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('resource_type', resourceType)
    .eq('resource_id', resourceId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erreur lors de la récupération des logs:', error);
    return [];
  }

  return data || [];
};

/**
 * Récupère les statistiques d'audit
 */
export const getAuditStats = async (): Promise<any> => {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('action, resource_type, created_at');

  if (error) {
    console.error('Erreur lors de la récupération des stats:', error);
    return null;
  }

  // Calculer les statistiques
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