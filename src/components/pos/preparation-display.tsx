"use client";

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChefHat, Clock, CheckCircle, Package, Pizza, Sandwich, Coffee } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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
  individualId: string;
}

const PREPARATION_TIMES = {
  sandwich: 270,
  pizza: 780,
};

const MAX_SIMULTANEOUS = 4;

export const PreparationDisplay = () => {
  const [sandwichProducts, setSandwichProducts] = useState<IndividualProduct[]>([]);
  const [pizzaProducts, setPizzaProducts] = useState<IndividualProduct[]>([]);

  useEffect(() => {
    loadQueue();
    const interval = setInterval(loadQueue, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadQueue = async () => {
    const { data: queueData, error } = await supabase
      .from('preparation_queue')
      .select('*')
      .in('status', ['pending', 'ready'])
      .order('created_at', { ascending: true });

    if (error) {
      console.error(error);
      return;
    }

    // Récupérer les détails des commandes
    const orderIds = [...new Set(queueData?.map(item => item.order_id) || [])];
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

    queueData?.forEach(queueItem => {
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
              individualId: `${queueItem.id}-${orderItem.product_id}-${i}`,
            });
          }
        }
      });
    });

    const sandwiches = allIndividualProducts.filter(p => 
      queueData?.find(q => q.id === p.queueId)?.preparation_type === 'sandwich'
    );
    const pizzas = allIndividualProducts.filter(p => 
      queueData?.find(q => q.id === p.queueId)?.preparation_type === 'pizza'
    );

    setSandwichProducts(sandwiches);
    setPizzaProducts(pizzas);
  };

  const recalculateQueueTimes = async (preparationType: 'sandwich' | 'pizza') => {
    const { data: queueData } = await supabase
      .from('preparation_queue')
      .select('*')
      .eq('preparation_type', preparationType)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (!queueData || queueData.length === 0) return;

    const baseTime = PREPARATION_TIMES[preparationType];
    const updates = [];

    for (let i = 0; i < queueData.length; i++) {
      let newEstimatedTime = baseTime;

      if (i >= MAX_SIMULTANEOUS) {
        const positionInQueue = i - MAX_SIMULTANEOUS + 1;
        const waitingTime = Math.ceil(positionInQueue / MAX_SIMULTANEOUS) * baseTime;
        newEstimatedTime = baseTime + waitingTime;
      }

      if (queueData[i].estimated_time !== newEstimatedTime) {
        updates.push({
          id: queueData[i].id,
          estimated_time: newEstimatedTime,
        });
      }
    }

    for (const update of updates) {
      await supabase
        .from('preparation_queue')
        .update({ estimated_time: update.estimated_time })
        .eq('id', update.id);
    }

    if (updates.length > 0) {
      await loadQueue();
    }
  };

  const handleMarkReady = async (queueId: string, preparationType: 'sandwich' | 'pizza') => {
    const { error } = await supabase
      .from('preparation_queue')
      .update({ 
        status: 'ready',
        ready_at: new Date().toISOString(),
      })
      .eq('id', queueId);

    if (error) {
      console.error(error);
    } else {
      await recalculateQueueTimes(preparationType);
      await loadQueue();
    }
  };

  const handleDeliver = async (queueId: string, preparationType: 'sandwich' | 'pizza') => {
    const { error } = await supabase
      .from('preparation_queue')
      .update({ 
        status: 'delivered',
        delivered_at: new Date().toISOString(),
      })
      .eq('id', queueId);

    if (error) {
      console.error(error);
    } else {
      await recalculateQueueTimes(preparationType);
      await loadQueue();
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getElapsedTime = (createdAt: string): number => {
    const created = new Date(createdAt).getTime();
    const now = new Date().getTime();
    return Math.floor((now - created) / 1000);
  };

  const getRemainingTime = (product: IndividualProduct): number => {
    const elapsed = getElapsedTime(product.createdAt);
    const remaining = product.estimatedTime - elapsed;
    return Math.max(0, remaining);
  };

  const renderQueueSection = (products: IndividualProduct[], type: 'sandwich' | 'pizza', icon: React.ReactNode, title: string, color: string) => {
    const pending = products.filter(p => p.status === 'pending');
    const ready = products.filter(p => p.status === 'ready');
    const inProgress = pending.slice(0, MAX_SIMULTANEOUS);
    const waiting = pending.slice(MAX_SIMULTANEOUS);

    // Grouper par numéro de commande pour l'affichage en attente
    const waitingByOrder = waiting.reduce((acc, product) => {
      if (!acc[product.queueNumber]) {
        acc[product.queueNumber] = [];
      }
      acc[product.queueNumber].push(product);
      return acc;
    }, {} as Record<number, IndividualProduct[]>);

    if (products.length === 0) return null;

    return (
      <Card className="backdrop-blur-xl bg-slate-900/60 border-blue-500/20 overflow-hidden">
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {icon}
              <h3 className="text-lg font-bold text-white">{title}</h3>
            </div>
            <Badge variant="outline" className={`${color} text-xs`}>
              {inProgress.length}/{MAX_SIMULTANEOUS}
            </Badge>
          </div>

          {/* En préparation */}
          {inProgress.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-orange-400 font-semibold flex items-center gap-1">
                <ChefHat className="w-3 h-3" />
                En préparation
              </p>
              <div className="grid grid-cols-2 gap-2">
                {inProgress.map((product) => {
                  const remaining = getRemainingTime(product);
                  const progress = ((product.estimatedTime - remaining) / product.estimatedTime) * 100;

                  return (
                    <Card key={product.individualId} className="backdrop-blur-xl bg-slate-900/40 border-orange-500/30 p-2">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="bg-orange-500/20 text-orange-400 border-orange-500/50 text-sm font-bold">
                            #{product.queueNumber.toString().padStart(2, '0')}
                          </Badge>
                          <span className="text-orange-400 text-xs font-bold">{formatTime(remaining)}</span>
                        </div>

                        <div className="flex items-center gap-2 bg-slate-900/50 p-1.5 rounded">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-10 h-10 object-cover rounded"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-orange-600/20 to-red-600/20 rounded flex items-center justify-center">
                              <Coffee className="w-5 h-5 text-orange-400/50" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-xs font-medium truncate">{product.name}</p>
                          </div>
                        </div>

                        <div className="w-full bg-slate-900/50 rounded-full h-1.5">
                          <div 
                            className="bg-gradient-to-r from-orange-500 to-orange-600 h-1.5 rounded-full transition-all duration-1000"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <Button
                          onClick={() => handleMarkReady(product.queueId, type)}
                          size="sm"
                          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white text-xs py-1 h-7"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Prêt
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* En attente */}
          {waiting.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-yellow-400 font-semibold flex items-center gap-1">
                <Clock className="w-3 h-3" />
                En attente ({waiting.length})
              </p>
              <div className="space-y-1">
                {Object.entries(waitingByOrder).slice(0, 2).map(([queueNum, prods]) => (
                  <div key={queueNum} className="bg-slate-900/40 p-2 rounded border border-yellow-500/30">
                    <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50 text-xs mb-1">
                      #{parseInt(queueNum).toString().padStart(2, '0')}
                    </Badge>
                    <div className="flex flex-wrap gap-1">
                      {prods.map((prod) => (
                        <div key={prod.individualId} className="text-white text-[10px] bg-slate-900/50 px-1.5 py-0.5 rounded">
                          {prod.name}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {Object.keys(waitingByOrder).length > 2 && (
                  <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50 text-xs">
                    +{Object.keys(waitingByOrder).length - 2} commande{Object.keys(waitingByOrder).length - 2 > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Prêts */}
          {ready.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-green-400 font-semibold flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Prêt à livrer
              </p>
              <div className="grid grid-cols-2 gap-2">
                {ready.map((product) => (
                  <Card key={product.individualId} className="backdrop-blur-xl bg-slate-900/40 border-green-500/30 p-2 animate-pulse">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/50 text-sm font-bold">
                          #{product.queueNumber.toString().padStart(2, '0')}
                        </Badge>
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      </div>

                      <div className="flex items-center gap-2 bg-slate-900/50 p-1.5 rounded">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-10 h-10 object-cover rounded"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gradient-to-br from-green-600/20 to-emerald-600/20 rounded flex items-center justify-center">
                            <Coffee className="w-5 h-5 text-green-400/50" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-medium truncate">{product.name}</p>
                        </div>
                      </div>

                      <Button
                        onClick={() => handleDeliver(product.queueId, type)}
                        size="sm"
                        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs py-1 h-7"
                      >
                        <Package className="w-3 h-3 mr-1" />
                        Livrer
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    );
  };

  if (sandwichProducts.length === 0 && pizzaProducts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <ChefHat className="w-5 h-5 text-orange-400" />
        <h2 className="text-xl font-bold text-white">File d'attente</h2>
      </div>

      {renderQueueSection(
        sandwichProducts,
        'sandwich',
        <Sandwich className="w-5 h-5 text-orange-400" />,
        'Sandwichs',
        'bg-orange-500/20 text-orange-400 border-orange-500/50'
      )}

      {renderQueueSection(
        pizzaProducts,
        'pizza',
        <Pizza className="w-5 h-5 text-red-400" />,
        'Pizzas',
        'bg-red-500/20 text-red-400 border-red-500/50'
      )}
    </div>
  );
};