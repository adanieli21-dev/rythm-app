import { supabase } from './supabase';
import { getCurrentUser } from './auth';

export type LogStatus = 'done' | 'survival' | 'skip' | null;

export interface System {
  id: string;
  name: string;
  trigger: string;
  full: string;
  survival: string;
  isPaused: boolean;
  createdAt: string;
}

export interface DailyLog {
  [systemId: string]: LogStatus;
}

export interface ComebackSystem {
  system: System;
  consecutiveSkips: number;
}

function mapDbSystemToSystem(dbSystem: any): System {
  return {
    id: dbSystem.id,
    name: dbSystem.name,
    trigger: dbSystem.trigger,
    full: dbSystem.full_action,
    survival: dbSystem.survival_action,
    isPaused: dbSystem.is_paused,
    createdAt: dbSystem.created_at,
  };
}

export async function getSystems(): Promise<System[]> {
  const user = await getCurrentUser();
  if (!user) {
    console.log('getSystems: No user found');
    return [];
  }

  const { data, error } = await supabase
    .from('systems')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('getSystems error:', error);
    throw error;
  }

  console.log('getSystems: Found', data?.length || 0, 'systems');
  return (data || []).map(mapDbSystemToSystem);
}

export async function getActiveSystems(): Promise<System[]> {
  try {
    const systems = await getSystems();
    const activeSystems = systems.filter(s => !s.isPaused);
    console.log('getActiveSystems: Found', activeSystems.length, 'active systems out of', systems.length, 'total');
    return activeSystems;
  } catch (error) {
    console.error('getActiveSystems error:', error);
    return [];
  }
}

export async function addSystem(system: Omit<System, 'id' | 'createdAt'>): Promise<System> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('systems')
    .insert({
      user_id: user.id,
      name: system.name,
      trigger: system.trigger,
      full_action: system.full,
      survival_action: system.survival,
      is_paused: system.isPaused,
    })
    .select()
    .single();

  if (error) throw error;
  return mapDbSystemToSystem(data);
}

export async function updateSystem(id: string, updates: Partial<System>): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const dbUpdates: any = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.trigger !== undefined) dbUpdates.trigger = updates.trigger;
  if (updates.full !== undefined) dbUpdates.full_action = updates.full;
  if (updates.survival !== undefined) dbUpdates.survival_action = updates.survival;
  if (updates.isPaused !== undefined) dbUpdates.is_paused = updates.isPaused;

  const { error } = await supabase
    .from('systems')
    .update(dbUpdates)
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
}

export async function deleteSystem(id: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('systems')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
}

export function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function getLogsForDate(dateString: string): Promise<DailyLog> {
  const user = await getCurrentUser();
  if (!user) return {};

  const { data, error } = await supabase
    .from('daily_logs')
    .select('system_id, status')
    .eq('user_id', user.id)
    .eq('date', dateString);

  if (error) throw error;

  const logs: DailyLog = {};
  (data || []).forEach(log => {
    logs[log.system_id] = log.status as LogStatus;
  });

  return logs;
}

export async function getTodayLogs(): Promise<DailyLog> {
  try {
    const today = getTodayString();
    console.log('getTodayLogs: Getting logs for', today);
    const logs = await getLogsForDate(today);
    console.log('getTodayLogs: Found', Object.keys(logs).length, 'logs');
    return logs;
  } catch (error) {
    console.error('getTodayLogs error:', error);
    throw error;
  }
}

export async function saveDailyLog(systemId: string, status: LogStatus): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const today = getTodayString();

  const { error } = await supabase
    .from('daily_logs')
    .upsert({
      user_id: user.id,
      system_id: systemId,
      date: today,
      status,
    }, {
      onConflict: 'user_id,system_id,date',
    });

  if (error) throw error;
}

export async function getSurvivalMode(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) {
    console.log('getSurvivalMode: No user found');
    return false;
  }

  const { data, error } = await supabase
    .from('user_settings')
    .select('survival_mode')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('getSurvivalMode error:', error);
    throw error;
  }

  console.log('getSurvivalMode: survival_mode =', data?.survival_mode || false);
  return data?.survival_mode || false;
}

export async function setSurvivalMode(enabled: boolean): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('user_settings')
    .upsert({
user_id: user.id,
      survival_mode: enabled,
    }, {
      onConflict: 'user_id',
    });

  if (error) throw error;
}

export function getWeekDates(dateString: string): string[] {
  // Parse the date string directly without creating intermediate Date objects
  const parts = dateString.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  
  // Create date using UTC to avoid timezone issues
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const dayOfWeek = date.getUTCDay();
  
  // Calculate how many days to go back to Monday
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  
  const weekDates: string[] = [];
  for (let i = 0; i < 7; i++) {
    // Calculate the day offset from the input date
    const dayOffset = i - daysToMonday;
    const targetDate = new Date(Date.UTC(year, month - 1, day + dayOffset, 12, 0, 0));
    
    // Format as YYYY-MM-DD
    const y = targetDate.getUTCFullYear();
    const m = String(targetDate.getUTCMonth() + 1).padStart(2, '0');
    const d = String(targetDate.getUTCDate()).padStart(2, '0');
    weekDates.push(`${y}-${m}-${d}`);
  }
  
  return weekDates;
}

export async function calculateStreak(systemId: string, endDate: string): Promise<number> {
  const user = await getCurrentUser();
  if (!user) return 0;

let streak = 0;
  const [year, month, day] = endDate.split('-').map(Number);
  let currentDate = new Date(year, month - 1, day);

  while (true) {
    const dateString = currentDate.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('daily_logs')
      .select('status')
      .eq('user_id', user.id)
      .eq('system_id', systemId)
      .eq('date', dateString)
      .maybeSingle();

    if (error || !data || data.status === null) {
      break;
    }

    streak++;
    currentDate.setDate(currentDate.getDate() - 1);
  }

  return streak;
}

export async function calculateConsecutiveSkips(systemId: string): Promise<number> {
 let skips = 0;
  const user = await getCurrentUser();
if (!user) return 0;
  const todayString = getTodayString();
  const [year, month, day] = todayString.split('-').map(Number);
  let currentDate = new Date(year, month - 1, day);
  currentDate.setDate(currentDate.getDate() - 1);
 

  while (true) {
    const dateString = currentDate.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('daily_logs')
      .select('status')
      .eq('user_id', user.id)
      .eq('system_id', systemId)
      .eq('date', dateString)
      .maybeSingle();

    if (error || !data) {
      break;
    }

    if (data.status === 'skip' || data.status === null) {
      skips++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return skips;
}

export async function getComebackSystems(): Promise<ComebackSystem[]> {
  try {
    console.log('getComebackSystems: Starting...');
    const systems = await getActiveSystems();
    console.log('getComebackSystems: Processing', systems.length, 'systems');
    const comebackSystems: ComebackSystem[] = [];

    for (const system of systems) {
      try {
        const skips = await calculateConsecutiveSkips(system.id);
        console.log('getComebackSystems: System', system.name, 'has', skips, 'consecutive skips');
        if (skips >= 2) {
          comebackSystems.push({
            system,
            consecutiveSkips: skips,
          });
        }
      } catch (error) {
        console.error('getComebackSystems: Error processing system', system.name, error);
      }
    }

    console.log('getComebackSystems: Found', comebackSystems.length, 'comeback systems');
    return comebackSystems;
  } catch (error) {
    console.error('getComebackSystems error:', error);
    return [];
  }
}

export function getPreviousDate(dateString: string): string {
  const date = new Date(dateString);
  date.setDate(date.getDate() - 1);
  return date.toISOString().split('T')[0];
}

export function getNextDate(dateString: string): string {
  const date = new Date(dateString);
  date.setDate(date.getDate() + 1);
  return date.toISOString().split('T')[0];
}

export function isToday(dateString: string): boolean {
  return dateString === getTodayString();
}

export async function getCurrentDate(): Promise<string> {
  const user = await getCurrentUser();
  if (!user) return getTodayString();

  const { data, error } = await supabase
    .from('user_settings')
    .select('tracker_date')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error || !data) return getTodayString();
  return data.tracker_date || getTodayString();
}

export async function setCurrentDate(dateString: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('user_settings')
    .upsert({
      user_id: user.id,
      tracker_date: dateString,
    }, {
      onConflict: 'user_id',
    });

  if (error) throw error;
}

export async function saveWeeklySync(syncData: {
  weekEnding: string;
  win: string;
  patterns: string;
  hardDays: string;
  adjustSystem: string;
  adjustDescription: string;
  intention: string;
}): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('weekly_syncs')
    .insert({
      user_id: user.id,
      week_ending: syncData.weekEnding,
      win: syncData.win,
      patterns: syncData.patterns,
      hard_days: syncData.hardDays,
      adjust_system: syncData.adjustSystem,
      adjust_description: syncData.adjustDescription,
      intention: syncData.intention,
    });

  if (error) throw error;
}

export async function getWeeklySyncs(): Promise<any[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('weekly_syncs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}
