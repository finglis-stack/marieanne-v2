"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Heart, CreditCard, Banknote, ArrowRight, ArrowLeft, CheckCircle, Gift, AlertCircle, Clock, X, Star, Coffee } from 'lucide-react';
import { createAuditLog } from '@/lib/audit';
import { validateLuhnAlphanumeric, cleanCardCode } from '@/lib/card-validation';
import { generateTemporaryToken, markTokenAsUsed } from '@/lib/tokenization';
import { decryptBatch } from '@/lib/crypto';

interface Product {
  id: string;
  name: string;
  price: number;
  apply_taxes: boolean;
  image_url: string | null;
}

interface AddSuspendedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const AddSuspendedDialog = ({ open, onOpenChange, onSuccess }: AddSuspendedDialogProps) => {
  // Étapes : product -> reward -> payment
  const [step, setStep] = useState<'product' | 'reward' | 'payment'>('product');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [donorName, setDonorName] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // États pour la carte récompense
  const [cardCode, setCardCode] = useState('');
  const [validatingCard, setValidatingCard] = useState(false);
  const [cardValidated, setCardValidated] = useState(false);
  const [validatedRewardCard, setValidatedRewardCard] = useState<any>(null);
  const [customerName, setCustomerName] = useState<string>('');
  const [generatedToken, setGeneratedToken] = useState<string>('');
  const [isCardCodeValid, setIsCardCodeValid] = useState<boolean | null>(null);
  const [tokenExpiresAt, setTokenExpiresAt] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  const TAX_RATE = 0.14975;

  useEffect(() => {
    if (open) {
      loadProducts();
      resetState();
    }
  }, [open]);

  // Timer pour l'expiration du token temporaire
  useEffect(() => {
    if (!tokenExpiresAt) return;

    const interval = setInterval(() => {
      const now = new Date();
      const remaining = Math.max(0, Math.floor((tokenExpiresAt.getTime() - now.getTime()) / 1000));
      setTimeRemaining(remaining);

      if (remaining === 0) {
        showError('Le token a expiré. Veuillez valider à nouveau la carte.');
        handleRemoveRewardCard();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [tokenExpiresAt]);

  // Validation du format de carte en temps réel
  useEffect(() => {
    const cleaned = cleanCardCode(cardCode);
    
    if (cleaned.length === 0) {
      setIsCardCodeValid(null);
      return;
    }

    if (cleaned.length !== 5) {
      setIsCardCodeValid(false);
      return;
    }

    const regex = /^[A-Z]{2}[0-9]{3}$/;
    const formatValid = regex.test(cleaned);
    const luhnValid = validateLuhnAlphanumeric(cleaned);

    setIsCardCodeValid(formatValid && luhnValid);
  }, [cardCode]);

  const resetState = () => {
    setStep('product');
    setSelectedProductId('');
    setDonorName('');
    setMessage('');
    handleRemoveRewardCard();
  };

  const loadProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('id, name, price, apply_taxes, image_url')
      .order('name');
    setProducts(data || []);
  };

  const getSelectedProduct = () => products.find(p => p.id === selectedProductId);

  const calculateTotal = () => {
    const product = getSelectedProduct();
    if (!product) return 0;
    
    const basePrice = product.price;
    const tax = product.apply_taxes ? basePrice * TAX_RATE : 0;
    return basePrice + tax;
  };

  // --- LOGIQUE CARTE RÉCOMPENSE ---

  const formatCardCodeDisplay = (value: string): string => {
    const cleaned = value.replace(/\s/g, '').toUpperCase();
    const limited = cleaned.slice(0, 5);
    let formatted = '';
    for (let i = 0; i < limited.length; i++) {
      if (i === 2 || i === 4) formatted += ' ';
      formatted += limited[i];
    }
    return formatted;
  };

  const handleCardCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardCode(formatCardCodeDisplay(e.target.value));
  };

  const handleValidateCard = async () => {
    setValidatingCard(true);
    const cleaned = cleanCardCode(cardCode);

    if (!isCardCodeValid) {
      showError('Code de carte invalide');
      setValidatingCard(false);
      return;
    }

    try {
      const { data: cardData, error: cardError } = await supabase
        .from('reward_cards')
        .select('*, customer_profiles(*)')
        .eq('card_code', cleaned)
        .eq('is_active', true)
        .single();

      if (cardError || !cardData) {
        showError('Carte non trouvée ou inactive');
        setValidatingCard(false);
        return;
      }

      let displayName = 'Client';
      if (cardData.customer_profiles?.first_name) {
        try {
          const decrypted = await decryptBatch({
            first_name: cardData.customer_profiles.first_name,
          });
          displayName = decrypted.first_name || 'Client';
        } catch (error) {
          console.error('Decryption error:', error);
        }
      }
      setCustomerName(displayName);

      const { data: permanentTokenData, error: tokenError } = await supabase
        .from('card_tokens')
        .select('token')
        .eq('reward_card_id', cardData.id)
        .eq('token_type', 'permanent')
        .eq('is_active', true)
        .single();

      if (tokenError || !permanentTokenData) {
        showError('Erreur technique (Token)');
        setValidatingCard(false);
        return;
      }

      const temporaryToken = await generateTemporaryToken(permanentTokenData.token);
      
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 5);
      setTokenExpiresAt(expiresAt);
      setTimeRemaining(300);

      setGeneratedToken(temporaryToken);
      setCardValidated(true);
      setValidatedRewardCard(cardData);
      showSuccess('Carte validée !');
      
      setTimeout(() => setStep('payment'), 800);

    } catch (error: any) {
      console.error(error);
      showError('Erreur de validation');
    } finally {
      setValidatingCard(false);
    }
  };

  const handleRemoveRewardCard = () => {
    setCardValidated(false);
    setValidatedRewardCard(null);
    setCustomerName('');
    setCardCode('');
    setGeneratedToken('');
    setIsCardCodeValid(null);
    setTokenExpiresAt(null);
    setTimeRemaining(0);
  };

  // --- LOGIQUE PAIEMENT ---

  const processPayment = async (method: 'cash' | 'card') => {
    const product = getSelectedProduct();
    if (!product) return;

    setLoading(true);
    const totalAmount = calculateTotal();
    const pointsEarned = Math.floor(totalAmount * 1000);

    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          total_amount: totalAmount,
          payment_method: method,
          points_earned: validatedRewardCard ? pointsEarned : 0,
          customer_profile_id: validatedRewardCard?.customer_profiles?.id || null,
          reward_card_id: validatedRewardCard?.id || null,
          items: [{
            product_id: product.id,
            product_name: product.name,
            quantity: 1,
            unit_price: product.price,
            is_donation: true
          }]
        })
        .select()
        .single();

      if (orderError) throw orderError;

      if (validatedRewardCard) {
        const currentPoints = validatedRewardCard.customer_profiles.points_balance || 0;
        await supabase
          .from('customer_profiles')
          .update({ points_balance: currentPoints + pointsEarned })
          .eq('id', validatedRewardCard.customer_profiles.id);
          
        if (generatedToken) {
          await markTokenAsUsed(generatedToken);
        }
      }

      const { error: suspendedError } = await supabase
        .from('suspended_items')
        .insert({
          product_id: product.id,
          order_id: orderData.id,
          donor_name: donorName || (validatedRewardCard ? customerName : 'Anonyme'),
          message: message || null,
          status: 'available'
        });

      if (suspendedError) throw suspendedError;

      await createAuditLog({
        action: 'CREATE_ORDER',
        resourceType: 'ORDER',
        resourceId: orderData.id,
        details: { 
          action: 'purchase_suspended_coffee', 
          amount: totalAmount,
          method: method,
          with_reward_card: !!validatedRewardCard
        }
      });

      showSuccess(`Don enregistré ! Merci ${donorName || customerName || 'Anonyme'} ❤️`);
      
      if (onSuccess) onSuccess();
      onOpenChange(false);

    } catch (error) {
      console.error(error);
      showError("Erreur lors du traitement");
    } finally {
      setLoading(false);
    }
  };

  const product = getSelectedProduct();
  const total = calculateTotal();
  const pointsToEarn = Math.floor(total * 1000);

  const formatTimeRemaining = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="backdrop-blur-xl bg-slate-900/95 border-pink-500/30 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
            <Heart className="w-6 h-6 text-pink-400" />
            {step === 'product' && 'Choisir un don'}
            {step === 'reward' && 'Carte Récompense ?'}
            {step === 'payment' && 'Paiement'}
          </DialogTitle>
        </DialogHeader>

        {step === 'product' && (
          <form onSubmit={(e) => { e.preventDefault(); if(selectedProductId) setStep('reward'); }} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Produit offert</Label>
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger className="bg-slate-900/50 border-pink-500/50 text-white h-16">
                  <SelectValue placeholder="Choisir un produit..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-pink-500/50 max-h-80">
                  {products.map(p => (
                    <SelectItem 
                      key={p.id} 
                      value={p.id} 
                      className="text-white py-3 cursor-pointer focus:bg-pink-500/20 focus:text-white"
                    >
                      <div className="flex items-center gap-3">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} className="w-10 h-10 object-cover rounded bg-slate-800" />
                        ) : (
                          <div className="w-10 h-10 bg-slate-800 rounded flex items-center justify-center">
                            <Coffee className="w-5 h-5 text-gray-500" />
                          </div>
                        )}
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{p.name}</span>
                          <span className="text-xs text-pink-400">{p.price.toFixed(2)} $</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Nom du donateur (Optionnel)</Label>
              <Input 
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                placeholder="Ex: Félix"
                className="bg-slate-900/50 border-pink-500/50 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Petit message (Optionnel)</Label>
              <Input 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ex: Bon courage pour tes exams !"
                className="bg-slate-900/50 border-pink-500/50 text-white"
              />
            </div>

            <div className="pt-4 flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1 bg-slate-900/50 border-gray-500/50 text-gray-300 hover:bg-slate-800 hover:text-white">
                Annuler
              </Button>
              <Button type="submit" disabled={!selectedProductId} className="flex-1 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white">
                Suivant <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </form>
        )}

        {step === 'reward' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="flex items-center gap-3 mb-2">
              <Gift className="w-6 h-6 text-purple-400" />
              <p className="text-white text-lg">Avez-vous une carte récompense ?</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="card-code" className="text-gray-300">Code de la carte (XX 00 0)</Label>
              <Input
                id="card-code"
                value={cardCode}
                onChange={handleCardCodeChange}
                placeholder="AB 12 3"
                className={`bg-slate-900/50 text-white text-center text-2xl font-mono tracking-widest uppercase transition-all ${
                  isCardCodeValid === true ? 'border-green-500/70 focus:border-green-400' : 
                  isCardCodeValid === false ? 'border-red-500/70 focus:border-red-400' : 
                  'border-blue-500/50 focus:border-blue-400'
                }`}
                disabled={validatingCard}
              />
              <div className="flex items-center gap-2 text-sm h-5">
                {isCardCodeValid === true && <span className="text-green-400 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Code valide</span>}
                {isCardCodeValid === false && <span className="text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Code invalide</span>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={handleValidateCard}
                disabled={!isCardCodeValid || validatingCard}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white"
              >
                {validatingCard ? 'Validation...' : 'Valider la carte'}
              </Button>
              <Button
                onClick={() => setStep('payment')}
                variant="outline"
                className="bg-slate-900/50 border-gray-500/50 text-gray-300 hover:bg-slate-800 hover:text-white"
              >
                Pas de carte
              </Button>
            </div>
            
            <Button variant="ghost" onClick={() => setStep('product')} className="w-full text-gray-400 hover:text-white hover:bg-slate-800 mt-2">
              <ArrowLeft className="w-4 h-4 mr-2" /> Retour
            </Button>
          </div>
        )}

        {step === 'payment' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            {cardValidated && (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-purple-500/20 border border-purple-500/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Gift className="w-5 h-5 text-purple-400" />
                    <p className="text-purple-400 font-semibold">{customerName}</p>
                  </div>
                  <Button onClick={handleRemoveRewardCard} variant="ghost" size="sm" className="text-red-400 hover:bg-red-500/20 h-8 w-8 p-0">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center gap-2 p-2 bg-orange-500/20 border border-orange-500/50 rounded-lg">
                    <Clock className="w-4 h-4 text-orange-400 animate-pulse" />
                    <span className="text-orange-400 text-xs font-bold">Exp: {formatTimeRemaining(timeRemaining)}</span>
                  </div>
                  <div className="flex-1 flex items-center gap-2 p-2 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span className="text-yellow-400 text-xs font-bold">+{pointsToEarn} pts</span>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-slate-900/50 p-4 rounded-lg border border-pink-500/20 space-y-2">
              <div className="flex justify-between text-sm text-gray-400">
                <span>Produit</span>
                <span className="text-white">{product?.name}</span>
              </div>
              {product?.apply_taxes && (
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Taxes</span>
                  <span className="text-white">{(total - product.price).toFixed(2)} $</span>
                </div>
              )}
              <div className="border-t border-pink-500/20 pt-2 flex justify-between font-bold text-lg">
                <span className="text-pink-400">Total à payer</span>
                <span className="text-white">{total.toFixed(2)} $</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => processPayment('cash')}
                disabled={loading}
                className="h-20 flex flex-col gap-1 bg-gradient-to-br from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 border-0"
              >
                <Banknote className="w-6 h-6" />
                <span>Comptant</span>
              </Button>
              <Button
                onClick={() => processPayment('card')}
                disabled={loading}
                className="h-20 flex flex-col gap-1 bg-gradient-to-br from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 border-0"
              >
                <CreditCard className="w-6 h-6" />
                <span>Carte</span>
              </Button>
            </div>

            <Button variant="ghost" onClick={() => setStep('reward')} disabled={loading} className="w-full text-gray-400 hover:text-white hover:bg-slate-800">
              <ArrowLeft className="w-4 h-4 mr-2" /> Retour
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};