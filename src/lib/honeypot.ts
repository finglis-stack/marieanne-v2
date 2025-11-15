import { supabase } from '@/integrations/supabase/client';
import { createAuditLog } from './audit';

/**
 * 🍯 HONEYPOT ACCOUNTS
 * Faux comptes qui alertent si quelqu'un essaie de se connecter
 */

const HONEYPOT_EMAILS = [
  'admin@cafemarieanne.com',
  'root@cafemarieanne.com',
  'test@cafemarieanne.com',
  'demo@cafemarieanne.com',
  'support@cafemarieanne.com',
];

/**
 * Vérifie si un email est un honeypot
 */
export const isHoneypotEmail = (email: string): boolean => {
  return HONEYPOT_EMAILS.includes(email.toLowerCase());
};

/**
 * Déclenche une alerte honeypot
 */
export const triggerHoneypotAlert = async (email: string, ip?: string) => {
  console.error('🚨 HONEYPOT TRIGGERED 🚨', {
    email,
    ip,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
  });

  // Log dans le système d'audit
  await createAuditLog({
    action: 'LOGIN',
    resourceType: 'USER',
    details: {
      honeypot_triggered: true,
      attempted_email: email,
      ip_address: ip,
      user_agent: navigator.userAgent,
      severity: 'CRITICAL',
      threat_level: 'HIGH',
    },
  });

  // Envoyer une notification (tu peux ajouter email/SMS ici)
  await sendSecurityAlert({
    type: 'HONEYPOT_TRIGGERED',
    email,
    ip,
    timestamp: new Date().toISOString(),
  });
};

/**
 * 🕵️ CANARY TOKENS
 * Tokens invisibles qui détectent les scrapers/bots
 */

interface CanaryToken {
  id: string;
  token: string;
  location: string;
  created_at: string;
}

/**
 * Génère un canary token unique
 */
export const generateCanaryToken = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = 'CANARY_';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

/**
 * Crée un canary token dans la base de données
 */
export const createCanaryToken = async (location: string): Promise<string> => {
  const token = generateCanaryToken();

  const { error } = await supabase
    .from('canary_tokens')
    .insert({
      token,
      location,
      is_triggered: false,
    });

  if (error) {
    console.error('Error creating canary token:', error);
    return '';
  }

  return token;
};

/**
 * Vérifie si un token est un canary
 */
export const isCanaryToken = async (token: string): Promise<boolean> => {
  if (!token.startsWith('CANARY_')) return false;

  const { data, error } = await supabase
    .from('canary_tokens')
    .select('*')
    .eq('token', token)
    .single();

  if (error || !data) return false;

  return true;
};

/**
 * Déclenche une alerte canary token
 */
export const triggerCanaryAlert = async (token: string, location: string) => {
  console.error('🚨 CANARY TOKEN TRIGGERED 🚨', {
    token,
    location,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
  });

  // Marquer le token comme déclenché
  await supabase
    .from('canary_tokens')
    .update({
      is_triggered: true,
      triggered_at: new Date().toISOString(),
      triggered_by_ip: null, // Tu peux ajouter l'IP ici
      triggered_by_user_agent: navigator.userAgent,
    })
    .eq('token', token);

  // Log dans le système d'audit
  await createAuditLog({
    action: 'VALIDATE_TOKEN',
    resourceType: 'TOKEN',
    details: {
      canary_triggered: true,
      token,
      location,
      user_agent: navigator.userAgent,
      severity: 'CRITICAL',
      threat_level: 'HIGH',
    },
  });

  // Envoyer une notification
  await sendSecurityAlert({
    type: 'CANARY_TOKEN_TRIGGERED',
    token,
    location,
    timestamp: new Date().toISOString(),
  });
};

/**
 * 🎣 HONEYPOT ENDPOINTS
 * Faux endpoints API qui piègent les attaquants
 */

const HONEYPOT_ENDPOINTS = [
  '/api/admin/users',
  '/api/admin/delete',
  '/api/backup/download',
  '/api/config/secrets',
  '/wp-admin',
  '/phpmyadmin',
  '/.env',
  '/admin.php',
];

/**
 * Vérifie si un endpoint est un honeypot
 */
export const isHoneypotEndpoint = (path: string): boolean => {
  return HONEYPOT_ENDPOINTS.some(endpoint => path.includes(endpoint));
};

/**
 * Déclenche une alerte endpoint honeypot
 */
export const triggerEndpointAlert = async (path: string) => {
  console.error('🚨 HONEYPOT ENDPOINT ACCESSED 🚨', {
    path,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
  });

  await createAuditLog({
    action: 'VIEW_DASHBOARD',
    resourceType: 'USER',
    details: {
      honeypot_endpoint_accessed: true,
      path,
      user_agent: navigator.userAgent,
      severity: 'CRITICAL',
      threat_level: 'HIGH',
    },
  });

  await sendSecurityAlert({
    type: 'HONEYPOT_ENDPOINT_ACCESSED',
    path,
    timestamp: new Date().toISOString(),
  });
};

/**
 * 📧 SYSTÈME D'ALERTE
 */

interface SecurityAlert {
  type: string;
  timestamp: string;
  [key: string]: any;
}

/**
 * Envoie une alerte de sécurité
 */
const sendSecurityAlert = async (alert: SecurityAlert) => {
  // Log dans la console (en production, tu enverrais un email/SMS)
  console.error('🚨 SECURITY ALERT 🚨', alert);

  // Enregistrer l'alerte dans la base de données
  await supabase
    .from('security_alerts')
    .insert({
      alert_type: alert.type,
      details: alert,
      severity: 'CRITICAL',
      is_resolved: false,
    });

  // TODO: Envoyer un email/SMS à l'admin
  // await sendEmail({
  //   to: 'admin@cafemarieanne.com',
  //   subject: `🚨 ALERTE SÉCURITÉ: ${alert.type}`,
  //   body: JSON.stringify(alert, null, 2),
  // });
};

/**
 * 🔍 DÉTECTION DE SCRAPING
 */

let requestCount = 0;
let lastRequestTime = Date.now();

/**
 * Détecte les comportements de scraping/bot
 */
export const detectScraping = (): boolean => {
  const now = Date.now();
  const timeDiff = now - lastRequestTime;

  requestCount++;
  lastRequestTime = now;

  // Si plus de 10 requêtes en moins de 1 seconde = probable bot
  if (requestCount > 10 && timeDiff < 1000) {
    triggerScrapingAlert();
    return true;
  }

  // Reset le compteur après 5 secondes
  if (timeDiff > 5000) {
    requestCount = 0;
  }

  return false;
};

/**
 * Déclenche une alerte de scraping
 */
const triggerScrapingAlert = async () => {
  console.error('🚨 SCRAPING DETECTED 🚨', {
    requestCount,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
  });

  await createAuditLog({
    action: 'VIEW_DASHBOARD',
    resourceType: 'USER',
    details: {
      scraping_detected: true,
      request_count: requestCount,
      user_agent: navigator.userAgent,
      severity: 'HIGH',
      threat_level: 'MEDIUM',
    },
  });

  await sendSecurityAlert({
    type: 'SCRAPING_DETECTED',
    requestCount,
    timestamp: new Date().toISOString(),
  });
};

/**
 * 🎭 FAKE DATA GENERATOR
 * Génère de fausses données pour tromper les attaquants
 */

export const generateFakeCustomerData = () => {
  const fakeNames = ['Jean Dupont', 'Marie Tremblay', 'Pierre Gagnon', 'Sophie Leblanc'];
  const fakeEmails = ['fake1@example.com', 'fake2@example.com', 'fake3@example.com'];
  
  return {
    id: generateCanaryToken(),
    name: fakeNames[Math.floor(Math.random() * fakeNames.length)],
    email: fakeEmails[Math.floor(Math.random() * fakeEmails.length)],
    phone: '555-0000',
    points: Math.floor(Math.random() * 10000),
    created_at: new Date().toISOString(),
    is_honeypot: true,
  };
};

/**
 * 📊 STATISTIQUES DE SÉCURITÉ
 */

export const getSecurityStats = async () => {
  const { data: alerts } = await supabase
    .from('security_alerts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  const { data: canaryTokens } = await supabase
    .from('canary_tokens')
    .select('*')
    .eq('is_triggered', true);

  return {
    totalAlerts: alerts?.length || 0,
    triggeredCanaries: canaryTokens?.length || 0,
    recentAlerts: alerts?.slice(0, 10) || [],
  };
};