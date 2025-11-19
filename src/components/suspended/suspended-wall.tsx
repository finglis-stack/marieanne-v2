"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Heart, Gift, Coffee, MessageCircle, Clock, Search, ChefHat } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { createAuditLog } from '@/lib/audit';
import { OrderNumberDialog } from '@/components/pos/order-number-dialog';

interface SuspendedItem {
  id: string;
  product_id: string;
  order_id: string;
  donor_name: string | null;
  message: string | null;
  created_at: string;
  product: {
    name: string;
    image_url: string | null;
    price: number;
    requires_preparation: boolean;
    preparation_type: 'sandwich' | 'pizza' | null;
  };
}

interface SuspendedWallProps {
  lastUpdate?: number;
}

const PREPARATION_TIMES = {
  sandwich: 270,
  pizza: 780,
};

const MAX_SIMULTANEOUS = 4;

export const SuspendedWall = ({ lastUpdate }: SuspendedWallProps) => {
  const [items, setItems] = useState<SuspendedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // États pour le dialogue de numéro de commande
  const [orderNumberDialogOpen, setOrderNumberDialogOpen] = useState(false);
  const [preparationInfo, setPreparationInfo] = useState<{ queueNumber: number; estimatedTime: number; preparationType: 'sandwich' | 'pizza' } | null>(null);

  useEffect(() => {
    loadItems();
    
    const channel = supabase
      .channel('suspended_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'suspended_items' }, () => {
        loadItems();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (lastUpdate) {
      loadItems();
    }
  }, [lastUpdate]);

  const loadItems = async () => {
    const { data, error } = await supabase
      .from('suspended_items')
      .select(`
        *,
        product:products (name, image_url, price, requires_preparation, preparation_type)
      `)
      .eq('status', 'available')
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  // --- LOGIQUE DE FILE D'ATTENTE (Identique au POS) ---

  const getNextQueueNumber = async (preparationType: 'sandwich' | 'pizza'): Promise<number> => {
    const { data: allQueue } = await supabase
      .from('preparation_queue')
      .select('queue_number')
      .eq('preparation_type', preparationType)
      .order('queue_number', { ascending: false });

    if (!allQueue || allQueue.length === 0) return 0;
    const maxNumber = allQueue[0].queue_number;
    if (maxNumber >= 999) return 0;
    return maxNumber + 1;
  };

  const countProductsInQueue = async (preparationType: 'sandwich' | 'pizza'): Promise<number> => {
    const { data: queueData } = await supabase
      .from('preparation_queue')
      .select('order_id')
      .eq('preparation_type', preparationType)
      .in('status', ['pending', 'ready']);

    if (!queueData || queueData.length === 0) return 0;
    return queueData.length; 
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

  // --- FIN LOGIQUE FILE D'ATTENTE ---

  const handleClaim = async (item: SuspendedItem) => {
    if (!confirm(`Donner "${item.product.name}" à un élève ?`)) return;

    try {
      // 1. Si préparation requise, ajouter à la file
      if (item.product.requires_preparation && item.product.preparation_type) {
        const prepType = item.product.preparation_type;
        const { queueNumber, estimatedTime } = await calculatePreparationQueue(prepType);

        const { error: queueError } = await supabase
          .from('preparation_queue')
          .insert({
            order_id: item.order_id, // On lie à la commande d'origine du donateur
            queue_number: queueNumber,
            preparation_type: prepType,
            estimated_time: estimatedTime,
            status: 'pending',
          });

        if (queueError) throw queueError;

        setPreparationInfo({ queueNumber, estimatedTime, preparationType: prepType });
        setOrderNumberDialogOpen(true);
      }

      // 2. Marquer comme réclamé
      const { error } = await supabase
        .from('suspended_items')
        .update({ 
          status: 'claimed',
          claimed_at: new Date().toISOString()
        })
        .eq('id', item.id);

      if (error) throw error;

      if (!item.product.requires_preparation) {
        showSuccess("Item donné avec succès ! ❤️");
      }

      await createAuditLog({
        action: 'UPDATE_PRODUCT',
        resourceType: 'PRODUCT',
        resourceId: item.product_id,
        details: { 
          action: 'claim_suspended', 
          item_id: item.id,
          with_preparation: item.product.requires_preparation 
        }
      });

    } catch (error) {
      console.error(error);
      showError("Erreur lors de la réclamation");
    }
  };

  const filteredItems = items.filter(item => 
    item.product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.donor_name && item.donor_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) return <div className="text-white text-center p-8">Chargement du mur de la bonté...</div>;

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Heart className="w-8 h-8 text-pink-500 animate-pulse" />
            <h2 className="text-2xl font-bold text-white">Mur de la Bonté ({items.length} disponibles)</h2>
          </div>
          
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un produit ou donateur..."
              className="pl-9 bg-slate-900/50 border-pink-500/30 text-white placeholder:text-gray-500 focus:border-pink-500/60"
            />
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/40 rounded-xl border border-dashed border-pink-500/30">
            <Coffee className="w-16 h-16 text-pink-500/50 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">
              {searchQuery ? 'Aucun résultat trouvé pour votre recherche.' : 'Le mur est vide pour le moment.'}
            </p>
            {!searchQuery && <p className="text-pink-400 mt-2">Soyez le premier à offrir un café !</p>}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map((item) => (
              <Card key={item.id} className="relative overflow-hidden backdrop-blur-xl bg-slate-900/60 border-pink-500/30 hover:border-pink-400 transition-all group">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                
                <div className="p-4 space-y-4 relative z-10">
                  <div className="flex gap-3">
                    {item.product.image_url ? (
                      <img 
                        src={item.product.image_url} 
                        alt={item.product.name} 
                        className="w-16 h-16 object-cover rounded-lg border border-pink-500/20"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-pink-500/10 rounded-lg flex items-center justify-center border border-pink-500/20">
                        <Gift className="w-8 h-8 text-pink-400" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold truncate">{item.product.name}</h3>
                      <p className="text-pink-400 text-sm font-medium">{item.product.price.toFixed(2)} $</p>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                        <Clock className="w-3 h-3" />
                        {new Date(item.created_at).toLocaleDateString('fr-CA')}
                      </div>
                    </div>
                  </div>

                  <div className="bg-pink-500/10 rounded-lg p-3 border border-pink-500/20 relative">
                    <div className="absolute -top-2 -right-2 bg-slate-900 rounded-full p-1 border border-pink-500/30">
                      <MessageCircle className="w-3 h-3 text-pink-400" />
                    </div>
                    <p className="text-sm text-gray-300 italic">
                      "{item.message || "Pour toi, passe une belle journée !"}"
                    </p>
                    <p className="text-xs text-pink-400 mt-2 text-right font-semibold">
                      - {item.donor_name || "Anonyme"}
                    </p>
                  </div>

                  <Button 
                    onClick={() => handleClaim(item)}
                    className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white shadow-lg shadow-pink-900/20"
                  >
                    {item.product.requires_preparation ? (
                      <>
                        <ChefHat className="w-4 h-4 mr-2" />
                        Lancer préparation
                      </>
                    ) : (
                      <>
                        <Gift className="w-4 h-4 mr-2" />
                        Donner cet item
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {preparationInfo && (
        <OrderNumberDialog
          open={orderNumberDialogOpen}
          onOpenChange={setOrderNumberDialogOpen}
          queueNumber={preparationInfo.queueNumber}
          estimatedTime={preparationInfo.estimatedTime}
          preparationType={preparationInfo.preparationType}
        />
      )}
    </>
  );
};