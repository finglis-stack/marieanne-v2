"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, CreditCard, Trash2, Power, PowerOff, ChevronRight, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Badge } from '@/components/ui/badge';

interface RewardCard {
  id: string;
  card_code: string;
  customer_profile_id: string;
  is_active: boolean;
  created_at: string;
}

interface CustomerProfile {
  id: string;
  customer_number: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
}

interface CustomerWithCards extends CustomerProfile {
  cards: RewardCard[];
}

interface CustomerCardProps {
  customer: CustomerWithCards;
  onRefresh: () => void;
  onClick: () => void;
  showSensitiveData: boolean;
}

const formatCardCode = (code: string): string => {
  if (code.length !== 5) return code;
  return `${code.slice(0, 2)} ${code.slice(2, 4)} ${code.slice(4)}`;
};

export const CustomerCard = ({ customer, onRefresh, onClick, showSensitiveData }: CustomerCardProps) => {
  const handleToggleCard = async (e: React.MouseEvent, cardId: string, currentStatus: boolean) => {
    e.stopPropagation();
    
    const { error } = await supabase
      .from('reward_cards')
      .update({ is_active: !currentStatus })
      .eq('id', cardId);

    if (error) {
      showError('Erreur lors de la modification de la carte');
      console.error(error);
    } else {
      showSuccess(currentStatus ? 'Carte désactivée' : 'Carte activée');
      onRefresh();
    }
  };

  const handleDeleteCard = async (e: React.MouseEvent, cardId: string) => {
    e.stopPropagation();
    
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette carte ?')) return;

    const { error } = await supabase
      .from('reward_cards')
      .delete()
      .eq('id', cardId);

    if (error) {
      showError('Erreur lors de la suppression de la carte');
      console.error(error);
    } else {
      showSuccess('Carte supprimée');
      onRefresh();
    }
  };

  const handleCardClick = () => {
    if (!showSensitiveData) {
      showError('Veuillez déverrouiller les données pour accéder aux profils');
      return;
    }
    onClick();
  };

  const displayName = showSensitiveData 
    ? (customer.first_name || 'Élève sans nom')
    : '••••••••';
  
  const displayNumber = showSensitiveData
    ? customer.customer_number
    : '••••••';

  return (
    <Card 
      onClick={handleCardClick}
      className={`backdrop-blur-xl bg-slate-900/60 border-blue-500/20 overflow-hidden transition-all ${
        showSensitiveData 
          ? 'hover:border-blue-400/50 cursor-pointer group' 
          : 'cursor-not-allowed opacity-75'
      }`}
    >
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 ${showSensitiveData && 'group-hover:scale-110'} transition-transform`}>
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className={`text-white font-semibold text-lg ${!showSensitiveData && 'blur-sm select-none'}`}>
                {displayName}
              </h3>
              <p className={`text-gray-400 text-sm ${!showSensitiveData && 'blur-sm select-none'}`}>
                Fiche #{displayNumber}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/50">
              {customer.cards.length} carte{customer.cards.length > 1 ? 's' : ''}
            </Badge>
            {showSensitiveData ? (
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
            ) : (
              <Lock className="w-5 h-5 text-orange-400" />
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-gray-300">
            <CreditCard className="w-4 h-4 text-purple-400" />
            <span className="font-semibold text-sm">Cartes récompenses</span>
          </div>

          <div className="space-y-2">
            {customer.cards.slice(0, 2).map((card) => (
              <div
                key={card.id}
                className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-blue-500/20"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-3">
                  <CreditCard className={`w-4 h-4 ${card.is_active ? 'text-green-400' : 'text-gray-500'}`} />
                  <div>
                    <p className="text-white font-mono text-sm font-semibold blur-sm select-none">
                      •• •• •
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(card.created_at).toLocaleDateString('fr-CA')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    onClick={(e) => handleToggleCard(e, card.id, card.is_active)}
                    variant="ghost"
                    size="sm"
                    className={`h-7 w-7 p-0 ${
                      card.is_active 
                        ? 'text-green-400 hover:text-green-300 hover:bg-green-500/20' 
                        : 'text-gray-500 hover:text-gray-400 hover:bg-gray-500/20'
                    }`}
                  >
                    {card.is_active ? <Power className="w-3 h-3" /> : <PowerOff className="w-3 h-3" />}
                  </Button>
                  <Button
                    onClick={(e) => handleDeleteCard(e, card.id)}
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/20 h-7 w-7 p-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
            
            {customer.cards.length > 2 && (
              <p className="text-xs text-gray-400 text-center py-1">
                +{customer.cards.length - 2} autre{customer.cards.length - 2 > 1 ? 's' : ''} carte{customer.cards.length - 2 > 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>

        {!showSensitiveData && (
          <div className="flex items-center justify-center gap-2 p-3 bg-orange-500/20 border border-orange-500/50 rounded-lg mt-4">
            <Lock className="w-4 h-4 text-orange-400" />
            <span className="text-orange-400 text-xs font-semibold">
              Déverrouillez pour accéder
            </span>
          </div>
        )}
      </div>
    </Card>
  );
};