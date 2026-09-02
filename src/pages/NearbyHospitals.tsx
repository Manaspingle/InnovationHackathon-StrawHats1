import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Building2, ArrowRight, Search, Truck, CheckCircle2, Clock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { haversineDistance } from '@/lib/compatibility';
import { BLOOD_GROUPS, ORGAN_TYPES } from '@/lib/constants';
import type { Hospital, Transfer } from '@/types';

interface NearbyHospital extends Hospital {
  distance: number;
  estTime: number;
}

export default function NearbyHospitals() {
  const { hospital } = useAuth();
  const [hospitals, setHospitals] = useState<NearbyHospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [transferTarget, setTransferTarget] = useState<string | null>(null);

  useEffect(() => {
    if (!hospital) return;
    supabase.from('hospitals').select('*').neq('id', hospital.id).then(({ data }) => {
      if (data) {
        const nearby = (data as Hospital[])
          .map((h) => {
            const distance = haversineDistance(hospital.lat, hospital.lng, h.lat, h.lng);
            return { ...h, distance: Math.round(distance * 10) / 10, estTime: Math.round(distance * 3) };
          })
          .sort((a, b) => a.distance - b.distance);
        setHospitals(nearby);
      }
      setLoading(false);
    });

    supabase.from('transfers').select('*, to:hospitals!to_hospital_id(*)').eq('from_hospital_id', hospital.id).order('created_at', { ascending: false }).then(({ data }) => {
      if (data) setTransfers(data as any[]);
    });
  }, [hospital]);

  async function requestTransfer(targetHospital: NearbyHospital, type: string) {
    if (!hospital) return;
    setTransferTarget(targetHospital.id);
    const isBlood = BLOOD_GROUPS.includes(type);
    await supabase.from('transfers').insert({
      from_hospital_id: hospital.id,
      to_hospital_id: targetHospital.id,
      blood_type: isBlood ? type : null,
      organ_type: !isBlood ? type : null,
      status: 'Pending',
    });
    // Refresh transfers
    supabase.from('transfers').select('*, to:hospitals!to_hospital_id(*)').eq('from_hospital_id', hospital.id).order('created_at', { ascending: false }).then(({ data }) => {
      if (data) setTransfers(data as any[]);
    });
    setTransferTarget(null);
  }

  if (!hospital) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-slate-500">No hospital profile found.</p>
      </div>
    );
  }

  const filtered = hospitals.filter((h) => {
    if (filterType === 'all') return true;
    if (BLOOD_GROUPS.includes(filterType)) {
      return (h.inventory?.[filterType] || 0) > 0;
    }
    return (h.inventory?.[filterType] || 0) > 0;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Nearby Hospitals</h1>
        <p className="text-slate-500 mt-1">Search for hospitals with available inventory and request cross-hospital transfers.</p>
      </div>

      {/* Map */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary-600" />
          Hospital Map — {hospital.city}
        </h3>
        <div className="relative h-72 bg-slate-100 rounded-xl overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 600 300">
            {/* Grid lines for map effect */}
            {[0, 60, 120, 180, 240, 300, 360, 420, 480, 540, 600].map((x) => (
              <line key={`v${x}`} x1={x} y1="0" x2={x} y2="300" stroke="#e2e8f0" strokeWidth="0.5" />
            ))}
            {[0, 50, 100, 150, 200, 250, 300].map((y) => (
              <line key={`h${y}`} x1="0" y1={y} x2="600" y2={y} stroke="#e2e8f0" strokeWidth="0.5" />
            ))}

            {/* Your hospital (center) */}
            <circle cx="300" cy="150" r="12" fill="#dc2626" />
            <circle cx="300" cy="150" r="20" fill="#dc2626" opacity="0.2">
              <animate attributeName="r" values="20;30;20" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.2;0;0.2" dur="2s" repeatCount="indefinite" />
            </circle>
            <text x="320" y="155" fill="#1e293b" fontSize="12" fontWeight="600">{hospital.hospital_name}</text>

            {/* Other hospitals */}
            {filtered.map((h, i) => {
              const angle = (i / filtered.length) * 2 * Math.PI;
              const radius = 80 + (h.distance / 50) * 60;
              const x = 300 + Math.cos(angle) * radius;
              const y = 150 + Math.sin(angle) * radius;
              return (
                <g key={h.id}>
                  <line x1="300" y1="150" x2={x} y2={y} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="4 4" />
                  <circle cx={x} cy={y} r="8" fill="#0d9488" />
                  <text x={x + 12} y={y + 4} fill="#475569" fontSize="10" fontWeight="500">{h.hospital_name.split(' ').slice(-1)[0]}</text>
                  <text x={x + 12} y={y + 16} fill="#94a3b8" fontSize="9">{h.distance}km</text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-6 flex items-center gap-3">
        <Search className="w-5 h-5 text-slate-400" />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40"
        >
          <option value="all">All Types</option>
          <optgroup label="Blood Groups">
            {BLOOD_GROUPS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
          </optgroup>
          <optgroup label="Organs">
            {ORGAN_TYPES.map((o) => <option key={o} value={o}>{o}</option>)}
          </optgroup>
        </select>
        <span className="text-sm text-slate-400">{filtered.length} hospitals found</span>
      </div>

      {/* Hospital cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {filtered.map((h, i) => (
          <motion.div
            key={h.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 text-sm">{h.hospital_name}</h4>
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />{h.city}
                  </p>
                </div>
              </div>
              {h.verified && (
                <CheckCircle2 className="w-4 h-4 text-teal-500" />
              )}
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {h.distance} km away
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                ~{h.estTime} min
              </span>
            </div>

            {/* Inventory preview */}
            <div className="mb-4">
              <p className="text-xs text-slate-400 mb-1.5">Available Inventory:</p>
              <div className="flex flex-wrap gap-1">
                {Object.entries(h.inventory || {}).filter(([, qty]) => qty > 0).slice(0, 6).map(([type, qty]) => (
                  <span key={type} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-medium">
                    {type}: {qty}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={() => requestTransfer(h, filterType !== 'all' ? filterType : 'O-')}
              disabled={transferTarget === h.id}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-100 hover:bg-primary-50 hover:text-primary-700 text-slate-600 text-sm font-medium rounded-xl transition-all disabled:opacity-50"
            >
              <Truck className="w-4 h-4" />
              {transferTarget === h.id ? 'Request sent...' : 'Request Transfer'}
            </button>
          </motion.div>
        ))}
      </div>

      {/* Transfer requests */}
      {transfers.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary-600" />
              Transfer Requests
            </h3>
          </div>
          <div className="divide-y divide-slate-50">
            {transfers.map((t: any) => (
              <div key={t.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">{t.to?.hospital_name || 'Hospital'}</p>
                    <p className="text-xs text-slate-400">
                      {t.blood_type || t.organ_type} · {new Date(t.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                  t.status === 'Approved' ? 'bg-teal-100 text-teal-700' :
                  t.status === 'Rejected' ? 'bg-primary-100 text-primary-700' :
                  'bg-amber-100 text-amber-700'
                }`}>
                  {t.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
