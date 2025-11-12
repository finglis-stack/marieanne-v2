"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Gift, User, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { encryptBatch } from '@/lib/crypto';
import { createPermanentCardToken } from '@/lib/tokenization';
import { createAuditLog } from '@/lib/audit';
import { generateCardCodeWithLuhn, formatCardCode } from '@/lib/card-validation';

interface CreateCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const CreateCardDialog = ({ open, onOpenChange, onSuccess }: CreateCardDialogProps) => {
  const [customerNumber, setCustomerNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    const customerNum = parseInt(customerNumber);
    if (isNaN(customerNum) || customerNum <= 0) {
      showError('Le numéro de fiche doit être un nombre positif');
      setCreating(false);
      return;
    }

    try {
      const encryptedData = await encryptBatch({
        customer_number: customerNumber,
        first_name: firstName.trim(),
      });

      const { data: newProfile, error: profileError } = await supabase
        .from('customer_profiles')
        .insert({
          customer_number: encryptedData.customer_number,
          first_name: encryptedData.first_name,
        })
        .select()
        .single();

      if (profileError) {
        showError('Erreur lors de la création de la fiche client');
        console.error(profileError);
        setCreating(false);
        return;
      }

      const cardCode = generateCardCodeWithLuhn(customerNum);

      const { data: newCard, error: cardError } = await supabase
        .from('reward_cards')
        .insert({
          card_code: cardCode,
          customer_profile_id: newProfile.id,
          is_active: true,
        })
        .select()
        .single();

      if (cardError) {
        showError('Erreur lors de la création de la carte');
        console.error(cardError);
        setCreating(false);
        return;
      }

      const permanentToken = await createPermanentCardToken(newCard.id);

      await createAuditLog({
        action: 'CREATE_REWARD_CARD',
        resourceType: 'REWARD_CARD',
        resourceId: newCard.id,
        details: {
          customer_profile_id: newProfile.id,
          card_code: cardCode,
          permanent_token_generated: true,
          luhn_validated: true,
        },
      });

      showSuccess(`Carte créée avec succès ! Code: ${formatCardCode(cardCode)}`);
      setCustomerNumber('');
      setFirstName('');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error:', error);
      showError('Erreur lors de la création de la carte');
    }

    setCreating(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="backdrop-blur-xl bg-slate-900/95 border-blue-500/30 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
            <Gift className="w-6 h-6 text-purple-400" />
            Nouvelle carte récompense
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="customer-number" className="text-gray-300 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-400" />
              Numéro de fiche *
            </Label>
            <Input
              id="customer-number"
              type="number"
              value={customerNumber}
              onChange={(e) => setCustomerNumber(e.target.value)}
              placeholder="Ex: 12345"
              className="bg-slate-900/50 border-blue-500/50 text-white text-lg"
              required
            />
            <p className="text-xs text-gray-400">
              🔒 Ce numéro sera chiffré avec AES-256-GCM
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="first-name" className="text-gray-300">Prénom *</Label>
            <Input
              id="first-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Prénom de l'élève"
              className="bg-slate-900/50 border-blue-500/50 text-white text-lg"
              required
            />
            <p className="text-xs text-gray-400">
              🔒 Ce prénom sera chiffré avec AES-256-GCM
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 p-4 bg-blue-500/20 border border-blue-500/50 rounded-lg">
              <CreditCard className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-sm text-blue-400 font-semibold">Code de carte physique</p>
                <p className="text-xs text-blue-300">Format: XX 00 0 avec validation Luhn</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-4 bg-purple-500/20 border border-purple-500/50 rounded-lg">
              <Gift className="w-5 h-5 text-purple-400" />
              <div>
                <p className="text-sm text-purple-400 font-semibold">Token permanent (backend)</p>
                <p className="text-xs text-purple-300">Pour générer des tokens temporaires au checkout</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-blue-500/30">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="bg-slate-900/50 border-gray-500/50 text-gray-300"
              disabled={creating}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-500 hover:via-pink-500 hover:to-purple-500 text-white font-semibold py-6"
              disabled={creating}
            >
              {creating ? 'Création...' : 'Créer la carte'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};