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
  | 'DECRYPT_DATA';

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
  | 'DATA';

interface AuditLogData {
  action: AuditAction;
  resourceType: ResourceType;
  resourceId?: string;
  details?: any;
}

/**
 * Crée un log d'audit
 */
export const createAuditLog = async (data: AuditLogData): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn('Tentative de log sans utilisateur authentifié');
      return;
    }

    await supabase
      .from('audit_logs')
      .insert({
        user_id: user.id,
        user_email: user.email,
        action: data.action,
        resource_type: data.resourceType,
        resource_id: data.resourceId,
        details: data.details,
        ip_address: null, // Sera rempli côté serveur si nécessaire
        user_agent: navigator.userAgent,
      });
  } catch (error) {
    console.error('Erreur lors de la création du log d\'audit:', error);
  }
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