import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getLastNDays } from './dateHelpers';

export interface SystemComebackStatus {
  systemId: string;
  isComeback: boolean;
  consecutiveMisses: number;
  lastMissedDates: string[];
}

export async function checkComebackStatus(
  userId: string,
  systemIds: string[]
): Promise<Map<string, SystemComebackStatus>> {
  const supabase = createClientComponentClient();
  const last3Days = getLastNDays(3);
  
  console.log('🔍 Checking comeback status for dates:', last3Days);
  
  const statusMap = new Map<string, SystemComebackStatus>();
  systemIds.forEach(id => {
    statusMap.set(id, {
      systemId: id,
      isComeback: false,
      consecutiveMisses: 0,
      lastMissedDates: []
    });
  });

  const { data: logs, error } = await supabase
    .from('logs')
    .select('system_id, log_date, status')
    .eq('user_id', userId)
    .in('system_id', systemIds)
    .in('log_date', last3Days)
    .order('log_date', { ascending: true });

  if (error) {
    console.error('❌ Error fetching logs:', error);
    return statusMap;
  }

  console.log('📊 Found logs:', logs);

  const logsBySystem: Record<string, typeof logs> = {};
  systemIds.forEach(id => {
    logsBySystem[id] = [];
  });
  
  logs?.forEach(log => {
    if (!logsBySystem[log.system_id]) {
      logsBySystem[log.system_id] = [];
    }
    logsBySystem[log.system_id].push(log);
  });

  systemIds.forEach(systemId => {
    const systemLogs = logsBySystem[systemId] || [];
    
    const dateMap: Record<string, string> = {};
    systemLogs.forEach(log => {
      dateMap[log.log_date] = log.status;
    });

    const yesterday = last3Days[2];
    const dayBefore = last3Days[1];

    const yesterdayStatus = dateMap[yesterday];
    const dayBeforeStatus = dateMap[dayBefore];

    const yesterdayMissed = !yesterdayStatus || yesterdayStatus === 'missed';
    const dayBeforeMissed = !dayBeforeStatus || dayBeforeStatus === 'missed';

    let consecutiveMisses = 0;
    const missedDates: string[] = [];

    if (yesterdayMissed) {
      consecutiveMisses++;
      missedDates.push(yesterday);
      
      if (dayBeforeMissed) {
        consecutiveMisses++;
        missedDates.unshift(dayBefore);
      }
    }

    const isComeback = consecutiveMisses >= 2;

    console.log(`📌 System ${systemId}: ${consecutiveMisses} misses, comeback=${isComeback}`);

    statusMap.set(systemId, {
      systemId,
      isComeback,
      consecutiveMisses,
      lastMissedDates: missedDates
    });
  });

  return statusMap;
}
```

- Save the file

### 4. Create `weeklySyncHelpers.ts`

**In Bolt.new:**
- Right-click on `lib` folder
- Click "New File"
- Type: `weeklySyncHelpers.ts`
- **Paste the code from my previous response** (the updated version matching your schema with `win`, `pattern`, `hard_days`, etc.)

- Save the file

---

## Visual Check

After creating these files, your Bolt.new file tree should look like:
```
📁 your-project
  📁 app
  📁 components
  📁 lib                    ← NEW FOLDER
    📄 dateHelpers.ts       ← NEW FILE
    📄 comebackHelpers.ts   ← NEW FILE
    📄 weeklySyncHelpers.ts ← NEW FILE
  📁 public
  📄 package.json
  ...