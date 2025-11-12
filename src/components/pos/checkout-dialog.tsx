"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, Banknote, Gift, AlertCircle, CheckCircle, X, Star, Clock } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { supabase } from '@/integrations/supabase/client';
import { CashPaymentDialog } from './cash-payment-dialog';
import { OrderNumberDialog } from './order-number-dialog';
import { generateTemporaryToken, markTokenAsUsed } from '@/lib/tokenization';
import { createAuditLog } from '@/lib/audit';
import { validateLuhnAlphanumeric, cleanCardCode } from '@/lib/card-validation';
import { decryptBatch } from '@/lib/crypto';

interface CartItem {
  product: {
    id: string;
    name: string;
    price: number;
    apply_taxes: boolean;
    requires_preparation?: boolean;
    preparation_type?: 'sandwich' | 'pizza' | null;
  };
  quantity: number;
}

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  cart: CartItem[];
  onComplete: () => void;
}

const PREPARATION_TIMES = {
  sandwich: 270,
  pizza: 780,
};

const MAX_SIMULTANEOUS = 4;

export const CheckoutDialog = ({ open, onOpenChange, total, cart, onComplete }: CheckoutDialogProps) => {
  const [step, setStep] = useState<'reward-question' | 'reward-input' | 'payment'>('reward-question');
  const [cardCode, setCardCode] = useState('');
  const [validatingCard, setValidatingCard] = useState(false);
  const [cardValidated, setCardValidated] = useState(false);
  const [validatedRewardCard, setValidatedRewardCard] = useState<any>(null);
  const [customerName, setCustomerName] = useState<string>('');
  const [generatedToken, setGeneratedToken] = useState<string>('');
  const [isCardCodeValid, setIsCardCodeValid] = useState<boolean | null>(null);
  const [tokenExpiresAt, setTokenExpiresAt] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [cashPaymentOpen, setCashPaymentOpen] = useState(false);
  const [orderNumberDialogOpen, setOrderNumberDialogOpen] = useState(false);
  const [preparationInfo, setPreparationInfo] = useState<{ queueNumber: number; estimatedTime: number; preparationType: 'sandwich' | 'pizza' } | null>(null);

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

  const handleRewardYes = () => {
    setStep('reward-input');
  };

  const handleRewardNo = () => {
    setStep('payment');
  };

  const formatCardCodeDisplay = (value: string): string => {
    const cleaned = value.replace(/\s/g, '').toUpperCase();
    const limited = cleaned.slice(0, 5);
    
    let formatted = '';
    for (let i = 0; i < limited.length; i++) {
      if (i === 2 || i === 4) {
        formatted += ' ';
      }
      formatted += limited[i];
    }
    
    return formatted;
  };

  const handleCardCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardCodeDisplay(e.target.value);
    setCardCode(formatted);
  };

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
        await createAuditLog({
          action: 'VALIDATE_TOKEN',
          resourceType: 'REWARD_CARD',
          details: {
            error: 'Carte non trouvée ou inactive',
            card_code: cleaned,
          },
        });
        showError('Carte non trouvée ou inactive');
        setValidatingCard(false);
        return;
      }

      // Déchiffrer le prénom du client
      let displayName = 'Client';
      if (cardData.customer_profiles?.first_name) {
        try {
          const decrypted = await decryptBatch({
            first_name: cardData.customer_profiles.first_name,
          });
          displayName = decrypted.first_name || 'Client';
        } catch (error) {
          console.error('Decryption error:', error);
          displayName = 'Client';
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
        console.error('Token error:', tokenError);
        showError('Erreur lors de la récupération du token');
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
      showSuccess('Carte validée avec succès !');
      
      await createAuditLog({
        action: 'VALIDATE_TOKEN',
        resourceType: 'REWARD_CARD',
        resourceId: cardData.id,
        details: {
          success: true,
          card_code: cleaned,
        },
      });

      setTimeout(() => {
        setStep('payment');
        setValidatingCard(false);
      }, 1000);
    } catch (error: any) {
      console.error('Validation error:', error);
      showError(error.message || 'Erreur lors de la validation');
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
    setStep('reward-question');
  };

  const getNextQueueNumber = async (preparationType: 'sandwich' | 'pizza'): Promise<number> => {
    const { data: allQueue } = await supabase
      .from('preparation_queue')
      .select('queue_number')
      .eq('preparation_type', preparationType)
      .order('queue_number', { ascending: false });

    if (!allQueue || allQueue.length === 0) {
      return 0;
    }

    const maxNumber = allQueue[0].queue_number;

    if (maxNumber >= 999) {
      return 0;
    }

    return maxNumber + 1;
  };

  const countProductsInQueue = async (preparationType: 'sandwich' | 'pizza'): Promise<number> => {
    const { data: queueData } = await supabase
      .from('preparation_queue')
      .select('order_id')
      .eq('preparation_type', preparationType)
      .in('status', ['pending', 'ready']);

    if (!queueData || queueData.length === 0) {
      return 0;
    }

    const orderIds = queueData.map(q => q.order_id);
    const { data: ordersData } = await supabase
      .from('orders')
      .select('id, items')
      .in('id', orderIds);

    if (!ordersData) {
      return 0;
    }

    const productIds = new Set<string>();
    ordersData.forEach(order => {
      order.items?.forEach((item: any) => {
        productIds.add(item.product_id);
      });
    });

    const { data: productsData } = await supabase
      .from('products')
      .select('id, requires_preparation, preparation_type')
      .in('id', Array.from(productIds));

    if (!productsData) {
      return 0;
    }

    const productsMap = new Map();
    productsData.forEach(product => {
      productsMap.set(product.id, product);
    });

    let totalProducts = 0;
    ordersData.forEach(order => {
      order.items?.forEach((item: any) => {
        const product = productsMap.get(item.product_id);
        if (product?.requires_preparation && product.preparation_type === preparationType) {
          totalProducts += item.quantity;
        }
      });
    });

    return totalProducts;
  };

  const calculatePreparationQueue = async (preparationType: 'sandwich' | 'pizza'): Promise<{ queueNumber: number; estimatedTime: number }> => {
    const totalProductsInQueue = await countProductsInQueue(preparationType);
    const queueNumber = await getNextQueueNumber(preparationType);
    const baseTime = PREPARATION_TIMES[preparationType];
    
    if (totalProductsInQueue < MAX_SIMULTANEOUS) {
      return { queueNumber, estimatedTime: baseTime };
    }

    const productsAhead = totalProductsInQueue - MAX_SIMULTANEOUS + 1;
    const batchesAhead = Math.ceil(productsAhead / MAX_SIMULTANEOUS);
    const waitingTime = batchesAhead * baseTime;
    const totalTime = baseTime + waitingTime;

    return { queueNumber, estimatedTime: totalTime };
  };

  const handlePayment = async (method: 'cash' | 'card') => {
    if (method === 'cash') {
      setCashPaymentOpen(true);
      return;
    }

    await completePayment(method);
  };

  const completePayment = async (method: 'cash' | 'card') => {
    const pointsEarned = Math.floor(total * 1000);

    const orderItems = cart.map(item => ({
      product_id: item.product.id,
      product_name: item.product.name,
      quantity: item.quantity,
      unit_price: item.product.price,
      apply_taxes: item.product.apply_taxes,
    }));

    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_profile_id: validatedRewardCard?.customer_profiles?.id || null,
        reward_card_id: validatedRewardCard?.id || null,
        total_amount: total,
        payment_method: method,
        points_earned: validatedRewardCard ? pointsEarned : 0,
        items: orderItems,
      })
      .select()
      .single();

    if (orderError) {
      showError('Erreur lors de l\'enregistrement de la commande');
      console.error(orderError);
      return;
    }

    if (cardValidated && generatedToken) {
      await markTokenAsUsed(generatedToken);
    }

    await createAuditLog({
      action: 'CREATE_ORDER',
      resourceType: 'ORDER',
      resourceId: orderData.id,
      details: {
        total_amount: total,
        payment_method: method,
        customer_profile_id: validatedRewardCard?.customer_profiles?.id || null,
        points_earned: validatedRewardCard ? pointsEarned : 0,
      },
    });

    if (validatedRewardCard) {
      const currentPoints = validatedRewardCard.customer_profiles.points_balance || 0;
      const { error: updateError } = await supabase
        .from('customer_profiles')
        .update({ points_balance: currentPoints + pointsEarned })
        .eq('id', validatedRewardCard.customer_profiles.id);

      if (updateError) {
        console.error('Erreur lors de la mise à jour des points:', updateError);
      }
    }

    const preparationItems = cart.filter(item => item.product.requires_preparation);
    let tempPreparationInfo = null;
    
    if (preparationItems.length > 0) {
      const preparationTypes = new Set(preparationItems.map(item => item.product.preparation_type).filter(Boolean));
      
      for (const prepType of preparationTypes) {
        if (prepType) {
          const { queueNumber, estimatedTime } = await calculatePreparationQueue(prepType as 'sandwich' | 'pizza');
          
          await supabase
            .from('preparation_queue')
            .insert({
              order_id: orderData.id,
              queue_number: queueNumber,
              preparation_type: prepType,
              estimated_time: estimatedTime,
              status: 'pending',
            });

          tempPreparationInfo = { queueNumber, estimatedTime, preparationType: prepType as 'sandwich' | 'pizza' };
          setPreparationInfo(tempPreparationInfo);
        }
      }
    }

    const paymentMethod = method === 'cash' ? 'Comptant' : 'Débit/Crédit';
    showSuccess(`Paiement ${paymentMethod} enregistré avec succès !${validatedRewardCard ? ` +${pointsEarned.toLocaleString()} points` : ''}`);
    
    onComplete();
    handleClose();
    
    if (tempPreparationInfo) {
      setTimeout(() => {
        setOrderNumberDialogOpen(true);
      }, 300);
    }
  };

  const handleCashPaymentConfirm = async () => {
    setCashPaymentOpen(false);
    await completePayment('cash');
  };

  const handleClose = () => {
    setStep('reward-question');
    setCardCode('');
    setValidatingCard(false);
    setCardValidated(false);
    setValidatedRewardCard(null);
    setCustomerName('');
    setGeneratedToken('');
    setIsCardCodeValid(null);
    setTokenExpiresAt(null);
    setTimeRemaining(0);
    setCashPaymentOpen(false);
    onOpenChange(false);
  };

  const handleOrderNumberDialogClose = () => {
    setOrderNumberDialogOpen(false);
    setPreparationInfo(null);
  };

  const pointsToEarn = Math.floor(total * 1000);
  const hasPreparationItems = cart.some(item => item.product.requires_preparation);

  const formatTimeRemaining = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="backdrop-blur-xl bg-slate-900/95 border-blue-500/30 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-blue-400" />
              Finaliser la commande
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="p-4 bg-slate-900/50 rounded-lg border border-blue-500/30">
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-lg">Total à payer</span>
                <span className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
                  {total.toFixed(2)} $
                </span>
              </div>
            </div>

            {hasPreparationItems && (
              <div className="flex items-center gap-2 p-3 bg-orange-500/20 border border-orange-500/50 rounded-lg">
                <Clock className="w-5 h-5 text-orange-400" />
                <p className="text-sm text-orange-400">
                  Cette commande nécessite une préparation. Un numéro sera attribué.
                </p>
              </div>
            )}

            {step === 'reward-question' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center gap-3 mb-4">
                  <Gift className="w-6 h-6 text-purple-400" />
                  <p className="text-white text-lg">Le client a-t-il une carte récompense ?</p>
                </div>
                
                <div className="flex items-center gap-2 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
                  <Star className="w-5 h-5 text-yellow-400" />
                  <p className="text-sm text-yellow-400">
                    Cette commande rapportera <span className="font-bold">{pointsToEarn.toLocaleString()}</span> points
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button
                    onClick={handleRewardYes}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold py-6 text-lg transition-all duration-300 hover:scale-105"
                  >
                    <Gift className="w-5 h-5 mr-2" />
                    Oui
                  </Button>
                  <Button
                    onClick={handleRewardNo}
                    variant="outline"
                    className="bg-slate-900/50 border-blue-500/50 hover:bg-blue-500/20 text-white font-semibold py-6 text-lg"
                  >
                    Non
                  </Button>
                </div>
              </div>
            )}

            {step === 'reward-input' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center gap-3 mb-4">
                  <CreditCard className="w-6 h-6 text-purple-400" />
                  <p className="text-white text-lg">Code de carte récompense</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="card-code" className="text-gray-300">
                    Format: XX 00 0 (ex: AB 12 3)
                  </Label>
                  <Input
                    id="card-code"
                    value={cardCode}
                    onChange={handleCardCodeChange}
                    placeholder="AB 12 3"
                    className={`bg-slate-900/50 text-white text-center text-3xl font-mono tracking-widest uppercase transition-all ${
                      isCardCodeValid === true 
                        ? 'border-green-500/70 focus:border-green-400' 
                        : isCardCodeValid === false 
                        ? 'border-red-500/70 focus:border-red-400' 
                        : 'border-blue-500/50 focus:border-blue-400'
                    }`}
                    disabled={validatingCard || cardValidated}
                  />
                  <div className="flex items-center gap-2 text-sm">
                    {isCardCodeValid === true && (
                      <div className="flex items-center gap-2 text-green-400">
                        <CheckCircle className="w-4 h-4" />
                        <span>Code valide</span>
                      </div>
                    )}
                    {isCardCodeValid === false && (
                      <div className="flex items-center gap-2 text-red-400">
                        <AlertCircle className="w-4 h-4" />
                        <span>Code invalide</span>
                      </div>
                    )}
                    {isCardCodeValid === null && (
                      <div className="flex items-center gap-2 text-gray-400">
                        <AlertCircle className="w-4 h-4" />
                        <span>2 lettres + 3 chiffres</span>
                      </div>
                    )}
                  </div>
                </div>

                {cardValidated && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-3 bg-green-500/20 border border-green-500/50 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-green-400 font-semibold">Carte validée !</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-orange-500/20 border border-orange-500/50 rounded-lg">
                      <Clock className="w-5 h-5 text-orange-400 animate-pulse" />
                      <span className="text-orange-400 text-sm font-bold">
                        Expire dans {formatTimeRemaining(timeRemaining)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <Button
                    onClick={handleValidateCard}
                    disabled={!isCardCodeValid || validatingCard || cardValidated}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold py-6 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {validatingCard ? 'Validation...' : 'Valider'}
                  </Button>
                  <Button
                    onClick={() => setStep('reward-question')}
                    variant="outline"
                    disabled={validatingCard || cardValidated}
                    className="bg-slate-900/50 border-gray-500/50 text-gray-300 py-6"
                  >
                    Retour
                  </Button>
                </div>
              </div>
            )}

            {step === 'payment' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center gap-3 mb-4">
                  <CreditCard className="w-6 h-6 text-blue-400" />
                  <p className="text-white text-lg">Mode de paiement</p>
                </div>

                {cardValidated && validatedRewardCard && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-purple-500/20 border border-purple-500/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Gift className="w-5 h-5 text-purple-400" />
                        <p className="text-purple-400 font-semibold">
                          {customerName}
                        </p>
                      </div>
                      <Button
                        onClick={handleRemoveRewardCard}
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/20 h-8 w-8 p-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-orange-500/20 border border-orange-500/50 rounded-lg">
                      <Clock className="w-5 h-5 text-orange-400 animate-pulse" />
                      <span className="text-orange-400 text-sm font-bold">
                        Expire dans {formatTimeRemaining(timeRemaining)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
                      <Star className="w-5 h-5 text-yellow-400" />
                      <span className="text-yellow-400 text-sm">
                        <span className="font-bold">+{pointsToEarn.toLocaleString()}</span> points après paiement
                      </span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <Button
                    onClick={() => handlePayment('cash')}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold py-8 text-lg transition-all duration-300 hover:scale-105 flex flex-col items-center gap-2"
                  >
                    <Banknote className="w-8 h-8" />
                    Comptant
                  </Button>
                  <Button
                    onClick={() => handlePayment('card')}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold py-8 text-lg transition-all duration-300 hover:scale-105 flex flex-col items-center gap-2"
                  >
                    <CreditCard className="w-8 h-8" />
                    Débit/Crédit
                  </Button>
                </div>

                {!cardValidated && (
                  <Button
                    onClick={() => setStep('reward-question')}
                    variant="outline"
                    className="w-full bg-slate-900/50 border-gray-500/50 text-gray-300"
                  >
                    Retour
                  </Button>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <CashPaymentDialog
        open={cashPaymentOpen}
        onOpenChange={setCashPaymentOpen}
        totalAmount={total}
        onConfirm={handleCashPaymentConfirm}
      />

      {preparationInfo && (
        <OrderNumberDialog
          open={orderNumberDialogOpen}
          onOpenChange={handleOrderNumberDialogClose}
          queueNumber={preparationInfo.queueNumber}
          estimatedTime={preparationInfo.estimatedTime}
          preparationType={preparationInfo.preparationType}
        />
      )}
    </>
  );
};