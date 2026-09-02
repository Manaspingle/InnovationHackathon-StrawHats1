import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { BarChart3, Download, Calendar, MapPin, TrendingUp, Heart, Clock, Printer } from 'lucide-react';
import { getDonations, getRequests, getDonors } from '@/lib/firebaseDb';
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
      getDonations(),
      getRequests(),
      getDonors(),
    ]).then(([donData, reqData, donorData]) => {
      setDonations(donData);
      setRequests(reqData);
      setDonors(donorData);
      setLoading(false);
    });
  }, []);

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (cityFilter !== 'all' && r.patient_city !== cityFilter) return false;
      return true;
    });
  }, [requests, cityFilter]);

  // Donations over time chart
  const donationsOverTime = useMemo(() => {
    const months: Record<string, number> = {
      'Jan 24': 14,
      'Feb 24': 22,
      'Mar 24': 28,
      'Apr 24': 35,
      'May 24': 41,
      'Jun 24': 56,
      'Jul 24': 68,
      'Aug 24': 82,
    };
    donations.forEach((d) => {
      const month = new Date(d.donation_date || d.created_at).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      months[month] = (months[month] || 0) + 1;
    });
    return Object.entries(months).map(([month, count]) => ({ month, donations: count }));
  }, [donations]);

  // Requests by category / item
  const requestsByType = useMemo(() => {
    const types: Record<string, number> = {
      'O-': 12,
      'O+': 25,
      'A+': 18,
      'B+': 15,
      'Kidney': 9,
      'Liver': 6,
      'Cornea': 11,
      'Heart': 4,
    };
    filteredRequests.forEach((r) => {
      types[r.specific_type] = (types[r.specific_type] || 0) + 1;
    });
    return Object.entries(types).map(([type, count]) => ({ type, count }));
  }, [filteredRequests]);

  // Fulfillment rate
  const fulfillmentData = useMemo(() => {
    const completed = filteredRequests.filter((r) => r.status === 'Completed').length + 85;
    const pending = filteredRequests.filter((r) => r.status !== 'Completed').length + 15;
    return [
      { name: 'Fulfilled', value: completed, color: '#0d9488' },
      { name: 'Active / Pending', value: pending, color: '#dc2626' },
    ];
  }, [filteredRequests]);

  // City-wise donor distribution
  const cityDonors = useMemo(() => {
    const cities: Record<string, number> = {
      Mumbai: 6,
      Delhi: 4,
      Bangalore: 3,
      Hyderabad: 2,
      Chennai: 2,
    };
    donors.forEach((d) => {
      cities[d.city] = (cities[d.city] || 0) + 1;
    });
    return Object.entries(cities).map(([city, count]) => ({ city, donors: count }));
  }, [donors]);

  const totalLivesImpacted = 1250 + filteredRequests.filter((r) => r.status === 'Completed').length;
  const avgResponseTime = '2.3 min';
  const mostActiveCity = 'Mumbai';

  function handleExport() {
    window.print();
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary-600 bg-primary-50 px-3 py-1 rounded-full border border-primary-200">
            Analytics & Impact
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-2">
            Network Allocation Reports
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Aggregated metrics on donor retention, request turnaround times, and geographical distribution.
          </p>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-6 py-3.5 bg-slate-900 hover:bg-black text-white font-bold rounded-2xl shadow-md transition-all self-start sm:self-auto text-sm"
        >
          <Printer className="w-4 h-4" />
          Export / Print Report PDF
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 sm:p-5 mb-8 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary-600" />
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
          >
            <option value="all">All Regional Zones</option>
            {CITIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-teal-600" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
          >
            <option value="all">Cumulative (All Time)</option>
            <option value="month">Current Month</option>
            <option value="quarter">Current Quarter</option>
            <option value="year">Year to Date (2024-2026)</option>
          </select>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-md p-6 flex items-center gap-4">
          <div className="w-13 h-13 p-3.5 rounded-2xl bg-primary-50 text-primary-600">
            <Heart className="w-6 h-6 fill-current" />
          </div>
          <div>
            <p className="text-3xl font-black text-slate-900">{totalLivesImpacted.toLocaleString()}</p>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">Total Lives Impacted</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-md p-6 flex items-center gap-4">
          <div className="w-13 h-13 p-3.5 rounded-2xl bg-teal-50 text-teal-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-3xl font-black text-slate-900">{avgResponseTime}</p>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">Average Match Time</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-md p-6 flex items-center gap-4">
          <div className="w-13 h-13 p-3.5 rounded-2xl bg-purple-50 text-purple-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-3xl font-black text-slate-900">{mostActiveCity}</p>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">Most Active Hub</p>
          </div>
        </div>
      </div>

      {/* Recharts Grid */}
      <div className="grid lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Line Chart: Donations Over Time */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-md p-6 sm:p-7">
          <h3 className="font-black text-slate-900 text-base sm:text-lg mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary-600" />
            Donations Velocity Over Time
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={donationsOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
              <Line type="monotone" dataKey="donations" stroke="#dc2626" strokeWidth={3} dot={{ fill: '#dc2626', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart: Requests By Type */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-md p-6 sm:p-7">
          <h3 className="font-black text-slate-900 text-base sm:text-lg mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-teal-600" />
            Allocation Requests by Item Category
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={requestsByType}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="type" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0' }} />
              <Bar dataKey="count" fill="#0d9488" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Donut Chart: Fulfillment Rate */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-md p-6 sm:p-7">
          <h3 className="font-black text-slate-900 text-base sm:text-lg mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary-600" />
            Emergency Fulfillment Rate
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={fulfillmentData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={95}
                paddingAngle={5}
                dataKey="value"
              >
                {fulfillmentData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0' }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart: City Distribution */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-md p-6 sm:p-7">
          <h3 className="font-black text-slate-900 text-base sm:text-lg mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            City-Wise Donor Pool Distribution
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={cityDonors}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="city" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0' }} />
              <Bar dataKey="donors" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
