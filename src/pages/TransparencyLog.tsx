import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ShieldAlert, Info, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { verifyHash } from '@/lib/hash';
import type { Allocation, Request, Donor } from '@/types';

interface AllocationRow extends Allocation {
  request?: Request;
  donor?: Donor;
}

export default function TransparencyLog() {
  const [allocations, setAllocations] = useState<AllocationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [verified, setVerified] = useState<Record<string, boolean>>({});

  useEffect(() => {
    supabase
      .from('allocations')
      .select('*, request:requests(*), donor:donors(*)')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setAllocations(data as AllocationRow[]);
        setLoading(false);
      });
  }, []);

  async function handleVerify(alloc: AllocationRow) {
    setVerifying(alloc.id);
    const timestamp = alloc.created_at;
    const isValid = await verifyHash(
      alloc.request_id,
      alloc.donor_id,
      alloc.score,
      timestamp,
      alloc.verification_hash
    );
    setVerified((prev) => ({ ...prev, [alloc.id]: isValid }));
    setVerifying(null);
  }

  function anonymizeId(id: string): string {
    return `DONOR-${id.slice(0, 6).toUpperCase()}`;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Transparency Log</h1>
        <p className="text-slate-500 mt-1">Every allocation is hash-verified to ensure organs are always assigned by medical priority, never favoritism.</p>
      </div>

      {/* Info banner */}
      <div className="bg-gradient-to-r from-primary-50 to-teal-50 rounded-2xl border border-primary-100 p-5 flex gap-4 mb-6">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
          <Info className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h4 className="font-semibold text-slate-800 text-sm mb-1">How verification works</h4>
          <p className="text-sm text-slate-600 leading-relaxed">
            Each allocation record is hashed using SHA-256 of (requestId + donorId + score + timestamp). Click "Verify" to recompute the hash live and confirm the record hasn't been tampered with.
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading allocations...</div>
        ) : allocations.length === 0 ? (
          <div className="p-12 text-center">
            <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400">No allocations yet</p>
            <p className="text-xs text-slate-400 mt-1">Complete an emergency request flow to generate allocation records</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-6 py-3 font-medium">Request ID</th>
                  <th className="text-left px-6 py-3 font-medium">Matched Donor</th>
                  <th className="text-left px-6 py-3 font-medium">Score</th>
                  <th className="text-left px-6 py-3 font-medium">Timestamp</th>
                  <th className="text-left px-6 py-3 font-medium">Verification Hash</th>
                  <th className="text-center px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {allocations.map((alloc, i) => (
                  <motion.tr
                    key={alloc.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="hover:bg-slate-50"
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs text-slate-600">REQ-{alloc.request_id.slice(0, 6).toUpperCase()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs text-slate-600">{anonymizeId(alloc.donor_id)}</span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800">{alloc.score}</td>
                    <td className="px-6 py-4 text-slate-400 text-xs">{new Date(alloc.created_at).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs text-slate-500 block max-w-[180px] truncate" title={alloc.verification_hash}>
                        {alloc.verification_hash.slice(0, 20)}...
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <AnimatePresence mode="wait">
                        {verified[alloc.id] === undefined ? (
                          <button
                            onClick={() => handleVerify(alloc)}
                            disabled={verifying === alloc.id}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium rounded-lg transition-all disabled:opacity-50"
                          >
                            {verifying === alloc.id ? (
                              <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                            ) : (
                              'Verify'
                            )}
                          </button>
                        ) : verified[alloc.id] ? (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="flex items-center gap-1.5 justify-center text-teal-600"
                          >
                            <ShieldCheck className="w-5 h-5" />
                            <span className="text-xs font-medium">Verified</span>
                          </motion.div>
                        ) : (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="flex items-center gap-1.5 justify-center text-primary-600"
                          >
                            <ShieldAlert className="w-5 h-5" />
                            <span className="text-xs font-medium">Tampered</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary */}
      {!loading && allocations.length > 0 && (
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-center">
            <p className="text-2xl font-bold text-slate-800">{allocations.length}</p>
            <p className="text-xs text-slate-400 mt-1">Total Allocations</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-center">
            <p className="text-2xl font-bold text-teal-600">{Object.values(verified).filter(Boolean).length}</p>
            <p className="text-xs text-slate-400 mt-1">Verified Records</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-center">
            <p className="text-2xl font-bold text-slate-800">{(allocations.reduce((sum, a) => sum + a.score, 0) / allocations.length).toFixed(1)}</p>
            <p className="text-xs text-slate-400 mt-1">Avg Match Score</p>
          </div>
        </div>
      )}
    </div>
  );
}
