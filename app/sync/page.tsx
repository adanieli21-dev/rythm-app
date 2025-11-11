'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import {
  getActiveSystems,
  getWeekDates,
  getLogsForDate,
  getTodayString,
  saveWeeklySync,
  type LogStatus,
  type System,
} from '@/lib/systems-db';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, CheckCircle2, Zap, XCircle, TrendingUp, Lightbulb, Target, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface WeekData {
  [systemId: string]: LogStatus[];
}

interface SyncData {
  weekEnding: string;
  win: string;
  patterns: string;
  hardDays: string;
  adjustSystem: string;
  adjustDescription: string;
  intention: string;
  timestamp: string;
}

function getStatusIcon(status: LogStatus) {
  if (status === 'done') return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
  if (status === 'survival') return <Zap className="h-5 w-5 text-amber-600" />;
  if (status === 'skip') return <XCircle className="h-5 w-5 text-gray-500" />;
  return <div className="h-5 w-5 rounded border-2 border-slate-200" />;
}

function calculateCompletion(statuses: LogStatus[]): number {
  const tracked = statuses.filter(s => s !== null).length;
  return tracked === 0 ? 0 : Math.round((tracked / statuses.length) * 100);
}

function analyzePattern(statuses: LogStatus[], systemName: string): string | null {
  const dayPatterns: { [key: number]: number } = {};

  statuses.forEach((status, index) => {
    if (status === 'skip' || status === null) {
      dayPatterns[index] = (dayPatterns[index] || 0) + 1;
    }
  });

  const mostSkippedDay = Object.entries(dayPatterns)
    .sort(([, a], [, b]) => b - a)[0];

  if (mostSkippedDay && mostSkippedDay[1] >= 1) {
    return `You often skip ${WEEKDAYS[parseInt(mostSkippedDay[0])]}s`;
  }

  const completionRate = calculateCompletion(statuses);
  if (completionRate === 100) {
    return '🎉 Perfect week!';
  } else if (completionRate >= 80) {
    return '💪 Strong consistency';
  } else if (completionRate >= 50) {
    return '📈 Building momentum';
  } else if (completionRate > 0) {
    return '🌱 Starting small';
  }

  return null;
}


export default function SyncPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [systems, setSystems] = useState<System[]>([]);
  const [weekData, setWeekData] = useState<WeekData>({});
  const [weekDates, setWeekDates] = useState<string[]>([]);
  const [step, setStep] = useState<'review' | 'reflect' | 'adjust' | 'complete'>('review');

  const [win, setWin] = useState('');
  const [patterns, setPatterns] = useState('');
  const [hardDays, setHardDays] = useState('');
  const [adjustSystem, setAdjustSystem] = useState('');
  const [adjustDescription, setAdjustDescription] = useState('');
  const [intention, setIntention] = useState('');

  useEffect(() => {
    setMounted(true);
    loadSyncData();
  }, [router]);

  const loadSyncData = async () => {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      router.push('/login');
      return;
    }

    const activeSystems = await getActiveSystems();
    setSystems(activeSystems);

    const today = getTodayString();
    const dates = getWeekDates(today);
    setWeekDates(dates);

    const data: WeekData = {};
    for (const system of activeSystems) {
      data[system.id] = [];
      for (const date of dates) {
        const logs = await getLogsForDate(date);
        data[system.id].push(logs[system.id] || null);
      }
    }
    setWeekData(data);
  };

  const handleCompleteSync = async () => {
    try {
      await saveWeeklySync({
        weekEnding: weekDates[weekDates.length - 1],
        win,
        patterns,
        hardDays,
        adjustSystem,
        adjustDescription,
        intention,
      });
      setStep('complete');
    } catch (error) {
      console.error('Error saving sync:', error);
    }
  };

  const canComplete = win.trim() && patterns.trim() && adjustSystem;

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        <header className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/dashboard')}
            className="text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Weekly Sync</h1>
            <p className="text-sm text-slate-600">Review, reflect, and adjust</p>
          </div>
        </header>

        {step === 'complete' ? (
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-12 text-center space-y-4">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Check className="h-8 w-8 text-emerald-600" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Sync Complete!</h2>
                <p className="text-slate-600 max-w-md mx-auto">
                  Your reflection has been saved. Keep building momentum with your systems.
                </p>
              </div>
              <div className="pt-4">
                <Button
                  onClick={() => router.push('/dashboard')}
                  className="bg-[#106981] hover:bg-[#0d5468] text-white h-12 px-8"
                >
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex gap-2 mb-6">
              <Button
                variant={step === 'review' ? 'default' : 'outline'}
                onClick={() => setStep('review')}
                className={step === 'review' ? 'bg-[#106981] hover:bg-[#0d5468]' : ''}
              >
                Review
              </Button>
              <Button
                variant={step === 'reflect' ? 'default' : 'outline'}
                onClick={() => setStep('reflect')}
                className={step === 'reflect' ? 'bg-[#106981] hover:bg-[#0d5468]' : ''}
              >
                Reflect
              </Button>
              <Button
                variant={step === 'adjust' ? 'default' : 'outline'}
                onClick={() => setStep('adjust')}
                className={step === 'adjust' ? 'bg-[#106981] hover:bg-[#0d5468]' : ''}
              >
                Adjust
              </Button>
            </div>

            {step === 'review' && (
              <div className="space-y-6">
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-[#106981]" />
                      <CardTitle>Week at a Glance</CardTitle>
                    </div>
                    <CardDescription>Your activity patterns this week</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <div className="min-w-[600px]">
                        <div className="grid grid-cols-8 gap-2 mb-4">
                          <div className="font-medium text-sm text-slate-600"></div>
                          {WEEKDAYS.map(day => (
                            <div key={day} className="text-center font-medium text-sm text-slate-600">
                              {day}
                            </div>
                          ))}
                        </div>

                        {systems.map(system => {
                          const statuses = weekData[system.id] || [];
                          const completion = calculateCompletion(statuses);
                          const pattern = analyzePattern(statuses, system.name);

                          return (
                            <div key={system.id} className="mb-4">
                              <div className="grid grid-cols-8 gap-2 items-center">
                                <div className="text-sm font-medium text-slate-900 pr-2">
                                  {system.name}
                                </div>
                                {statuses.map((status, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center justify-center p-3 bg-slate-50 rounded-lg border border-slate-200"
                                  >
                                    {getStatusIcon(status)}
                                  </div>
                                ))}
                              </div>
                              <div className="mt-2 flex items-center justify-between text-xs text-slate-600 ml-2">
                                <span className="font-medium">
                                  {completion}% tracked
                                </span>
                                {pattern && (
                                  <span className="text-[#106981] font-medium">{pattern}</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end">
                  <Button
                    onClick={() => setStep('reflect')}
                    className="bg-[#106981] hover:bg-[#0d5468] text-white"
                  >
                    Continue to Reflect
                  </Button>
                </div>
              </div>
            )}

            {step === 'reflect' && (
              <div className="space-y-6">
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-[#106981]" />
                      <CardTitle>Reflect on Your Week</CardTitle>
                    </div>
                    <CardDescription>Take a moment to process how things went</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="win" className="text-base font-medium text-slate-900">
                        What was a win this week?
                      </Label>
                      <Textarea
                        id="win"
                        placeholder="Even small wins matter..."
                        value={win}
                        onChange={(e) => setWin(e.target.value)}
                        className="min-h-[100px] border-slate-300 focus:border-[#106981] focus:ring-[#106981]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="patterns" className="text-base font-medium text-slate-900">
                        What patterns emerged?
                      </Label>
                      <Textarea
                        id="patterns"
                        placeholder="Notice any recurring themes or behaviors..."
                        value={patterns}
                        onChange={(e) => setPatterns(e.target.value)}
                        className="min-h-[100px] border-slate-300 focus:border-[#106981] focus:ring-[#106981]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="hardDays" className="text-base font-medium text-slate-900">
                        What made hard days hard?
                      </Label>
                      <Textarea
                        id="hardDays"
                        placeholder="Understanding obstacles helps us adapt..."
                        value={hardDays}
                        onChange={(e) => setHardDays(e.target.value)}
                        className="min-h-[100px] border-slate-300 focus:border-[#106981] focus:ring-[#106981]"
                      />
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep('review')}
                  >
                    Back
                  </Button>
                  <Button
                    onClick={() => setStep('adjust')}
                    className="bg-[#106981] hover:bg-[#0d5468] text-white"
                  >
                    Continue to Adjust
                  </Button>
                </div>
              </div>
            )}

            {step === 'adjust' && (
              <div className="space-y-6">
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-[#106981]" />
                      <CardTitle>Adjust & Plan Ahead</CardTitle>
                    </div>
                    <CardDescription>Fine-tune your systems for next week</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="system" className="text-base font-medium text-slate-900">
                        Which system needs adjustment?
                      </Label>
                      <Select value={adjustSystem} onValueChange={setAdjustSystem}>
                        <SelectTrigger className="border-slate-300 focus:border-[#106981] focus:ring-[#106981]">
                          <SelectValue placeholder="Select a system..." />
                        </SelectTrigger>
                        <SelectContent>
                          {systems.map(system => (
                            <SelectItem key={system.id} value={system.id}>
                              {system.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-base font-medium text-slate-900">
                        Describe the change
                      </Label>
                      <Textarea
                        id="description"
                        placeholder="What specifically will you adjust and why?"
                        value={adjustDescription}
                        onChange={(e) => setAdjustDescription(e.target.value)}
                        className="min-h-[100px] border-slate-300 focus:border-[#106981] focus:ring-[#106981]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="intention" className="text-base font-medium text-slate-900">
                        Set next week's intention
                      </Label>
                      <Input
                        id="intention"
                        placeholder="One clear focus for the week ahead..."
                        value={intention}
                        onChange={(e) => setIntention(e.target.value)}
                        className="border-slate-300 focus:border-[#106981] focus:ring-[#106981]"
                      />
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep('reflect')}
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleCompleteSync}
                    disabled={!canComplete}
                    className={`text-white ${
                      canComplete
                        ? 'bg-[#106981] hover:bg-[#0d5468]'
                        : 'bg-slate-400 cursor-not-allowed'
                    }`}
                  >
                    Complete Sync
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
