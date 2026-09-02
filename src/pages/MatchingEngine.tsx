import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Zap, MapPin, Shield, Info, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { scoreDonors } from '@/lib/compatibility';
import type { Donor, Request, ScoredDonor } from '@/types';

export default function MatchingEngine() {
  const { hospital } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const requestId = searchParams.get('requestId');

  const [request, setRequest] = useState<Request | null>(null);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [scoredDonors, setScoredDonors] = useState<ScoredDonor[]>([]);
  const [displayScores, setDisplayScores] = useState<Record<string, number>>({});
  const [scoring, setScoring] = useState(true);
  const [selectedDonor, setSelectedDonor] = useState<ScoredDonor | null>(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!requestId) return;
    Promise.all([
      supabase.from('requests').select('*').eq('id', requestId).maybeSingle(),
      supabase.from('donors').select('*'),
    ]).then(([reqRes, donorRes]) => {
      if (reqRes.data) setRequest(reqRes.data as Request);
      if (donorRes.data) setDonors(donorRes.data as Donor[]);
      setLoading(false);
    });
  }, [requestId]);

  useEffect(() => {
    if (!request || !hospital || donors.length === 0) return;

    const scored = scoreDonors(
      donors,
      request.request_type,
      request.specific_type,
      hospital.lat,
      hospital.lng
    );

    setScoredDonors(scored);
    setScoring(true);

    // Animate scores counting up
    const targets: Record<string, number> = {};
    scored.forEach((d) => { targets[d.id] = d.finalScore; });
    setDisplayScores({});

    let frame = 0;
    const totalFrames = 40;
    intervalRef.current = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      const newScores: Record<string, number> = {};
      scored.forEach((d) => {
        newScores[d.id] = Math.round(d.finalScore * progress * 10) / 10;
      });
      setDisplayScores(newScores);

      if (frame >= totalFrames) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setDisplayScores(targets);
        setScoring(false);
      }
    }, 30);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [request, hospital, donors]);

  async function handleSelectDonor(donor: ScoredDonor) {
    if (!request || !hospital) return;
    setSelectedDonor(donor);

    await supabase.from('requests').update({
      status: 'Matched',
      matched_donor_id: donor.id,
      match_score: donor.finalScore,
    }).eq('id', request.id);
  }

  function proceedToDispatch() {
    if (!selectedDonor || !request) return;
    navigate(`/dispatch?requestId=${request.id}&donorId=${selectedDonor.id}`);
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-slate-500">Request not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <motion.span
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="w-3 h-3 bg-primary-500 rounded-full"
          />
          <span className="text-sm font-medium text-primary-600 uppercase tracking-wide">
            {scoring ? 'Scoring in progress...' : 'Matching complete'}
          </span>
        </div>
        <h1 className="text-3xl font-bold text-slate-800">Matching Engine</h1>
        <p className="text-slate-500 mt-1">
          {request.request_type === 'blood' ? 'Blood' : 'Organ'} request for <span className="font-semibold text-slate-700">{request.specific_type}</span> · {request.urgency} urgency
        </p>
      </div>

      {/* Scoring Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-6">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary-600" />
            <h3 className="font-bold text-slate-800">Eligible Donors — Live Scoring</h3>
          </div>
          <span className="text-sm text-slate-400">{scoredDonors.length} matches found</span>
        </div>

        {scoredDonors.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-400">No eligible donors found for this request.</p>
            <p className="text-sm text-slate-400 mt-2">Try searching nearby hospitals for cross-city transfers.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Rank</th>
                  <th className="text-left px-4 py-3 font-medium">Donor</th>
                  <th className="text-left px-4 py-3 font-medium">Blood</th>
                  <th className="text-center px-4 py-3 font-medium">Compat</th>
                  <th className="text-center px-4 py-3 font-medium">Proximity</th>
                  <th className="text-center px-4 py-3 font-medium">Reliability</th>
                  <th className="text-center px-4 py-3 font-medium">Final Score</th>
                  <th className="text-center px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                <AnimatePresence>
                  {scoredDonors.map((donor, i) => {
                    const isTop = i === 0 && !scoring;
                    const isSelected = selectedDonor?.id === donor.id;
                    return (
                      <motion.tr
                        key={donor.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className={`${isTop ? 'bg-primary-50' : isSelected ? 'bg-teal-50' : 'hover:bg-slate-50'}`}
                      >
                        <td className="px-4 py-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                            i === 0 ? 'bg-amber-100 text-amber-700' :
                            i === 1 ? 'bg-slate-200 text-slate-600' :
                            i === 2 ? 'bg-orange-100 text-orange-700' :
                            'bg-slate-50 text-slate-500'
                          }`}>
                            {i + 1}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                              {donor.full_name[0]}
                            </div>
                            <div>
                              <p className="font-medium text-slate-800 text-sm">{donor.full_name}</p>
                              <p className="text-xs text-slate-400">{donor.donor_level}</p>
                            </div>
                            {isTop && (
                              <motion.span
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                className="px-2 py-0.5 bg-primary-500 text-white text-xs font-bold rounded-md"
                              >
                                TOP MATCH
                              </motion.span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-primary-50 text-primary-700 rounded-md text-xs font-medium">{donor.blood_group}</span>
                        </td>
                        <td className="px-4 py-3 text-center text-slate-600">{donor.compatibilityScore}</td>
                        <td className="px-4 py-3 text-center text-slate-600">{donor.proximityScore} <span className="text-xs text-slate-400">({donor.distance}km)</span></td>
                        <td className="px-4 py-3 text-center text-slate-600">{donor.reliabilityScore}</td>
                        <td className="px-4 py-3 text-center">
                          <motion.span
                            key={displayScores[donor.id] || 0}
                            initial={{ scale: 1.2 }}
                            animate={{ scale: 1 }}
                            className="text-lg font-bold text-slate-800"
                          >
                            {displayScores[donor.id] || 0}
                          </motion.span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleSelectDonor(donor)}
                            disabled={scoring}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              isSelected
                                ? 'bg-teal-500 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            } disabled:opacity-50`}
                          >
                            {isSelected ? 'Selected' : 'Select'}
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Formula Transparency Panel */}
      <div className="bg-gradient-to-r from-slate-50 to-white rounded-2xl border border-slate-100 p-6 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Info className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-800 text-sm mb-1">How scores are calculated</h4>
            <p className="text-sm text-slate-500 mb-2">Every allocation is explainable and transparent. The final score is a weighted combination of three factors:</p>
            <div className="bg-white rounded-xl p-3 font-mono text-sm text-slate-700 border border-slate-100">
              Score = 0.5 × Compatibility + 0.3 × Proximity + 0.2 × Reliability
            </div>
            <div className="grid grid-cols-3 gap-3 mt-3">
              <div className="text-center p-2 bg-white rounded-lg border border-slate-100">
                <p className="text-xs text-slate-400">Compatibility</p>
                <p className="text-sm font-medium text-slate-700">Blood group / organ match</p>
              </div>
              <div className="text-center p-2 bg-white rounded-lg border border-slate-100">
                <p className="text-xs text-slate-400">Proximity</p>
                <p className="text-sm font-medium text-slate-700">Distance from hospital (km)</p>
              </div>
              <div className="text-center p-2 bg-white rounded-lg border border-slate-100">
                <p className="text-xs text-slate-400">Reliability</p>
                <p className="text-sm font-medium text-slate-700">Donor level & history</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Proceed button */}
      {selectedDonor && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-teal-50 rounded-2xl border border-teal-200 p-6 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-teal-600" />
            <div>
              <p className="font-semibold text-slate-800">Selected: {selectedDonor.full_name}</p>
              <p className="text-sm text-slate-500">Score: {selectedDonor.finalScore} · {selectedDonor.blood_group} · {selectedDonor.distance}km away</p>
            </div>
          </div>
          <button
            onClick={proceedToDispatch}
            className="flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl transition-all"
          >
            Proceed to Dispatch
            <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>
      )}
    </div>
  );
}
