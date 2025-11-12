"use client";

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ParticleBackground } from '@/components/particle-background';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Search, ShoppingBag, Sparkles, ChevronRight, CreditCard, Banknote, Star, Calendar, User, Gift, ChevronLeft } from 'lucide-react';
import { showError } from '@/utils/toast';

interface Order {
  id: string;
  order_number: number;
  customer_profile_id: string | null;
  reward_card_id: string | null;
  total_amount: number;
  payment_method: string;
  points_earned: number;
  items: any[];
  created_at: string;
}

interface CustomerProfile {
  id: string;
  customer_number: number;
  first_name: string | null;
  last_name: string | null;
}

interface RewardCard {
  id: string;
  card_code: string;
}

interface OrderWithDetails extends Order {
  customer?: CustomerProfile;
  card?: RewardCard;
}

const ITEMS_PER_PAGE = 10;

const formatCardCode = (code: string): string => {
  if (code.length !== 5) return code;
  return `${code.slice(0, 2)} ${code.slice(2, 4)} ${code.slice(4)}`;
};

const Transactions = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
      } else {
        setUser(user);
        loadData();
      }
    };
    getUser();
  }, [navigate]);

  const loadData = async () => {
    setLoading(true);

    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (ordersError) {
      showError('Erreur lors du chargement des transactions');
      console.error(ordersError);
      setLoading(false);
      return;
    }

    const customerIds = [...new Set(ordersData?.map(o => o.customer_profile_id).filter(Boolean))];
    const cardIds = [...new Set(ordersData?.map(o => o.reward_card_id).filter(Boolean))];

    let customersMap: { [key: string]: CustomerProfile } = {};
    let cardsMap: { [key: string]: RewardCard } = {};

    if (customerIds.length > 0) {
      const { data: customersData } = await supabase
        .from('customer_profiles')
        .select('id, customer_number, first_name, last_name')
        .in('id', customerIds);

      if (customersData) {
        customersMap = customersData.reduce((acc, customer) => {
          acc[customer.id] = customer;
          return acc;
        }, {} as { [key: string]: CustomerProfile });
      }
    }

    if (cardIds.length > 0) {
      const { data: cardsData } = await supabase
        .from('reward_cards')
        .select('id, card_code')
        .in('id', cardIds);

      if (cardsData) {
        cardsMap = cardsData.reduce((acc, card) => {
          acc[card.id] = card;
          return acc;
        }, {} as { [key: string]: RewardCard });
      }
    }

    const ordersWithDetails: OrderWithDetails[] = (ordersData || []).map(order => ({
      ...order,
      customer: order.customer_profile_id ? customersMap[order.customer_profile_id] : undefined,
      card: order.reward_card_id ? cardsMap[order.reward_card_id] : undefined,
    }));

    setOrders(ordersWithDetails);
    setLoading(false);
  };

  const filteredOrders = orders.filter(order => {
    const searchLower = searchQuery.toLowerCase();
    return (
      order.id.toLowerCase().includes(searchLower) ||
      order.order_number.toString().includes(searchLower) ||
      order.customer?.first_name?.toLowerCase().includes(searchLower) ||
      order.customer?.customer_number.toString().includes(searchLower) ||
      order.card?.card_code.toLowerCase().includes(searchLower)
    );
  });

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total_amount.toString()), 0);
  const totalTransactions = orders.length;
  const cashTransactions = orders.filter(o => o.payment_method === 'cash').length;
  const cardTransactions = orders.filter(o => o.payment_method === 'card').length;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        <ParticleBackground />
        <div className="relative z-10 text-white text-xl">Chargement...</div>
      </div>
    );
  }

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
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="backdrop-blur-xl bg-slate-900/40 border border-blue-500/30 rounded-2xl p-6 shadow-2xl shadow-blue-500/20">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => navigate('/dashboard')}
                  variant="outline"
                  className="bg-slate-900/50 border-blue-500/50 hover:bg-blue-500/20 hover:border-blue-400 text-gray-300 hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour
                </Button>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
                    Transactions
                  </h1>
                  <p className="text-gray-400 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Historique complet des ventes
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="backdrop-blur-xl bg-slate-900/60 border-blue-500/20 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500">
                    <ShoppingBag className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Total transactions</p>
                    <p className="text-white text-2xl font-bold">{totalTransactions}</p>
                  </div>
                </div>
              </Card>

              <Card className="backdrop-blur-xl bg-slate-900/60 border-blue-500/20 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500">
                    <Banknote className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Revenu total</p>
                    <p className="text-white text-xl font-bold">{totalRevenue.toFixed(2)} $</p>
                  </div>
                </div>
              </Card>

              <Card className="backdrop-blur-xl bg-slate-900/60 border-blue-500/20 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500">
                    <Banknote className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Paiements comptant</p>
                    <p className="text-white text-2xl font-bold">{cashTransactions}</p>
                  </div>
                </div>
              </Card>

              <Card className="backdrop-blur-xl bg-slate-900/60 border-blue-500/20 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Paiements carte</p>
                    <p className="text-white text-2xl font-bold">{cardTransactions}</p>
                  </div>
                </div>
              </Card>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par UUID, prénom, numéro de fiche ou code de carte..."
                className="pl-10 bg-slate-900/50 border-blue-500/50 text-white placeholder:text-gray-500 focus:border-blue-400"
              />
            </div>
          </div>

          <div className="space-y-3">
            {paginatedOrders.map((order) => (
              <Card 
                key={order.id}
                onClick={() => navigate(`/orders/${order.id}`)}
                className="backdrop-blur-xl bg-slate-900/60 border-blue-500/20 p-6 cursor-pointer hover:border-blue-400/50 transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/50 font-mono">
                        #{order.order_number}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={`${
                          order.payment_method === 'cash'
                            ? 'bg-green-500/20 text-green-400 border-green-500/50'
                            : 'bg-blue-500/20 text-blue-400 border-blue-500/50'
                        }`}
                      >
                        {order.payment_method === 'cash' ? (
                          <>
                            <Banknote className="w-3 h-3 mr-1" />
                            Comptant
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-3 h-3 mr-1" />
                            Débit/Crédit
                          </>
                        )}
                      </Badge>
                      {order.customer && (
                        <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/50">
                          <User className="w-3 h-3 mr-1" />
                          {order.customer.first_name || 'Client'} (#{order.customer.customer_number})
                        </Badge>
                      )}
                      {order.card && (
                        <Badge variant="outline" className="bg-pink-500/20 text-pink-400 border-pink-500/50 font-mono">
                          <Gift className="w-3 h-3 mr-1" />
                          {formatCardCode(order.card.card_code)}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Calendar className="w-4 h-4" />
                        {new Date(order.created_at).toLocaleDateString('fr-CA', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      <div className="flex items-center gap-2">
                        <Banknote className="w-4 h-4 text-emerald-400" />
                        <span className="text-white font-bold text-lg">{parseFloat(order.total_amount.toString()).toFixed(2)} $</span>
                      </div>
                      {order.points_earned > 0 && (
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-yellow-400" />
                          <span className="text-yellow-400 font-semibold">+{order.points_earned.toLocaleString()} pts</span>
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-gray-500 font-mono">
                      UUID: {order.id}
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors flex-shrink-0" />
                </div>
              </Card>
            ))}
          </div>

          {filteredOrders.length > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-center gap-4 backdrop-blur-xl bg-slate-900/40 border border-blue-500/30 rounded-2xl p-4">
              <Button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                variant="outline"
                className="bg-slate-900/50 border-blue-500/50 hover:bg-blue-500/20 text-white disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Précédent
              </Button>
              
              <span className="text-white font-semibold">
                Page {currentPage} sur {totalPages}
              </span>
              
              <Button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                variant="outline"
                className="bg-slate-900/50 border-blue-500/50 hover:bg-blue-500/20 text-white disabled:opacity-50"
              >
                Suivant
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {filteredOrders.length === 0 && (
            <div className="backdrop-blur-xl bg-slate-900/40 border border-blue-500/30 rounded-2xl p-12 text-center shadow-2xl shadow-blue-500/20">
              <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">
                {searchQuery ? 'Aucune transaction trouvée' : 'Aucune transaction pour le moment'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Transactions;