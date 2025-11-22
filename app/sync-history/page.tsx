'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { getWeeklySyncs } from '@/lib/systems-db';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Calendar, TrendingUp, Target, Lightbulb } from 'lucide-react';

interface WeeklySyncData {
  id: string;
  week_start: string;
  win: string;
  pattern: string;
  hard_days: string;
  adjusted_system_id: string | null;
  adjustment_note: string | null;
  intention: string;
  created_at: string;
}

export default function SyncHistoryPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncs, setSyncs] = useState<WeeklySyncData[]>([]);

  useEffect(() => {
    setMounted(true);
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      router.push('/login');
      return;
    }

    const data = await getWeeklySyncs();
    setSyncs(data);
    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-slate-600">Loading history...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        <header className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/sync')}
            className="text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Weekly Sync History</h1>
            <p className="text-sm text-slate-600">Review your past reflections</p>
          </div>
        </header>

        {syncs.length === 0 ? (
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-12 text-center">
              <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 mb-4">No weekly syncs yet</p>
              <Button
                onClick={() => router.push('/sync')}
                className="bg-[#106981] hover:bg-[#0d5468] text-white"
              >
                Complete Your First Sync
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {syncs.map((sync) => (
              <Card key={sync.id} className="border-slate-200 shadow-sm">
                <CardHeader className="bg-slate-50 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-[#106981]" />
                      <CardTitle className="text-lg">Week of {formatDate(sync.week_start)}</CardTitle>
                    </div>
                    <span className="text-xs text-slate-500">
                      Completed {new Date(sync.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {/* Win */}
                  {sync.win && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-emerald-600" />
                        <h3 className="font-semibold text-slate-900">Win</h3>
                      </div>
                      <p className="text-slate-700 pl-6">{sync.win}</p>
                    </div>
                  )}

                  {/* Pattern */}
                  {sync.pattern && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="h-4 w-4 text-amber-600" />
                        <h3 className="font-semibold text-slate-900">Pattern Noticed</h3>
                      </div>
                      <p className="text-slate-700 pl-6">{sync.pattern}</p>
                    </div>
                  )}

                  {/* Hard Days */}
                  {sync.hard_days && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-slate-600">💪</span>
                        <h3 className="font-semibold text-slate-900">What Made Days Hard</h3>
                      </div>
                      <p className="text-slate-700 pl-6">{sync.hard_days}</p>
                    </div>
                  )}

                  {/* Adjustment */}
                  {sync.adjustment_note && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-slate-600">🔧</span>
                        <h3 className="font-semibold text-slate-900">System Adjustment</h3>
                      </div>
                      <p className="text-slate-700 pl-6">{sync.adjustment_note}</p>
                    </div>
                  )}

                  {/* Intention */}
                  {sync.intention && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-4 w-4 text-blue-600" />
                        <h3 className="font-semibold text-slate-900">Intention</h3>
                      </div>
                      <p className="text-slate-700 pl-6">{sync.intention}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="flex justify-center pt-4">
          <Button
            onClick={() => router.push('/dashboard')}
            variant="outline"
            className="border-slate-300"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}