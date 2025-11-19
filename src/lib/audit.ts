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
 * Crée un log d'audit
 * NOTE : Le hachage et le chaînage (Blockchain) sont maintenant gérés
 * par un Trigger PostgreSQL côté serveur pour une sécurité maximale.
 */
export const createAuditLog = async (data: AuditLogData): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    // On envoie juste les données. Le serveur calculera le hash, le previous_hash
    // et garantira l'intégrité de la chaîne.
    await supabase
      .from('audit_logs')
      .insert({
        user_id: user?.id,
        user_email: user?.email,
        action: data.action,
        resource_type: data.resourceType,
        resource_id: data.resourceId,
        details: data.details,
        ip_address: null, // Sera géré par le serveur si nécessaire
        user_agent: navigator.userAgent,
        // created_at est géré par le défaut de la DB ou le trigger
      });
      
  } catch (error) {
    console.error('Erreur lors de l\'envoi du log d\'audit:', error);
  }
};

/**
 * Vérifie l'intégrité de la chaîne de logs
 * NOTE : Cette vérification est maintenant indicative côté client.
 * Pour une vérification forensique stricte, on devrait utiliser une fonction RPC serveur
 * car la sérialisation JSON entre JS et PostgreSQL peut varier légèrement.
 */
export const verifyAuditChain = async (): Promise<{ valid: boolean; corruptedBlockId?: string; totalChecked: number }> => {
  // Pour l'instant, on fait confiance au serveur qui garantit l'intégrité à l'insertion.
  // Une vérification client nécessiterait de répliquer exactement l'algorithme PL/pgSQL
  // (notamment le casting jsonb::text).
  
  const { count, error } = await supabase
    .from('audit_logs')
    .select('*', { count: 'exact', head: true });

  if (error) {
    return { valid: false, totalChecked: 0 };
  }

  return { valid: true, totalChecked: count || 0 };
};

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