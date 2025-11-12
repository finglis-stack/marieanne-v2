import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { supabase } from '@/integrations/supabase/client';
import { createAuditLog } from './audit';

interface DeviceInfo {
  fingerprint: string;
  deviceName: string;
  browserName: string;
  osName: string;
}

/**
 * Génère une empreinte unique de l'appareil
 */
export const generateDeviceFingerprint = async (): Promise<DeviceInfo> => {
  // Initialiser FingerprintJS
  const fp = await FingerprintJS.load();
  const result = await fp.get();

  // Récupérer les informations du navigateur
  const userAgent = navigator.userAgent;
  
  // Détecter le navigateur
  let browserName = 'Unknown';
  if (userAgent.includes('Chrome')) browserName = 'Chrome';
  else if (userAgent.includes('Firefox')) browserName = 'Firefox';
  else if (userAgent.includes('Safari')) browserName = 'Safari';
  else if (userAgent.includes('Edge')) browserName = 'Edge';
  else if (userAgent.includes('Opera')) browserName = 'Opera';

  // Détecter l'OS
  let osName = 'Unknown';
  if (userAgent.includes('Windows')) osName = 'Windows';
  else if (userAgent.includes('Mac')) osName = 'macOS';
  else if (userAgent.includes('Linux')) osName = 'Linux';
  else if (userAgent.includes('Android')) osName = 'Android';
  else if (userAgent.includes('iOS')) osName = 'iOS';

  // Générer un nom d'appareil descriptif
  const deviceName = `${osName} - ${browserName}`;

  return {
    fingerprint: result.visitorId,
    deviceName,
    browserName,
    osName,
  };
};

/**
 * Vérifie si l'appareil actuel est autorisé pour cet utilisateur
 */
export const isDeviceAuthorized = async (userId: string): Promise<boolean> => {
  try {
    const deviceInfo = await generateDeviceFingerprint();

    const { data, error } = await supabase
      .from('device_fingerprints')
      .select('*')
      .eq('user_id', userId)
      .eq('fingerprint', deviceInfo.fingerprint)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking device authorization:', error);
      return false;
    }

    // Si l'appareil existe et est actif
    if (data) {
      // Mettre à jour la date de dernière utilisation
      await supabase
        .from('device_fingerprints')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', data.id);

      await createAuditLog({
        action: 'LOGIN',
        resourceType: 'USER',
        resourceId: userId,
        details: {
          device_authorized: true,
          device_name: deviceInfo.deviceName,
          fingerprint: deviceInfo.fingerprint,
        },
      });

      return true;
    }

    return false;
  } catch (error) {
    console.error('Error in isDeviceAuthorized:', error);
    return false;
  }
};

/**
 * Enregistre un nouvel appareil autorisé (première connexion)
 */
export const registerDevice = async (userId: string): Promise<boolean> => {
  try {
    const deviceInfo = await generateDeviceFingerprint();

    // Vérifier si l'appareil existe déjà
    const { data: existing } = await supabase
      .from('device_fingerprints')
      .select('*')
      .eq('user_id', userId)
      .eq('fingerprint', deviceInfo.fingerprint)
      .single();

    if (existing) {
      // Réactiver l'appareil s'il était désactivé
      await supabase
        .from('device_fingerprints')
        .update({ 
          is_active: true,
          last_used_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      return true;
    }

    // Enregistrer le nouvel appareil
    const { error } = await supabase
      .from('device_fingerprints')
      .insert({
        user_id: userId,
        fingerprint: deviceInfo.fingerprint,
        device_name: deviceInfo.deviceName,
        browser_name: deviceInfo.browserName,
        os_name: deviceInfo.osName,
        is_active: true,
      });

    if (error) {
      console.error('Error registering device:', error);
      return false;
    }

    await createAuditLog({
      action: 'CREATE_REWARD_CARD',
      resourceType: 'USER',
      resourceId: userId,
      details: {
        action: 'register_device',
        device_name: deviceInfo.deviceName,
        browser: deviceInfo.browserName,
        os: deviceInfo.osName,
        fingerprint: deviceInfo.fingerprint,
      },
    });

    return true;
  } catch (error) {
    console.error('Error in registerDevice:', error);
    return false;
  }
};

/**
 * Récupère tous les appareils autorisés pour un utilisateur
 */
export const getAuthorizedDevices = async (userId: string): Promise<any[]> => {
  const { data, error } = await supabase
    .from('device_fingerprints')
    .select('*')
    .eq('user_id', userId)
    .order('last_used_at', { ascending: false });

  if (error) {
    console.error('Error getting authorized devices:', error);
    return [];
  }

  return data || [];
};

/**
 * Révoque un appareil (le désactive)
 */
export const revokeDevice = async (deviceId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('device_fingerprints')
    .update({ is_active: false })
    .eq('id', deviceId);

  if (error) {
    console.error('Error revoking device:', error);
    return false;
  }

  await createAuditLog({
    action: 'DELETE_REWARD_CARD',
    resourceType: 'USER',
    details: {
      action: 'revoke_device',
      device_id: deviceId,
    },
  });

  return true;
};

/**
 * Supprime définitivement un appareil
 */
export const deleteDevice = async (deviceId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('device_fingerprints')
    .delete()
    .eq('id', deviceId);

  if (error) {
    console.error('Error deleting device:', error);
    return false;
  }

  await createAuditLog({
    action: 'DELETE_REWARD_CARD',
    resourceType: 'USER',
    details: {
      action: 'delete_device',
      device_id: deviceId,
    },
  });

  return true;
};

/**
 * Compte le nombre d'appareils autorisés pour un utilisateur
 */
export const countAuthorizedDevices = async (userId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('device_fingerprints')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error) {
    console.error('Error counting devices:', error);
    return 0;
  }

  return count || 0;
};