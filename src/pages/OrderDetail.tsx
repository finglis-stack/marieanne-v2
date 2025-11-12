"use client";

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ParticleBackground } from '@/components/particle-background';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, ShoppingBag, Calendar, CreditCard, Banknote, Star, Package, DollarSign, User, Gift, Eye, EyeOff, Lock } from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';
import { Badge } from '@/components/ui/badge';
import { decryptBatch } from '@/lib/crypto';

interface Order {
  id: string;
  order_number: number;
  customer_profile_id: string | null;
  reward_card_id: string | null;
  total_amount: number;
  payment_method: string;
  points_earned: number;
  items: OrderItem[];
  created_at: string;
}

interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  apply_taxes: boolean;
}

interface CustomerProfile {
  id: string;
  customer_number: string;
  first_name: string | null;
  last_name: string | null;
}

interface RewardCard {
  id: string;
  card_code: string;
}

const OrderDetail = () => {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [rewardCard, setRewardCard] = useState<RewardCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [decryptedCustomer, setDecryptedCustomer] = useState<CustomerProfile | null>(null);

  const TAX_RATE = 0.14975;

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
      } else {
        loadData();
      }
    };
    getUser();
  }, [navigate, orderId]);

  const loadData = async () => {
    if (!orderId) return;
    
    setLoading(true);

    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError) {
      showError('Erreur lors du chargement de la commande');
      console.error(orderError);
      navigate('/reward-cards');
      return;
    }

    if (orderData.customer_profile_id) {
      const { data: customerData } = await supabase
        .from('customer_profiles')
        .select('id, customer_number, first_name, last_name')
        .eq('id', orderData.customer_profile_id)
        .single();
      
      setCustomer(customerData);
    }

    if (orderData.reward_card_id) {
      const { data: cardData } = await supabase
        .from('reward_cards')
        .select('id, card_code')
        .eq('id', orderData.reward_card_id)
        .single();
      
      setRewardCard(cardData);
    }

    setOrder(orderData);
    setLoading(false);
  };

  const handleUnlockSensitiveData = () => {
    setPasswordDialogOpen(true);
  };

  const handleVerifyPassword = async () => {
    setVerifying(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: (await supabase.auth.getUser()).data.user?.email || '',
      password: password,
    });

    if (error) {
      showError('Mot de passe incorrect');
      setVerifying(false);
      return;
    }

    if (customer) {
      try {
        const toDecrypt: { [key: string]: string } = {};
        
        if (customer.customer_number) toDecrypt.customer_number = customer.customer_number;
        if (customer.first_name) toDecrypt.first_name = customer.first_name;
        if (customer.last_name) toDecrypt.last_name = customer.last_name;

        const decrypted = await decryptBatch(toDecrypt);

        setDecryptedCustomer({
          ...customer,
          customer_number: decrypted.customer_number || customer.customer_number,
          first_name: decrypted.first_name || customer.first_name,
          last_name: decrypted.last_name || customer.last_name,
        });

        setShowSensitiveData(true);
        showSuccess('Données déchiffrées avec succès');
      } catch (error) {
        console.error('Decryption error:', error);
        showError('Erreur lors du déchiffrement');
      }
    }

    setPasswordDialogOpen(false);
    setPassword('');
    setVerifying(false);
  };

  const calculateItemTotal = (item: OrderItem) => {
    const basePrice = item.unit_price * item.quantity;
    const tax = item.apply_taxes ? basePrice * TAX_RATE : 0;
    return { basePrice, tax, total: basePrice + tax };
  };

  const calculateOrderTotals = () => {
    if (!order) return { subtotal: 0, tax: 0, total: 0 };

    let subtotal = 0;
    let totalTax = 0;

    order.items.forEach(item => {
      const { basePrice, tax } = calculateItemTotal(item);
      subtotal += basePrice;
      totalTax += tax;
    });

    return {
      subtotal,
      tax: totalTax,
      total: subtotal + totalTax,
    };
  };

  if (loading || !order) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        <ParticleBackground />
        <div className="relative z-10 text-white text-xl">Chargement...</div>
      </div>
    );
  }

  const totals = calculateOrderTotals();

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
                onClick={() => navigate(-1)}
                variant="outline"
                className="bg-slate-900/50 border-blue-500/50 hover:bg-blue-500/20 hover:border-blue-400 text-gray-300 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500">
                  <ShoppingBag className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Commande #{order.order_number}</h1>
                  <p className="text-gray-400 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {new Date(order.created_at).toLocaleDateString('fr-CA', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="backdrop-blur-xl bg-slate-900/60 border-blue-500/20 p-4">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  <div>
                    <p className="text-gray-400 text-xs">Montant total</p>
                    <p className="text-white text-xl font-bold">{parseFloat(order.total_amount.toString()).toFixed(2)} $</p>
                  </div>
                </div>
              </Card>

              <Card className="backdrop-blur-xl bg-slate-900/60 border-blue-500/20 p-4">
                <div className="flex items-center gap-3">
                  {order.payment_method === 'cash' ? (
                    <Banknote className="w-5 h-5 text-green-400" />
                  ) : (
                    <CreditCard className="w-5 h-5 text-blue-400" />
                  )}
                  <div>
                    <p className="text-gray-400 text-xs">Paiement</p>
                    <p className="text-white text-sm font-semibold">
                      {order.payment_method === 'cash' ? 'Comptant' : 'Débit/Crédit'}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="backdrop-blur-xl bg-slate-900/60 border-blue-500/20 p-4">
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-purple-400" />
                  <div>
                    <p className="text-gray-400 text-xs">Articles</p>
                    <p className="text-white text-xl font-bold">{order.items.length}</p>
                  </div>
                </div>
              </Card>

              <Card className="backdrop-blur-xl bg-slate-900/60 border-blue-500/20 p-4">
                <div className="flex items-center gap-3">
                  <Star className="w-5 h-5 text-yellow-400" />
                  <div>
                    <p className="text-gray-400 text-xs">Points gagnés</p>
                    <p className="text-white text-xl font-bold">{order.points_earned.toLocaleString()}</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {(customer || rewardCard) && (
            <Card className="backdrop-blur-xl bg-slate-900/40 border border-blue-500/30 shadow-2xl shadow-blue-500/20 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <User className="w-6 h-6 text-blue-400" />
                    Informations client
                  </h2>
                  {!showSensitiveData && customer && (
                    <Button
                      onClick={handleUnlockSensitiveData}
                      variant="outline"
                      size="sm"
                      className="bg-slate-900/50 border-orange-500/50 hover:bg-orange-500/20 text-orange-400"
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      Déverrouiller
                    </Button>
                  )}
                </div>

                <div className="space-y-3">
                  {customer && (
                    <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-blue-400" />
                        <div>
                          {showSensitiveData && decryptedCustomer ? (
                            <>
                              <p className="text-white font-semibold">
                                {decryptedCustomer.first_name || 'Élève sans nom'}
                              </p>
                              <p className="text-gray-400 text-sm">Fiche #{decryptedCustomer.customer_number}</p>
                            </>
                          ) : (
                            <>
                              <p className="text-white font-semibold">••••••••</p>
                              <p className="text-gray-400 text-sm">Fiche #••••••</p>
                            </>
                          )}
                        </div>
                      </div>
                      <Button
                        onClick={() => navigate(`/reward-cards/${customer.id}`)}
                        variant="outline"
                        size="sm"
                        className="bg-slate-900/50 border-blue-500/50 hover:bg-blue-500/20 text-blue-400"
                      >
                        Voir la fiche
                      </Button>
                    </div>
                  )}

                  {rewardCard && (
                    <div className="flex items-center gap-3 p-4 bg-slate-900/50 rounded-lg">
                      <Gift className="w-5 h-5 text-purple-400" />
                      <div>
                        <p className="text-gray-400 text-xs">Carte récompense utilisée</p>
                        <p className="text-white font-mono text-lg font-bold blur-sm select-none">
                          •• •• •
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}

          <Card className="backdrop-blur-xl bg-slate-900/40 border border-blue-500/30 shadow-2xl shadow-blue-500/20 overflow-hidden">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-6">
                <Package className="w-6 h-6 text-purple-400" />
                Articles commandés
              </h2>

              <div className="space-y-3">
                {order.items.map((item, index) => {
                  const { basePrice, tax, total } = calculateItemTotal(item);
                  
                  return (
                    <Card key={index} className="backdrop-blur-xl bg-slate-900/60 border-blue-500/20 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/50">
                              x{item.quantity}
                            </Badge>
                            <h3 className="text-white font-semibold text-lg">{item.product_name}</h3>
                            {item.apply_taxes && (
                              <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/50 text-xs">
                                +TPS/TVQ
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-gray-400">
                              Prix unitaire: <span className="text-white font-semibold">{item.unit_price.toFixed(2)} $</span>
                            </span>
                            <span className="text-gray-400">
                              Sous-total: <span className="text-white font-semibold">{basePrice.toFixed(2)} $</span>
                            </span>
                            {item.apply_taxes && (
                              <span className="text-gray-400">
                                Taxes: <span className="text-green-400 font-semibold">{tax.toFixed(2)} $</span>
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-white text-2xl font-bold">{total.toFixed(2)} $</p>
                          <p className="text-gray-400 text-xs">Total</p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>

              <div className="mt-6 pt-6 border-t border-blue-500/30 space-y-3">
                <div className="flex items-center justify-between text-gray-300">
                  <span className="text-lg">Sous-total</span>
                  <span className="text-xl font-semibold">{totals.subtotal.toFixed(2)} $</span>
                </div>
                <div className="flex items-center justify-between text-gray-300">
                  <span className="text-lg flex items-center gap-2">
                    <Star className="w-5 h-5 text-green-400" />
                    Taxes (TPS/TVQ)
                  </span>
                  <span className="text-xl font-semibold text-green-400">{totals.tax.toFixed(2)} $</span>
                </div>
                <div className="h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
                <div className="flex items-center justify-between text-white">
                  <span className="text-2xl font-bold">Total</span>
                  <span className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
                    {totals.total.toFixed(2)} $
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="backdrop-blur-xl bg-slate-900/95 border-orange-500/30 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl bg-gradient-to-r from-orange-400 via-red-400 to-orange-400 bg-clip-text text-transparent flex items-center gap-2">
              <Lock className="w-6 h-6 text-orange-400" />
              Authentification requise
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-gray-300">
              Pour des raisons de sécurité, veuillez entrer votre mot de passe pour déchiffrer les informations sensibles.
            </p>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-slate-900/50 border-orange-500/50 text-white"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleVerifyPassword();
                  }
                }}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                onClick={() => setPasswordDialogOpen(false)}
                variant="outline"
                className="bg-slate-900/50 border-gray-500/50 text-gray-300"
                disabled={verifying}
              >
                Annuler
              </Button>
              <Button
                onClick={handleVerifyPassword}
                className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white"
                disabled={verifying || !password}
              >
                {verifying ? 'Vérification...' : 'Déverrouiller'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderDetail;