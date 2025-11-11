'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, logout } from '@/lib/auth';
import {
  getActiveSystems,
  getTodayLogs,
  getSurvivalMode,
  setSurvivalMode,
  getComebackSystems,
  saveDailyLog,
  setCurrentDate,
  getTodayString,
  type LogStatus,
  type System,
  type ComebackSystem,
} from '@/lib/systems-db';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Heart, LogOut, CheckCircle2, Zap, XCircle, Calendar, Settings, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [systems, setSystems] = useState<System[]>([]);
  const [todayLogs, setTodayLogs] = useState<Record<string, LogStatus>>({});
  const [survivalMode, setSurvivalModeState] = useState(false);
  const [currentDate, setCurrentDate] = useState('');
  const [comebackSystems, setComebackSystems] = useState<ComebackSystem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      router.push('/login');
      return;
    }

    await loadData();
    setLoading(false);
  };

  const loadData = async () => {
    try {
      console.log('Dashboard: Starting to load data...');
      const [systemsData, logsData, survivalData, comebackData] = await Promise.all([
        getActiveSystems(),
        getTodayLogs(),
        getSurvivalMode(),
        getComebackSystems(),
      ]);

      console.log('Dashboard: Loaded', systemsData.length, 'systems');
      setSystems(systemsData);
      setTodayLogs(logsData);
      setSurvivalModeState(survivalData);
      setComebackSystems(comebackData);
      setCurrentDate(new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }));
      setError(null);
    } catch (error) {
      console.error('Error loading data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleSurvivalToggle = async (checked: boolean) => {
    try {
      await setSurvivalMode(checked);
      setSurvivalModeState(checked);
    } catch (error) {
      console.error('Error toggling survival mode:', error);
    }
  };

  const handleRestartWithSurvival = async (systemId: string) => {
    try {
      await setSurvivalMode(true);
      await saveDailyLog(systemId, 'survival');
      await loadData();
    } catch (error) {
      console.error('Error restarting with survival:', error);
    }
  };

  const handleTrackToday = async () => {
    const today = getTodayString();
    await setCurrentDate(today);
    await new Promise(resolve => setTimeout(resolve, 100));
    router.push('/tracker');
  };

  const getStatusIcon = (status: LogStatus, isSurvivalMode: boolean) => {
    if (isSurvivalMode && !status) {
      return <Zap className="h-5 w-5 text-[#f59e0b] animate-pulse" />;
    }
    if (status === 'done') return <CheckCircle2 className="h-5 w-5 text-[#106981]" />;
    if (status === 'survival') return <Zap className="h-5 w-5 text-[#f59e0b]" />;
    if (status === 'skip') return <XCircle className="h-5 w-5 text-[#6b7280]" />;
    return <div className="h-5 w-5 rounded-full border-2 border-slate-300" />;
  };

  const getStatusText = (status: LogStatus) => {
    if (status === 'done') return 'Done';
    if (status === 'survival') return 'Survival';
    if (status === 'skip') return 'Skip';
    return 'Not tracked';
  };

  const getStatusColor = (status: LogStatus, isSurvivalMode: boolean) => {
    if (isSurvivalMode && !status) {
      return 'text-[#f59e0b] bg-[#f59e0b]/20 border border-[#f59e0b]/30';
    }
    if (status === 'done') return 'text-[#106981] bg-[#106981]/10';
    if (status === 'survival') return 'text-[#f59e0b] bg-[#f59e0b]/10';
    if (status === 'skip') return 'text-[#6b7280] bg-[#6b7280]/10';
    return 'text-slate-500 bg-slate-100';
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-[#106981] flex items-center justify-center">
              <Heart className="h-6 w-6 text-white" fill="currentColor" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">RYTHM</h1>
              <p className="text-sm text-slate-600">{currentDate}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/systems')}
              className="text-slate-600 hover:text-slate-900"
            >
              <Settings className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-slate-600 hover:text-slate-900"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5 text-[#f59e0b]" />
                <div>
                  <Label htmlFor="survival-mode" className="text-base font-medium text-slate-900 cursor-pointer">
                    Survival Mode
                  </Label>
                  <p className="text-sm text-slate-600">Quick 2-minute actions</p>
                </div>
              </div>
              <Switch
                id="survival-mode"
                checked={survivalMode}
                onCheckedChange={handleSurvivalToggle}
              />
            </div>
          </CardContent>
        </Card>

        {survivalMode && (
          <Alert className="border-[#f59e0b] bg-gradient-to-r from-amber-50 to-orange-50">
            <Zap className="h-4 w-4 text-[#f59e0b]" />
            <AlertTitle className="text-[#f59e0b] font-semibold">Survival Mode Active</AlertTitle>
            <AlertDescription className="text-slate-700">
              Just keep moving — Focus on the smallest action today
            </AlertDescription>
          </Alert>
        )}

        {comebackSystems.length > 0 && (
          <div className="space-y-3">
            {comebackSystems.map(({ system, consecutiveSkips }) => (
              <Alert key={system.id} className="border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-900 font-semibold">
                  Comeback Mode: {system.name}
                </AlertTitle>
                <AlertDescription className="space-y-3">
                  <p className="text-slate-700">
                    Skipped {consecutiveSkips} days in a row. Use Survival Mode to restart momentum.
                  </p>
                  <Button
                    onClick={() => handleRestartWithSurvival(system.id)}
                    className="bg-[#f59e0b] hover:bg-[#d97706] text-white h-9 text-sm"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Restart with Survival
                  </Button>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Today's Systems</h2>
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTitle className="text-red-900">Error Loading Systems</AlertTitle>
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}
          {systems.length === 0 && !error && (
            <Card className="border-slate-200">
              <CardContent className="p-6 text-center">
                <p className="text-slate-600 mb-4">No active systems yet</p>
                <Button
                  onClick={() => router.push('/systems')}
                  className="bg-[#106981] hover:bg-[#0d5468] text-white"
                >
                  Add Your First System
                </Button>
              </CardContent>
            </Card>
          )}
          {systems.map((system) => {
            const status = todayLogs[system.id];
            const cardBorderClass = survivalMode && !status
              ? 'border-[#f59e0b] shadow-md'
              : 'border-slate-200 shadow-sm';

            return (
              <Card
                key={system.id}
                className={`${cardBorderClass} hover:shadow-md transition-shadow cursor-pointer`}
                onClick={handleTrackToday}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-medium text-slate-900 flex items-center justify-between">
                    <span>{system.name}</span>
                    {getStatusIcon(status, survivalMode)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <p className={`text-sm ${survivalMode && !status ? 'text-[#f59e0b] font-semibold' : 'text-slate-600'}`}>
                      <span className="font-medium">
                        {survivalMode ? 'Survival:' : 'Full:'}
                      </span>{' '}
                      {survivalMode ? system.survival : system.full}
                    </p>
                    {!survivalMode && (
                      <p className="text-sm text-slate-600">
                        <span className="font-medium">Survival:</span> {system.survival}
                      </p>
                    )}
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status, survivalMode)}`}>
                      {status ? getStatusText(status) : survivalMode ? 'Try Survival Mode' : 'Not tracked'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={handleTrackToday}
            className="h-14 bg-[#106981] hover:bg-[#0d5468] text-white font-medium text-lg transition-all active:scale-95"
          >
            Track Today
          </Button>
          <Button
            onClick={() => router.push('/sync')}
            variant="outline"
            className="h-14 border-[#106981] text-[#106981] hover:bg-[#106981]/10 font-medium text-lg transition-all active:scale-95"
          >
            <Calendar className="h-5 w-5 mr-2" />
            Weekly Sync
          </Button>
        </div>
      </div>
    </div>
  );
}
