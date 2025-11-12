"use client";

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Plus, Clock, AlertCircle } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  position: number;
}

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

interface ProductGridProps {
  categories: Category[];
  products: Product[];
  onAddToCart: (product: Product) => void;
}

const isProductAvailable = (product: Product): { available: boolean; reason?: string } => {
  if (!product.availability) {
    return { available: true };
  }

  const now = new Date();
  const estTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const dayOfWeek = estTime.getDay();
  
  const dayMap: { [key: number]: string } = {
    1: 'monday',
    2: 'tuesday',
    3: 'wednesday',
    4: 'thursday',
    5: 'friday',
  };

  const dayKey = dayMap[dayOfWeek];
  
  if (!dayKey || dayOfWeek === 0 || dayOfWeek === 6) {
    return { available: false, reason: 'Non disponible le week-end' };
  }

  const dayAvailability = product.availability[dayKey];
  
  if (!dayAvailability || !dayAvailability.enabled) {
    return { available: false, reason: 'Non disponible aujourd\'hui' };
  }

  if (dayAvailability.allDay) {
    return { available: true };
  }

  const currentTime = estTime.getHours() * 60 + estTime.getMinutes();
  
  for (const range of dayAvailability.timeRanges) {
    const [startHour, startMin] = range.start.split(':').map(Number);
    const [endHour, endMin] = range.end.split(':').map(Number);
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;
    
    if (currentTime >= startTime && currentTime <= endTime) {
      return { available: true };
    }
  }

  const nextRange = dayAvailability.timeRanges[0];
  if (nextRange) {
    return { 
      available: false, 
      reason: `Disponible à partir de ${nextRange.start}` 
    };
  }

  return { available: false, reason: 'Non disponible maintenant' };
};

export const ProductGrid = ({ categories, products, onAddToCart }: ProductGridProps) => {
  const TAX_RATE = 0.14975;

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto">
      {categories.map((category) => {
        const categoryProducts = products.filter(p => p.category_id === category.id);
        
        if (categoryProducts.length === 0) return null;

        return (
          <div key={category.id} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-1 w-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" />
              <h2 className="text-2xl font-bold text-white">{category.name}</h2>
              <div className="h-1 flex-1 bg-gradient-to-r from-cyan-500 to-transparent rounded-full" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {categoryProducts.map((product) => {
                const { available, reason } = isProductAvailable(product);
                const priceWithTax = product.apply_taxes 
                  ? product.price * (1 + TAX_RATE)
                  : product.price;

                return (
                  <Card
                    key={product.id}
                    className={`backdrop-blur-xl border-blue-500/20 overflow-hidden group transition-all ${
                      available 
                        ? 'bg-slate-900/60 hover:border-blue-400/50 hover:scale-105 cursor-pointer' 
                        : 'bg-slate-900/30 opacity-60 cursor-not-allowed'
                    }`}
                    onClick={() => available && onAddToCart(product)}
                  >
                    <div className="relative">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className={`w-full h-40 object-cover ${!available && 'grayscale'}`}
                        />
                      ) : (
                        <div className={`w-full h-40 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 flex items-center justify-center ${!available && 'grayscale'}`}>
                          <DollarSign className="w-12 h-12 text-blue-400/50" />
                        </div>
                      )}
                      
                      {!available && (
                        <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center p-2">
                          <AlertCircle className="w-8 h-8 text-orange-400 mb-2" />
                          <p className="text-orange-400 text-xs text-center font-semibold">
                            {reason}
                          </p>
                        </div>
                      )}

                      {available && (
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      )}

                      {product.apply_taxes && available && (
                        <div className="absolute top-2 left-2">
                          <span className="text-xs text-green-400 bg-green-500/20 backdrop-blur-sm px-2 py-1 rounded">
                            +TPS/TVQ
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-3 space-y-2">
                      <h3 className="text-white font-semibold text-sm truncate">{product.name}</h3>
                      {product.description && (
                        <p className="text-gray-400 text-xs line-clamp-2">{product.description}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-400 font-bold text-lg">{product.price.toFixed(2)} $</p>
                          {product.apply_taxes && (
                            <p className="text-gray-500 text-xs">
                              {priceWithTax.toFixed(2)} $ (taxes incl.)
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}

      {products.length === 0 && (
        <div className="text-center py-12">
          <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">Aucun produit disponible</p>
        </div>
      )}
    </div>
  );
};