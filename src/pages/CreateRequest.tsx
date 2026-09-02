import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Droplet, Heart, Siren, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { BLOOD_GROUPS, ORGAN_TYPES, URGENCY_LEVELS } from '@/lib/constants';

export default function CreateRequest() {
  const { hospital } = useAuth();
  const navigate = useNavigate();
  const [requestType, setRequestType] = useState<'blood' | 'organ'>('blood');
  const [specificType, setSpecificType] = useState('O-');
  const [urgency, setUrgency] = useState<'Critical' | 'High' | 'Moderate'>('Critical');
  const [patientAge, setPatientAge] = useState('');
  const [patientCity, setPatientCity] = useState(hospital?.city || '');
  const [requiredBy, setRequiredBy] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const typeOptions = requestType === 'blood' ? BLOOD_GROUPS : ORGAN_TYPES;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!hospital) return;
    setError(null);
    setSubmitting(true);

    const requiredByDate = requiredBy ? new Date(requiredBy).toISOString() : new Date(Date.now() + 6 * 3600 * 1000).toISOString();

    const { data, error: insertError } = await supabase.from('requests').insert({
      hospital_id: hospital.id,
      request_type: requestType,
      specific_type: specificType,
      urgency,
      patient_age: parseInt(patientAge) || 0,
      patient_city: patientCity,
      required_by: requiredByDate,
      status: 'Pending',
    }).select().single();

    if (insertError) {
      setError(insertError.message);
      setSubmitting(false);
      return;
    }

    navigate(`/matching-engine?requestId=${data.id}`);
  }

  if (!hospital) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-slate-500">No hospital profile found.</p>
      </div>
    );
  }

  const inputClass = 'w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-400 transition-all';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Create Emergency Request</h1>
        <p className="text-slate-500 mt-1">Submit a blood or organ request to trigger the matching engine.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Request Type */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-bold text-slate-800 mb-4">Request Type</h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => { setRequestType('blood'); setSpecificType('O-'); }}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                requestType === 'blood' ? 'border-primary-500 bg-primary-50' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <Droplet className={`w-6 h-6 ${requestType === 'blood' ? 'text-primary-600' : 'text-slate-400'}`} />
              <span className={`font-medium ${requestType === 'blood' ? 'text-primary-700' : 'text-slate-600'}`}>Blood</span>
            </button>
            <button
              type="button"
              onClick={() => { setRequestType('organ'); setSpecificType('Kidney'); }}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                requestType === 'organ' ? 'border-teal-500 bg-teal-50' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <Heart className={`w-6 h-6 ${requestType === 'organ' ? 'text-teal-600' : 'text-slate-400'}`} />
              <span className={`font-medium ${requestType === 'organ' ? 'text-teal-700' : 'text-slate-600'}`}>Organ</span>
            </button>
          </div>
        </div>

        {/* Details */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-slate-800">Request Details</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">
                {requestType === 'blood' ? 'Blood Group' : 'Organ Type'}
              </label>
              <select value={specificType} onChange={(e) => setSpecificType(e.target.value)} className={inputClass}>
                {typeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Urgency Level</label>
              <select value={urgency} onChange={(e) => setUrgency(e.target.value as typeof urgency)} className={inputClass}>
                {URGENCY_LEVELS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Patient Age</label>
              <input type="number" value={patientAge} onChange={(e) => setPatientAge(e.target.value)} placeholder="e.g., 45" min="0" max="120" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Patient City</label>
              <input type="text" value={patientCity} onChange={(e) => setPatientCity(e.target.value)} required className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Required By</label>
              <input type="datetime-local" value={requiredBy} onChange={(e) => setRequiredBy(e.target.value)} className={inputClass} />
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-primary-600 bg-primary-50 px-4 py-3 rounded-xl">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 py-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-lg shadow-primary-600/20 transition-all disabled:opacity-60"
        >
          <Siren className="w-5 h-5" />
          {submitting ? 'Creating...' : 'Trigger Matching Engine'}
          <ArrowRight className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
