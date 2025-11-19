"use client";

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ParticleBackground } from '@/components/particle-background';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, HeartHandshake } from 'lucide-react';
import { SuspendedWall } from '@/components/suspended/suspended-wall';
import { AddSuspendedDialog } from '@/components/suspended/add-suspended-dialog';

const SuspendedCoffee = () => {
  const navigate = useNavigate();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(0);

  const handleSuccess = () => {
    // Force le rafraîchissement du mur
    setLastUpdate(Date.now());
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: 'url(/foodiesfeed.com_refreshing-berry-medley-with-mint-splash.png)',
        }}
      />
      
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-purple-950/85 to-slate-950/90" />
      <div className="absolute inset-0 bg-pink-900/20" />
      
      <ParticleBackground />
      
      <div className="relative z-10 p-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex items-center justify-between backdrop-blur-xl bg-slate-900/40 border border-pink-500/30 rounded-2xl p-6 shadow-2xl shadow-pink-500/20">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate('/dashboard')}
                variant="outline"
                className="bg-slate-900/50 border-pink-500/50 hover:bg-pink-500/20 hover:border-pink-400 text-gray-300 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent flex items-center gap-3">
                  Café Suspendu
                  <HeartHandshake className="w-8 h-8 text-pink-400" />
                </h1>
                <p className="text-gray-400">Payez au suivant : offrez un produit à un élève</p>
              </div>
            </div>
            
            <Button
              onClick={() => setIsAddOpen(true)}
              className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-semibold shadow-lg shadow-pink-900/20 transition-all hover:scale-105"
            >
              <Plus className="w-5 h-5 mr-2" />
              Ajouter un don
            </Button>
          </div>

          {/* Le Mur */}
          <SuspendedWall lastUpdate={lastUpdate} />

        </div>
      </div>

      <AddSuspendedDialog 
        open={isAddOpen} 
        onOpenChange={setIsAddOpen} 
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default SuspendedCoffee;