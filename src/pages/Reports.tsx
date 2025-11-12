"use client";

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ParticleBackground } from '@/components/particle-background';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ArrowLeft, FileText, Download, Calendar, FileSpreadsheet } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';

const Reports = () => {
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [generating, setGenerating] = useState(false);

  const [csvStartDate, setCsvStartDate] = useState('');
  const [csvEndDate, setCsvEndDate] = useState('');
  const [exportingCsv, setExportingCsv] = useState(false);

  const [selectedMetrics, setSelectedMetrics] = useState({
    totalSales: true,
    totalOrders: true,
    cashTransactions: true,
    cardTransactions: true,
    cashAmount: true,
    cardAmount: true,
    averageOrderValue: true,
    topProducts: true,
    customerCount: true,
    pointsEarned: true,
    preparationStats: true,
  });

  const handleMetricToggle = (metric: keyof typeof selectedMetrics) => {
    setSelectedMetrics(prev => ({
      ...prev,
      [metric]: !prev[metric],
    }));
  };

  const generatePDF = async () => {
    if (!startDate || !endDate) {
      showError('Veuillez sélectionner une période');
      return;
    }

    setGenerating(true);

    try {
      // Créer les dates en heure locale (EST) sans conversion UTC
      const start = new Date(startDate + 'T00:00:00');
      const end = new Date(endDate + 'T23:59:59');

      // Convertir en ISO pour Supabase (qui attend UTC)
      const startISO = start.toISOString();
      const endISO = end.toISOString();

      // Récupérer les données
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', startISO)
        .lte('created_at', endISO);

      if (error) {
        showError('Erreur lors de la récupération des données');
        console.error(error);
        setGenerating(false);
        return;
      }

      // Calculer les métriques
      const metrics: any = {};

      if (selectedMetrics.totalSales) {
        metrics.totalSales = orders?.reduce((sum, order) => sum + parseFloat(order.total_amount.toString()), 0) || 0;
      }

      if (selectedMetrics.totalOrders) {
        metrics.totalOrders = orders?.length || 0;
      }

      if (selectedMetrics.cashTransactions) {
        metrics.cashTransactions = orders?.filter(o => o.payment_method === 'cash').length || 0;
      }

      if (selectedMetrics.cardTransactions) {
        metrics.cardTransactions = orders?.filter(o => o.payment_method === 'card').length || 0;
      }

      if (selectedMetrics.cashAmount) {
        metrics.cashAmount = orders?.filter(o => o.payment_method === 'cash')
          .reduce((sum, order) => sum + parseFloat(order.total_amount.toString()), 0) || 0;
      }

      if (selectedMetrics.cardAmount) {
        metrics.cardAmount = orders?.filter(o => o.payment_method === 'card')
          .reduce((sum, order) => sum + parseFloat(order.total_amount.toString()), 0) || 0;
      }

      if (selectedMetrics.averageOrderValue) {
        metrics.averageOrderValue = metrics.totalOrders > 0 ? metrics.totalSales / metrics.totalOrders : 0;
      }

      if (selectedMetrics.customerCount) {
        metrics.customerCount = new Set(orders?.map(o => o.customer_profile_id).filter(Boolean)).size;
      }

      if (selectedMetrics.pointsEarned) {
        metrics.pointsEarned = orders?.reduce((sum, order) => sum + (order.points_earned || 0), 0) || 0;
      }

      if (selectedMetrics.topProducts) {
        const productCounts: { [key: string]: { name: string; count: number; revenue: number } } = {};
        orders?.forEach(order => {
          order.items?.forEach((item: any) => {
            if (!productCounts[item.product_id]) {
              productCounts[item.product_id] = {
                name: item.product_name,
                count: 0,
                revenue: 0,
              };
            }
            productCounts[item.product_id].count += item.quantity;
            productCounts[item.product_id].revenue += item.unit_price * item.quantity;
          });
        });
        metrics.topProducts = Object.values(productCounts)
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);
      }

      if (selectedMetrics.preparationStats) {
        const { data: queueData } = await supabase
          .from('preparation_queue')
          .select('*')
          .gte('created_at', startISO)
          .lte('created_at', endISO);

        metrics.preparationStats = {
          totalPrepared: queueData?.length || 0,
          sandwiches: queueData?.filter(q => q.preparation_type === 'sandwich').length || 0,
          pizzas: queueData?.filter(q => q.preparation_type === 'pizza').length || 0,
        };
      }

      // Générer le PDF avec les dates correctes
      generatePDFDocument(metrics, start, end);

      showSuccess('Rapport généré avec succès !');
    } catch (error) {
      console.error(error);
      showError('Erreur lors de la génération du rapport');
    }

    setGenerating(false);
  };

  const generatePDFDocument = (metrics: any, startDate: Date, endDate: Date) => {
    // Formater les dates en français (format: 11 novembre 2025)
    const formatDate = (date: Date): string => {
      return date.toLocaleDateString('fr-CA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    // Créer le contenu HTML pour le PDF
    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Rapport - Café Marie Anne</title>
        <style>
          @page {
            size: A4;
            margin: 2cm;
          }
          body {
            font-family: 'Arial', sans-serif;
            color: #333;
            line-height: 1.6;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #1e40af;
            margin: 0;
            font-size: 28px;
          }
          .header p {
            color: #64748b;
            margin: 5px 0;
          }
          .section {
            margin-bottom: 30px;
          }
          .section-title {
            background: #eff6ff;
            padding: 10px 15px;
            border-left: 4px solid #2563eb;
            font-size: 18px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 15px;
          }
          .metric-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-bottom: 20px;
          }
          .metric-card {
            border: 1px solid #e2e8f0;
            padding: 15px;
            border-radius: 8px;
            background: #f8fafc;
          }
          .metric-label {
            font-size: 12px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .metric-value {
            font-size: 24px;
            font-weight: bold;
            color: #1e40af;
            margin-top: 5px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
          }
          th {
            background: #eff6ff;
            color: #1e40af;
            padding: 12px;
            text-align: left;
            font-weight: bold;
            border-bottom: 2px solid #2563eb;
          }
          td {
            padding: 10px 12px;
            border-bottom: 1px solid #e2e8f0;
          }
          tr:hover {
            background: #f8fafc;
          }
          .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 2px solid #e2e8f0;
            text-align: center;
            color: #64748b;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>CAFÉ MARIE ANNE</h1>
          <p>Rapport d'activité</p>
          <p>${formatDate(startDate)} au ${formatDate(endDate)}</p>
        </div>

        ${selectedMetrics.totalSales || selectedMetrics.totalOrders || selectedMetrics.averageOrderValue ? `
        <div class="section">
          <div class="section-title">Résumé des ventes</div>
          <div class="metric-grid">
            ${selectedMetrics.totalSales ? `
            <div class="metric-card">
              <div class="metric-label">Ventes totales</div>
              <div class="metric-value">${metrics.totalSales.toFixed(2)} $</div>
            </div>
            ` : ''}
            ${selectedMetrics.totalOrders ? `
            <div class="metric-card">
              <div class="metric-label">Nombre de commandes</div>
              <div class="metric-value">${metrics.totalOrders}</div>
            </div>
            ` : ''}
            ${selectedMetrics.averageOrderValue ? `
            <div class="metric-card">
              <div class="metric-label">Valeur moyenne par commande</div>
              <div class="metric-value">${metrics.averageOrderValue.toFixed(2)} $</div>
            </div>
            ` : ''}
            ${selectedMetrics.customerCount ? `
            <div class="metric-card">
              <div class="metric-label">Clients uniques</div>
              <div class="metric-value">${metrics.customerCount}</div>
            </div>
            ` : ''}
          </div>
        </div>
        ` : ''}

        ${selectedMetrics.cashTransactions || selectedMetrics.cardTransactions || selectedMetrics.cashAmount || selectedMetrics.cardAmount ? `
        <div class="section">
          <div class="section-title">Méthodes de paiement</div>
          <div class="metric-grid">
            ${selectedMetrics.cashTransactions ? `
            <div class="metric-card">
              <div class="metric-label">Transactions comptant</div>
              <div class="metric-value">${metrics.cashTransactions}</div>
            </div>
            ` : ''}
            ${selectedMetrics.cashAmount ? `
            <div class="metric-card">
              <div class="metric-label">Montant comptant</div>
              <div class="metric-value">${metrics.cashAmount.toFixed(2)} $</div>
            </div>
            ` : ''}
            ${selectedMetrics.cardTransactions ? `
            <div class="metric-card">
              <div class="metric-label">Transactions carte</div>
              <div class="metric-value">${metrics.cardTransactions}</div>
            </div>
            ` : ''}
            ${selectedMetrics.cardAmount ? `
            <div class="metric-card">
              <div class="metric-label">Montant carte</div>
              <div class="metric-value">${metrics.cardAmount.toFixed(2)} $</div>
            </div>
            ` : ''}
          </div>
        </div>
        ` : ''}

        ${selectedMetrics.pointsEarned ? `
        <div class="section">
          <div class="section-title">Programme de fidélité</div>
          <div class="metric-grid">
            <div class="metric-card">
              <div class="metric-label">Points distribués</div>
              <div class="metric-value">${metrics.pointsEarned.toLocaleString()}</div>
            </div>
          </div>
        </div>
        ` : ''}

        ${selectedMetrics.preparationStats ? `
        <div class="section">
          <div class="section-title">Statistiques de préparation</div>
          <div class="metric-grid">
            <div class="metric-card">
              <div class="metric-label">Total préparé</div>
              <div class="metric-value">${metrics.preparationStats.totalPrepared}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Sandwichs</div>
              <div class="metric-value">${metrics.preparationStats.sandwiches}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Pizzas</div>
              <div class="metric-value">${metrics.preparationStats.pizzas}</div>
            </div>
          </div>
        </div>
        ` : ''}

        ${selectedMetrics.topProducts && metrics.topProducts.length > 0 ? `
        <div class="section">
          <div class="section-title">Top 10 des produits</div>
          <table>
            <thead>
              <tr>
                <th>Produit</th>
                <th style="text-align: right;">Quantité vendue</th>
                <th style="text-align: right;">Revenu</th>
              </tr>
            </thead>
            <tbody>
              ${metrics.topProducts.map((product: any) => `
                <tr>
                  <td>${product.name}</td>
                  <td style="text-align: right;">${product.count}</td>
                  <td style="text-align: right;">${product.revenue.toFixed(2)} $</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        <div class="footer">
          <p>Rapport généré le ${new Date().toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' })} à ${new Date().toLocaleTimeString('fr-CA')}</p>
          <p>Café Marie Anne - Système de gestion</p>
        </div>
      </body>
      </html>
    `;

    // Ouvrir dans une nouvelle fenêtre pour impression
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(content);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  const exportTransactionsCSV = async () => {
    if (!csvStartDate || !csvEndDate) {
      showError('Veuillez sélectionner une période pour l\'export CSV');
      return;
    }

    setExportingCsv(true);

    try {
      const start = new Date(csvStartDate + 'T00:00:00');
      const end = new Date(csvEndDate + 'T23:59:59');
      const startISO = start.toISOString();
      const endISO = end.toISOString();

      // Récupérer toutes les commandes
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', startISO)
        .lte('created_at', endISO)
        .order('created_at', { ascending: true });

      if (ordersError) {
        showError('Erreur lors de la récupération des transactions');
        console.error(ordersError);
        setExportingCsv(false);
        return;
      }

      if (!orders || orders.length === 0) {
        showError('Aucune transaction trouvée pour cette période');
        setExportingCsv(false);
        return;
      }

      // Récupérer les profils clients
      const customerIds = [...new Set(orders.map(o => o.customer_profile_id).filter(Boolean))];
      let customersMap: { [key: string]: any } = {};

      if (customerIds.length > 0) {
        const { data: customersData } = await supabase
          .from('customer_profiles')
          .select('id, customer_number')
          .in('id', customerIds);

        if (customersData) {
          customersMap = customersData.reduce((acc, customer) => {
            acc[customer.id] = customer;
            return acc;
          }, {} as { [key: string]: any });
        }
      }

      // Récupérer les cartes récompenses
      const cardIds = [...new Set(orders.map(o => o.reward_card_id).filter(Boolean))];
      let cardsMap: { [key: string]: any } = {};

      if (cardIds.length > 0) {
        const { data: cardsData } = await supabase
          .from('reward_cards')
          .select('id, card_code')
          .in('id', cardIds);

        if (cardsData) {
          cardsMap = cardsData.reduce((acc, card) => {
            acc[card.id] = card;
            return acc;
          }, {} as { [key: string]: any });
        }
      }

      // Créer le CSV
      const headers = [
        'Date',
        'Heure',
        'Numéro de commande',
        'UUID Commande',
        'Montant total',
        'Méthode de paiement',
        'Points gagnés',
        'Numéro de fiche client',
        'UUID Client',
        'Code de carte',
        'UUID Carte',
        'Nombre d\'articles',
        'Détails des articles'
      ];

      const rows = orders.map(order => {
        const date = new Date(order.created_at);
        const customer = order.customer_profile_id ? customersMap[order.customer_profile_id] : null;
        const card = order.reward_card_id ? cardsMap[order.reward_card_id] : null;
        
        const itemsDetails = order.items?.map((item: any) => 
          `${item.product_name} (x${item.quantity} @ ${item.unit_price}$)`
        ).join('; ') || '';

        return [
          date.toLocaleDateString('fr-CA'),
          date.toLocaleTimeString('fr-CA'),
          order.order_number,
          order.id,
          parseFloat(order.total_amount.toString()).toFixed(2),
          order.payment_method === 'cash' ? 'Comptant' : 'Débit/Crédit',
          order.points_earned || 0,
          customer?.customer_number || '',
          order.customer_profile_id || '',
          card?.card_code || '',
          order.reward_card_id || '',
          order.items?.length || 0,
          itemsDetails
        ];
      });

      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Télécharger le fichier
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions-${csvStartDate}-${csvEndDate}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      showSuccess(`${orders.length} transaction(s) exportée(s) avec succès !`);
    } catch (error) {
      console.error(error);
      showError('Erreur lors de l\'export CSV');
    }

    setExportingCsv(false);
  };

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
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="backdrop-blur-xl bg-slate-900/40 border border-blue-500/30 rounded-2xl p-6 shadow-2xl shadow-blue-500/20">
            <div className="flex items-center gap-4 mb-6">
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
                  Rapports
                </h1>
                <p className="text-gray-400 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Générez des rapports personnalisés
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="space-y-2">
                <Label htmlFor="start-date" className="text-gray-300 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Date de début
                </Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-slate-900/50 border-blue-500/50 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date" className="text-gray-300 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Date de fin
                </Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-slate-900/50 border-blue-500/50 text-white"
                />
              </div>
            </div>
          </div>

          <Card className="backdrop-blur-xl bg-slate-900/40 border border-blue-500/30 shadow-2xl shadow-blue-500/20 overflow-hidden">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-white mb-6">Sélectionnez les métriques à inclure</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-blue-400">Ventes</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="totalSales"
                        checked={selectedMetrics.totalSales}
                        onCheckedChange={() => handleMetricToggle('totalSales')}
                      />
                      <Label htmlFor="totalSales" className="text-gray-300 cursor-pointer">
                        Ventes totales
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="totalOrders"
                        checked={selectedMetrics.totalOrders}
                        onCheckedChange={() => handleMetricToggle('totalOrders')}
                      />
                      <Label htmlFor="totalOrders" className="text-gray-300 cursor-pointer">
                        Nombre de commandes
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="averageOrderValue"
                        checked={selectedMetrics.averageOrderValue}
                        onCheckedChange={() => handleMetricToggle('averageOrderValue')}
                      />
                      <Label htmlFor="averageOrderValue" className="text-gray-300 cursor-pointer">
                        Valeur moyenne par commande
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-blue-400">Paiements</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="cashTransactions"
                        checked={selectedMetrics.cashTransactions}
                        onCheckedChange={() => handleMetricToggle('cashTransactions')}
                      />
                      <Label htmlFor="cashTransactions" className="text-gray-300 cursor-pointer">
                        Transactions comptant
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="cashAmount"
                        checked={selectedMetrics.cashAmount}
                        onCheckedChange={() => handleMetricToggle('cashAmount')}
                      />
                      <Label htmlFor="cashAmount" className="text-gray-300 cursor-pointer">
                        Montant comptant
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="cardTransactions"
                        checked={selectedMetrics.cardTransactions}
                        onCheckedChange={() => handleMetricToggle('cardTransactions')}
                      />
                      <Label htmlFor="cardTransactions" className="text-gray-300 cursor-pointer">
                        Transactions carte
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="cardAmount"
                        checked={selectedMetrics.cardAmount}
                        onCheckedChange={() => handleMetricToggle('cardAmount')}
                      />
                      <Label htmlFor="cardAmount" className="text-gray-300 cursor-pointer">
                        Montant carte
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-blue-400">Clients</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="customerCount"
                        checked={selectedMetrics.customerCount}
                        onCheckedChange={() => handleMetricToggle('customerCount')}
                      />
                      <Label htmlFor="customerCount" className="text-gray-300 cursor-pointer">
                        Nombre de clients uniques
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="pointsEarned"
                        checked={selectedMetrics.pointsEarned}
                        onCheckedChange={() => handleMetricToggle('pointsEarned')}
                      />
                      <Label htmlFor="pointsEarned" className="text-gray-300 cursor-pointer">
                        Points distribués
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-blue-400">Produits & Préparation</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="topProducts"
                        checked={selectedMetrics.topProducts}
                        onCheckedChange={() => handleMetricToggle('topProducts')}
                      />
                      <Label htmlFor="topProducts" className="text-gray-300 cursor-pointer">
                        Top 10 des produits
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="preparationStats"
                        checked={selectedMetrics.preparationStats}
                        onCheckedChange={() => handleMetricToggle('preparationStats')}
                      />
                      <Label htmlFor="preparationStats" className="text-gray-300 cursor-pointer">
                        Statistiques de préparation
                      </Label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-blue-500/30">
                <Button
                  onClick={generatePDF}
                  disabled={generating || !startDate || !endDate}
                  className="w-full bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 hover:from-blue-500 hover:via-cyan-500 hover:to-teal-500 text-white font-semibold py-6 text-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-5 h-5 mr-2" />
                  {generating ? 'Génération en cours...' : 'Générer et imprimer le rapport'}
                </Button>
              </div>
            </div>
          </Card>

          <Card className="backdrop-blur-xl bg-slate-900/40 border border-green-500/30 shadow-2xl shadow-green-500/20 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <FileSpreadsheet className="w-6 h-6 text-green-400" />
                <h2 className="text-2xl font-bold text-white">Export CSV des transactions</h2>
              </div>

              <p className="text-gray-400 mb-6">
                Exportez toutes les transactions détaillées en format CSV pour analyse dans Excel ou autre logiciel.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="space-y-2">
                  <Label htmlFor="csv-start-date" className="text-gray-300 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Date de début
                  </Label>
                  <Input
                    id="csv-start-date"
                    type="date"
                    value={csvStartDate}
                    onChange={(e) => setCsvStartDate(e.target.value)}
                    className="bg-slate-900/50 border-green-500/50 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="csv-end-date" className="text-gray-300 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Date de fin
                  </Label>
                  <Input
                    id="csv-end-date"
                    type="date"
                    value={csvEndDate}
                    onChange={(e) => setCsvEndDate(e.target.value)}
                    className="bg-slate-900/50 border-green-500/50 text-white"
                  />
                </div>
              </div>

              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg mb-6">
                <h3 className="text-green-400 font-semibold mb-2">Le fichier CSV contiendra :</h3>
                <ul className="text-gray-300 text-sm space-y-1 list-disc list-inside">
                  <li>Date et heure de chaque transaction</li>
                  <li>Numéro de commande et UUID</li>
                  <li>Montant total et méthode de paiement</li>
                  <li>Points gagnés</li>
                  <li>Informations client (numéro de fiche, UUID)</li>
                  <li>Code de carte récompense et UUID</li>
                  <li>Détails complets des articles commandés</li>
                </ul>
              </div>

              <Button
                onClick={exportTransactionsCSV}
                disabled={exportingCsv || !csvStartDate || !csvEndDate}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold py-6 text-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileSpreadsheet className="w-5 h-5 mr-2" />
                {exportingCsv ? 'Export en cours...' : 'Exporter les transactions en CSV'}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Reports;