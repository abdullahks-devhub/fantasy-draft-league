import { useState } from 'react';
import { Search, Edit2, AlertCircle, Plus, User, CheckCircle, XCircle } from 'lucide-react';
import { useWrestlers } from '../hooks/useWrestlers';
import { api } from '../lib/api';

const PROMOTIONS = ['All', 'AEW', 'WWE', 'NXT', 'NJPW', 'ROH', 'STARDOM', 'AAA', 'NOAH'];

export default function AdminWrestlers() {
  const [search, setSearch] = useState('');
  const [promoFilter, setPromoFilter] = useState('All');
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);
  const [updating, setUpdating] = useState(false);

  const { data: wrestlers, isLoading, isError, refetch } = useWrestlers(
    search.length > 2 ? search : undefined,
    promoFilter === 'All' ? undefined : promoFilter,
    activeFilter
  );

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    setUpdating(true);
    try {
      await api.put(`/wrestlers/${id}`, { active: !currentStatus });
      refetch();
    } catch (e) {
      console.error(e);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 slide-in-from-bottom-4">
      <div className="border-b border-gray-800 pb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent inline-flex items-center gap-3">
            <User className="w-8 h-8 text-indigo-400" />
            Wrestler Database
          </h1>
          <p className="text-gray-400 mt-2 text-sm">
            Manage active rosters, correct scraper mismatches, and manage alternate aliases.
          </p>
        </div>
        <button className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all">
          <Plus className="w-4 h-4" />
          Add Wrestler
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search by name or alias..."
            className="w-full pl-10 pr-4 py-2 bg-gray-800/60 border border-gray-700/60 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2 text-sm focus:outline-none"
          value={promoFilter}
          onChange={(e) => setPromoFilter(e.target.value)}
        >
          {PROMOTIONS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <div className="flex bg-gray-800 rounded-xl p-1 border border-gray-700">
          <button
            className={`px-4 py-1 text-xs font-bold rounded-lg transition-all ${
              activeFilter === undefined ? 'bg-gray-700 text-white shadow' : 'text-gray-500 hover:text-gray-300'
            }`}
            onClick={() => setActiveFilter(undefined)}
          >
            All
          </button>
          <button
            className={`px-4 py-1 text-xs font-bold rounded-lg transition-all ${
              activeFilter === true ? 'bg-emerald-500/20 text-emerald-400 shadow' : 'text-gray-500 hover:text-gray-300'
            }`}
            onClick={() => setActiveFilter(true)}
          >
            Active
          </button>
          <button
            className={`px-4 py-1 text-xs font-bold rounded-lg transition-all ${
              activeFilter === false ? 'bg-red-500/20 text-red-500 shadow' : 'text-gray-500 hover:text-gray-300'
            }`}
            onClick={() => setActiveFilter(false)}
          >
            Inactive
          </button>
        </div>
      </div>

      {isError && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm">Error connecting to wrestler database.</p>
          <button onClick={() => refetch()} className="ml-auto text-xs font-bold underline">
            Retry
          </button>
        </div>
      )}

      <div className="rounded-xl border border-gray-800/60 bg-gray-900/50 overflow-hidden backdrop-blur-xl">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-800/50 border-b border-gray-700/50">
              <th className="p-4 text-sm font-semibold text-gray-400">Name</th>
              <th className="p-4 text-sm font-semibold text-gray-400">Promotion</th>
              <th className="p-4 text-sm font-semibold text-gray-400">Status</th>
              <th className="p-4 text-sm font-semibold text-gray-400">Aliases</th>
              <th className="p-4 text-sm font-semibold text-gray-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={5} className="p-4 h-12 bg-gray-800/10" />
                </tr>
              ))
            ) : wrestlers?.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">
                  No wrestlers found matching criteria.
                </td>
              </tr>
            ) : (
              wrestlers?.map((wrestler) => (
                <tr key={wrestler.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="p-4">
                    <span className="font-bold text-gray-200">{wrestler.name}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-xs px-2 py-1 bg-gray-800 border border-gray-700 rounded text-gray-400">
                      {wrestler.currentTeam || 'Independent'}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleToggleActive(wrestler.id, wrestler.active)}
                      disabled={updating}
                      className={`flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-md border transition-all ${
                        wrestler.active
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-red-500/10 text-red-500 border-red-500/20'
                      }`}
                    >
                      {wrestler.active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {wrestler.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-1 flex-wrap max-w-xs">
                      {wrestler.aliases?.map((a) => (
                        <span key={a.id} className="inline-block px-1.5 py-0.5 bg-gray-800 text-[10px] text-gray-500 border border-gray-700 rounded">
                          {a.alias}
                        </span>
                      ))}
                      {(!wrestler.aliases || wrestler.aliases.length === 0) && (
                        <span className="text-[10px] text-gray-600 italic">None</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <button className="p-2 transition-colors text-gray-500 hover:text-indigo-400 hover:bg-gray-800 rounded-lg">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
