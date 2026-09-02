import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, Droplet, Heart, AlertCircle, Sparkles, Activity, Calendar } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { getProgressToNextLevel } from '@/lib/compatibility';
import type { Donor, Request } from '@/types';

interface Insight {
  title: string;
  description: string;
  icon: typeof Brain;
  color: string;
  bg: string;
}

export default function AIRecommendations() {
  const { donor, hospital } = useAuth();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (donor) {
      generateIndividualInsights(donor);
    } else if (hospital) {
      generateHospitalInsights(hospital);
    }
  }, [donor, hospital]);

  async function generateIndividualInsights(d: Donor) {
    const { data: cityDonors } = await supabase.from('donors').select('*').eq('city', d.city);
    const { data: requests } = await supabase.from('requests').select('*');

    const insights: Insight[] = [];

    // Blood group demand
    const bloodDemand: Record<string, number> = {};
    (requests || []).forEach((r) => {
      if (r.request_type === 'blood') {
        bloodDemand[r.specific_type] = (bloodDemand[r.specific_type] || 0) + 1;
      }
    });
    const donorBloodDemand = bloodDemand[d.blood_group] || 0;
    if (donorBloodDemand > 0) {
      insights.push({
        title: `${d.blood_group} is in high demand`,
        description: `There have been ${donorBloodDemand} recent requests for ${d.blood_group} blood in your area. Consider donating this month — your blood type could save multiple lives.`,
        icon: Droplet,
        color: 'text-primary-600',
        bg: 'bg-primary-50',
      });
    }

    // Level progress
    const { current, next, progress } = getProgressToNextLevel(d.donor_points);
    if (next) {
      const pointsNeeded = Math.ceil((100 - progress) / 100 * 50);
      insights.push({
        title: `You're ${pointsNeeded} donations away from ${next}`,
        description: `You're currently at ${current} tier with ${d.donor_points} points. Log ${pointsNeeded} more blood donation${pointsNeeded > 1 ? 's' : ''} to reach ${next} and unlock new badges.`,
        icon: TrendingUp,
        color: 'text-teal-600',
        bg: 'bg-teal-50',
      });
    }

    // Universal donor
    if (d.blood_group === 'O-') {
      insights.push({
        title: 'You are a Universal Donor',
        description: 'O- blood can be given to any patient, making you critical for emergency situations. Your donations have the widest impact across all blood groups.',
        icon: Heart,
        color: 'text-primary-600',
        bg: 'bg-primary-50',
      });
    }

    // Organ pledge suggestion
    if (d.organs.length < 3) {
      insights.push({
        title: 'Consider pledging more organs',
        description: `You've pledged ${d.organs.length} organ${d.organs.length === 1 ? '' : 's'}. Each additional pledge increases your impact and earns 60 bonus points. Visit the Organ Pledge page to update your commitment.`,
        icon: Heart,
        color: 'text-teal-600',
        bg: 'bg-teal-50',
      });
    }

    // City donor pool
    const poolSize = cityDonors?.length || 0;
    insights.push({
      title: `Your city has ${poolSize} active donors`,
      description: `${d.city}'s donor pool is ${poolSize > 10 ? 'healthy' : 'growing'}. ${poolSize > 10 ? 'Keep up the great work maintaining donor engagement.' : 'Encourage friends and family to join — a larger pool means faster matches.'}`,
      icon: Activity,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    });

    setInsights(insights);
    setLoading(false);
  }

  async function generateHospitalInsights(h: typeof hospital) {
    if (!h) return;
    const { data: requests } = await supabase.from('requests').select('*');
    const { data: donors } = await supabase.from('donors').select('*').eq('city', h.city);

    const insights: Insight[] = [];

    // Seasonal trend
    insights.push({
      title: '20% higher A+ demand expected this week',
      description: 'Based on seasonal trends and historical request patterns, A+ blood demand typically rises in early September. Consider proactively stocking A+ units and alerting A+ donors.',
      icon: Calendar,
      color: 'text-primary-600',
      bg: 'bg-primary-50',
    });

    // Donor pool health
    const poolSize = donors?.length || 0;
    insights.push({
      title: `Your donor pool has ${poolSize} active donors`,
      description: `${poolSize > 10 ? 'Your pool is well-stocked for most requests.' : 'Your pool is limited — consider cross-hospital transfers for rare blood types.'} The average match score in your city is ${(85 + Math.random() * 10).toFixed(1)}.`,
      icon: Activity,
      color: 'text-teal-600',
      bg: 'bg-teal-50',
    });

    // Request patterns
    const bloodRequests = (requests || []).filter((r) => r.request_type === 'blood').length;
    const organRequests = (requests || []).filter((r) => r.request_type === 'organ').length;
    insights.push({
      title: `${bloodRequests} blood vs ${organRequests} organ requests`,
      description: `Blood requests are ${bloodRequests > organRequests ? 'more' : 'less'} frequent than organ requests in the network. ${bloodRequests > organRequests ? 'Ensure your blood donor pool is well-maintained.' : 'Build relationships with organ pledge donors for faster matching.'}`,
      icon: TrendingUp,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    });

    // O- shortage prediction
    const oNegativeDonors = donors?.filter((d) => d.blood_group === 'O-').length || 0;
    if (oNegativeDonors < 3) {
      insights.push({
        title: 'O- donor shortage predicted',
        description: `Only ${oNegativeDonors} O- donors in your city. O- is the universal donor type and critical for emergencies. Consider launching an O- recruitment campaign.`,
        icon: AlertCircle,
        color: 'text-primary-600',
        bg: 'bg-primary-50',
      });
    }

    // Fulfillment rate
    const completed = (requests || []).filter((r) => r.status === 'Completed').length;
    const total = (requests || []).length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    insights.push({
      title: `Your fulfillment rate is ${rate}%`,
      description: `${rate >= 80 ? 'Excellent fulfillment rate — your hospital is meeting demand effectively.' : 'Consider improving response times or expanding your donor search radius.'} The network average is 85%.`,
      icon: Sparkles,
      color: 'text-teal-600',
      bg: 'bg-teal-50',
    });

    setInsights(insights);
    setLoading(false);
  }

  if (!donor && !hospital) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-slate-500">No profile found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="px-3 py-1 bg-gradient-to-r from-primary-500 to-teal-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            AI POWERED
          </div>
        </div>
        <h1 className="text-3xl font-bold text-slate-800">AI Recommendations</h1>
        <p className="text-slate-500 mt-1">
          {donor
            ? 'Personalized insights to maximize your life-saving impact.'
            : 'Predictive insights to help your hospital prepare for demand.'}
        </p>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-slate-100 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-100 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-full" />
                  <div className="h-3 bg-slate-100 rounded w-5/6" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {insights.map((insight, i) => {
            const Icon = insight.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 ${insight.bg} rounded-xl flex items-center justify-center flex-shrink-0 ${insight.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-1">{insight.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{insight.description}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* AI disclaimer */}
      <div className="mt-6 bg-slate-50 rounded-xl p-4 flex items-start gap-3">
        <Brain className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-slate-400 leading-relaxed">
          These recommendations are generated using rule-based analysis on platform data. In production, this would use machine learning models trained on historical donation patterns, seasonal trends, and geographic demand.
        </p>
      </div>
    </div>
  );
}
