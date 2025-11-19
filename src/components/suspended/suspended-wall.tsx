"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Heart, Gift, Coffee, MessageCircle, Clock, Search } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { createAuditLog } from '@/lib/audit';

interface SuspendedItem {
  id: string;
  product_id: string;
  donor_name: string | null;
  message: string | null;
  created_at: string;
  product: {
    name: string;
    image_url: string | null;
    price: number;
  };
}

interface SuspendedWallProps {
  lastUpdate?: number;
}

export const SuspendedWall = ({ lastUpdate }: SuspendedWallProps) => {
  const [items, setItems] = useState<SuspendedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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

  // Recharger si le parent le demande (via lastUpdate)
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
        product:products (name, image_url, price)
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

  const handleClaim = async (item: SuspendedItem) => {
    if (!confirm(`Donner "${item.product.name}" à un élève ?`)) return;

    const { error } = await supabase
      .from('suspended_items')
      .update({ 
        status: 'claimed',
        claimed_at: new Date().toISOString()
      })
      .eq('id', item.id);

    if (error) {
      showError("Erreur lors de la réclamation");
    } else {
      showSuccess("Item donné avec succès ! ❤️");
      await createAuditLog({
        action: 'UPDATE_PRODUCT',
        resourceType: 'PRODUCT',
        resourceId: item.product_id,
        details: { action: 'claim_suspended', item_id: item.id }
      });
    }
  };

  const filteredItems = items.filter(item => 
    item.product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.donor_name && item.donor_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) return <div className="text-white text-center p-8">Chargement du mur de la bonté...</div>;

  return (
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
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="p-4 space-y-4">
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
                  <Gift className="w-4 h-4 mr-2" />
                  Donner cet item
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};