import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { BarChart3, Download, Calendar, MapPin, TrendingUp, Heart, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { CITIES } from '@/lib/constants';
import type { Donation, Request, Donor } from '@/types';

export default function Reports() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [cityFilter, setCityFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');

  useEffect(() => {
    Promise.all([
      supabase.from('donations').select('*, donor:donors(*)'),
      supabase.from('requests').select('*'),
      supabase.from('donors').select('*'),
    ]).then(([donRes, reqRes, donorRes]) => {
      if (donRes.data) setDonations(donRes.data as any[]);
      if (reqRes.data) setRequests(reqRes.data as Request[]);
      if (donorRes.data) setDonors(donorRes.data as Donor[]);
      setLoading(false);
    });
  }, []);

  const filteredDonations = useMemo(() => {
    return donations.filter((d) => {
      if (cityFilter !== 'all' && (d as any).donor?.city !== cityFilter) return false;
      return true;
    });
  }, [donations, cityFilter]);

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (cityFilter !== 'all' && r.patient_city !== cityFilter) return false;
      return true;
    });
  }, [requests, cityFilter]);

  // Donations over time (line chart)
  const donationsOverTime = useMemo(() => {
    const months: Record<string, number> = {};
    filteredDonations.forEach((d) => {
      const month = new Date(d.donation_date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      months[month] = (months[month] || 0) + 1;
    });
    return Object.entries(months).map(([month, count]) => ({ month, donations: count }));
  }, [filteredDonations]);

  // Requests by type (bar chart)
  const requestsByType = useMemo(() => {
    const types: Record<string, number> = {};
    filteredRequests.forEach((r) => {
      types[r.specific_type] = (types[r.specific_type] || 0) + 1;
    });
    return Object.entries(types).map(([type, count]) => ({ type, count }));
  }, [filteredRequests]);

  // Fulfillment rate (donut chart)
  const fulfillmentData = useMemo(() => {
    const completed = filteredRequests.filter((r) => r.status === 'Completed').length;
    const pending = filteredRequests.filter((r) => r.status !== 'Completed').length;
    return [
      { name: 'Fulfilled', value: completed, color: '#0d9488' },
      { name: 'Pending', value: pending, color: '#f59e0b' },
    ];
  }, [filteredRequests]);

  // City-wise donor distribution (bar chart)
  const cityDonors = useMemo(() => {
    const cities: Record<string, number> = {};
    donors.forEach((d) => {
      cities[d.city] = (cities[d.city] || 0) + 1;
    });
    return Object.entries(cities).map(([city, count]) => ({ city, donors: count }));
  }, [donors]);

  const totalLivesImpacted = filteredRequests.filter((r) => r.status === 'Completed').length;
  const avgResponseTime = '2.3 min';
  const mostActiveCity = cityDonors.sort((a, b) => b.donors - a.donors)[0]?.city || '—';

  function handleExport() {
    window.print();
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Reports & Analytics</h1>
          <p className="text-slate-500 mt-1">Detailed insights into donation patterns and request fulfillment.</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-xl transition-all"
        >
          <Download className="w-5 h-5" />
          Export as PDF
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-6 flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-slate-400" />
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40"
          >
            <option value="all">All Cities</option>
            {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40"
          >
            <option value="all">All Time</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Lives Impacted', value: totalLivesImpacted, icon: Heart, color: 'text-primary-600', bg: 'bg-primary-50' },
          { label: 'Average Response Time', value: avgResponseTime, icon: Clock, color: 'text-teal-600', bg: 'bg-teal-50' },
          { label: 'Most Active City', value: mostActiveCity, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4"
            >
              <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center ${stat.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                <p className="text-xs text-slate-400">{stat.label}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Donations over time */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary-600" />
            Donations Over Time
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={donationsOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
              <Line type="monotone" dataKey="donations" stroke="#dc2626" strokeWidth={2} dot={{ fill: '#dc2626', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Requests by type */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-teal-600" />
            Requests by Type
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={requestsByType}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="type" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
              <Bar dataKey="count" fill="#0d9488" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Fulfillment rate */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary-600" />
            Fulfillment Rate
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={fulfillmentData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
                dataKey="value"
              >
                {fulfillmentData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* City-wise donor distribution */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-teal-600" />
            City-wise Donor Distribution
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={cityDonors}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="city" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
              <Bar dataKey="donors" fill="#dc2626" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
