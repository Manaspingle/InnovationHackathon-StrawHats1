import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { Heart, Users, Building2, MapPin, ArrowRight, ShieldCheck, Zap, Award, Phone, Mail, Activity, Droplet } from 'lucide-react';

function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (inView) {
      const duration = 2000;
      const steps = 60;
      const increment = value / steps;
      let current = 0;
      const interval = setInterval(() => {
        current += increment;
        if (current >= value) {
          setCount(value);
          clearInterval(interval);
        } else {
          setCount(Math.floor(current));
        }
      }, duration / steps);
      return () => clearInterval(interval);
    }
  }, [inView, value]);

  return (
    <span ref={ref} className="text-4xl md:text-5xl font-bold text-slate-800">
      {count.toLocaleString()}{suffix}
    </span>
  );
}

const stats = [
  { label: 'Lives Saved', value: 1247, icon: Heart, color: 'text-primary-600' },
  { label: 'Active Donors', value: 3856, icon: Users, color: 'text-teal-600' },
  { label: 'Hospitals Connected', value: 142, icon: Building2, color: 'text-primary-600' },
  { label: 'Cities Covered', value: 28, icon: MapPin, color: 'text-teal-600' },
];

const steps = [
  {
    num: '01',
    title: 'Register',
    desc: 'Sign up as a donor or hospital. Pledge organs, log blood donations, and join your city\'s donor network.',
    icon: Users,
  },
  {
    num: '02',
    title: 'Match',
    desc: 'When a hospital raises an emergency request, our matching engine scores every eligible donor in real time by compatibility, proximity, and reliability.',
    icon: Zap,
  },
  {
    num: '03',
    title: 'Save a Life',
    desc: 'Get alerted instantly. Confirm availability, and our logistics tracker guides the organ or blood from donor to hospital with full transparency.',
    icon: Heart,
  },
];

const testimonials = [
  {
    name: 'Dr. Rajesh Kumar',
    role: 'Apollo Hospital, Mumbai',
    quote: 'LifeLink cut our average match time from hours to minutes. The transparency log gives families confidence that allocation is fair.',
    avatar: 'RK',
  },
  {
    name: 'Priya Iyer',
    role: 'Donor, Mumbai',
    quote: 'I pledged my organs after my father needed a transplant. The gamification keeps me engaged — I\'m proud to be a Gold-tier donor.',
    avatar: 'PI',
  },
  {
    name: 'Dr. Priya Sharma',
    role: 'Fortis Hospital, Delhi',
    quote: 'The AI recommendations helped us anticipate a 20% spike in A+ demand this season. We were prepared when it hit.',
    avatar: 'PS',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-red-50/40">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-100/40 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-teal-100/30 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-full text-sm font-medium mb-6">
                <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
                City-based Blood & Organ Donor Network
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-slate-800 leading-[1.05] tracking-tight">
                Connecting Life,
                <br />
                <span className="bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                  One Match at a Time
                </span>
              </h1>
              <p className="mt-6 text-lg text-slate-600 max-w-lg leading-relaxed">
                A transparent, priority-based platform linking donors, recipients, and hospitals within city zones — because every minute matters when a life is on the line.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link
                  to="/auth?mode=signup&role=individual"
                  className="group flex items-center justify-center gap-2 px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-2xl shadow-xl shadow-primary-600/25 transition-all"
                >
                  Register as Donor
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/auth?mode=login&role=hospital"
                  className="group flex items-center justify-center gap-2 px-8 py-4 bg-white hover:bg-slate-50 text-slate-800 font-semibold rounded-2xl border border-slate-200 shadow-sm transition-all"
                >
                  <Building2 className="w-5 h-5" />
                  Hospital Login
                </Link>
              </div>
              <div className="mt-8 flex items-center gap-6 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-teal-600" />
                  Hash-verified allocations
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary-600" />
                  Real-time matching
                </div>
              </div>
            </motion.div>

            {/* Hero visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
                      <Heart className="w-5 h-5 text-primary-600" fill="currentColor" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">Live Match Feed</p>
                      <p className="text-xs text-slate-400">Apollo Hospital, Mumbai</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-primary-50 text-primary-700 text-xs font-medium rounded-lg">Critical</span>
                </div>
                <div className="space-y-2">
                  {[
                    { name: 'Arun Sharma', blood: 'O-', score: 92.5, top: true },
                    { name: 'Deepika Nair', blood: 'O-', score: 87.2, top: false },
                    { name: 'Neha Gupta', blood: 'O+', score: 81.0, top: false },
                  ].map((d, i) => (
                    <motion.div
                      key={d.name}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.15 }}
                      className={`flex items-center justify-between p-3 rounded-xl ${
                        d.top ? 'bg-primary-50 border border-primary-200' : 'bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                          d.top ? 'bg-primary-500' : 'bg-slate-400'
                        }`}>
                          {d.name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-700">{d.name}</p>
                          <p className="text-xs text-slate-400">{d.blood} · {d.score} score</p>
                        </div>
                      </div>
                      {d.top && (
                        <motion.span
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                          className="px-2 py-1 bg-primary-500 text-white text-xs font-bold rounded-lg"
                        >
                          TOP MATCH
                        </motion.span>
                      )}
                    </motion.div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Score = 0.5×Compat + 0.3×Proximity + 0.2×Reliability</span>
                    <span className="text-teal-600 font-medium">Verified</span>
                  </div>
                </div>
              </div>
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="absolute -top-4 -right-4 bg-teal-500 text-white px-4 py-2 rounded-xl shadow-lg text-sm font-medium"
              >
                Match found in 2.3s
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center p-6 rounded-2xl bg-gradient-to-b from-slate-50 to-white border border-slate-100"
                >
                  <div className={`w-12 h-12 mx-auto mb-3 rounded-xl bg-slate-50 flex items-center justify-center ${stat.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <AnimatedCounter value={stat.value} />
                  <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800">How It Works</h2>
            <p className="mt-3 text-slate-500 max-w-xl mx-auto">Three steps from signup to saving a life. Every allocation is transparent, fair, and verified.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="relative bg-white rounded-2xl p-8 shadow-sm border border-slate-100"
                >
                  <div className="absolute -top-4 left-8 w-12 h-12 bg-primary-600 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-lg">
                    {step.num}
                  </div>
                  <div className="mt-6">
                    <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mb-4">
                      <Icon className="w-7 h-7 text-primary-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">{step.title}</h3>
                    <p className="text-slate-500 leading-relaxed text-sm">{step.desc}</p>
                  </div>
                  {i < steps.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-slate-200" />
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800">Real Impact, Real Stories</h2>
            <p className="mt-3 text-slate-500">From donors and hospitals on the LifeLink network.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-slate-50 rounded-2xl p-6 border border-slate-100"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.role}</p>
                  </div>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed">"{t.quote}"</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-800 text-slate-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
                  <Heart className="w-5 h-5 text-white" fill="white" />
                </div>
                <span className="text-xl font-bold text-white">LifeLink</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                A city-based Blood & Organ Donor Network connecting individuals, donors, and hospitals for emergency allocation.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3 text-sm">Emergency Helpline</h4>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-primary-400" />
                <span>+91-1800-LIFELINK</span>
              </div>
              <div className="flex items-center gap-2 text-sm mt-2">
                <Mail className="w-4 h-4 text-primary-400" />
                <span>emergency@lifelink.demo</span>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3 text-sm">City Coverage</h4>
              <ul className="space-y-1 text-sm text-slate-400">
                <li>Mumbai</li>
                <li>Delhi</li>
                <li>Bengaluru</li>
                <li>Chennai</li>
                <li>+ 24 more cities</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3 text-sm">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/auth" className="hover:text-white transition-colors">Register as Donor</Link></li>
                <li><Link to="/auth" className="hover:text-white transition-colors">Hospital Login</Link></li>
                <li><Link to="/transparency" className="hover:text-white transition-colors">Transparency Log</Link></li>
                <li><Link to="/reports" className="hover:text-white transition-colors">Reports</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-slate-700 text-center text-sm text-slate-500">
            © 2026 LifeLink. Connecting life, one match at a time.
          </div>
        </div>
      </footer>
    </div>
  );
}
