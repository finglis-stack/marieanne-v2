"use client";

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ParticleBackground } from '@/components/particle-background';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, User, CreditCard, Calendar, Hash, Power, PowerOff, Trash2, Star, ShoppingBag, Banknote, ChevronRight } from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';
import { Badge } from '@/components/ui/badge';
import { decryptBatch } from '@/lib/crypto';

interface CustomerProfile {
  id: string;
  customer_number: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
  points_balance: number;
}

interface RewardCard {
  id: string;
  card_code: string;
  customer_profile_id: string;
  is_active: boolean;
  created_at: string;
}

interface Order {
  id: string;
  order_number: number;
  total_amount: number;
  payment_method: string;
  points_earned: number;
  items: any[];
  created_at: string;
}

const formatCardCode = (code: string): string => {
  if (code.length !== 5) return code;
  return `${code.slice(0, 2)} ${code.slice(2, 4)} ${code.slice(4)}`;
};

const CustomerDetail = () => {
  const navigate = useNavigate();
  const { customerId } = useParams<{ customerId: string }>();
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [cards, setCards] = useState<RewardCard[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

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
  }, [navigate, customerId]);

  const loadData = async () => {
    if (!customerId) return;
    
    setLoading(true);

    const { data: customerData, error: customerError } = await supabase
      .from('customer_profiles')
      .select('*')
      .eq('id', customerId)
      .single();

    if (customerError) {
      showError('Erreur lors du chargement de la fiche');
      console.error(customerError);
      navigate('/reward-cards');
      return;
    }

    // Déchiffrer les données du client
    try {
      const toDecrypt: { [key: string]: string } = {};
      
      if (customerData.customer_number) toDecrypt.customer_number = customerData.customer_number;
      if (customerData.first_name) toDecrypt.first_name = customerData.first_name;
      if (customerData.last_name) toDecrypt.last_name = customerData.last_name;
      if (customerData.email) toDecrypt.email = customerData.email;
      if (customerData.phone) toDecrypt.phone = customerData.phone;
      if (customerData.notes) toDecrypt.notes = customerData.notes;

      const decrypted = await decryptBatch(toDecrypt);

      const decryptedCustomer = {
        ...customerData,
        customer_number: decrypted.customer_number || customerData.customer_number,
        first_name: decrypted.first_name || customerData.first_name,
        last_name: decrypted.last_name || customerData.last_name,
        email: decrypted.email || customerData.email,
        phone: decrypted.phone || customerData.phone,
        notes: decrypted.notes || customerData.notes,
      };

      setCustomer(decryptedCustomer);
    } catch (error) {
      console.error('Decryption error:', error);
      setCustomer(customerData);
    }

    const { data: cardsData, error: cardsError } = await supabase
      .from('reward_cards')
      .select('*')
      .eq('customer_profile_id', customerId)
      .order('created_at', { ascending: false });

    if (cardsError) {
      showError('Erreur lors du chargement des cartes');
      console.error(cardsError);
    }

    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_profile_id', customerId)
      .order('created_at', { ascending: false });

    if (ordersError) {
      showError('Erreur lors du chargement des commandes');
      console.error(ordersError);
    }

    setCards(cardsData || []);
    setOrders(ordersData || []);
    setLoading(false);
  };

  const handleToggleCard = async (cardId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('reward_cards')
      .update({ is_active: !currentStatus })
      .eq('id', cardId);

    if (error) {
      showError('Erreur lors de la modification de la carte');
      console.error(error);
    } else {
      showSuccess(currentStatus ? 'Carte désactivée' : 'Carte activée');
      loadData();
    }
  };

  const handleDeleteCard = async (cardId: string) => {
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
      loadData();
    }
  };

  if (loading || !customer) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        <ParticleBackground />
        <div className="relative z-10 text-white text-xl">Chargement...</div>
      </div>
    );
  }

  const displayName = customer.first_name || 'Élève sans nom';
  const totalSpent = orders.reduce((sum, order) => sum + parseFloat(order.total_amount.toString()), 0);

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
                onClick={() => navigate('/reward-cards')}
                variant="outline"
                className="bg-slate-900/50 border-blue-500/50 hover:bg-blue-500/20 hover:border-blue-400 text-gray-300 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">{displayName}</h1>
                  <p className="text-gray-400">Fiche #{customer.customer_number}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="backdrop-blur-xl bg-slate-900/60 border-blue-500/20 p-4">
                <div className="flex items-center gap-3">
                  <Star className="w-5 h-5 text-yellow-400" />
                  <div>
                    <p className="text-gray-400 text-xs">Points</p>
                    <p className="text-white text-xl font-bold">{customer.points_balance.toLocaleString()}</p>
                  </div>
                </div>
              </Card>

              <Card className="backdrop-blur-xl bg-slate-900/60 border-blue-500/20 p-4">
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-gray-400 text-xs">Commandes</p>
                    <p className="text-white text-xl font-bold">{orders.length}</p>
                  </div>
                </div>
              </Card>

              <Card className="backdrop-blur-xl bg-slate-900/60 border-blue-500/20 p-4">
                <div className="flex items-center gap-3">
                  <Banknote className="w-5 h-5 text-emerald-400" />
                  <div>
                    <p className="text-gray-400 text-xs">Total dépensé</p>
                    <p className="text-white text-lg font-bold">{totalSpent.toFixed(2)} $</p>
                  </div>
                </div>
              </Card>

              <Card className="backdrop-blur-xl bg-slate-900/60 border-blue-500/20 p-4">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-purple-400" />
                  <div>
                    <p className="text-gray-400 text-xs">Cartes</p>
                    <p className="text-white text-xl font-bold">{cards.length}</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <Card className="backdrop-blur-xl bg-slate-900/40 border border-blue-500/30 shadow-2xl shadow-blue-500/20 overflow-hidden">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-6">
                <ShoppingBag className="w-6 h-6 text-green-400" />
                Historique des commandes
              </h2>

              <div className="space-y-3">
                {orders.map((order) => (
                  <Card 
                    key={order.id} 
                    onClick={() => navigate(`/orders/${order.id}`)}
                    className="backdrop-blur-xl bg-slate-900/60 border-blue-500/20 p-4 cursor-pointer hover:border-blue-400/50 transition-all group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/50">
                            Commande #{order.order_number}
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className={`${
                              order.payment_method === 'cash'
                                ? 'bg-green-500/20 text-green-400 border-green-500/50'
                                : 'bg-blue-500/20 text-blue-400 border-blue-500/50'
                            }`}
                          >
                            {order.payment_method === 'cash' ? 'Comptant' : 'Débit/Crédit'}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-gray-400">
                          {new Date(order.created_at).toLocaleDateString('fr-CA', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Banknote className="w-4 h-4 text-emerald-400" />
                            <span className="text-white font-bold">{parseFloat(order.total_amount.toString()).toFixed(2)} $</span>
                          </div>
                          {order.points_earned > 0 && (
                            <div className="flex items-center gap-2">
                              <Star className="w-4 h-4 text-yellow-400" />
                              <span className="text-yellow-400 font-semibold">+{order.points_earned.toLocaleString()} pts</span>
                            </div>
                          )}
                        </div>

                        <div className="text-xs text-gray-500">
                          {order.items.length} article{order.items.length > 1 ? 's' : ''}
                        </div>
                      </div>

                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
                    </div>
                  </Card>
                ))}

                {orders.length === 0 && (
                  <div className="text-center py-12">
                    <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">Aucune commande pour cette fiche</p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          <Card className="backdrop-blur-xl bg-slate-900/40 border border-blue-500/30 shadow-2xl shadow-blue-500/20 overflow-hidden">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-6">
                <CreditCard className="w-6 h-6 text-purple-400" />
                Cartes récompenses
              </h2>

              <div className="space-y-3">
                {cards.map((card) => (
                  <Card key={card.id} className="backdrop-blur-xl bg-slate-900/60 border-blue-500/20 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <CreditCard className={`w-6 h-6 ${card.is_active ? 'text-green-400' : 'text-gray-500'}`} />
                        <div>
                          <p className="text-white font-mono text-xl font-bold">
                            {formatCardCode(card.card_code)}
                          </p>
                          <div className="flex items-center gap-4 mt-1">
                            <p className="text-xs text-gray-500">
                              Créée le {new Date(card.created_at).toLocaleDateString('fr-CA')}
                            </p>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                card.is_active 
                                  ? 'bg-green-500/20 text-green-400 border-green-500/50' 
                                  : 'bg-gray-500/20 text-gray-400 border-gray-500/50'
                              }`}
                            >
                              {card.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleToggleCard(card.id, card.is_active)}
                          variant="outline"
                          size="sm"
                          className={`${
                            card.is_active 
                              ? 'bg-green-500/20 border-green-500/50 hover:bg-green-500/30 text-green-400' 
                              : 'bg-gray-500/20 border-gray-500/50 hover:bg-gray-500/30 text-gray-400'
                          }`}
                        >
                          {card.is_active ? <Power className="w-4 h-4 mr-2" /> : <PowerOff className="w-4 h-4 mr-2" />}
                          {card.is_active ? 'Désactiver' : 'Activer'}
                        </Button>
                        <Button
                          onClick={() => handleDeleteCard(card.id)}
                          variant="outline"
                          size="sm"
                          className="bg-red-500/20 border-red-500/50 hover:bg-red-500/30 text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}

                {cards.length === 0 && (
                  <div className="text-center py-12">
                    <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">Aucune carte pour cette fiche</p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          <Card className="backdrop-blur-xl bg-slate-900/40 border border-blue-500/30 shadow-2xl shadow-blue-500/20 overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-4">Informations techniques</h2>
              <div className="space-y-3 font-mono text-sm">
                <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                  <span className="text-gray-400">UUID complet</span>
                  <span className="text-white">{customer.id}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                  <span className="text-gray-400">Date de création (ISO)</span>
                  <span className="text-white">{customer.created_at}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetail;