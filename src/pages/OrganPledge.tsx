import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Heart, Check, Download, AlertCircle, Award } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { ORGAN_TYPES } from '@/lib/constants';
import { getDonorLevel } from '@/lib/compatibility';

const organPositions: Record<string, { cx: number; cy: number; label: string }> = {
  Heart: { cx: 100, cy: 80, label: 'Heart' },
  Lungs: { cx: 100, cy: 120, label: 'Lungs' },
  Liver: { cx: 100, cy: 170, label: 'Liver' },
  Kidney: { cx: 75, cy: 200, label: 'Kidney' },
  Cornea: { cx: 100, cy: 30, label: 'Cornea' },
  'Bone Marrow': { cx: 100, cy: 240, label: 'Bone Marrow' },
};

export default function OrganPledge() {
  const { donor, refreshProfile } = useAuth();
  const [selectedOrgans, setSelectedOrgans] = useState<string[]>(donor?.organs || []);
  const [allergies, setAllergies] = useState(donor?.medical_allergies || '');
  const [conditions, setConditions] = useState(donor?.medical_conditions || '');
  const [submitting, setSubmitting] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [donorId, setDonorId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const donorCode = donor ? `LL-${donor.id.slice(0, 8).toUpperCase()}` : '';

  function toggleOrgan(organ: string) {
    setSelectedOrgans((prev) =>
      prev.includes(organ) ? prev.filter((o) => o !== organ) : [...prev, organ]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!donor) return;
    if (selectedOrgans.length === 0) {
      setError('Please select at least one organ to pledge.');
      return;
    }
    setError(null);
    setSubmitting(true);

    const newPoints = donor.donor_points + (selectedOrgans.length > donor.organs.length ? 60 : 0);
    const newLevel = getDonorLevel(newPoints);

    await supabase.from('donors').update({
      organs: selectedOrgans,
      medical_allergies: allergies,
      medical_conditions: conditions,
      consent: true,
      donor_points: newPoints,
      donor_level: newLevel,
    }).eq('id', donor.id);

    if (selectedOrgans.length > donor.organs.length) {
      await supabase.from('donations').insert({
        donor_id: donor.id,
        donation_type: 'organ_pledge',
        donation_date: new Date().toISOString().split('T')[0],
        points_earned: 60,
      });
    }

    await refreshProfile();
    setDonorId(donorCode);
    setShowCertificate(true);
    setSubmitting(false);
  }

  function downloadCertificate() {
    const canvas = document.querySelector('#pledge-certificate canvas') as HTMLCanvasElement;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `lifelink-pledge-${donorCode}.png`;
    link.href = canvas.toDataURL();
    link.click();
  }

  if (!donor) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-slate-500">No donor profile found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Organ Donation Pledge</h1>
        <p className="text-slate-500 mt-1">Pledge your organs to save lives after death. Click on the body diagram to select organs.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Body Diagram */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-bold text-slate-800 mb-4">Interactive Body Diagram</h3>
          <div className="flex justify-center">
            <svg viewBox="0 0 200 280" className="w-64 h-80">
              {/* Body outline */}
              <ellipse cx="100" cy="30" rx="18" ry="22" fill="none" stroke="#cbd5e1" strokeWidth="1.5" />
              <path d="M 75 55 Q 75 50 80 50 L 120 50 Q 125 50 125 55 L 130 100 L 125 110 L 125 150 L 130 160 L 125 220 L 105 270 L 95 270 L 75 220 L 70 160 L 75 150 L 75 110 L 70 100 Z"
                fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
              {/* Arms */}
              <path d="M 70 60 L 50 120 L 48 130" fill="none" stroke="#cbd5e1" strokeWidth="1.5" />
              <path d="M 130 60 L 150 120 L 152 130" fill="none" stroke="#cbd5e1" strokeWidth="1.5" />

              {/* Organ markers */}
              {ORGAN_TYPES.map((organ) => {
                const pos = organPositions[organ];
                if (!pos) return null;
                const selected = selectedOrgans.includes(organ);
                return (
                  <g key={organ} onClick={() => toggleOrgan(organ)} className="cursor-pointer">
                    <circle
                      cx={pos.cx}
                      cy={pos.cy}
                      r={selected ? 10 : 7}
                      fill={selected ? '#dc2626' : '#e2e8f0'}
                      stroke={selected ? '#b91c1c' : '#cbd5e1'}
                      strokeWidth="1.5"
                      className="transition-all"
                    />
                    {selected && (
                      <text x={pos.cx} y={pos.cy + 4} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
                        ✓
                      </text>
                    )}
                    <text x={pos.cx + 14} y={pos.cy + 4} fill={selected ? '#dc2626' : '#94a3b8'} fontSize="9" fontWeight={selected ? '600' : '400'}>
                      {organ}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            {ORGAN_TYPES.map((organ) => (
              <button
                key={organ}
                onClick={() => toggleOrgan(organ)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedOrgans.includes(organ)
                    ? 'bg-primary-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {organ}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-bold text-slate-800 mb-4">Medical History (Optional)</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Known Allergies</label>
                <input
                  type="text"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  placeholder="e.g., Penicillin, None"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-400 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Existing Conditions</label>
                <input
                  type="text"
                  value={conditions}
                  onChange={(e) => setConditions(e.target.value)}
                  placeholder="e.g., Hypertension, None"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-400 transition-all"
                />
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
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary-600/20 disabled:opacity-60"
          >
            <Heart className="w-5 h-5" fill="white" />
            {submitting ? 'Submitting...' : 'Submit Pledge'}
          </button>

          <p className="text-xs text-slate-400 text-center">
            By submitting, you consent to posthumous organ donation. Your pledge will be registered with a unique Donor ID.
          </p>
        </div>
      </div>

      {/* Certificate Modal */}
      <AnimatePresence>
        {showCertificate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowCertificate(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
            >
              {/* Confirmation animation */}
              <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <Check className="w-8 h-8 text-white" />
                </motion.div>
                <h2 className="text-2xl font-bold text-white">Thank you!</h2>
                <p className="text-primary-100 text-sm mt-1">You've registered as a lifesaver</p>
              </div>

              {/* Certificate */}
              <div id="pledge-certificate" className="p-8">
                <div className="border-2 border-primary-200 rounded-2xl p-6 text-center">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Award className="w-6 h-6 text-primary-600" />
                    <h3 className="font-bold text-slate-800 text-lg">Organ Donor Pledge Certificate</h3>
                  </div>
                  <p className="text-sm text-slate-500 mb-1">This certifies that</p>
                  <p className="text-xl font-bold text-slate-800 mb-3">{donor.full_name}</p>
                  <p className="text-sm text-slate-500 mb-4">has pledged to donate the following organs after death:</p>
                  <div className="flex flex-wrap gap-2 justify-center mb-4">
                    {selectedOrgans.map((organ) => (
                      <span key={organ} className="px-3 py-1 bg-primary-50 text-primary-700 rounded-lg text-sm font-medium">
                        {organ}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-slate-500 mb-4">Blood Group: <span className="font-semibold text-slate-700">{donor.blood_group}</span></p>
                  <div className="flex justify-center mb-4">
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <QRCodeSVG value={donorCode} size={100} />
                    </div>
                  </div>
                  <p className="text-xs text-slate-400">Donor ID: {donorCode}</p>
                  <p className="text-xs text-slate-400 mt-1">Issued: {new Date().toLocaleDateString()}</p>
                </div>
                <button
                  onClick={downloadCertificate}
                  className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-all"
                >
                  <Download className="w-5 h-5" />
                  Download Certificate
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
