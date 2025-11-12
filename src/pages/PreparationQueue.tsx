"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ParticleBackground } from '@/components/particle-background';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChefHat, Clock, CheckCircle, Sandwich, Pizza, Coffee } from 'lucide-react';

interface QueueItem {
  id: string;
  order_id: string;
  queue_number: number;
  preparation_type: 'sandwich' | 'pizza';
  estimated_time: number;
  status: 'pending' | 'ready' | 'delivered';
  created_at: string;
  ready_at: string | null;
  delivered_at: string | null;
}

interface Order {
  id: string;
  items: OrderItem[];
}

interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
}

interface Product {
  id: string;
  name: string;
  image_url: string | null;
  requires_preparation: boolean;
  preparation_type: string | null;
}

interface IndividualProduct {
  name: string;
  image_url: string | null;
  queueNumber: number;
  estimatedTime: number;
  status: 'pending' | 'ready';
  createdAt: string;
  queueId: string;
}

const PreparationQueue = () => {
  const [sandwichProducts, setSandwichProducts] = useState<IndividualProduct[]>([]);
  const [pizzaProducts, setPizzaProducts] = useState<IndividualProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    // Timer pour mettre à jour l'heure actuelle chaque seconde
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadQueue();

    // S'abonner aux changements en temps réel
    const channel = supabase
      .channel('preparation_queue_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'preparation_queue',
        },
        (payload) => {
          console.log('Change received!', payload);
          loadQueue();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadQueue = async () => {
    try {
      const { data: queueData, error } = await supabase
        .from('preparation_queue')
        .select('*')
        .in('status', ['pending', 'ready'])
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading queue:', error);
        setLoading(false);
        return;
      }

      if (!queueData || queueData.length === 0) {
        setSandwichProducts([]);
        setPizzaProducts([]);
        setLoading(false);
        return;
      }

      // Récupérer les détails des commandes
      const orderIds = [...new Set(queueData.map(item => item.order_id))];
      const { data: ordersData } = await supabase
        .from('orders')
        .select('id, items')
        .in('id', orderIds);

      // Récupérer les détails des produits
      const productIds = new Set<string>();
      ordersData?.forEach(order => {
        order.items?.forEach((item: OrderItem) => {
          productIds.add(item.product_id);
        });
      });

      const { data: productsData } = await supabase
        .from('products')
        .select('id, name, image_url, requires_preparation, preparation_type')
        .in('id', Array.from(productIds));

      const productsMap = new Map<string, Product>();
      productsData?.forEach(product => {
        productsMap.set(product.id, product);
      });

      const ordersMap = new Map<string, Order>();
      ordersData?.forEach(order => {
        ordersMap.set(order.id, order);
      });

      // Créer une liste de produits individuels
      const allIndividualProducts: IndividualProduct[] = [];

      queueData.forEach(queueItem => {
        const order = ordersMap.get(queueItem.order_id);
        
        order?.items?.forEach((orderItem: OrderItem) => {
          const product = productsMap.get(orderItem.product_id);
          
          // Vérifier si le produit nécessite une préparation et correspond au type
          if (product?.requires_preparation && product.preparation_type === queueItem.preparation_type) {
            // Créer un produit individuel pour chaque quantité
            for (let i = 0; i < orderItem.quantity; i++) {
              allIndividualProducts.push({
                name: product.name,
                image_url: product.image_url,
                queueNumber: queueItem.queue_number,
                estimatedTime: queueItem.estimated_time,
                status: queueItem.status as 'pending' | 'ready',
                createdAt: queueItem.created_at,
                queueId: queueItem.id,
              });
            }
          }
        });
      });

      const sandwiches = allIndividualProducts.filter(p => 
        queueData.find(q => q.id === p.queueId)?.preparation_type === 'sandwich'
      );
      const pizzas = allIndividualProducts.filter(p => 
        queueData.find(q => q.id === p.queueId)?.preparation_type === 'pizza'
      );

      setSandwichProducts(sandwiches);
      setPizzaProducts(pizzas);
      setLoading(false);
    } catch (error) {
      console.error('Error in loadQueue:', error);
      setLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getElapsedTime = (createdAt: string): number => {
    const created = new Date(createdAt).getTime();
    return Math.floor((currentTime - created) / 1000);
  };

  const getRemainingTime = (product: IndividualProduct): number => {
    const elapsed = getElapsedTime(product.createdAt);
    const remaining = product.estimatedTime - elapsed;
    return Math.max(0, remaining);
  };

  const renderQueueSection = (products: IndividualProduct[], type: 'sandwich' | 'pizza', icon: React.ReactNode, title: string, bgGradient: string) => {
    const ready = products.filter(p => p.status === 'ready');
    const pending = products.filter(p => p.status === 'pending');

    if (products.length === 0) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className={`p-4 rounded-2xl bg-gradient-to-br ${bgGradient} shadow-2xl`}>
            {icon}
          </div>
          <h2 className="text-5xl font-bold text-white">{title}</h2>
        </div>

        {/* Prêts à livrer */}
        {ready.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3 mb-6">
              <CheckCircle className="w-8 h-8 text-green-400" />
              <h3 className="text-3xl font-bold text-green-400">Prêt à livrer</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {ready.map((product, idx) => (
                <Card key={`${product.queueId}-ready-${idx}`} className="backdrop-blur-xl bg-slate-900/80 border-green-500/50 p-6 animate-pulse shadow-2xl shadow-green-500/30">
                  <div className="space-y-4">
                    <div className="flex items-center justify-center">
                      <Badge variant="outline" className="bg-green-500/30 text-green-400 border-green-500/70 text-6xl font-bold px-8 py-4">
                        #{product.queueNumber.toString().padStart(2, '0')}
                      </Badge>
                    </div>

                    <div className="flex flex-col items-center gap-3 bg-slate-900/50 p-4 rounded-lg">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-24 h-24 bg-gradient-to-br from-green-600/20 to-emerald-600/20 rounded-lg flex items-center justify-center">
                          <Coffee className="w-12 h-12 text-green-400/50" />
                        </div>
                      )}
                      <p className="text-white font-semibold text-xl text-center">{product.name}</p>
                    </div>

                    <div className="flex items-center justify-center gap-2 p-3 bg-green-500/20 rounded-lg">
                      <CheckCircle className="w-6 h-6 text-green-400" />
                      <span className="text-green-400 font-bold text-xl">PRÊT</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* En préparation */}
        {pending.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3 mb-6">
              <ChefHat className="w-8 h-8 text-orange-400" />
              <h3 className="text-3xl font-bold text-orange-400">En préparation</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {pending.map((product, idx) => {
                const remaining = getRemainingTime(product);
                const progress = ((product.estimatedTime - remaining) / product.estimatedTime) * 100;

                return (
                  <Card key={`${product.queueId}-pending-${idx}`} className={`backdrop-blur-xl bg-slate-900/80 border-${type === 'sandwich' ? 'orange' : 'red'}-500/50 p-6 shadow-2xl shadow-${type === 'sandwich' ? 'orange' : 'red'}-500/30`}>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className={`bg-${type === 'sandwich' ? 'orange' : 'red'}-500/30 text-${type === 'sandwich' ? 'orange' : 'red'}-400 border-${type === 'sandwich' ? 'orange' : 'red'}-500/70 text-5xl font-bold px-6 py-3`}>
                          #{product.queueNumber.toString().padStart(2, '0')}
                        </Badge>
                        <div className="text-right">
                          <p className={`text-${type === 'sandwich' ? 'orange' : 'red'}-400 font-bold text-3xl`}>{formatTime(remaining)}</p>
                          <p className="text-xs text-gray-500">restant</p>
                        </div>
                      </div>

                      <div className="flex flex-col items-center gap-3 bg-slate-900/50 p-4 rounded-lg">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-24 h-24 object-cover rounded-lg"
                          />
                        ) : (
                          <div className={`w-24 h-24 bg-gradient-to-br from-${type === 'sandwich' ? 'orange' : 'red'}-600/20 to-${type === 'sandwich' ? 'red' : 'pink'}-600/20 rounded-lg flex items-center justify-center`}>
                            <Coffee className={`w-12 h-12 text-${type === 'sandwich' ? 'orange' : 'red'}-400/50`} />
                          </div>
                        )}
                        <p className="text-white font-semibold text-xl text-center">{product.name}</p>
                      </div>

                      <div className="w-full bg-slate-900/50 rounded-full h-3">
                        <div 
                          className={`bg-gradient-to-r from-${type === 'sandwich' ? 'orange' : 'red'}-500 to-${type === 'sandwich' ? 'red' : 'pink'}-600 h-3 rounded-full transition-all duration-1000`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        <ParticleBackground />
        <div className="relative z-10 text-white text-3xl">Chargement...</div>
      </div>
    );
  }

  if (sandwichProducts.length === 0 && pizzaProducts.length === 0) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
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

        <div className="relative z-10 text-center space-y-6">
          <div className="flex items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-50 animate-pulse" />
              <Coffee className="w-32 h-32 text-blue-400 relative animate-pulse" />
            </div>
          </div>
          <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
            CAFÉ MARIE ANNE
          </h1>
          <p className="text-3xl text-gray-400">Aucune commande en cours</p>
        </div>
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

      <div className="relative z-10 p-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="max-w-[2000px] mx-auto space-y-12">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-4 mb-4">
              <Coffee className="w-16 h-16 text-blue-400" />
              <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
                CAFÉ MARIE ANNE
              </h1>
            </div>
            <p className="text-2xl text-gray-400 flex items-center justify-center gap-2">
              <Clock className="w-6 h-6" />
              File d'attente en temps réel
            </p>
          </div>

          {sandwichProducts.length > 0 && renderQueueSection(
            sandwichProducts,
            'sandwich',
            <Sandwich className="w-12 h-12 text-white" />,
            'Sandwichs',
            'from-orange-500 to-red-500'
          )}

          {pizzaProducts.length > 0 && renderQueueSection(
            pizzaProducts,
            'pizza',
            <Pizza className="w-12 h-12 text-white" />,
            'Pizzas',
            'from-red-500 to-pink-500'
          )}
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-gray-300 text-xl flex items-center gap-3 z-10">
        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
        Mise à jour en temps réel
      </div>
    </div>
  );
};

export default PreparationQueue;