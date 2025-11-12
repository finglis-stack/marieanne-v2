"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Banknote, Coins, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface CashPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalAmount: number;
  onConfirm: () => void;
}

const DENOMINATIONS = [
  { value: 10, label: '10 $', type: 'bill', color: 'from-purple-600 to-purple-700' },
  { value: 5, label: '5 $', type: 'bill', color: 'from-blue-600 to-blue-700' },
  { value: 2, label: '2 $', type: 'coin', color: 'from-gray-400 to-gray-500' },
  { value: 1, label: '1 $', type: 'coin', color: 'from-yellow-600 to-yellow-700' },
  { value: 0.25, label: '0.25 $', type: 'coin', color: 'from-gray-300 to-gray-400' },
  { value: 0.10, label: '0.10 $', type: 'coin', color: 'from-gray-300 to-gray-400' },
  { value: 0.05, label: '0.05 $', type: 'coin', color: 'from-orange-400 to-orange-500' },
];

export const CashPaymentDialog = ({ open, onOpenChange, totalAmount, onConfirm }: CashPaymentDialogProps) => {
  const [givenAmount, setGivenAmount] = useState(0);
  const [changeAmount, setChangeAmount] = useState(0);
  const [changeBreakdown, setChangeBreakdown] = useState<{ value: number; count: number; label: string; type: string; color: string }[]>([]);

  useEffect(() => {
    const change = givenAmount - totalAmount;
    setChangeAmount(change);

    if (change > 0) {
      calculateChangeBreakdown(change);
    } else {
      setChangeBreakdown([]);
    }
  }, [givenAmount, totalAmount]);

  const calculateChangeBreakdown = (amount: number) => {
    let remaining = Math.round(amount * 100) / 100;
    const breakdown: { value: number; count: number; label: string; type: string; color: string }[] = [];

    for (const denom of DENOMINATIONS) {
      if (remaining >= denom.value) {
        const count = Math.floor(remaining / denom.value);
        breakdown.push({
          value: denom.value,
          count,
          label: denom.label,
          type: denom.type,
          color: denom.color,
        });
        remaining = Math.round((remaining - (count * denom.value)) * 100) / 100;
      }
    }

    setChangeBreakdown(breakdown);
  };

  const handleAddDenomination = (value: number) => {
    setGivenAmount(prev => Math.round((prev + value) * 100) / 100);
  };

  const handleReset = () => {
    setGivenAmount(0);
    setChangeAmount(0);
    setChangeBreakdown([]);
  };

  const handleConfirm = () => {
    if (givenAmount >= totalAmount) {
      onConfirm();
      handleReset();
    }
  };

  const isPaymentSufficient = givenAmount >= totalAmount;
  const amountRemaining = totalAmount - givenAmount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="backdrop-blur-xl bg-slate-900/95 border-blue-500/30 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl bg-gradient-to-r from-green-400 via-emerald-400 to-green-400 bg-clip-text text-transparent flex items-center gap-2">
            <Banknote className="w-6 h-6 text-green-400" />
            Paiement Comptant
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Montant à payer */}
          <Card className="backdrop-blur-xl bg-slate-900/60 border-green-500/30 p-6">
            <div className="text-center space-y-2">
              <p className="text-gray-400 text-sm">Montant à payer</p>
              <p className="text-4xl font-bold text-white">{totalAmount.toFixed(2)} $</p>
            </div>
          </Card>

          {/* Montant donné */}
          <Card className="backdrop-blur-xl bg-slate-900/60 border-blue-500/30 p-6">
            <div className="text-center space-y-2">
              <p className="text-gray-400 text-sm">Montant donné par le client</p>
              <p className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
                {givenAmount.toFixed(2)} $
              </p>
              {!isPaymentSufficient && givenAmount > 0 && (
                <div className="flex items-center justify-center gap-2 text-orange-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>Manque {amountRemaining.toFixed(2)} $</span>
                </div>
              )}
            </div>
          </Card>

          {/* Sélection des billets et pièces */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Banknote className="w-5 h-5 text-green-400" />
                Billets (Maximum 10$)
              </h3>
              <Button
                onClick={handleReset}
                variant="outline"
                size="sm"
                className="bg-slate-900/50 border-red-500/50 hover:bg-red-500/20 text-red-400"
              >
                Réinitialiser
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {DENOMINATIONS.filter(d => d.type === 'bill').map((denom) => (
                <Button
                  key={denom.value}
                  onClick={() => handleAddDenomination(denom.value)}
                  className={`h-28 bg-gradient-to-br ${denom.color} hover:scale-105 transition-all duration-200 text-white font-bold text-2xl shadow-lg`}
                >
                  {denom.label}
                </Button>
              ))}
            </div>

            <h3 className="text-lg font-semibold text-white flex items-center gap-2 pt-4">
              <Coins className="w-5 h-5 text-yellow-400" />
              Pièces
            </h3>

            <div className="grid grid-cols-5 gap-3">
              {DENOMINATIONS.filter(d => d.type === 'coin').map((denom) => (
                <Button
                  key={denom.value}
                  onClick={() => handleAddDenomination(denom.value)}
                  className={`h-20 rounded-full bg-gradient-to-br ${denom.color} hover:scale-105 transition-all duration-200 text-white font-bold shadow-lg`}
                >
                  {denom.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Monnaie à rendre */}
          {isPaymentSufficient && changeAmount > 0 && (
            <Card className="backdrop-blur-xl bg-slate-900/60 border-emerald-500/50 p-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="space-y-4">
                <div className="text-center space-y-2">
                  <p className="text-emerald-400 text-sm font-semibold">Monnaie à rendre</p>
                  <p className="text-5xl font-bold text-emerald-400">{changeAmount.toFixed(2)} $</p>
                </div>

                {changeBreakdown.length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-emerald-500/30">
                    <p className="text-emerald-400 text-sm font-semibold text-center">Détail de la monnaie :</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {changeBreakdown.map((item, index) => (
                        <Card key={index} className={`backdrop-blur-xl bg-gradient-to-br ${item.color} border-none p-4`}>
                          <div className="text-center">
                            <p className="text-white text-2xl font-bold">×{item.count}</p>
                            <p className="text-white/80 text-sm">{item.label}</p>
                            {item.type === 'bill' ? (
                              <Banknote className="w-6 h-6 text-white/60 mx-auto mt-2" />
                            ) : (
                              <Coins className="w-6 h-6 text-white/60 mx-auto mt-2" />
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Boutons d'action */}
          <div className="flex gap-4 pt-4 border-t border-blue-500/30">
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="flex-1 bg-slate-900/50 border-gray-500/50 text-gray-300 py-6 text-lg"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Retour
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!isPaymentSufficient}
              className={`flex-1 py-6 text-lg font-semibold transition-all duration-300 ${
                isPaymentSufficient
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 hover:scale-105'
                  : 'bg-gray-600 cursor-not-allowed opacity-50'
              }`}
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Confirmer le paiement
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};