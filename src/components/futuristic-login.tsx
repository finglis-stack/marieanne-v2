"use client";

import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Coffee, Eye, EyeOff, Loader2, MonitorPlay, Shield, AlertTriangle } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { isDeviceAuthorized, registerDevice, countAuthorizedDevices, isAccountUnlocked } from '@/lib/device-fingerprint';

export const FuturisticLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showDeviceDialog, setShowDeviceDialog] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Étape 1 : Authentification Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        showError(error.message || 'Erreur de connexion');
        setIsLoading(false);
        return;
      }

      if (!data.user) {
        showError('Erreur de connexion');
        setIsLoading(false);
        return;
      }

      // Étape 2 : Vérifier si c'est la première connexion (aucun appareil enregistré)
      const deviceCount = await countAuthorizedDevices(data.user.id);

      if (deviceCount === 0) {
        // Première connexion : enregistrer automatiquement l'appareil
        const registered = await registerDevice(data.user.id);
        
        if (!registered) {
          showError('Erreur lors de l\'enregistrement de l\'appareil');
          await supabase.auth.signOut();
          setIsLoading(false);
          return;
        }

        showSuccess('Connexion réussie ! Appareil enregistré avec succès 🔒');
        setTimeout(() => {
          navigate('/dashboard');
        }, 500);
        return;
      }

      // Étape 3 : Vérifier si l'appareil actuel est autorisé
      const authorized = await isDeviceAuthorized(data.user.id);

      if (authorized) {
        // Appareil autorisé : connexion réussie
        showSuccess('Connexion réussie ! Bienvenue au café ☕');
        setTimeout(() => {
          navigate('/dashboard');
        }, 500);
        return;
      }

      // Étape 4 : Appareil NON autorisé - Vérifier si le compte est déverrouillé
      const accountUnlocked = await isAccountUnlocked(data.user.id);

      if (!accountUnlocked) {
        // PAS DÉVERROUILLÉ = REFUS DIRECT (pas de dialogue)
        await supabase.auth.signOut();
        showError('🚫 Appareil non autorisé. Veuillez déverrouiller le compte depuis un appareil autorisé pour ajouter ce nouvel appareil.');
        setIsLoading(false);
        return;
      }

      // Étape 5 : DÉVERROUILLÉ = AFFICHER LE DIALOGUE
      setPendingUserId(data.user.id);
      setShowDeviceDialog(true);
      setIsLoading(false);

    } catch (error) {
      console.error('Login error:', error);
      showError('Erreur lors de la connexion');
      setIsLoading(false);
    }
  };

  const handleAuthorizeDevice = async () => {
    if (!pendingUserId) return;

    setIsLoading(true);

    const registered = await registerDevice(pendingUserId);

    if (!registered) {
      showError('Erreur lors de l\'autorisation de l\'appareil');
      await supabase.auth.signOut();
      setIsLoading(false);
      setShowDeviceDialog(false);
      setPendingUserId(null);
      return;
    }

    showSuccess('Appareil autorisé avec succès ! 🔒');
    setShowDeviceDialog(false);
    setPendingUserId(null);
    
    setTimeout(() => {
      navigate('/dashboard');
    }, 500);
  };

  const handleDenyDevice = async () => {
    await supabase.auth.signOut();
    setShowDeviceDialog(false);
    setPendingUserId(null);
    setIsLoading(false);
    showError('Connexion refusée. Appareil non autorisé.');
  };

  return (
    <>
      <div className="relative">
        <Card className="backdrop-blur-xl bg-slate-900/40 border border-blue-500/30 rounded-2xl shadow-2xl shadow-blue-500/20 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-pulse" />
          
          <div className="relative p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-slate-900/50 border border-blue-500/30 rounded-full">
                  <Coffee className="w-8 h-8 text-blue-400" />
                </div>
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
                CAFÉ MARIE ANNE
              </h1>
              <p className="text-gray-400">Système de point de vente</p>
              <div className="flex items-center justify-center gap-2 text-xs text-green-400">
                <Shield className="w-3 h-3" />
                <span>Sécurisé par biométrie d'appareil</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative group">
                <Label htmlFor="email" className="text-gray-300">Identifiant</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nom.utilisateur@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-slate-900/50 border-blue-500/50 text-white placeholder:text-gray-500 focus:border-blue-400 group-hover:border-blue-400/70 transition-colors"
                />
                <div className="absolute inset-0 bg-blue-500/5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </div>

              <div className="relative group">
                <Label htmlFor="password" className="text-gray-300">Mot de passe</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-slate-900/50 border-blue-500/50 text-white placeholder:text-gray-500 focus:border-blue-400 group-hover:border-blue-400/70 transition-colors pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-blue-400 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <div className="absolute inset-0 bg-blue-500/5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </div>

              <div className="flex items-center">
                <div className="flex items-center space-x-2">
                  <Checkbox id="remember-me" className="border-blue-500/50" />
                  <Label htmlFor="remember-me" className="text-gray-300 font-normal">Se souvenir</Label>
                </div>
              </div>

              <div className="relative">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 hover:from-blue-500 hover:via-cyan-500 hover:to-teal-500 text-white font-semibold py-6 text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/50"
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                >
                  {isLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    'SE CONNECTER'
                  )}
                  {isHovered && !isLoading && (
                    <div className="absolute inset-0 bg-white/10 animate-pulse rounded-md" />
                  )}
                </Button>
              </div>
            </form>

            <div className="relative flex items-center">
              <div className="flex-grow border-t border-blue-500/30"></div>
              <span className="flex-shrink mx-4 text-gray-400 text-xs">Accès rapide</span>
              <div className="flex-grow border-t border-blue-500/30"></div>
            </div>

            <Button
              variant="outline"
              className="w-full bg-slate-900/50 border-blue-500/50 hover:bg-blue-500/20 hover:border-blue-400 text-gray-300 hover:text-white"
              onClick={() => navigate('/preparation-queue')}
            >
              <MonitorPlay className="w-4 h-4 mr-2" />
              Visualiser commandes en attente
            </Button>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent animate-pulse" />
        </Card>
        <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/20 via-cyan-600/20 to-teal-600/20 blur-3xl -z-10 animate-pulse" />
      </div>

      {/* DIALOGUE UNIQUEMENT SI LE MODE "AJOUTER UN APPAREIL" EST ACTIVÉ */}
      <Dialog open={showDeviceDialog} onOpenChange={setShowDeviceDialog}>
        <DialogContent className="backdrop-blur-xl bg-slate-900/95 border-green-500/30 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl bg-gradient-to-r from-green-400 via-emerald-400 to-green-400 bg-clip-text text-transparent flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-green-400" />
              Nouvel appareil détecté
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              Le mode "Ajouter un appareil" est activé. Voulez-vous autoriser cet appareil ?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-green-400 text-sm font-semibold mb-2">
                ✅ Mode ajout d'appareil activé
              </p>
              <p className="text-gray-300 text-sm">
                Vous avez 5 minutes pour autoriser ce nouvel appareil. Après autorisation, 
                le mode sera automatiquement désactivé.
              </p>
            </div>

            <div className="p-4 bg-slate-900/50 border border-blue-500/30 rounded-lg">
              <p className="text-blue-400 text-sm font-semibold mb-2">
                📱 Informations de l'appareil
              </p>
              <p className="text-gray-300 text-xs">
                Navigateur : {navigator.userAgent.includes('Chrome') ? 'Chrome' : 
                             navigator.userAgent.includes('Firefox') ? 'Firefox' : 
                             navigator.userAgent.includes('Safari') ? 'Safari' : 'Autre'}
              </p>
              <p className="text-gray-300 text-xs">
                Système : {navigator.userAgent.includes('Windows') ? 'Windows' : 
                          navigator.userAgent.includes('Mac') ? 'macOS' : 
                          navigator.userAgent.includes('Linux') ? 'Linux' : 'Autre'}
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleDenyDevice}
                variant="outline"
                className="flex-1 bg-slate-900/50 border-red-500/50 hover:bg-red-500/20 text-red-400"
              >
                Refuser
              </Button>
              <Button
                onClick={handleAuthorizeDevice}
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Autoriser cet appareil'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};