'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import {
  getActiveSystems,
  getLogsForDate,
  saveDailyLog,
  getWeekDates,
  calculateStreak,
  getPreviousDate,
  getNextDate,
  isToday,
  getCurrentDate,
  setCurrentDate,
  getTodayString,
  getSurvivalMode,
  type LogStatus,
  type System,
} from '@/lib/systems-db';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ChevronLeft, ChevronRight, CheckCircle2, Zap, XCircle, Flame, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getStatusDotColor(status: LogStatus): string {
  if (status === 'done') return 'bg-emerald-500';
  if (status === 'survival') return 'bg-amber-500';
  if (status === 'skip') return 'bg-gray-400';
  return 'bg-slate-200';
}

function formatDateDisplay(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date(getTodayString());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (dateString === getTodayString()) {
    return 'Today';
  } else if (dateString === yesterday.toISOString().split('T')[0]) {
    return 'Yesterday';
  }

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatFullDateDisplay(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function WeekCalendar({ currentDate, systems, logs }: { currentDate: string; systems: System[]; logs: Record<string, Record<string, LogStatus>> }) {
  const weekDates = getWeekDates(currentDate);

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {weekDates.map((date, index) => {
        const dayLogs = logs[date] || {};
        const hasAnyLog = systems.some(sys => dayLogs[sys.id]);
        const isCurrent = date === currentDate;
        const today = getTodayString();

        return (
          <div
            key={date}
            className={`flex flex-col items-center gap-2 p-2 rounded-lg transition-all ${
              isCurrent
                ? 'bg-[#106981] text-white shadow-md'
                : 'bg-white text-slate-900 border border-slate-200'
            } ${date > today ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span className={`text-xs font-medium ${isCurrent ? 'text-white/80' : 'text-slate-600'}`}>
              {WEEKDAYS[index]}
            </span>
            <span className={`text-sm font-semibold ${isCurrent ? 'text-white' : 'text-slate-900'}`}>
              {new Date(date).getDate()}
            </span>
            {hasAnyLog && (
              <div className="flex gap-1">
                {systems.map(sys => (
                  <div
                    key={sys.id}
                    className={`h-1.5 w-1.5 rounded-full ${getStatusDotColor(dayLogs[sys.id])}`}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function TrackerPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [systems, setSystems] = useState<System[]>([]);
  const [currentDate, setCurrentDateState] = useState('');
  const [logs, setLogs] = useState<Record<string, LogStatus>>({});
  const [weekLogs, setWeekLogs] = useState<Record<string, Record<string, LogStatus>>>({});
  const [streaks, setStreaks] = useState<Record<string, number>>({});
  const [survivalMode, setSurvivalMode] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadTrackerData();
  }, [router]);

  const loadTrackerData = async () => {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      router.push('/login');
      return;
    }

    const [activeSystems, date, survival] = await Promise.all([
      getActiveSystems(),
      getCurrentDate(),
      getSurvivalMode(),
    ]);

    setSystems(activeSystems);
    setCurrentDateState(date);
    setSurvivalMode(survival);

    const logsData = await getLogsForDate(date);
    setLogs(logsData);
    await updateStreaks(date, activeSystems);

    const weekDates = getWeekDates(date);
    const weekLogsData: Record<string, Record<string, LogStatus>> = {};
    for (const weekDate of weekDates) {
      weekLogsData[weekDate] = await getLogsForDate(weekDate);
    }
    setWeekLogs(weekLogsData);
  };

  const updateStreaks = async (date: string, systemsList: System[]) => {
    const newStreaks: Record<string, number> = {};
    for (const system of systemsList) {
      newStreaks[system.id] = await calculateStreak(system.id, date);
    }
    setStreaks(newStreaks);
  };

  const handleStatusChange = async (systemId: string, status: LogStatus) => {
    try {
      await saveDailyLog(systemId, status);
      const newLogs = await getLogsForDate(currentDate);
      setLogs(newLogs);
      await updateStreaks(currentDate, systems);
    } catch (error) {
      console.error('Error saving log:', error);
    }
  };

  const handlePreviousDate = async () => {
    const prevDate = getPreviousDate(currentDate);
    setCurrentDateState(prevDate);
    await setCurrentDate(prevDate);
    const logsData = await getLogsForDate(prevDate);
    setLogs(logsData);
    await updateStreaks(prevDate, systems);
  };

  const handleNextDate = async () => {
    const today = getTodayString();
    if (currentDate < today) {
      const nextDate = getNextDate(currentDate);
      setCurrentDateState(nextDate);
      await setCurrentDate(nextDate);
      const logsData = await getLogsForDate(nextDate);
      setLogs(logsData);
      await updateStreaks(nextDate, systems);
    }
  };

  const canGoNext = currentDate < getTodayString();

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
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
            <h1 className="text-2xl font-bold text-slate-900">Track</h1>
            <p className="text-sm text-slate-600">Choose how you showed up</p>
          </div>
        </header>

        {survivalMode && isToday(currentDate) && (
          <Alert className="border-[#f59e0b] bg-gradient-to-r from-amber-50 to-orange-50">
            <Zap className="h-4 w-4 text-[#f59e0b]" />
            <AlertTitle className="text-[#f59e0b] font-semibold">Survival Mode Active</AlertTitle>
            <AlertDescription className="text-slate-700">
              Just keep moving — Focus on the smallest action today
            </AlertDescription>
          </Alert>
        )}

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-slate-900">{formatFullDateDisplay(currentDate)}</h3>
                {!isToday(currentDate) && (
                  <p className="text-xs text-slate-500 mt-1">
                    {currentDate < getTodayString() ? 'Past data - read-only' : 'Future date'}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePreviousDate}
                  className="border-slate-300"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNextDate}
                  disabled={!canGoNext}
                  className={canGoNext ? 'border-slate-300' : 'opacity-50 cursor-not-allowed'}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <WeekCalendar currentDate={currentDate} systems={systems} logs={weekLogs} />
          </CardContent>
        </Card>

        <div className="space-y-6">
          {systems.map((system) => {
            const currentStatus = logs[system.id];
            const streak = streaks[system.id] || 0;

            return (
              <Card key={system.id} className="border-slate-200 shadow-sm">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg font-medium text-slate-900">
                        {system.name}
                      </CardTitle>
                      <div className="space-y-1 pt-2">
                        <p className="text-sm text-slate-600">
                          <span className="font-medium">Full:</span> {system.full}
                        </p>
                        <p className="text-sm text-slate-600">
                          <span className="font-medium">Survival:</span> {system.survival}
                        </p>
                      </div>
                    </div>
                    {streak > 0 && (
                      <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-red-50">
                        <Flame className="h-4 w-4 text-red-500" fill="currentColor" />
                        <span className="text-sm font-bold text-red-700">{streak}</span>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {!survivalMode && (
                    <Button
                      onClick={() => handleStatusChange(system.id, 'done')}
                      disabled={currentDate > getTodayString()}
                      className={`w-full h-20 flex items-center justify-center gap-3 text-lg font-medium transition-all active:scale-95 ${
                        currentDate > getTodayString()
                          ? 'opacity-50 cursor-not-allowed'
                          : currentStatus === 'done'
                            ? 'bg-[#106981] text-white hover:bg-[#0d5468] ring-2 ring-[#106981] ring-offset-2'
                            : 'bg-[#106981]/10 text-[#106981] hover:bg-[#106981]/20 border-2 border-[#106981]/30'
                      }`}
                    >
                      <CheckCircle2 className="h-6 w-6" />
                      <span>Done</span>
                    </Button>
                  )}

                  <Button
                    onClick={() => handleStatusChange(system.id, 'survival')}
                    disabled={currentDate > getTodayString()}
                    className={`w-full h-20 flex items-center justify-center gap-3 text-lg font-medium transition-all active:scale-95 ${
                      currentDate > getTodayString()
                        ? 'opacity-50 cursor-not-allowed'
                        : currentStatus === 'survival'
                          ? 'bg-[#f59e0b] text-white hover:bg-[#d97706] ring-2 ring-[#f59e0b] ring-offset-2'
                          : survivalMode && !currentStatus
                            ? 'bg-[#f59e0b] text-white hover:bg-[#d97706] ring-2 ring-[#f59e0b] ring-offset-2 animate-pulse'
                            : 'bg-[#f59e0b]/10 text-[#f59e0b] hover:bg-[#f59e0b]/20 border-2 border-[#f59e0b]/30'
                    }`}
                  >
                    <Zap className="h-6 w-6" />
                    <span>Survival Mode</span>
                  </Button>

                  {survivalMode && (
                    <Button
                      onClick={() => handleStatusChange(system.id, 'done')}
                      disabled={currentDate > getTodayString()}
                      className={`w-full h-20 flex items-center justify-center gap-3 text-lg font-medium transition-all active:scale-95 ${
                        currentDate > getTodayString()
                          ? 'opacity-50 cursor-not-allowed'
                          : currentStatus === 'done'
                            ? 'bg-[#106981] text-white hover:bg-[#0d5468] ring-2 ring-[#106981] ring-offset-2'
                            : 'bg-[#106981]/10 text-[#106981] hover:bg-[#106981]/20 border-2 border-[#106981]/30'
                      }`}
                    >
                      <CheckCircle2 className="h-6 w-6" />
                      <span>Done (Full)</span>
                    </Button>
                  )}

                  <Button
                    onClick={() => handleStatusChange(system.id, 'skip')}
                    disabled={currentDate > getTodayString()}
                    className={`w-full h-20 flex items-center justify-center gap-3 text-lg font-medium transition-all active:scale-95 ${
                      currentDate > getTodayString()
                        ? 'opacity-50 cursor-not-allowed'
                        : currentStatus === 'skip'
                          ? 'bg-[#6b7280] text-white hover:bg-[#4b5563] ring-2 ring-[#6b7280] ring-offset-2'
                          : 'bg-[#6b7280]/10 text-[#6b7280] hover:bg-[#6b7280]/20 border-2 border-[#6b7280]/30'
                    }`}
                  >
                    <XCircle className="h-6 w-6" />
                    <span>Skip</span>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Button
          onClick={() => router.push('/dashboard')}
          variant="outline"
          className="w-full h-14 text-slate-700 border-slate-300 hover:bg-slate-100 font-medium text-lg transition-all active:scale-95"
        >
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
