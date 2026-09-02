import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity, CheckCircle2, Clock, Users, Siren, MapPin, ArrowRight,
  Building2, AlertCircle, FileText
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Request, Donor } from '@/types';

export default function HospitalDashboard() {
  const { hospital } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<Request[]>([]);
  const [donorPool, setDonorPool] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hospital) return;
    Promise.all([
      supabase.from('requests').select('*').eq('hospital_id', hospital.id).order('created_at', { ascending: false }),
      supabase.from('donors').select('*').eq('city', hospital.city),
    ]).then(([reqRes, donorRes]) => {
      if (reqRes.data) setRequests(reqRes.data as Request[]);
      if (donorRes.data) setDonorPool(donorRes.data as Donor[]);
      setLoading(false);
    });
  }, [hospital]);

  if (!hospital) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-slate-500">No hospital profile found.</p>
      </div>
    );
  }

  const activeRequests = requests.filter((r) => r.status === 'Pending' || r.status === 'Matched' || r.status === 'Dispatched');
  const fulfilledThisMonth = requests.filter((r) => {
    const d = new Date(r.created_at);
    const now = new Date();
    return r.status === 'Completed' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const avgMatchTime = '2.3 min';

  const statusColors: Record<string, string> = {
    Pending: 'bg-amber-100 text-amber-700',
    Matched: 'bg-teal-100 text-teal-700',
    Dispatched: 'bg-blue-100 text-blue-700',
    Completed: 'bg-slate-100 text-slate-600',
    Cancelled: 'bg-primary-100 text-primary-700',
  };

  const cards = [
    { label: 'Active Requests', value: activeRequests.length, icon: Activity, color: 'text-primary-600', bg: 'bg-primary-50' },
    { label: 'Fulfilled This Month', value: fulfilledThisMonth, icon: CheckCircle2, color: 'text-teal-600', bg: 'bg-teal-50' },
    { label: 'Average Match Time', value: avgMatchTime, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'City Donor Pool', value: donorPool.length, icon: Users, color: 'text-primary-600', bg: 'bg-primary-50' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{hospital.hospital_name}</h1>
              <p className="text-sm text-slate-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />{hospital.city} · {hospital.verified && 'Verified'}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate('/create-request')}
          className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-lg shadow-primary-600/20 transition-all"
        >
          <Siren className="w-5 h-5" />
          Create Emergency Request
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5"
            >
              <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center mb-3 ${card.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-slate-800">{card.value}</p>
              <p className="text-xs text-slate-400 mt-1">{card.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Access */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <button
          onClick={() => navigate('/create-request')}
          className="flex items-center justify-between p-5 bg-gradient-to-r from-primary-50 to-white rounded-2xl border border-primary-100 hover:border-primary-200 transition-all text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <Siren className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">Create Emergency Request</p>
              <p className="text-sm text-slate-400">Trigger the matching engine for blood or organ</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400" />
        </button>
        <button
          onClick={() => navigate('/nearby-hospitals')}
          className="flex items-center justify-between p-5 bg-gradient-to-r from-teal-50 to-white rounded-2xl border border-teal-100 hover:border-teal-200 transition-all text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
              <MapPin className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">Search Nearby Hospitals</p>
              <p className="text-sm text-slate-400">Find hospitals with available inventory</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      {/* Request List */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 text-lg">Requests</h3>
          <p className="text-sm text-slate-400 mt-1">All past and active emergency requests</p>
        </div>
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading requests...</div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400">No requests yet</p>
            <p className="text-xs text-slate-400 mt-1">Create an emergency request to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-6 py-3 font-medium">Type</th>
                  <th className="text-left px-6 py-3 font-medium">Specific</th>
                  <th className="text-left px-6 py-3 font-medium">Urgency</th>
                  <th className="text-left px-6 py-3 font-medium">City</th>
                  <th className="text-left px-6 py-3 font-medium">Score</th>
                  <th className="text-left px-6 py-3 font-medium">Status</th>
                  <th className="text-left px-6 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-2">
                        {req.request_type === 'blood' ? (
                          <span className="w-2 h-2 rounded-full bg-primary-500" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-teal-500" />
                        )}
                        <span className="capitalize text-slate-700">{req.request_type}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800">{req.specific_type}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                        req.urgency === 'Critical' ? 'bg-primary-100 text-primary-700' :
                        req.urgency === 'High' ? 'bg-orange-100 text-orange-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {req.urgency}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{req.patient_city}</td>
                    <td className="px-6 py-4 text-slate-600">{req.match_score ? `${req.match_score}` : '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${statusColors[req.status]}`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">{new Date(req.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
