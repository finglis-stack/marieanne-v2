"use client";

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ParticleBackground } from '@/components/particle-background';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Smartphone, Monitor, Tablet, Trash2, Power, PowerOff, Shield, Clock } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { getAuthorizedDevices, revokeDevice, deleteDevice, generateDeviceFingerprint } from '@/lib/device-fingerprint';

interface Device {
  id: string;
  fingerprint: string;
  device_name: string;
  browser_name: string;
  os_name: string;
  is_active: boolean;
  last_used_at: string;
  created_at: string;
}

const DeviceManagement = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [currentFingerprint, setCurrentFingerprint] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
      } else {
        setUser(user);
        loadDevices(user.id);
        loadCurrentFingerprint();
      }
    };
    getUser();
  }, [navigate]);

  const loadDevices = async (userId: string) => {
    setLoading(true);
    const devicesData = await getAuthorizedDevices(userId);
    setDevices(devicesData);
    setLoading(false);
  };

  const loadCurrentFingerprint = async () => {
    const deviceInfo = await generateDeviceFingerprint();
    setCurrentFingerprint(deviceInfo.fingerprint);
  };

  const handleRevokeDevice = async (deviceId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir désactiver cet appareil ?')) return;

    const success = await revokeDevice(deviceId);
    if (success) {
      showSuccess('Appareil désactivé avec succès');
      if (user) loadDevices(user.id);
    } else {
      showError('Erreur lors de la désactivation de l\'appareil');
    }
  };

  const handleDeleteDevice = async (deviceId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer définitivement cet appareil ?')) return;

    const success = await deleteDevice(deviceId);
    if (success) {
      showSuccess('Appareil supprimé avec succès');
      if (user) loadDevices(user.id);
    } else {
      showError('Erreur lors de la suppression de l\'appareil');
    }
  };

  const getDeviceIcon = (osName: string) => {
    if (osName.includes('Android') || osName.includes('iOS')) {
      return <Smartphone className="w-6 h-6" />;
    } else if (osName.includes('Windows') || osName.includes('Mac') || osName.includes('Linux')) {
      return <Monitor className="w-6 h-6" />;
    } else {
      return <Tablet className="w-6 h-6" />;
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-CA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="backdrop-blur-xl bg-slate-900/40 border border-blue-500/30 rounded-2xl p-6 shadow-2xl shadow-blue-500/20">
            <div className="flex items-center gap-4 mb-6">
              <Button
                onClick={() => navigate('/dashboard')}
                variant="outline"
                className="bg-slate-900/50 border-blue-500/50 hover:bg-blue-500/20 hover:border-blue-400 text-gray-300 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
                  Gestion des appareils
                </h1>
                <p className="text-gray-400 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Appareils autorisés à se connecter
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="backdrop-blur-xl bg-slate-900/60 border-blue-500/20 p-4">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-gray-400 text-xs">Appareils actifs</p>
                    <p className="text-white text-2xl font-bold">
                      {devices.filter(d => d.is_active).length}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="backdrop-blur-xl bg-slate-900/60 border-blue-500/20 p-4">
                <div className="flex items-center gap-3">
                  <Monitor className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-gray-400 text-xs">Total appareils</p>
                    <p className="text-white text-2xl font-bold">{devices.length}</p>
                  </div>
                </div>
              </Card>

              <Card className="backdrop-blur-xl bg-slate-900/60 border-blue-500/20 p-4">
                <div className="flex items-center gap-3">
                  <PowerOff className="w-5 h-5 text-red-400" />
                  <div>
                    <p className="text-gray-400 text-xs">Désactivés</p>
                    <p className="text-white text-2xl font-bold">
                      {devices.filter(d => !d.is_active).length}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <div className="space-y-4">
            {devices.map((device) => {
              const isCurrentDevice = device.fingerprint === currentFingerprint;
              
              return (
                <Card 
                  key={device.id}
                  className={`backdrop-blur-xl bg-slate-900/60 border-blue-500/20 p-6 ${
                    isCurrentDevice ? 'border-green-500/50 shadow-green-500/20' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`p-3 rounded-xl ${
                        device.is_active 
                          ? 'bg-gradient-to-br from-green-500 to-emerald-500' 
                          : 'bg-gradient-to-br from-gray-500 to-gray-600'
                      }`}>
                        {getDeviceIcon(device.os_name)}
                      </div>

                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="text-white font-semibold text-lg">
                            {device.device_name}
                          </h3>
                          {isCurrentDevice && (
                            <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/50">
                              Appareil actuel
                            </Badge>
                          )}
                          <Badge 
                            variant="outline" 
                            className={`${
                              device.is_active 
                                ? 'bg-green-500/20 text-green-400 border-green-500/50' 
                                : 'bg-red-500/20 text-red-400 border-red-500/50'
                            }`}
                          >
                            {device.is_active ? 'Actif' : 'Désactivé'}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-2 text-gray-400">
                            <Monitor className="w-4 h-4" />
                            <span>Navigateur : {device.browser_name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-400">
                            <Smartphone className="w-4 h-4" />
                            <span>Système : {device.os_name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-400">
                            <Clock className="w-4 h-4" />
                            <span>Dernière utilisation : {formatDate(device.last_used_at)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-400">
                            <Shield className="w-4 h-4" />
                            <span>Enregistré le : {formatDate(device.created_at)}</span>
                          </div>
                        </div>

                        <details className="text-xs text-gray-500 mt-2">
                          <summary className="cursor-pointer hover:text-gray-400">Empreinte technique</summary>
                          <p className="mt-2 p-2 bg-slate-900/50 rounded font-mono break-all">
                            {device.fingerprint}
                          </p>
                        </details>
                      </div>
                    </div>

                    {!isCurrentDevice && (
                      <div className="flex items-center gap-2">
                        {device.is_active && (
                          <Button
                            onClick={() => handleRevokeDevice(device.id)}
                            variant="outline"
                            size="sm"
                            className="bg-slate-900/50 border-orange-500/50 hover:bg-orange-500/20 text-orange-400"
                          >
                            <PowerOff className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          onClick={() => handleDeleteDevice(device.id)}
                          variant="outline"
                          size="sm"
                          className="bg-slate-900/50 border-red-500/50 hover:bg-red-500/20 text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          {devices.length === 0 && (
            <div className="backdrop-blur-xl bg-slate-900/40 border border-blue-500/30 rounded-2xl p-12 text-center shadow-2xl shadow-blue-500/20">
              <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">Aucun appareil enregistré</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeviceManagement;