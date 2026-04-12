import { Users, AlertCircle, Calendar } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import { useStandings } from '../hooks/useStandings';
import { useRoster, type RosterSlot } from '../hooks/useRoster';
import { useSeasons, useActiveSeason } from '../hooks/useSeasons';

const columnHelper = createColumnHelper<RosterSlot>();

const columns = [
  columnHelper.accessor('wrestlers', {
    header: 'Wrestler',
    cell: info => {
      const wrestlers = info.getValue() || [];
      const isUnit = wrestlers.length > 1;
      return (
        <div className="flex flex-col gap-0.5">
          <span className="font-bold text-gray-200">
            {wrestlers.map(w => w.name).join(' & ')}
          </span>
          <span className={`text-[10px] font-bold uppercase tracking-tighter w-fit px-1.5 py-0.5 rounded ${
            isUnit
              ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
              : 'bg-gray-800 text-gray-500 border border-gray-700'
          }`}>
            {isUnit ? `Tag / Stable Unit` : 'Singles'}
          </span>
        </div>
      );
    },
  }),
  columnHelper.accessor('wrestlers', {
    id: 'promotion',
    header: 'Promotion',
    cell: info => {
      const wrestlers = info.getValue() || [];
      // Use promotion field first, fall back to currentTeam
      const promos = Array.from(
        new Set(wrestlers.map(w => (w as any).promotion || w.currentTeam).filter(Boolean))
      );
      const label = promos.length > 0 ? promos.join(' / ') : 'Independent';
      const promoColor = label.includes('WWE') ? 'text-amber-400 border-amber-500/30 bg-amber-500/10'
        : label.includes('AEW') ? 'text-blue-400 border-blue-500/30 bg-blue-500/10'
        : label.includes('TNA') ? 'text-orange-400 border-orange-500/30 bg-orange-500/10'
        : label.includes('ROH') ? 'text-purple-400 border-purple-500/30 bg-purple-500/10'
        : label.includes('NJPW') ? 'text-red-400 border-red-500/30 bg-red-500/10'
        : 'text-gray-400 border-gray-700 bg-gray-800';
      return (
        <span className={`text-xs px-2 py-1 border rounded font-medium ${promoColor}`}>
          {label}
        </span>
      );
    },
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    cell: info => {
      const status = info.getValue() as 'ACTIVE' | 'BENCH' | 'IR';
      const colors = {
        ACTIVE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        BENCH:  'bg-amber-500/10 text-amber-400 border-amber-500/20',
        IR:     'bg-red-500/10 text-red-400 border-red-500/20',
      };
      return <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${colors[status] ?? ''}`}>{status}</span>;
    },
  }),
];

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-800/50">
      {[1, 2, 3].map(i => (
        <td key={i} className="p-4"><div className="h-5 rounded bg-gray-800 animate-pulse" style={{ width: `${60 + i * 20}px` }} /></td>
      ))}
    </tr>
  );
}

export default function Rosters() {
  const { data: seasons } = useSeasons();
  const { data: activeSeason } = useActiveSeason();
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');

  // Set default season to active season once loaded
  useEffect(() => {
    if (activeSeason && !selectedSeasonId) {
      setSelectedSeasonId(activeSeason.id);
    }
  }, [activeSeason, selectedSeasonId]);

  const { data: standings, isLoading: standingsLoading } = useStandings(selectedSeasonId);
  const [selectedId, setSelectedId] = useState<string>('');

  // Reset selected player when season changes
  useEffect(() => {
    setSelectedId('');
  }, [selectedSeasonId]);

  // Auto-select first player when standings load for the season
  const playerSeasonId = selectedId || standings?.[0]?.playerSeasonId || '';
  const selectedPlayer = standings?.find(s => s.playerSeasonId === playerSeasonId);

  const { data: roster, isLoading: rosterLoading, isError, refetch } = useRoster(playerSeasonId);

  const data = useMemo(() => roster ?? [], [roster]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const activeCount   = data.filter(r => r.status === 'ACTIVE').length;
  const irCount       = data.filter(r => r.status === 'IR').length;
  const tagTeamCount  = data.filter(r => r.wrestlers.length > 1).length;


  const currentSeason = seasons?.find(s => s.id === selectedSeasonId);
  const isPastSeason = currentSeason && !currentSeason.isActive;

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 slide-in-from-bottom-4">
      <div className="border-b border-gray-800 pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <Users className="w-8 h-8 text-indigo-500" />
            {selectedPlayer ? <span className="capitalize">{selectedPlayer.name}'s Roster</span> : 'Rosters'}
            {isPastSeason && <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-500 border border-gray-700 font-bold uppercase tracking-wider">Archive</span>}
          </h1>
          <p className="text-gray-400 mt-2 text-sm">
            {rosterLoading ? 'Loading...' : `Managing ${data.length} wrestlers`}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          {/* Season Selector */}
          <div className="relative">
            <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <select
              className="pl-9 pr-8 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none cursor-pointer"
              value={selectedSeasonId}
              onChange={(e) => setSelectedSeasonId(e.target.value)}
            >
              {seasons?.map(s => (
                <option key={s.id} value={s.id}>{s.name} {s.isActive ? '(Active)' : ''}</option>
              ))}
            </select>
          </div>

          {/* Player selector */}
          {standings && standings.length > 0 && (
            <select
              id="player-selector"
              value={playerSeasonId}
              onChange={e => setSelectedId(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              {standings.map(s => (
                <option key={s.playerSeasonId} value={s.playerSeasonId} className="capitalize">
                  {s.name} ({s.points} pts)
                </option>
              ))}
            </select>
          )}
          <div className="flex gap-4">
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Active Slots</p>
              <p className={`font-mono px-3 py-1 rounded border ${
                activeCount >= 10
                  ? 'text-red-400 bg-red-500/10 border-red-500/30'
                  : 'text-white bg-gray-800 border-gray-700'
              }`}>{activeCount} / 10</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Tag Teams</p>
              <p className={`font-mono px-3 py-1 rounded border ${
                tagTeamCount >= 3
                  ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                  : 'text-white bg-gray-800 border-gray-700'
              }`}>{tagTeamCount} / 3</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">IR Slots</p>
              <p className="text-white font-mono bg-gray-800 px-3 py-1 rounded border border-gray-700">{irCount}</p>
            </div>
          </div>
        </div>
      </div>

      {isError && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm">Failed to load roster.</span>
          <button
            onClick={() => refetch()}
            className="ml-auto text-xs px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 rounded-lg border border-red-500/30 transition-colors font-bold"
          >
            Retry
          </button>
        </div>
      )}

      <div className="rounded-xl border border-gray-800/60 bg-gray-900/50 overflow-hidden backdrop-blur-xl">
        <table className="w-full text-left">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} className="bg-gray-800/50 border-b border-gray-700/50">
                {headerGroup.headers.map(header => (
                  <th key={header.id} className="p-4 text-sm font-semibold text-gray-400">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {rosterLoading || standingsLoading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              : data.length === 0
              ? (
                <tr>
                  <td colSpan={3} className="p-12 text-center text-gray-500">
                    No wrestlers on this roster yet.
                  </td>
                </tr>
              )
              : table.getRowModel().rows.map(row => (
                  <tr key={row.id} className="hover:bg-gray-800/30 transition-colors">
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="p-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
