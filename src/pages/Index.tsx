"use client";

import { ParticleBackground } from '@/components/particle-background';
import { FuturisticLogin } from '@/components/futuristic-login';

const Index = () => {
  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: 'url(/foodiesfeed.com_refreshing-berry-medley-with-mint-splash.png)',
        }}
      />
      
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/70 via-blue-950/60 to-slate-950/70" />
      
      <div className="absolute inset-0 bg-blue-900/20" />
      
      <ParticleBackground />
      
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />
      
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>
      
      <div className="relative z-10 w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <FuturisticLogin />
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-gray-300 text-xs flex items-center gap-2 z-10">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        Système sécurisé • Connexion cryptée
      </div>
    </div>
  );
};

export default Index;