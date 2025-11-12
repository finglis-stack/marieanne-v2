"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, Plus, Minus, ShoppingCart, CreditCard, Zap } from 'lucide-react';
import { CheckoutDialog } from './checkout-dialog';

interface Product {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  position: number;
  apply_taxes: boolean;
  availability?: any;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface CheckoutPanelProps {
  cart: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveFromCart: (productId: string) => void;
  onClearCart: () => void;
}

export const CheckoutPanel = ({ 
  cart, 
  onUpdateQuantity, 
  onRemoveFromCart, 
  onClearCart 
}: CheckoutPanelProps) => {
  const TAX_RATE = 0.14975;
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);

  const calculateItemTotal = (item: CartItem) => {
    const basePrice = item.product.price * item.quantity;
    const tax = item.product.apply_taxes ? basePrice * TAX_RATE : 0;
    return { basePrice, tax, total: basePrice + tax };
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let totalTax = 0;

    cart.forEach(item => {
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

  const totals = calculateTotals();

  const handleCheckout = () => {
    setCheckoutDialogOpen(true);
  };

  const handleCheckoutComplete = () => {
    onClearCart();
  };

  return (
    <>
      <div className="w-[450px] backdrop-blur-xl bg-slate-900/60 border-l border-blue-500/30 flex flex-col shadow-2xl shadow-blue-500/20">
        <div className="p-6 border-b border-blue-500/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-6 h-6 text-blue-400" />
              <h2 className="text-2xl font-bold text-white">Panier</h2>
            </div>
            {cart.length > 0 && (
              <Button
                onClick={onClearCart}
                variant="outline"
                size="sm"
                className="bg-slate-900/50 border-red-500/50 hover:bg-red-500/20 text-red-400"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Vider
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1 p-6">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <ShoppingCart className="w-16 h-16 text-gray-400 mb-4" />
              <p className="text-gray-400 text-lg">Panier vide</p>
              <p className="text-gray-500 text-sm mt-2">Ajoutez des produits pour commencer</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => {
                const { basePrice, tax, total } = calculateItemTotal(item);
                
                return (
                  <Card key={item.product.id} className="backdrop-blur-xl bg-slate-900/40 border-blue-500/20 p-4">
                    <div className="flex gap-3">
                      {item.product.image_url ? (
                        <img
                          src={item.product.image_url}
                          alt={item.product.name}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-lg flex items-center justify-center">
                          <ShoppingCart className="w-8 h-8 text-blue-400/50" />
                        </div>
                      )}

                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-white font-semibold text-sm">{item.product.name}</h3>
                            <p className="text-gray-400 text-xs">{item.product.price.toFixed(2)} $ / unité</p>
                          </div>
                          <Button
                            onClick={() => onRemoveFromCart(item.product.id)}
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/20 h-8 w-8 p-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 bg-slate-900/50 rounded-lg p-1">
                            <Button
                              onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => onUpdateQuantity(item.product.id, parseInt(e.target.value) || 1)}
                              className="w-16 h-8 text-center bg-transparent border-none text-white"
                              min="1"
                            />
                            <Button
                              onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>

                          <div className="text-right">
                            <p className="text-white font-bold">{total.toFixed(2)} $</p>
                            {item.product.apply_taxes && (
                              <p className="text-gray-500 text-xs">
                                dont {tax.toFixed(2)} $ de taxes
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {cart.length > 0 && (
          <div className="p-6 border-t border-blue-500/30 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-gray-300">
                <span>Sous-total</span>
                <span className="font-semibold">{totals.subtotal.toFixed(2)} $</span>
              </div>
              <div className="flex items-center justify-between text-gray-300">
                <span className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-green-400" />
                  Taxes (TPS/TVQ)
                </span>
                <span className="font-semibold text-green-400">{totals.tax.toFixed(2)} $</span>
              </div>
              <div className="h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
              <div className="flex items-center justify-between text-white text-xl">
                <span className="font-bold">Total</span>
                <span className="font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
                  {totals.total.toFixed(2)} $
                </span>
              </div>
            </div>

            <Button
              onClick={handleCheckout}
              className="w-full bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 hover:from-blue-500 hover:via-cyan-500 hover:to-teal-500 text-white font-semibold py-6 text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/50"
            >
              <CreditCard className="w-5 h-5 mr-2" />
              Finaliser la commande
            </Button>
          </div>
        )}
      </div>

      <CheckoutDialog
        open={checkoutDialogOpen}
        onOpenChange={setCheckoutDialogOpen}
        total={totals.total}
        cart={cart}
        onComplete={handleCheckoutComplete}
      />
    </>
  );
};