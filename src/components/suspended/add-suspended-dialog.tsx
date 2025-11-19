"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Heart } from 'lucide-react';
import { createAuditLog } from '@/lib/audit';

interface Product {
  id: string;
  name: string;
  price: number;
}

interface AddSuspendedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddSuspendedDialog = ({ open, onOpenChange }: AddSuspendedDialogProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [donorName, setDonorName] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) loadProducts();
  }, [open]);

  const loadProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('id, name, price')
      .order('name');
    setProducts(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    
    setLoading(true);

    const { error } = await supabase
      .from('suspended_items')
      .insert({
        product_id: selectedProduct,
        donor_name: donorName || 'Anonyme',
        message: message || null,
        status: 'available'
      });

    if (error) {
      showError("Erreur lors de l'ajout");
    } else {
      showSuccess("Café suspendu ajouté ! ☕");
      await createAuditLog({
        action: 'CREATE_PRODUCT',
        resourceType: 'PRODUCT',
        details: { action: 'add_suspended', product_id: selectedProduct }
      });
      
      setSelectedProduct('');
      setDonorName('');
      setMessage('');
      onOpenChange(false);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="backdrop-blur-xl bg-slate-900/95 border-pink-500/30 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
            <Heart className="w-6 h-6 text-pink-400" />
            Ajouter un Café Suspendu
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-300">Produit offert</Label>
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger className="bg-slate-900/50 border-pink-500/50 text-white">
                <SelectValue placeholder="Choisir un produit..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-pink-500/50 max-h-60">
                {products.map(p => (
                  <SelectItem key={p.id} value={p.id} className="text-white">
                    {p.name} - {p.price.toFixed(2)}$
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
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1 bg-slate-900/50 border-gray-500/50 text-gray-300"
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !selectedProduct}
              className="flex-1 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white"
            >
              Ajouter au mur
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};