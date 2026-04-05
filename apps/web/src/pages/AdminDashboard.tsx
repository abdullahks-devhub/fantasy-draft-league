import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users as UsersIcon, Repeat, ArrowRightLeft, ShieldAlert, AlertCircle, CheckCircle2, XCircle, Loader2, RefreshCw, User, UserPlus, Settings } from 'lucide-react';
import { useWaiverQueue } from '../hooks/useWaiverQueue';
import { api } from '../lib/api';
import ManualRosterModal from '../components/Admin/ManualRosterModal';
import ManualTradeModal from '../components/Admin/ManualTradeModal';
import DraftEntryModal from '../components/Admin/DraftEntryModal';
import UnitManagerModal from '../components/Admin/UnitManagerModal';

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-800/50">
      {[40, 60, 30, 80, 50].map((w, i) => (
        <td key={i} className="p-4">
          <div className={`h-5 rounded bg-gray-800 animate-pulse`} style={{ width: `${w}px` }} />
        </td>
      ))}
    </tr>
  );
}

export default function AdminDashboard() {
  const { data: pendingQueue, isLoading, isError, refetch } = useWaiverQueue();
  const [processingWaivers, setProcessingWaivers] = useState(false);
  const [isTriggeringJob, setIsTriggeringJob] = useState(false);
  const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [processResult, setProcessResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleProcessWaivers = async () => {
    setProcessingWaivers(true);
    setProcessResult(null);
    try {
      await api.post('/waivers/process', {});
      setProcessResult({ success: true, message: 'Waiver wire processed successfully.' });
      refetch();
    } catch (e: any) {
      setProcessResult({ success: false, message: e?.response?.data?.error ?? 'Processing failed.' });
    } finally {
      setProcessingWaivers(false);
    }
  };

  const handleTriggerJob = async () => {
    setIsTriggeringJob(true);
    setProcessResult(null);
    try {
      const res = await api.post('/admin/trigger-scraper', {});
      setProcessResult({ success: true, message: res.data.message || 'Scraper job triggered successfully.' });
    } catch (e: any) {
      setProcessResult({ success: false, message: e?.response?.data?.error ?? 'Job trigger failed.' });
    } finally {
      setIsTriggeringJob(false);
    }
  };

  // Group conflicts — same wrestlerId requested by multiple players
  const wrestlerRequestCounts: Record<string, number> = {};
  for (const move of pendingQueue ?? []) {
    if (move.action === 'ADD' && move.wrestler?.id) {
      wrestlerRequestCounts[move.wrestler.id] = (wrestlerRequestCounts[move.wrestler.id] ?? 0) + 1;
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 slide-in-from-bottom-4">
      <div className="border-b border-gray-800 pb-6">
        <h1 className="text-3xl font-black bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent inline-flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-indigo-400" />
          Admin Ops Center
        </h1>
        <p className="text-gray-400 mt-2 text-sm max-w-2xl">
          Manage system configurations, process waiver conflicts, approve manual trades, and trigger point generation. Only authorized users should be here.
        </p>
      </div>

      {/* Process result banner */}
      {processResult && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border text-sm ${
          processResult.success
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {processResult.success
            ? <CheckCircle2 className="w-5 h-5 shrink-0" />
            : <XCircle className="w-5 h-5 shrink-0" />}
          {processResult.message}
          <button onClick={() => setProcessResult(null)} className="ml-auto opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Process Waivers action card */}
        <div
          onClick={!processingWaivers ? handleProcessWaivers : undefined}
          className={`p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20 hover:border-blue-500/40 flex flex-col justify-between hover:shadow-[0_0_20px_rgba(59,130,246,0.1)] transition-all ${processingWaivers ? 'cursor-wait opacity-70' : 'cursor-pointer'}`}
        >
          <div className="p-3 bg-gray-800/60 rounded-xl mb-4 w-fit">
            {processingWaivers ? <Loader2 className="w-6 h-6 text-blue-400 animate-spin" /> : <Repeat className="w-6 h-6 text-blue-400" />}
          </div>
          <h3 className="font-bold text-white text-lg">Process Waivers</h3>
          <p className="text-sm text-gray-400 mt-1">
            {isLoading ? 'Loading...' : `${pendingQueue?.length ?? 0} Pending`}
          </p>
        </div>

        <AdminCard
          onClick={() => setIsTradeModalOpen(true)}
          icon={<ArrowRightLeft className="w-6 h-6 text-emerald-400" />}
          title="Manual Trade"
          desc="Execute Player ↔ Player"
          color="emerald"
        />
        <AdminCard
          onClick={() => setIsRosterModalOpen(true)}
          icon={<UsersIcon className="w-6 h-6 text-purple-400" />}
          title="Force Move"
          desc="Add/drop wrestlers"
          color="purple"
        />
        <AdminCard
          onClick={() => setIsDraftModalOpen(true)}
          icon={<UserPlus className="w-6 h-6 text-indigo-400" />}
          title="Bulk Draft"
          desc="Assign multiple picks"
          color="indigo"
        />
        <AdminLinkCard
          to="/admin/wrestlers"
          icon={<User className="w-6 h-6 text-cyan-400" />}
          title="Wrestler DB"
          desc="Edit aliases & status"
          color="cyan"
        />
        <AdminLinkCard 
          to="/admin/rules"
          icon={<Settings className="w-6 h-6 text-amber-400" />}
          title="Point Rules"
          desc="Edit scoring values"
          color="amber"
        />
        <AdminCard
          onClick={() => setIsUnitModalOpen(true)}
          icon={<UsersIcon className="w-6 h-6 text-indigo-400" />}
          title="Manage Units"
          desc="Merge Tag Teams"
          color="indigo"
        />

        {/* Trigger Job card */}
        <div 
          onClick={!isTriggeringJob ? handleTriggerJob : undefined}
          className={`p-6 rounded-2xl bg-gradient-to-br from-red-500/10 to-transparent border border-red-500/20 flex flex-col justify-between hover:border-red-500/40 transition-all hover:shadow-[0_0_20px_rgba(239,68,68,0.1)] ${isTriggeringJob ? 'cursor-wait opacity-70' : 'cursor-pointer'}`}
        >
          <div className="p-3 bg-gray-800/60 rounded-xl mb-4 w-fit">
            <RefreshCw className={`w-6 h-6 text-red-400 ${isTriggeringJob ? 'animate-spin' : ''}`} />
          </div>
          <h3 className="font-bold text-red-400">Trigger Scraper</h3>
          <p className="text-sm text-gray-400 mt-2">{isTriggeringJob ? 'Running calculation...' : 'Force point calculation.'}</p>
          <button 
            disabled={isTriggeringJob}
            className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-sm font-bold border border-red-500/30 transition-colors w-full disabled:opacity-50"
          >
            {isTriggeringJob ? 'Processing...' : 'Run Now'}
          </button>
        </div>
      </div>

      {/* Modals */}
      <ManualRosterModal 
        isOpen={isRosterModalOpen} 
        onClose={() => setIsRosterModalOpen(false)} 
        onSuccess={(msg) => setProcessResult({ success: true, message: msg })}
      />
      <ManualTradeModal 
        isOpen={isTradeModalOpen} 
        onClose={() => setIsTradeModalOpen(false)} 
        onSuccess={(msg) => setProcessResult({ success: true, message: msg })}
      />
      <DraftEntryModal
        isOpen={isDraftModalOpen}
        onClose={() => setIsDraftModalOpen(false)}
        onSuccess={(msg) => setProcessResult({ success: true, message: msg })}
      />
      <UnitManagerModal
        isOpen={isUnitModalOpen}
        onClose={() => setIsUnitModalOpen(false)}
        onSuccess={(msg) => setProcessResult({ success: true, message: msg })}
      />

      {/* Waiver Queue table */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">
            Pending Waiver Queue
            {pendingQueue && pendingQueue.length > 0 && (
              <span className="ml-3 text-sm font-normal text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full">
                {pendingQueue.length} requests
              </span>
            )}
          </h2>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-lg border border-gray-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        {isError && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
            <AlertCircle className="w-5 h-5 shrink-0" />
            Failed to load waiver queue.
          </div>
        )}

        <div className="rounded-xl border border-gray-800/60 bg-gray-900/50 overflow-hidden backdrop-blur-xl">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-gray-800/50 border-b border-gray-700/50">
                <th className="p-4 font-semibold text-gray-400">Order</th>
                <th className="p-4 font-semibold text-gray-400">Player (Points)</th>
                <th className="p-4 font-semibold text-gray-400">Action</th>
                <th className="p-4 font-semibold text-gray-400">Wrestler</th>
                <th className="p-4 font-semibold text-gray-400 text-right">Potential Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {isLoading
                ? Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
                : !pendingQueue || pendingQueue.length === 0
                ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-gray-500">
                      No pending waiver requests.
                    </td>
                  </tr>
                )
                : pendingQueue.map((move, idx) => {
                    const isConflict = move.action === 'ADD' && move.wrestler?.id && (wrestlerRequestCounts[move.wrestler.id] ?? 0) > 1;
                    const playerName = move.playerSeason?.user?.email?.split('@')[0] ?? '—';
                    const playerPoints = move.playerSeason?.totalPoints ?? 0;
                    
                    return (
                      <tr key={move.id} className="hover:bg-gray-800/30 transition-colors">
                        <td className="p-4">
                          <span className="text-indigo-400 font-bold">#{idx + 1}</span>
                        </td>
                        <td className="p-4">
                          <div className="text-white font-medium capitalize">{playerName}</div>
                          <div className="text-xs text-gray-500">{playerPoints} season pts</div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-md text-xs font-bold border ${
                            move.action === 'ADD'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-red-500/10 text-red-400 border-red-500/20'
                          }`}>
                            {move.action}
                          </span>
                        </td>
                        <td className="p-4 text-gray-300">{move.wrestler?.name ?? '—'}</td>
                        <td className="p-4 text-right">
                          {isConflict
                            ? <span className="text-xs text-amber-400 bg-amber-400/10 px-2 py-1 rounded border border-amber-400/20">Conflict Priority</span>
                            : <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded border border-emerald-400/20">Likely Clear</span>
                          }
                        </td>
                      </tr>
                    );
                  })
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AdminCard({ icon, title, desc, color, onClick }: { icon: React.ReactNode; title: string; desc: string; color: string; onClick?: () => void }) {
  const colorMap: Record<string, string> = {
    blue:    'from-blue-500/10 border-blue-500/20 hover:border-blue-500/40 hover:shadow-[0_0_20px_rgba(59,130,246,0.1)]',
    emerald: 'from-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/40 hover:shadow-[0_0_20px_rgba(16,185,129,0.1)]',
    purple:  'from-purple-500/10 border-purple-500/20 hover:border-purple-500/40 hover:shadow-[0_0_20px_rgba(168,85,247,0.1)]',
    indigo:  'from-indigo-500/10 border-indigo-500/20 hover:border-indigo-500/40 hover:shadow-[0_0_20px_rgba(79,70,229,0.1)]',
  };
  return (
    <div onClick={onClick} className={`p-6 rounded-2xl bg-gradient-to-br to-transparent border flex flex-col items-start cursor-pointer transition-all ${colorMap[color]}`}>
      <div className="p-3 bg-gray-800/60 rounded-xl mb-4 backdrop-blur-md">{icon}</div>
      <h3 className="font-bold text-white text-lg">{title}</h3>
      <p className="text-sm text-gray-400 mt-1">{desc}</p>
    </div>
  );
}

function AdminLinkCard({ to, icon, title, desc, color }: { to: string; icon: React.ReactNode; title: string; desc: string; color: string }) {
  const colorMap: Record<string, string> = {
    cyan:    'from-cyan-500/10 border-cyan-500/20 hover:border-cyan-500/40 hover:shadow-[0_0_20px_rgba(6,182,212,0.1)]',
    blue:    'from-blue-500/10 border-blue-500/20 hover:border-blue-500/40 hover:shadow-[0_0_20px_rgba(59,130,246,0.1)]',
    emerald: 'from-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/40 hover:shadow-[0_0_20px_rgba(16,185,129,0.1)]',
    purple:  'from-purple-500/10 border-purple-500/20 hover:border-purple-500/40 hover:shadow-[0_0_20px_rgba(168,85,247,0.1)]',
    amber:   'from-amber-500/10 border-amber-500/20 hover:border-amber-500/40 hover:shadow-[0_0_20px_rgba(245,158,11,0.1)]',
  };
  return (
    <Link to={to} className={`p-6 rounded-2xl bg-gradient-to-br to-transparent border flex flex-col items-start cursor-pointer transition-all ${colorMap[color]}`}>
      <div className="p-3 bg-gray-800/60 rounded-xl mb-4 backdrop-blur-md">{icon}</div>
      <h3 className="font-bold text-white text-lg">{title}</h3>
      <p className="text-sm text-gray-400 mt-1">{desc}</p>
    </Link>
  );
}
