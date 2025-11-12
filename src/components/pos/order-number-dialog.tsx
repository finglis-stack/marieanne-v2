"use client";

import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, ChefHat, Sandwich, Pizza } from 'lucide-react';

interface OrderNumberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  queueNumber: number;
  estimatedTime: number;
  preparationType: 'sandwich' | 'pizza';
}

export const OrderNumberDialog = ({ open, onOpenChange, queueNumber, estimatedTime, preparationType }: OrderNumberDialogProps) => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} min ${secs} s`;
  };

  const icon = preparationType === 'sandwich' ? <Sandwich className="w-16 h-16 text-orange-400" /> : <Pizza className="w-16 h-16 text-red-400" />;
  const color = preparationType === 'sandwich' ? 'from-orange-500 to-red-500' : 'from-red-500 to-pink-500';
  const bgColor = preparationType === 'sandwich' ? 'bg-orange-500/20 border-orange-500/50' : 'bg-red-500/20 border-red-500/50';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="backdrop-blur-xl bg-slate-900/95 border-blue-500/30 text-white max-w-md">
        <div className="space-y-6 py-6">
          <div className="flex items-center justify-center">
            <div className="relative">
              <div className={`absolute inset-0 bg-gradient-to-br ${color} blur-2xl opacity-50 animate-pulse`} />
              <div className="relative p-6 rounded-full bg-slate-900/50 border-2 border-blue-500/50">
                {icon}
              </div>
            </div>
          </div>

          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 mb-4">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <h2 className="text-2xl font-bold text-green-400">Commande enregistrée !</h2>
            </div>
            
            <p className="text-gray-400 text-sm">Votre numéro de commande :</p>
            
            <div className="flex justify-center my-6">
              <Badge variant="outline" className={`${bgColor} text-6xl font-bold px-12 py-6 animate-pulse`}>
                #{queueNumber.toString().padStart(2, '0')}
              </Badge>
            </div>

            <div className="flex items-center justify-center gap-2 p-4 bg-slate-900/50 rounded-lg border border-blue-500/30">
              <Clock className="w-5 h-5 text-blue-400" />
              <div className="text-left">
                <p className="text-xs text-gray-400">Temps estimé</p>
                <p className="text-lg font-bold text-blue-400">{formatTime(estimatedTime)}</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 p-3 bg-orange-500/20 border border-orange-500/50 rounded-lg">
              <ChefHat className="w-5 h-5 text-orange-400" />
              <p className="text-sm text-orange-400">
                Votre {preparationType === 'sandwich' ? 'sandwich' : 'pizza'} est en préparation
              </p>
            </div>
          </div>

          <Button
            onClick={() => onOpenChange(false)}
            className="w-full bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 hover:from-blue-500 hover:via-cyan-500 hover:to-teal-500 text-white font-semibold py-6 text-lg transition-all duration-300 hover:scale-105"
          >
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};