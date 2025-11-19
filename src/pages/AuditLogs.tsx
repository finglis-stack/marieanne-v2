"use client";

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ParticleBackground } from '@/components/particle-background';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Search, Activity, User, Clock, Filter, Download, ChevronLeft, ChevronRight, ShieldCheck, Link, AlertOctagon, Loader2 } from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { verifyAuditChain, createAuditLog } from '@/lib/audit';

interface AuditLog {
  id: string;
  user_id: string;
  user_email: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  hash?: string;
  previous_hash?: string;
}

const ITEMS_PER_PAGE = 50;

const AuditLogs = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [resourceFilter, setResourceFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [verifying, setVerifying] = useState(false);
  const [integrityStatus, setIntegrityStatus] = useState<'unknown' | 'valid' | 'corrupted'>('unknown');

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
      } else {
        setUser(user);
        loadLogs();
      }
    };
    getUser();
  }, [navigate]);

  const loadLogs = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      showError('Erreur lors du chargement des logs');
      console.error(error);
    } else {
      setLogs(data || []);
    }

    setLoading(false);
  };

  const handleVerifyIntegrity = async () => {
    setVerifying(true);
    setIntegrityStatus('unknown');
    
    try {
      const result = await verifyAuditChain();
      
      if (result.valid) {
        setIntegrityStatus('valid');
        showSuccess(`Intégrité vérifiée : ${result.totalChecked} blocs valides. La chaîne est intacte.`);
        
        // Logger la vérification réussie
        await createAuditLog({
          action: 'VERIFY_INTEGRITY',
          resourceType: 'SYSTEM',
          details: {
            status: 'valid',
            blocks_checked: result.totalChecked
          }
        });
      } else {
        setIntegrityStatus('corrupted');
        showError(`CORRUPTION DÉTECTÉE au bloc ${result.corruptedBlockId}. La chaîne est brisée !`);
        
        // Logger l'échec (si possible)
        await createAuditLog({
          action: 'VERIFY_INTEGRITY',
          resourceType: 'SYSTEM',
          details: {
            status: 'corrupted',
            corrupted_block: result.corruptedBlockId,
            severity: 'CRITICAL'
          }
        });
      }
    } catch (error) {
      console.error(error);
      showError('Erreur lors de la vérification');
    } finally {
      setVerifying(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resource_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.hash?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesResource = resourceFilter === 'all' || log.resource_type === resourceFilter;

    return matchesSearch && matchesAction && matchesResource;
  });

  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

  const uniqueActions = [...new Set(logs.map(log => log.action))];
  const uniqueResources = [...new Set(logs.map(log => log.resource_type))];

  const getActionColor = (action: string): string => {
    if (action.startsWith('CREATE')) return 'bg-green-500/20 text-green-400 border-green-500/50';
    if (action.startsWith('UPDATE')) return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
    if (action.startsWith('DELETE')) return 'bg-red-500/20 text-red-400 border-red-500/50';
    if (action.startsWith('VIEW')) return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    if (action === 'VERIFY_INTEGRITY') return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50';
    return 'bg-purple-500/20 text-purple-400 border-purple-500/50';
  };

  const formatAction = (action: string): string => {
    return action.replace(/_/g, ' ');
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Utilisateur', 'Action', 'Ressource', 'ID Ressource', 'Hash', 'Hash Précédent', 'Détails'];
    const rows = filteredLogs.map(log => [
      new Date(log.created_at).toLocaleString('fr-CA'),
      log.user_email,
      log.action,
      log.resource_type,
      log.resource_id || '',
      log.hash || '',
      log.previous_hash || '',
      JSON.stringify(log.details || {}),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-blockchain-${new Date().toISOString()}.csv`;
    a.click();
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, actionFilter, resourceFilter]);

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        <ParticleBackground />
        <div className="relative z-10 text-white text-xl">Chargement...</div>
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

      <div className="relative z-10 p-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="backdrop-blur-xl bg-slate-900/40 border border-blue-500/30 rounded-2xl p-6 shadow-2xl shadow-blue-500/20">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => navigate('/dashboard')}
                  variant="outline"
                  className="bg-slate-900/50 border-blue-500/50 hover:bg-blue-500/20 hover:border-blue-400 text-gray-300 hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour
                </Button>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent flex items-center gap-2">
                    Grand Livre d'Audit
                    <Badge variant="outline" className="ml-2 bg-cyan-500/20 text-cyan-400 border-cyan-500/50 text-sm">
                      <Link className="w-3 h-3 mr-1" />
                      Blockchain Privée
                    </Badge>
                  </h1>
                  <p className="text-gray-400 flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Historique immuable et vérifiable cryptographiquement
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleVerifyIntegrity}
                  disabled={verifying}
                  className={`font-semibold transition-all duration-300 ${
                    integrityStatus === 'valid' 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : integrityStatus === 'corrupted'
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-cyan-600 hover:bg-cyan-700 text-white'
                  }`}
                >
                  {verifying ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Vérification...
                    </>
                  ) : integrityStatus === 'valid' ? (
                    <>
                      <ShieldCheck className="w-4 h-4 mr-2" />
                      Intégrité Validée
                    </>
                  ) : integrityStatus === 'corrupted' ? (
                    <>
                      <AlertOctagon className="w-4 h-4 mr-2" />
                      CORRUPTION DÉTECTÉE
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 mr-2" />
                      Vérifier l'intégrité
                    </>
                  )}
                </Button>
                <Button
                  onClick={exportToCSV}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exporter CSV
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="backdrop-blur-xl bg-slate-900/60 border-blue-500/20 p-4">
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-gray-400 text-xs">Total blocs</p>
                    <p className="text-white text-2xl font-bold">{logs.length}</p>
                  </div>
                </div>
              </Card>

              <Card className="backdrop-blur-xl bg-slate-900/60 border-blue-500/20 p-4">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-purple-400" />
                  <div>
                    <p className="text-gray-400 text-xs">Utilisateurs</p>
                    <p className="text-white text-2xl font-bold">
                      {new Set(logs.map(l => l.user_id)).size}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="backdrop-blur-xl bg-slate-900/60 border-blue-500/20 p-4">
                <div className="flex items-center gap-3">
                  <Filter className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-gray-400 text-xs">Actions uniques</p>
                    <p className="text-white text-2xl font-bold">{uniqueActions.length}</p>
                  </div>
                </div>
              </Card>

              <Card className="backdrop-blur-xl bg-slate-900/60 border-blue-500/20 p-4">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-orange-400" />
                  <div>
                    <p className="text-gray-400 text-xs">Dernier bloc</p>
                    <p className="text-white text-sm font-bold">
                      {logs.length > 0 ? new Date(logs[0].created_at).toLocaleTimeString('fr-CA') : 'N/A'}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher (hash, action, email)..."
                  className="pl-10 bg-slate-900/50 border-blue-500/50 text-white placeholder:text-gray-500 focus:border-blue-400"
                />
              </div>

              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="bg-slate-900/50 border-blue-500/50 text-white">
                  <SelectValue placeholder="Filtrer par action" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-blue-500/50">
                  <SelectItem value="all" className="text-white">Toutes les actions</SelectItem>
                  {uniqueActions.map(action => (
                    <SelectItem key={action} value={action} className="text-white">
                      {formatAction(action)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={resourceFilter} onValueChange={setResourceFilter}>
                <SelectTrigger className="bg-slate-900/50 border-blue-500/50 text-white">
                  <SelectValue placeholder="Filtrer par ressource" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-blue-500/50">
                  <SelectItem value="all" className="text-white">Toutes les ressources</SelectItem>
                  {uniqueResources.map(resource => (
                    <SelectItem key={resource} value={resource} className="text-white">
                      {resource}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            {paginatedLogs.map((log, index) => (
              <div key={log.id} className="relative">
                {/* Ligne de connexion visuelle entre les blocs */}
                {index < paginatedLogs.length - 1 && (
                  <div className="absolute left-8 top-16 bottom-0 w-0.5 bg-gradient-to-b from-cyan-500/50 to-transparent -z-10 h-full" />
                )}
                
                <Card className="backdrop-blur-xl bg-slate-900/60 border-blue-500/20 p-4 hover:border-cyan-500/50 transition-all duration-300 group">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="p-2 bg-slate-800 rounded-full border border-blue-500/30">
                          <Link className="w-4 h-4 text-cyan-400" />
                        </div>
                        <Badge variant="outline" className={getActionColor(log.action)}>
                          {formatAction(log.action)}
                        </Badge>
                        <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/50">
                          {log.resource_type}
                        </Badge>
                        <span className="text-xs font-mono text-gray-500">
                          {new Date(log.created_at).toLocaleString('fr-CA')}
                        </span>
                      </div>

                      <div className="pl-11 space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <User className="w-3 h-3" />
                          {log.user_email}
                        </div>

                        {/* Affichage des Hashs */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] font-mono bg-slate-950/50 p-2 rounded border border-blue-500/10">
                          <div>
                            <span className="text-gray-500 block">Hash actuel :</span>
                            <span className="text-cyan-400 break-all">{log.hash || 'Non signé'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 block">Hash précédent :</span>
                            <span className="text-gray-600 break-all">{log.previous_hash || 'Genesis'}</span>
                          </div>
                        </div>

                        {log.details && Object.keys(log.details).length > 0 && (
                          <details className="text-xs text-gray-500">
                            <summary className="cursor-pointer hover:text-gray-400">Détails des données</summary>
                            <pre className="mt-2 p-2 bg-slate-900/50 rounded overflow-x-auto border border-gray-800">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>

          {filteredLogs.length > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-center gap-4 backdrop-blur-xl bg-slate-900/40 border border-blue-500/30 rounded-2xl p-4">
              <Button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                variant="outline"
                className="bg-slate-900/50 border-blue-500/50 hover:bg-blue-500/20 text-white disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Précédent
              </Button>
              
              <span className="text-white font-semibold">
                Page {currentPage} sur {totalPages}
              </span>
              
              <Button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                variant="outline"
                className="bg-slate-900/50 border-blue-500/50 hover:bg-blue-500/20 text-white disabled:opacity-50"
              >
                Suivant
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {filteredLogs.length === 0 && (
            <div className="backdrop-blur-xl bg-slate-900/40 border border-blue-500/30 rounded-2xl p-12 text-center shadow-2xl shadow-blue-500/20">
              <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">
                {searchQuery || actionFilter !== 'all' || resourceFilter !== 'all' 
                  ? 'Aucun log trouvé avec ces filtres' 
                  : 'La blockchain est vide'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;