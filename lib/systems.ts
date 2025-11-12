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

export interface DailyLogs {
  [date: string]: DailyLog;
}

const DEFAULT_SYSTEMS: System[] = [
  {
    id: '1',
    name: 'Morning Movement',
    trigger: 'After waking up',
    full: '30-min walk/gym',
    survival: '5-min stretch',
    isPaused: false,
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Ship Something Small',
    trigger: 'During work hours',
    full: '30-min focused work',
    survival: 'Send one email',
    isPaused: false,
    createdAt: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Family Connection',
    trigger: 'After work',
    full: '30-min quality time',
    survival: '5-min check-in',
    isPaused: false,
    createdAt: new Date().toISOString()
  },
  {
    id: '4',
    name: 'Partner Wind-Down',
    trigger: 'Before bed',
    full: '30-min together time',
    survival: '5-min gratitude share',
    isPaused: false,
    createdAt: new Date().toISOString()
  },
];

export function getSystems(): System[] {
  if (typeof window === 'undefined') return DEFAULT_SYSTEMS;
  const stored = localStorage.getItem('rythm_systems');
  return stored ? JSON.parse(stored) : DEFAULT_SYSTEMS;
}

export function getActiveSystems(): System[] {
  return getSystems().filter(s => !s.isPaused);
}

export const SYSTEMS = getActiveSystems();

export function saveSystems(systems: System[]): void {
  localStorage.setItem('rythm_systems', JSON.stringify(systems));
}

export function addSystem(system: Omit<System, 'id' | 'createdAt'>): System {
  const systems = getSystems();
  const newSystem: System = {
    ...system,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
  systems.push(newSystem);
  saveSystems(systems);
  return newSystem;
}

export function updateSystem(id: string, updates: Partial<System>): void {
  const systems = getSystems();
  const index = systems.findIndex(s => s.id === id);
  if (index !== -1) {
    systems[index] = { ...systems[index], ...updates };
    saveSystems(systems);
  }
}

export function deleteSystem(id: string): void {
  const systems = getSystems().filter(s => s.id !== id);
  saveSystems(systems);
}

export function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

export function getDailyLogs(): DailyLogs {
  if (typeof window === 'undefined') return {};
  const stored = localStorage.getItem('rythm_logs');
  return stored ? JSON.parse(stored) : {};
}

export function getTodayLogs(): DailyLog {
  const logs = getDailyLogs();
  const today = getTodayString();
  return logs[today] || {};
}

export function saveDailyLog(systemId: string, status: LogStatus): void {
  const logs = getDailyLogs();
  const today = getTodayString();

  if (!logs[today]) {
    logs[today] = {};
  }

  logs[today][systemId] = status;
  localStorage.setItem('rythm_logs', JSON.stringify(logs));
}

export function getSurvivalMode(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('rythm_survival_mode') === 'true';
}

export function setSurvivalMode(enabled: boolean): void {
  localStorage.setItem('rythm_survival_mode', enabled ? 'true' : 'false');
}

export function getLogsForDate(dateString: string): DailyLog {
  const logs = getDailyLogs();
  return logs[dateString] || {};
}

export function getWeekDates(dateString: string): string[] {
  const date = new Date(dateString);
  const dayOfWeek = date.getDay();
  const mondayDate = new Date(date);
  mondayDate.setDate(date.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

  const weekDates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(mondayDate);
    d.setDate(mondayDate.getDate() + i);
    weekDates.push(d.toISOString().split('T')[0]);
  }
  return weekDates;
}

export function calculateStreak(systemId: string, endDate: string): number {
  const logs = getDailyLogs();
  let streak = 0;
  let currentDate = new Date(endDate);

  while (true) {
    const dateString = currentDate.toISOString().split('T')[0];
    const dayLog = logs[dateString];

    if (!dayLog || !dayLog[systemId]) {
      break;
    }

    const status = dayLog[systemId];
    if (status === null) {
      break;
    }

    streak++;
    currentDate.setDate(currentDate.getDate() - 1);
  }

  return streak;
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

export function getCurrentDate(): string {
  if (typeof window === 'undefined') return getTodayString();
  const stored = localStorage.getItem('rythm_current_date');
  return stored || getTodayString();
}

export function setCurrentDate(dateString: string): void {
  localStorage.setItem('rythm_current_date', dateString);
}

export function calculateConsecutiveSkips(systemId: string): number {
  const logs = getDailyLogs();
  let skips = 0;
  let currentDate = new Date(getTodayString());
  currentDate.setDate(currentDate.getDate() - 1);

  while (true) {
    const dateString = currentDate.toISOString().split('T')[0];
    const dayLog = logs[dateString];

    if (!dayLog || !dayLog[systemId]) {
      break;
    }

    const status = dayLog[systemId];
    if (status === 'skip' || status === null) {
      skips++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return skips;
}

export interface ComebackSystem {
  system: System;
  consecutiveSkips: number;
}

export function getComebackSystems(): ComebackSystem[] {
  const systems = getActiveSystems();
  const comebackSystems: ComebackSystem[] = [];

  systems.forEach(system => {
    const skips = calculateConsecutiveSkips(system.id);
    if (skips >= 2) {
      comebackSystems.push({
        system,
        consecutiveSkips: skips,
      });
    }
  });

  return comebackSystems;
}
