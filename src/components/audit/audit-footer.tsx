"use client";

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Clock, User, ChevronRight } from 'lucide-react';
import { getRecentAuditLogs } from '@/lib/audit';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface AuditLog {
  id: string;
  user_email: string;
  action: string;
  resource_type: string;
  created_at: string;
}

export const AuditFooter = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    loadLogs();

    // S'abonner aux changements en temps réel
    const channel = supabase
      .channel('audit_logs_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'audit_logs',
        },
        (payload) => {
          setLogs(prev => [payload.new as AuditLog, ...prev].slice(0, 3));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadLogs = async () => {
    const data = await getRecentAuditLogs(3);
    setLogs(data);
  };

  const getActionColor = (action: string): string => {
    if (action.startsWith('CREATE')) return 'bg-green-500/20 text-green-400 border-green-500/50';
    if (action.startsWith('UPDATE')) return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
    if (action.startsWith('DELETE')) return 'bg-red-500/20 text-red-400 border-red-500/50';
    if (action.startsWith('VIEW')) return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    return 'bg-purple-500/20 text-purple-400 border-purple-500/50';
  };

  const formatAction = (action: string): string => {
    return action.replace(/_/g, ' ').toLowerCase();
  };

  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}min`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return date.toLocaleDateString('fr-CA');
  };

  if (logs.length === 0) return null;

  return (
    <Card 
      onClick={() => navigate('/audit-logs')}
      className="fixed bottom-4 right-4 w-80 backdrop-blur-xl bg-slate-900/90 border-blue-500/30 shadow-2xl shadow-blue-500/20 z-50 cursor-pointer hover:scale-105 transition-all duration-300 hover:border-blue-400/50"
    >
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400 animate-pulse" />
            <h3 className="text-xs font-semibold text-white">Activité récente</h3>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>

        <div className="space-y-1.5">
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between p-1.5 bg-slate-900/50 rounded border border-blue-500/10 text-xs"
            >
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <User className="w-3 h-3 text-gray-400 flex-shrink-0" />
                <span className="text-gray-400 truncate text-xs">{log.user_email?.split('@')[0]}</span>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <Badge variant="outline" className={`${getActionColor(log.action)} text-[10px] px-1.5 py-0`}>
                  {formatAction(log.action)}
                </Badge>
                <div className="flex items-center gap-0.5 text-gray-500">
                  <Clock className="w-2.5 h-2.5" />
                  <span className="text-[10px]">{formatTime(log.created_at)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center pt-1 border-t border-blue-500/20">
          <span className="text-[10px] text-blue-400 hover:text-blue-300">
            Cliquez pour voir le Grand Livre →
          </span>
        </div>
      </div>
    </Card>
  );
};