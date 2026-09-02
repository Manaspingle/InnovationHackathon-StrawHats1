import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle, Check, X, Truck, Thermometer, Clock, MapPin,
  CheckCircle2, Package, ArrowRight, AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { generateVerificationHash } from '@/lib/hash';
import { scoreDonors } from '@/lib/compatibility';
import type { Request, Donor, Hospital, ScoredDonor } from '@/types';

export default function EmergencyDispatch() {
  const { hospital } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const requestId = searchParams.get('requestId');
  const donorId = searchParams.get('donorId');

  const [request, setRequest] = useState<Request | null>(null);
  const [donor, setDonor] = useState<Donor | null>(null);
  const [hospitalData, setHospitalData] = useState<Hospital | null>(hospital);
  const [loading, setLoading] = useState(true);
  const [donorResponse, setDonorResponse] = useState<'pending' | 'accepted' | 'declined'>('pending');
  const [fallbackDonors, setFallbackDonors] = useState<ScoredDonor[]>([]);
  const [currentFallbackIdx, setCurrentFallbackIdx] = useState(-1);

  // Logistics state
  const [transitProgress, setTransitProgress] = useState(0);
  const [temperature, setTemperature] = useState(4);
  const [eta, setEta] = useState(25);
  const [status, setStatus] = useState<'collected' | 'in_transit' | 'arrived'>('collected');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tempRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!requestId) return;
    supabase.from('requests').select('*').eq('id', requestId).maybeSingle().then(({ data }) => {
      if (data) setRequest(data as Request);
      setLoading(false);
    });
  }, [requestId]);

  useEffect(() => {
    if (!donorId) return;
    supabase.from('donors').select('*').eq('id', donorId).maybeSingle().then(({ data }) => {
      if (data) setDonor(data as Donor);
    });
  }, [donorId]);

  useEffect(() => {
    if (!request || !hospitalData) return;
    // Prepare fallback donors in case of decline
    supabase.from('donors').select('*').eq('city', request.patient_city).then(({ data }) => {
      if (data) {
        const scored = scoreDonors(data as Donor[], request.request_type, request.specific_type, hospitalData.lat, hospitalData.lng);
        setFallbackDonors(scored.filter((d) => d.id !== donorId));
      }
    });
  }, [request, hospitalData, donorId]);

  function handleAccept() {
    setDonorResponse('accepted');
    startLogistics();
  }

  async function handleDecline() {
    setDonorResponse('declined');
    const nextIdx = currentFallbackIdx + 1;
    if (nextIdx < fallbackDonors.length) {
      const next = fallbackDonors[nextIdx];
      setCurrentFallbackIdx(nextIdx);
      setDonor(next);

      // Update request with new donor
      await supabase.from('requests').update({
        matched_donor_id: next.id,
        match_score: next.finalScore,
      }).eq('id', request?.id);

      setTimeout(() => {
        setDonorResponse('pending');
      }, 2000);
    }
  }

  function startLogistics() {
    setStatus('in_transit');
    setTransitProgress(0);
    setEta(25);

    intervalRef.current = setInterval(() => {
      setTransitProgress((prev) => {
        const next = prev + 2;
        if (next >= 100) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          if (tempRef.current) clearInterval(tempRef.current);
          setStatus('arrived');
          setEta(0);
          completeRequest();
          return 100;
        }
        setEta(Math.round((100 - next) / 100 * 25));
        return next;
      });
    }, 500);

    tempRef.current = setInterval(() => {
      setTemperature(Math.round((2 + Math.random() * 4) * 10) / 10);
    }, 1000);
  }

  async function completeRequest() {
    if (!request || !donor) return;
    await supabase.from('requests').update({ status: 'Completed' }).eq('id', request.id);

    const timestamp = new Date().toISOString();
    const hash = await generateVerificationHash(request.id, donor.id, request.match_score || 0, timestamp);
    await supabase.from('allocations').insert({
      request_id: request.id,
      donor_id: donor.id,
      score: request.match_score || 0,
      verification_hash: hash,
    });
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (tempRef.current) clearInterval(tempRef.current);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!request || !donor) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-slate-500">Request or donor not found.</p>
      </div>
    );
  }

  const alertMessage = `🚨 EMERGENCY ALERT from LifeLink\n\nHospital: ${hospitalData?.hospital_name}\nRequest: ${request.request_type === 'blood' ? 'Blood' : 'Organ'} — ${request.specific_type}\nUrgency: ${request.urgency}\nCity: ${request.patient_city}\n\nYou've been matched as a top donor. Please confirm your availability immediately.\n\nReply ACCEPT or DECLINE.\n\n— LifeLink Emergency Network`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Emergency Dispatch</h1>
        <p className="text-slate-500 mt-1">Alert sent to donor. Simulate response and track live logistics.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* WhatsApp Alert Preview */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Alert Sent to {donor.full_name}</h3>
                <p className="text-xs text-slate-400">+{donor.phone} · WhatsApp/SMS</p>
              </div>
            </div>

            {/* WhatsApp chat bubble */}
            <div className="bg-[#e5ddd5] rounded-xl p-4 min-h-[200px]">
              <div className="bg-[#dcf8c6] rounded-lg p-3 max-w-[85%] ml-auto shadow-sm">
                <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans">{alertMessage}</pre>
                <p className="text-[10px] text-slate-400 text-right mt-1">{new Date().toLocaleTimeString()}</p>
              </div>
              {donorResponse !== 'pending' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-3 p-3 rounded-lg max-w-[60%] shadow-sm ${
                    donorResponse === 'accepted' ? 'bg-teal-500 text-white' : 'bg-primary-500 text-white'
                  }`}
                >
                  <p className="text-sm font-medium">{donorResponse === 'accepted' ? 'ACCEPTED ✓' : 'DECLINED ✗'}</p>
                  <p className="text-[10px] opacity-80 text-right mt-1">{new Date().toLocaleTimeString()}</p>
                </motion.div>
              )}
            </div>
          </div>

          {/* Donor Response Simulation */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-bold text-slate-800 mb-2">Donor Response</h3>
            <p className="text-sm text-slate-400 mb-4">Simulate the donor's response to the emergency alert.</p>
            {donorResponse === 'pending' ? (
              <div className="flex gap-3">
                <button
                  onClick={handleAccept}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl transition-all"
                >
                  <Check className="w-5 h-5" />
                  Simulate Accept
                </button>
                <button
                  onClick={handleDecline}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                  Simulate Decline
                </button>
              </div>
            ) : donorResponse === 'accepted' ? (
              <div className="flex items-center gap-2 text-teal-600">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">Donor accepted — logistics unlocked</span>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentFallbackIdx}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-3"
                >
                  <div className="flex items-center gap-2 text-primary-600">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-medium text-sm">Donor declined — cascading to next match...</span>
                  </div>
                  {currentFallbackIdx >= 0 && currentFallbackIdx < fallbackDonors.length && (
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <p className="text-sm text-slate-600">Next donor: <span className="font-medium">{fallbackDonors[currentFallbackIdx].full_name}</span> (Score: {fallbackDonors[currentFallbackIdx].finalScore})</p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          {/* Map placeholder */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary-600" />
              Route Map
            </h3>
            <div className="relative h-64 bg-slate-100 rounded-xl overflow-hidden">
              {/* Simulated map */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200">
                <svg className="w-full h-full" viewBox="0 0 400 256">
                  {/* Route line */}
                  <motion.path
                    d="M 60 200 Q 150 100 340 60"
                    fill="none"
                    stroke="#dc2626"
                    strokeWidth="3"
                    strokeDasharray="6 4"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2 }}
                  />
                  {/* Donor marker */}
                  <circle cx="60" cy="200" r="8" fill="#0d9488" />
                  <text x="75" y="205" fill="#475569" fontSize="11" fontWeight="600">Donor</text>
                  {/* Hospital marker */}
                  <circle cx="340" cy="60" r="8" fill="#dc2626" />
                  <text x="295" y="50" fill="#475569" fontSize="11" fontWeight="600">Hospital</text>
                  {/* Vehicle marker */}
                  {donorResponse === 'accepted' && transitProgress < 100 && (
                    <motion.g
                      animate={{
                        cx: [60, 150, 250, 340],
                        cy: [200, 140, 90, 60],
                      }}
                      transition={{ duration: 12, repeat: Infinity }}
                    >
                      <circle r="12" fill="#1e40af" opacity="0.3" />
                      <circle r="7" fill="#1e40af" />
                    </motion.g>
                  )}
                </svg>
              </div>
              <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg text-xs text-slate-600">
                {donorResponse === 'accepted' ? `${transitProgress}% complete` : 'Awaiting donor response'}
              </div>
            </div>
          </div>
        </div>

        {/* Live Logistics */}
        <div className="space-y-6">
          {donorResponse === 'accepted' ? (
            <>
              {/* Telemetry */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-primary-600" />
                  Live Telemetry
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-slate-50 rounded-xl">
                    <Thermometer className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                    <p className="text-xl font-bold text-slate-800">{temperature}°C</p>
                    <p className="text-xs text-slate-400">Temperature</p>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-xl">
                    <Clock className="w-6 h-6 text-primary-500 mx-auto mb-2" />
                    <p className="text-xl font-bold text-slate-800">{eta} min</p>
                    <p className="text-xs text-slate-400">ETA</p>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-xl">
                    <MapPin className="w-6 h-6 text-teal-500 mx-auto mb-2" />
                    <p className="text-xl font-bold text-slate-800">{Math.round((100 - transitProgress) / 100 * 15)} km</p>
                    <p className="text-xs text-slate-400">Remaining</p>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="mt-4">
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      animate={{ width: `${transitProgress}%` }}
                      className="h-full bg-gradient-to-r from-primary-500 to-teal-500 rounded-full"
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-2 text-center">{transitProgress}% complete</p>
                </div>
              </div>

              {/* Status Timeline */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h3 className="font-bold text-slate-800 mb-4">Status Timeline</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Collected', icon: Package, done: true, color: 'text-teal-600 bg-teal-100' },
                    { label: 'In Transit', icon: Truck, done: status === 'in_transit' || status === 'arrived', active: status === 'in_transit', color: status === 'in_transit' ? 'text-blue-600 bg-blue-100' : status === 'arrived' ? 'text-teal-600 bg-teal-100' : 'text-slate-400 bg-slate-100' },
                    { label: 'Arrived at Hospital', icon: CheckCircle2, done: status === 'arrived', active: status === 'arrived', color: status === 'arrived' ? 'text-teal-600 bg-teal-100' : 'text-slate-400 bg-slate-100' },
                  ].map((step, i) => {
                    const Icon = step.icon;
                    return (
                      <div key={step.label} className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${step.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${step.done ? 'text-slate-800' : 'text-slate-400'}`}>{step.label}</p>
                          {step.active && <p className="text-xs text-primary-500">In progress...</p>}
                        </div>
                        {step.done && <CheckCircle2 className="w-5 h-5 text-teal-500" />}
                        {i < 2 && <div className="absolute" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {status === 'arrived' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-teal-50 rounded-2xl border border-teal-200 p-6 text-center"
                >
                  <CheckCircle2 className="w-12 h-12 text-teal-600 mx-auto mb-3" />
                  <h3 className="text-xl font-bold text-slate-800">Delivery Complete!</h3>
                  <p className="text-sm text-slate-500 mt-1">The {request.specific_type} has arrived at {hospitalData?.hospital_name}</p>
                  <p className="text-xs text-slate-400 mt-2">Allocation hash verified and logged to the transparency ledger.</p>
                  <button
                    onClick={() => navigate('/transparency')}
                    className="mt-4 flex items-center gap-2 mx-auto px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition-all"
                  >
                    View Transparency Log
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
              <Truck className="w-16 h-16 text-slate-200 mx-auto mb-4" />
              <h3 className="font-semibold text-slate-700 mb-1">Logistics Locked</h3>
              <p className="text-sm text-slate-400">Waiting for donor to accept the emergency alert before dispatch can begin.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
