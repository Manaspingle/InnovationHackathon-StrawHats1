import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Building2, Mail, Lock, User, Phone, MapPin, BadgeCheck, ChevronRight, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { BLOOD_GROUPS, ORGAN_TYPES, CITIES, CITY_COORDS } from '@/lib/constants';

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [role, setRole] = useState<'individual' | 'hospital'>('individual');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Individual fields
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O-');
  const [city, setCity] = useState('Mumbai');
  const [phone, setPhone] = useState('');
  const [organs, setOrgans] = useState<string[]>([]);
  const [emergencyContact, setEmergencyContact] = useState('');
  const [consent, setConsent] = useState(false);

  // Hospital fields
  const [hospitalName, setHospitalName] = useState('');
  const [registrationId, setRegistrationId] = useState('');
  const [address, setAddress] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [hospitalPhone, setHospitalPhone] = useState('');
  const [verified, setVerified] = useState(false);

  function toggleOrgan(organ: string) {
    setOrgans((prev) =>
      prev.includes(organ) ? prev.filter((o) => o !== organ) : [...prev, organ]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === 'login') {
      const { error: loginError } = await signIn(email, password);
      if (loginError) {
        setError(loginError);
        setLoading(false);
        return;
      }
      navigate('/dashboard');
    } else {
      const { error: signUpError } = await signUp(email, password);
      if (signUpError) {
        setError(signUpError);
        setLoading(false);
        return;
      }

      // Get the session that was just created
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setError('Failed to create account. Please try again.');
        setLoading(false);
        return;
      }

      const userId = session.user.id;

      // Create profile
      await supabase.from('profiles').insert({
        user_id: userId,
        role,
        email,
      });

      if (role === 'individual') {
        const coords = CITY_COORDS[city] || { lat: 0, lng: 0 };
        await supabase.from('donors').insert({
          user_id: userId,
          email,
          full_name: fullName,
          age: parseInt(age) || 0,
          blood_group: bloodGroup,
          city,
          phone,
          organs,
          emergency_contact: emergencyContact,
          consent,
          available: true,
          donor_level: 'Bronze',
          donor_points: organs.length > 0 ? 60 : 0,
          blood_donations: 0,
          lat: coords.lat + (Math.random() - 0.5) * 0.05,
          lng: coords.lng + (Math.random() - 0.5) * 0.05,
        });
      } else {
        const coords = CITY_COORDS[city] || { lat: 0, lng: 0 };
        await supabase.from('hospitals').insert({
          user_id: userId,
          email,
          hospital_name: hospitalName,
          registration_id: registrationId,
          city,
          address,
          contact_person: contactPerson,
          phone: hospitalPhone,
          verified,
          lat: coords.lat + (Math.random() - 0.5) * 0.05,
          lng: coords.lng + (Math.random() - 0.5) * 0.05,
          inventory: {},
        });
      }

      navigate('/dashboard');
    }

    setLoading(false);
  }

  const inputClass = 'w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-400 transition-all';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50/30 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-8 py-6">
            <Link to="/" className="flex items-center gap-2 text-white mb-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" fill="white" />
              </div>
              <span className="text-xl font-bold">LifeLink</span>
            </Link>
            <h1 className="text-2xl font-bold text-white">
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-primary-100 text-sm mt-1">
              {mode === 'login' ? 'Sign in to your donor or hospital account' : 'Join the network connecting lives'}
            </p>
          </div>

          <div className="p-8">
            {/* Mode toggle */}
            <div className="flex gap-2 mb-6 p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => setMode('login')}
                className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all ${
                  mode === 'login' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500'
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setMode('signup')}
                className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all ${
                  mode === 'signup' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500'
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Role toggle */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={() => setRole('individual')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${
                  role === 'individual'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                <User className="w-5 h-5" />
                <span className="font-medium text-sm">Individual</span>
              </button>
              <button
                onClick={() => setRole('hospital')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${
                  role === 'hospital'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                <Building2 className="w-5 h-5" />
                <span className="font-medium text-sm">Hospital</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence mode="wait">
                {mode === 'signup' && role === 'individual' && (
                  <motion.div
                    key="individual-signup"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 overflow-hidden"
                  >
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className={inputClass}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="number"
                          placeholder="Age"
                          value={age}
                          onChange={(e) => setAge(e.target.value)}
                          required
                          min="18"
                          max="80"
                          className={inputClass}
                        />
                      </div>
                      <select
                        value={bloodGroup}
                        onChange={(e) => setBloodGroup(e.target.value)}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition-all"
                      >
                        {BLOOD_GROUPS.map((bg) => (
                          <option key={bg} value={bg}>{bg}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <select
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition-all"
                      >
                        {CITIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="tel"
                          placeholder="Phone"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                          className={inputClass}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-2">Organs willing to donate</label>
                      <div className="flex flex-wrap gap-2">
                        {ORGAN_TYPES.map((organ) => (
                          <button
                            key={organ}
                            type="button"
                            onClick={() => toggleOrgan(organ)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                              organs.includes(organ)
                                ? 'bg-primary-500 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {organ}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Emergency Contact"
                        value={emergencyContact}
                        onChange={(e) => setEmergencyContact(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={consent}
                        onChange={(e) => setConsent(e.target.checked)}
                        className="mt-1 w-5 h-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-slate-600">
                        I consent to posthumous organ donation. I understand my organs may be used to save lives after my death.
                      </span>
                    </label>
                  </motion.div>
                )}

                {mode === 'signup' && role === 'hospital' && (
                  <motion.div
                    key="hospital-signup"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 overflow-hidden"
                  >
                    <div className="relative">
                      <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Hospital Name"
                        value={hospitalName}
                        onChange={(e) => setHospitalName(e.target.value)}
                        required
                        className={inputClass}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative">
                        <BadgeCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Registration ID"
                          value={registrationId}
                          onChange={(e) => setRegistrationId(e.target.value)}
                          required
                          className={inputClass}
                        />
                      </div>
                      <select
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition-all"
                      >
                        {CITIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        required
                        className={inputClass}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Contact Person"
                          value={contactPerson}
                          onChange={(e) => setContactPerson(e.target.value)}
                          required
                          className={inputClass}
                        />
                      </div>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="tel"
                          placeholder="Phone"
                          value={hospitalPhone}
                          onChange={(e) => setHospitalPhone(e.target.value)}
                          required
                          className={inputClass}
                        />
                      </div>
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={verified}
                        onChange={(e) => setVerified(e.target.checked)}
                        className="w-5 h-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-slate-600">
                        Mock verification toggle (for demo purposes)
                      </span>
                    </label>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Common fields */}
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className={inputClass}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-primary-600 bg-primary-50 px-4 py-3 rounded-xl">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary-600/20 disabled:opacity-60"
              >
                {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
                <ChevronRight className="w-5 h-5" />
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-400">
                Demo: Sign up with any email/password to create an account, or use a seeded hospital email like <span className="font-medium text-slate-500">apollo.mumbai@lifelink.demo</span>
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
