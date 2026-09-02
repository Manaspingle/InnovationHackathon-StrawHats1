import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { Heart, Users, Building2, MapPin, ArrowRight, ShieldCheck, Zap, Award, Phone, Mail, Activity, Droplet, CheckCircle2, Lightbulb } from 'lucide-react';
import { LANDING_STATS, TESTIMONIALS } from '@/lib/mockData';

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
    <span ref={ref} className="text-5xl md:text-6xl font-bold text-primary-600">
      {count.toLocaleString()}{suffix}
    </span>
  );
}

const statsList = [
  { label: 'Lives Saved', value: LANDING_STATS.lives_saved, icon: Heart, color: 'from-primary-500 to-primary-600', textColor: 'text-primary-600' },
  { label: 'Active Donors', value: LANDING_STATS.active_donors, icon: Users, color: 'from-teal-500 to-teal-600', textColor: 'text-teal-600' },
  { label: 'Hospitals Connected', value: LANDING_STATS.hospitals_connected, icon: Building2, color: 'from-blue-500 to-blue-600', textColor: 'text-blue-600' },
  { label: 'Cities Covered', value: LANDING_STATS.cities_covered, icon: MapPin, color: 'from-purple-500 to-purple-600', textColor: 'text-purple-600' },
];

const stepsList = [
  {
    num: '01',
    title: 'Register Your Profile',
    desc: 'Sign up as a donor or hospital. Pledge organs, log blood donations, and join your city\'s network.',
    icon: Users,
    color: 'from-primary-500 to-primary-600',
  },
  {
    num: '02',
    title: 'Get Matched Instantly',
    desc: 'When a hospital needs help, our AI algorithm scores every eligible donor by compatibility, proximity, and reliability in real time.',
    icon: Zap,
    color: 'from-teal-500 to-teal-600',
  },
  {
    num: '03',
    title: 'Save a Life',
    desc: 'Accept alerts, confirm availability, and track the entire logistics journey with full transparency and live updates.',
    icon: Heart,
    color: 'from-teal-400 to-teal-500',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-primary-900 py-20 md:py-32">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-3 px-4 py-2 bg-primary-500/20 text-primary-100 rounded-full text-sm font-semibold mb-8 backdrop-blur-sm border border-primary-500/30">
                <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="w-2 h-2 bg-primary-400 rounded-full" />
                🩸 City-based Blood & Organ Donor Network
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.1] mb-6">
                Connecting
                <br />
                <span className="bg-gradient-to-r from-primary-400 via-primary-300 to-primary-200 bg-clip-text text-transparent">
                  Life, One Match
                </span>
                <br />
                <span className="text-white">at a Time</span>
              </h1>

              <p className="text-lg md:text-xl text-gray-200 max-w-lg leading-relaxed mb-8">
                A transparent, priority-based platform linking donors, recipients, and hospitals within city zones. Because every second counts when a life depends on it.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <Link
                  to="/auth?mode=signup&role=individual"
                  className="group flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold rounded-xl shadow-2xl shadow-primary-600/30 transition-all transform hover:scale-105"
                >
                  💉 Register as Donor
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/auth?mode=signup&role=hospital"
                  className="group flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl border-2 border-white/30 transition-all backdrop-blur-sm"
                >
                  🏥 Hospital Access
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              <div className="flex flex-col sm:flex-row gap-6 text-sm">
                <div className="flex items-center gap-3 text-gray-200">
                  <ShieldCheck className="w-6 h-6 text-teal-400 flex-shrink-0" />
                  <span>Transparent & Verified</span>
                </div>
                <div className="flex items-center gap-3 text-gray-200">
                  <Activity className="w-6 h-6 text-green-400 flex-shrink-0" />
                  <span>Real-time Matching</span>
                </div>
              </div>
            </motion.div>

            {/* Right Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl p-8 shadow-2xl border border-slate-600/50 backdrop-blur-sm">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary-500/10 to-transparent pointer-events-none" />
                
                <div className="relative space-y-4">
                  {/* Match Card */}
                  <div className="bg-slate-600/50 backdrop-blur rounded-xl p-4 border border-slate-500/50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-primary-500/30 rounded-lg flex items-center justify-center">
                          <Droplet className="w-5 h-5 text-primary-300" />
                        </div>
                        <div>
                          <p className="font-bold text-white text-sm">Emergency Alert</p>
                          <p className="text-xs text-gray-300">Apollo Hospital, Mumbai</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-primary-500 text-white text-xs font-bold rounded-lg">CRITICAL</span>
                    </div>
                    <div className="space-y-2">
                      {[
                        { name: 'Rajesh Kumar', score: 94.5, top: true },
                        { name: 'Priya Sharma', score: 87.2 },
                        { name: 'Neha Singh', score: 81.0 },
                      ].map((donor, idx) => (
                        <motion.div
                          key={donor.name}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + idx * 0.15 }}
                          className={`flex items-center justify-between p-2 rounded-lg ${
                            donor.top ? 'bg-primary-500/30 border border-primary-400/50' : 'bg-slate-500/30'
                          }`}
                        >
                          <span className="text-sm font-semibold text-white">{donor.name}</span>
                          <span className={`text-sm font-bold ${donor.top ? 'text-primary-300' : 'text-gray-300'}`}>
                            {donor.score}%
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="bg-gradient-to-r from-teal-500 to-green-500 rounded-lg px-4 py-3 text-center"
                  >
                    <p className="text-sm font-bold text-white">✓ Match Found in 2.3 seconds</p>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-3">Real Impact, Real Numbers</h2>
            <p className="text-gray-600 text-lg">LifeLink by the numbers</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {statsList.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="relative group"
                >
                  <div className={`absolute inset-0 bg-gradient-to-r ${stat.color} rounded-2xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity`} />
                  <div className="relative bg-white rounded-2xl p-8 shadow-lg border border-gray-100 group-hover:border-gray-200 transition-all">
                    <div className={`w-14 h-14 mb-6 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <AnimatedCounter value={stat.value} />
                    <p className="text-gray-600 font-semibold mt-2">{stat.label}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">How LifeLink Works</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">From registration to saving lives. Three simple steps powered by AI and transparency.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connection lines */}
            <div className="hidden md:block absolute top-24 left-0 right-0 h-1 bg-gradient-to-r from-primary-200 via-primary-400 to-primary-200" />

            {stepsList.map((step, idx) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.15 }}
                  className="relative"
                >
                  <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 relative z-10">
                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-6 relative`}>
                      <Icon className="w-8 h-8 text-white" />
                      <div className="absolute -top-3 -right-3 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                        {step.num}
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-3">{step.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{step.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Highlight Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">Why Choose LifeLink?</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: ShieldCheck,
                title: 'Hash-Verified Allocations',
                desc: 'Every organ allocation is cryptographically verified to ensure fair, priority-based matching with zero tampering.',
                color: 'text-teal-600',
              },
              {
                icon: Lightbulb,
                title: 'AI-Powered Matching',
                desc: 'Our algorithm scores donors by compatibility, proximity, and reliability — reducing match time from hours to minutes.',
                color: 'text-yellow-600',
              },
              {
                icon: CheckCircle2,
                title: 'Gamification & Engagement',
                desc: 'Donor levels, badges, and leaderboards keep your community engaged and ready to save lives.',
                color: 'text-green-600',
              },
            ].map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100"
                >
                  <Icon className={`w-12 h-12 ${feature.color} mb-4`} />
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">Impact Stories</h2>
            <p className="text-gray-600 text-lg">Hear from donors and hospitals making a difference</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((testimonial, idx) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 shadow-lg border border-gray-100"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-4xl">{testimonial.image}</div>
                  <div>
                    <p className="font-bold text-slate-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                    <p className="text-xs text-gray-500">{testimonial.city}</p>
                  </div>
                </div>
                <p className="text-gray-700 leading-relaxed">"{testimonial.message}"</p>
                <div className="mt-4 flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400">⭐</span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-primary-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">Ready to Save Lives?</h2>
          <p className="text-xl text-primary-100 mb-10">Join thousands of donors and hospitals already making a difference.</p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/auth?mode=signup&role=individual"
              className="group flex items-center justify-center gap-2 px-8 py-4 bg-white text-primary-600 font-bold rounded-xl hover:bg-gray-100 transition-all transform hover:scale-105"
            >
              💉 I Want to Donate
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/auth?mode=signup&role=hospital"
              className="group flex items-center justify-center gap-2 px-8 py-4 bg-primary-700 text-white font-bold rounded-xl hover:bg-primary-800 transition-all border-2 border-white"
            >
              🏥 Hospital Sign Up
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-gray-300 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center">
                  <Heart className="w-6 h-6 text-white" fill="white" />
                </div>
                <div>
                  <p className="font-bold text-white">LifeLink</p>
                  <p className="text-xs text-gray-400">Connecting Lives</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed">
                A city-based blood and organ donor network connecting individuals, hospitals, and donors for emergency allocation.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">Emergency</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary-400" />
                  <span>+91-1800-LIFELINK</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary-400" />
                  <span>emergency@lifelink.demo</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">Cities</h4>
              <ul className="space-y-1 text-sm">
                <li>🔴 Mumbai</li>
                <li>🔴 Delhi</li>
                <li>🔴 Bangalore</li>
                <li>🔴 Hyderabad</li>
                <li>🔴 + 24 More</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/auth" className="hover:text-primary-400 transition-colors">Donor Registration</Link></li>
                <li><Link to="/auth" className="hover:text-primary-400 transition-colors">Hospital Login</Link></li>
                <li><Link to="/" className="hover:text-primary-400 transition-colors">Transparency Log</Link></li>
                <li><Link to="/" className="hover:text-primary-400 transition-colors">Reports</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-700 pt-8 text-center text-sm">
            <p className="text-gray-400">© 2026 LifeLink. Connecting life, one match at a time. 💓</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
