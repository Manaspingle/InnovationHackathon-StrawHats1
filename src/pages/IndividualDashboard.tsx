import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Droplet, Heart, Trophy, Award, Star, Crown, Globe, Shield, Zap,
  TrendingUp, Bell, Info, Activity, MapPin, Phone, Plus, Medal
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { getProgressToNextLevel, getDonorLevel } from '@/lib/compatibility';
import { BADGES, LEVEL_COLORS } from '@/lib/constants';
import type { Donor, Notification } from '@/types';

const iconMap: Record<string, typeof Heart> = {
  Heart, Droplet, Globe, Shield, Award, Crown, Trophy, Star,
};

export default function IndividualDashboard() {
  const { donor, session, refreshProfile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [leaderboard, setLeaderboard] = useState<Donor[]>([]);
  const [tab, setTab] = useState<'overview' | 'leaderboard' | 'notifications'>('overview');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!donor) return;
    supabase
      .from('notifications')
      .select('*')
      .eq('donor_id', donor.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setNotifications(data as Notification[]);
      });

    supabase
      .from('donors')
      .select('*')
      .eq('city', donor.city)
      .order('donor_points', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (data) setLeaderboard(data as Donor[]);
      });
  }, [donor]);

  if (!donor) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 mb-4">No donor profile found for your account.</p>
          <p className="text-sm text-slate-400">If you just signed up, your profile may still be loading. Try refreshing the page.</p>
        </div>
      </div>
    );
  }

  const { current, next, progress } = getProgressToNextLevel(donor.donor_points);

  // Determine earned badges
  const earnedBadges = new Set<string>();
  if (donor.organs.length > 0) earnedBadges.add('first_pledge');
  if (donor.blood_donations >= 3) earnedBadges.add('blood_hero_3');
  if (donor.blood_group === 'O-') earnedBadges.add('universal_donor');
  if (notifications.some((n) => n.type === 'match')) earnedBadges.add('lifesaver');
  if (donor.donor_level === 'Gold' || donor.donor_level === 'Platinum Lifesaver') earnedBadges.add('gold_tier');
  if (donor.donor_level === 'Platinum Lifesaver') earnedBadges.add('platinum');
  if (donor.organs.length >= 3) earnedBadges.add('committed');
  const rank = leaderboard.findIndex((d) => d.id === donor.id);
  if (rank >= 0 && rank < 3) earnedBadges.add('city_champion');

  async function toggleAvailability() {
    if (!donor) return;
    setUpdating(true);
    await supabase.from('donors').update({ available: !donor.available }).eq('id', donor.id);
    await refreshProfile();
    setUpdating(false);
  }

  async function logBloodDonation() {
    if (!donor) return;
    setUpdating(true);
    const newPoints = donor.donor_points + 30;
    const newLevel = getDonorLevel(newPoints);
    await supabase.from('donors').update({
      donor_points: newPoints,
      blood_donations: donor.blood_donations + 1,
      donor_level: newLevel,
    }).eq('id', donor.id);
    await supabase.from('donations').insert({
      donor_id: donor.id,
      donation_type: 'blood',
      donation_date: new Date().toISOString().split('T')[0],
      points_earned: 30,
    });
    await refreshProfile();
    setUpdating(false);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Welcome back, {donor.full_name.split(' ')[0]}</h1>
        <p className="text-slate-500 mt-1">Your donor dashboard — track your impact and stay ready to save lives.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 p-1 bg-white rounded-xl border border-slate-200 w-fit">
        {[
          { key: 'overview', label: 'Overview', icon: Activity },
          { key: 'leaderboard', label: 'Leaderboard', icon: Trophy },
          { key: 'notifications', label: 'Notifications', icon: Bell },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key as typeof tab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.key ? 'bg-primary-50 text-primary-700' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'overview' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid lg:grid-cols-3 gap-6"
        >
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
                  {donor.full_name[0]}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">{donor.full_name}</h3>
                  <p className="text-sm text-slate-400">{donor.email}</p>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between py-2 border-b border-slate-50">
                  <span className="text-slate-500">Blood Group</span>
                  <span className="font-semibold text-slate-800 bg-primary-50 px-3 py-1 rounded-lg">{donor.blood_group}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-50">
                  <span className="text-slate-500">City</span>
                  <span className="font-medium text-slate-700 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />{donor.city}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-50">
                  <span className="text-slate-500">Pledged Organs</span>
                  <span className="font-medium text-slate-700">{donor.organs.length > 0 ? donor.organs.join(', ') : 'None yet'}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-50">
                  <span className="text-slate-500">Blood Donations</span>
                  <span className="font-medium text-slate-700">{donor.blood_donations}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-50">
                  <span className="text-slate-500">Phone</span>
                  <span className="font-medium text-slate-700 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />{donor.phone}
                  </span>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">Availability Status</span>
                <button
                  onClick={toggleAvailability}
                  disabled={updating}
                  className={`relative w-14 h-7 rounded-full transition-colors ${donor.available ? 'bg-teal-500' : 'bg-slate-300'}`}
                >
                  <motion.span
                    animate={{ x: donor.available ? 28 : 2 }}
                    className="absolute top-1 w-5 h-5 bg-white rounded-full shadow"
                  />
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {donor.available ? 'Available for emergency contact' : 'Not available for emergency contact'}
              </p>
            </div>

            {/* Quick actions */}
            <div className="mt-4 space-y-3">
              <Link
                to="/organ-pledge"
                className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-primary-200 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
                    <Heart className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800 text-sm">Pledge Organs</p>
                    <p className="text-xs text-slate-400">Update your organ donation pledge</p>
                  </div>
                </div>
                <Plus className="w-5 h-5 text-slate-400" />
              </Link>
              <button
                onClick={logBloodDonation}
                disabled={updating}
                className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-teal-200 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
                    <Droplet className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800 text-sm">Log Blood Donation</p>
                    <p className="text-xs text-slate-400">+30 points per donation</p>
                  </div>
                </div>
                <Plus className="w-5 h-5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Gamification */}
          <div className="lg:col-span-2 space-y-6">
            {/* Donor Level */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800 text-lg">Donor Level</h3>
                <span
                  className="px-3 py-1 rounded-lg text-sm font-bold text-white"
                  style={{ backgroundColor: LEVEL_COLORS[donor.donor_level] }}
                >
                  {donor.donor_level}
                </span>
              </div>
              <div className="flex items-center gap-4 mb-4">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-white"
                  style={{ backgroundColor: LEVEL_COLORS[donor.donor_level] }}
                >
                  <Medal className="w-8 h-8" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-500">{donor.donor_points} points</span>
                    <span className="text-slate-400">
                      {next ? `${next} at ${getDonorLevel(donor.donor_points) === 'Platinum Lifesaver' ? '∞' : ''}` : 'Max level'}
                    </span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: LEVEL_COLORS[donor.donor_level] }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {next ? `${Math.round(progress)}% to ${next}` : 'You\'ve reached the highest level!'}
                  </p>
                </div>
              </div>
            </div>

            {/* Why gamification? */}
            <div className="bg-gradient-to-r from-primary-50 to-teal-50 rounded-2xl border border-primary-100 p-5 flex gap-4">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                <Info className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 text-sm mb-1">Why gamification?</h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Donor drop-off is the biggest challenge in organ and blood donation. Levels, badges, and leaderboards keep donors engaged and coming back — this is the retention engine that keeps the donor pool alive.
                </p>
              </div>
            </div>

            {/* Badges */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="font-bold text-slate-800 text-lg mb-4">Badges</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {BADGES.map((badge) => {
                  const Icon = iconMap[badge.icon] || Award;
                  const earned = earnedBadges.has(badge.id);
                  return (
                    <div
                      key={badge.id}
                      className={`text-center p-4 rounded-xl border transition-all ${
                        earned
                          ? 'bg-gradient-to-b from-amber-50 to-white border-amber-200'
                          : 'bg-slate-50 border-slate-100 opacity-50'
                      }`}
                    >
                      <div className={`w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-2 ${
                        earned ? 'bg-amber-100' : 'bg-slate-200'
                      }`}>
                        <Icon className={`w-6 h-6 ${earned ? 'text-amber-600' : 'text-slate-400'}`} />
                      </div>
                      <p className={`text-xs font-medium ${earned ? 'text-slate-700' : 'text-slate-400'}`}>{badge.name}</p>
                      <p className={`text-[10px] mt-0.5 ${earned ? 'text-slate-500' : 'text-slate-400'}`}>{badge.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Impact Stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Points Earned', value: donor.donor_points, icon: Zap, color: 'text-primary-600' },
                { label: 'Blood Donations', value: donor.blood_donations, icon: Droplet, color: 'text-teal-600' },
                { label: 'Organs Pledged', value: donor.organs.length, icon: Heart, color: 'text-primary-600' },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-center">
                    <div className={`w-10 h-10 mx-auto mb-2 rounded-xl bg-slate-50 flex items-center justify-center ${stat.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                    <p className="text-xs text-slate-400 mt-1">{stat.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {tab === 'leaderboard' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-slate-800 text-lg">City Leaderboard — {donor.city}</h3>
              </div>
              <p className="text-sm text-slate-400 mt-1">Top donors in your city, ranked by total points</p>
            </div>
            <div className="divide-y divide-slate-50">
              {leaderboard.map((d, i) => {
                const isYou = d.id === donor.id;
                return (
                  <motion.div
                    key={d.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`flex items-center gap-4 p-4 ${isYou ? 'bg-primary-50' : 'hover:bg-slate-50'}`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                      i === 0 ? 'bg-amber-100 text-amber-700' :
                      i === 1 ? 'bg-slate-200 text-slate-600' :
                      i === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-slate-50 text-slate-500'
                    }`}>
                      {i + 1}
                    </div>
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {d.full_name[0]}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-800 text-sm">
                        {isYou ? 'You' : d.full_name}
                        {isYou && <span className="ml-2 text-xs text-primary-600 font-medium">(You)</span>}
                      </p>
                      <p className="text-xs text-slate-400">{d.blood_group} · {d.blood_donations} donations</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-800">{d.donor_points}</p>
                      <p className="text-xs text-slate-400" style={{ color: LEVEL_COLORS[d.donor_level] }}>{d.donor_level}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {tab === 'notifications' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary-600" />
                <h3 className="font-bold text-slate-800 text-lg">Notification Feed</h3>
              </div>
              <p className="text-sm text-slate-400 mt-1">Match alerts, badge unlocks, and updates</p>
            </div>
            <div className="divide-y divide-slate-50">
              {notifications.length === 0 ? (
                <div className="p-12 text-center">
                  <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-400">No notifications yet</p>
                  <p className="text-xs text-slate-400 mt-1">You'll be notified when you're matched for a request</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className="flex items-start gap-3 p-4 hover:bg-slate-50">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      n.type === 'match' ? 'bg-teal-50' : n.type === 'badge' ? 'bg-amber-50' : 'bg-slate-50'
                    }`}>
                      {n.type === 'match' ? <Shield className="w-5 h-5 text-teal-600" /> :
                       n.type === 'badge' ? <Award className="w-5 h-5 text-amber-600" /> :
                       <Bell className="w-5 h-5 text-slate-500" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-700">{n.message}</p>
                      <p className="text-xs text-slate-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
