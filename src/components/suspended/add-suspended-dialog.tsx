"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Heart, CreditCard, Banknote, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { createAuditLog } from '@/lib/audit';

interface Product {
  id: string;
  name: string;
  price: number;
  apply_taxes: boolean;
}

interface AddSuspendedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddSuspendedDialog = ({ open, onOpenChange }: AddSuspendedDialogProps) => {
  const [step, setStep] = useState<'form' | 'payment'>('form');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [donorName, setDonorName] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const TAX_RATE = 0.14975;

  useEffect(() => {
    if (open) {
      loadProducts();
      setStep('form');
    }
  }, [open]);

  const loadProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('id, name, price, apply_taxes')
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

  const handleGoToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) return;
    setStep('payment');
  };

  const processPayment = async (method: 'cash' | 'card') => {
    const product = getSelectedProduct();
    if (!product) return;

    setLoading(true);
    const totalAmount = calculateTotal();

    try {
      // 1. Créer la commande (Transaction financière)
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          total_amount: totalAmount,
          payment_method: method,
          points_earned: 0, // Pas de points pour les dons (ou à décider)
          items: [{
            product_id: product.id,
            product_name: product.name,
            quantity: 1,
            unit_price: product.price,
            is_donation: true // Marqueur pour les stats
          }]
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Créer l'item suspendu (Inventaire du mur)
      const { error: suspendedError } = await supabase
        .from('suspended_items')
        .insert({
          product_id: product.id,
          order_id: orderData.id, // Lien avec la commande
          donor_name: donorName || 'Anonyme',
          message: message || null,
          status: 'available'
        });

      if (suspendedError) throw suspendedError;

      // 3. Audit et Feedback
      await createAuditLog({
        action: 'CREATE_ORDER',
        resourceType: 'ORDER',
        resourceId: orderData.id,
        details: { 
          action: 'purchase_suspended_coffee', 
          amount: totalAmount,
          method: method 
        }
      });

      showSuccess(`Don enregistré ! Merci ${donorName || 'Anonyme'} ❤️`);
      
      // Reset
      setSelectedProductId('');
      setDonorName('');
      setMessage('');
      onOpenChange(false);

    } catch (error) {
      console.error(error);
      showError("Erreur lors du traitement du don");
    } finally {
      setLoading(false);
    }
  };

  const product = getSelectedProduct();
  const total = calculateTotal();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="backdrop-blur-xl bg-slate-900/95 border-pink-500/30 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
            <Heart className="w-6 h-6 text-pink-400" />
            {step === 'form' ? 'Ajouter un Café Suspendu' : 'Paiement du don'}
          </DialogTitle>
        </DialogHeader>

        {step === 'form' ? (
          <form onSubmit={handleGoToPayment} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Produit offert</Label>
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
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
                disabled={!selectedProductId}
                className="flex-1 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white"
              >
                Suivant <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="bg-slate-900/50 p-4 rounded-lg border border-pink-500/20 space-y-2">
              <div className="flex justify-between text-sm text-gray-400">
                <span>Produit</span>
                <span className="text-white">{product?.name}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-400">
                <span>Prix</span>
                <span className="text-white">{product?.price.toFixed(2)} $</span>
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
                className="h-24 flex flex-col gap-2 bg-gradient-to-br from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 border-0"
              >
                <Banknote className="w-8 h-8" />
                <span>Comptant</span>
              </Button>
              <Button
                onClick={() => processPayment('card')}
                disabled={loading}
                className="h-24 flex flex-col gap-2 bg-gradient-to-br from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 border-0"
              >
                <CreditCard className="w-8 h-8" />
                <span>Carte</span>
              </Button>
            </div>

            <Button 
              variant="ghost" 
              onClick={() => setStep('form')}
              disabled={loading}
              className="w-full text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Retour
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};