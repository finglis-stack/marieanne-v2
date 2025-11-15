"use client";

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ParticleBackground } from '@/components/particle-background';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Shield, AlertTriangle, Activity, Eye, CheckCircle, XCircle } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { getSecurityStats } from '@/lib/honeypot';

interface SecurityAlert {
  id: string;
  alert_type: string;
  details: any;
  severity: string;
  is_resolved: boolean;
  created_at: string;
}

interface CanaryToken {
  id: string;
  token: string;
  location: string;
  is_triggered: boolean;
  triggered_at: string | null;
  created_at: string;
}

const SecurityDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [canaryTokens, setCanaryTokens] = useState<CanaryToken[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
      } else {
        setUser(user);
        loadData();
      }
    };
    getUser();
  }, [navigate]);

  const loadData = async () => {
    setLoading(true);

    // Charger les alertes
    const { data: alertsData } = await supabase
      .from('security_alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    // Charger les canary tokens
    const { data: tokensData } = await supabase
      .from('canary_tokens')
      .select('*')
      .order('created_at', { ascending: false });

    // Charger les statistiques
    const statsData = await getSecurityStats();

    setAlerts(alertsData || []);
    setCanaryTokens(tokensData || []);
    setStats(statsData);
    setLoading(false);
  };

  const handleResolveAlert = async (alertId: string) => {
    const { error } = await supabase
      .from('security_alerts')
      .update({
        is_resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: user?.id,
      })
      .eq('id', alertId);

    if (error) {
      showError('Erreur lors de la résolution de l\'alerte');
    } else {
      showSuccess('Alerte résolue');
      loadData();
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'HIGH':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      case 'MEDIUM':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'LOW':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  const getAlertTypeIcon = (type: string) => {
    if (type.includes('HONEYPOT')) return <Shield className="w-5 h-5" />;
    if (type.includes('CANARY')) return <Eye className="w-5 h-5" />;
    if (type.includes('SCRAPING')) return <Activity className="w-5 h-5" />;
    return <AlertTriangle className="w-5 h-5" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        <ParticleBackground />
        <div className="relative z-10 text-white text-xl">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: 'url(/foodiesfeed.com_refreshing-berry-medley-with-mint-splash.png)',
        }}
      />
      
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-blue-950/85 to-slate-950/90" />
      <div className="absolute inset-0 bg-blue-900/30" />
      
      <ParticleBackground />
      
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />

      <div className="relative z-10 p-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="backdrop-blur-xl bg-slate-900/40 border border-red-500/30 rounded-2xl p-6 shadow-2xl shadow-red-500/20">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => navigate('/dashboard')}
                  variant="outline"
                  className="bg-slate-900/50 border-blue-500/50 hover:bg-blue-500/20 hover:border-blue-400 text-gray-300 hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour
                </Button>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
                    🚨 Centre de Sécurité
                  </h1>
                  <p className="text-gray-400 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Honeypots, Canary Tokens & Alertes
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="backdrop-blur-xl bg-slate-900/60 border-red-500/20 p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                  <div>
                    <p className="text-gray-400 text-xs">Alertes totales</p>
                    <p className="text-white text-2xl font-bold">{stats?.totalAlerts || 0}</p>
                  </div>
                </div>
              </Card>

              <Card className="backdrop-blur-xl bg-slate-900/60 border-orange-500/20 p-4">
                <div className="flex items-center gap-3">
                  <Eye className="w-6 h-6 text-orange-400" />
                  <div>
                    <p className="text-gray-400 text-xs">Canaries déclenchés</p>
                    <p className="text-white text-2xl font-bold">{stats?.triggeredCanaries || 0}</p>
                  </div>
                </div>
              </Card>

              <Card className="backdrop-blur-xl bg-slate-900/60 border-green-500/20 p-4">
                <div className="flex items-center gap-3">
                  <Shield className="w-6 h-6 text-green-400" />
                  <div>
                    <p className="text-gray-400 text-xs">Canaries actifs</p>
                    <p className="text-white text-2xl font-bold">
                      {canaryTokens.filter(t => !t.is_triggered).length}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Alertes récentes */}
          <Card className="backdrop-blur-xl bg-slate-900/40 border border-red-500/30 shadow-2xl shadow-red-500/20 overflow-hidden">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-red-400" />
                Alertes de sécurité
              </h2>

              <div className="space-y-3">
                {alerts.map((alert) => (
                  <Card key={alert.id} className="backdrop-blur-xl bg-slate-900/60 border-red-500/20 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`p-3 rounded-xl ${getSeverityColor(alert.severity)}`}>
                          {getAlertTypeIcon(alert.alert_type)}
                        </div>

                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="text-white font-semibold text-lg">
                              {alert.alert_type.replace(/_/g, ' ')}
                            </h3>
                            <Badge variant="outline" className={getSeverityColor(alert.severity)}>
                              {alert.severity}
                            </Badge>
                            {alert.is_resolved ? (
                              <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/50">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Résolu
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/50">
                                <XCircle className="w-3 h-3 mr-1" />
                                Non résolu
                              </Badge>
                            )}
                          </div>

                          <div className="text-sm text-gray-400">
                            {new Date(alert.created_at).toLocaleString('fr-CA')}
                          </div>

                          <details className="text-xs text-gray-500">
                            <summary className="cursor-pointer hover:text-gray-400">Détails</summary>
                            <pre className="mt-2 p-2 bg-slate-900/50 rounded overflow-x-auto">
                              {JSON.stringify(alert.details, null, 2)}
                            </pre>
                          </details>
                        </div>
                      </div>

                      {!alert.is_resolved && (
                        <Button
                          onClick={() => handleResolveAlert(alert.id)}
                          variant="outline"
                          size="sm"
                          className="bg-slate-900/50 border-green-500/50 hover:bg-green-500/20 text-green-400"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Résoudre
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}

                {alerts.length === 0 && (
                  <div className="text-center py-12">
                    <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">Aucune alerte pour le moment</p>
                    <p className="text-gray-500 text-sm mt-2">Tous les systèmes sont opérationnels 🛡️</p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Canary Tokens */}
          <Card className="backdrop-blur-xl bg-slate-900/40 border border-orange-500/30 shadow-2xl shadow-orange-500/20 overflow-hidden">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Eye className="w-6 h-6 text-orange-400" />
                Canary Tokens
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {canaryTokens.map((token) => (
                  <Card 
                    key={token.id} 
                    className={`backdrop-blur-xl bg-slate-900/60 p-4 ${
                      token.is_triggered 
                        ? 'border-red-500/50 shadow-red-500/20' 
                        : 'border-green-500/20'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge 
                          variant="outline" 
                          className={token.is_triggered 
                            ? 'bg-red-500/20 text-red-400 border-red-500/50' 
                            : 'bg-green-500/20 text-green-400 border-green-500/50'
                          }
                        >
                          {token.is_triggered ? '🚨 DÉCLENCHÉ' : '✅ ACTIF'}
                        </Badge>
                      </div>

                      <div>
                        <p className="text-gray-400 text-xs">Emplacement</p>
                        <p className="text-white font-semibold">{token.location}</p>
                      </div>

                      <div>
                        <p className="text-gray-400 text-xs">Token</p>
                        <p className="text-white font-mono text-xs break-all blur-sm hover:blur-none transition-all">
                          {token.token}
                        </p>
                      </div>

                      {token.is_triggered && token.triggered_at && (
                        <div>
                          <p className="text-gray-400 text-xs">Déclenché le</p>
                          <p className="text-red-400 text-sm">
                            {new Date(token.triggered_at).toLocaleString('fr-CA')}
                          </p>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}

                {canaryTokens.length === 0 && (
                  <div className="col-span-full text-center py-12">
                    <Eye className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">Aucun canary token déployé</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SecurityDashboard;