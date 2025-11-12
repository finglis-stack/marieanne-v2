"use client";

import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Coffee, Eye, EyeOff, Loader2, MonitorPlay } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

export const FuturisticLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsLoading(false);

    if (error) {
      showError(error.message || 'Erreur de connexion');
    } else if (data.user) {
      showSuccess('Connexion réussie ! Bienvenue au café ☕');
      setTimeout(() => {
        navigate('/dashboard');
      }, 500);
    }
  };

  return (
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
  );
};