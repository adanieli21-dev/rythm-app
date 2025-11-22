import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getWeekStart } from './dateHelpers';

export interface WeeklySyncData {
  id?: string;
  user_id?: string;
  week_start: string;
  win: string;
  pattern: string;
  hard_days: string;
  adjusted_system_id?: string | null;
  adjustment_note?: string | null;
  intention: string;
  created_at?: string;
}

/**
 * Saves weekly sync data (creates or updates)
 */
export async function saveWeeklySync(
  userId: string,
  syncData: {
    win: string;
    pattern: string;
    hard_days: string;
    adjusted_system_id?: string | null;
    adjustment_note?: string | null;
    intention: string;
  },
  weekStartDate?: Date
): Promise<{ success: boolean; error?: string; data?: any }> {
  const supabase = createClientComponentClient();
  const weekStart = getWeekStart(weekStartDate);

  console.log('💾 Saving weekly sync for week:', weekStart);
  console.log('📝 Data:', syncData);

  try {
    // Check if record exists
    const { data: existing } = await supabase
      .from('weekly_sync')
      .select('id')
      .eq('user_id', userId)
      .eq('week_start', weekStart)
      .maybeSingle();

    let result;

    if (existing) {
      // Update existing record
      console.log('📝 Updating existing record:', existing.id);
      result = await supabase
        .from('weekly_sync')
        .update({
          win: syncData.win,
          pattern: syncData.pattern,
          hard_days: syncData.hard_days,
          adjusted_system_id: syncData.adjusted_system_id,
          adjustment_note: syncData.adjustment_note,
          intention: syncData.intention
        })
        .eq('id', existing.id)
        .select()
        .single();
    } else {
      // Insert new record
      console.log('✨ Creating new record');
      result = await supabase
        .from('weekly_sync')
        .insert({
          user_id: userId,
          week_start: weekStart,
          win: syncData.win,
          pattern: syncData.pattern,
          hard_days: syncData.hard_days,
          adjusted_system_id: syncData.adjusted_system_id,
          adjustment_note: syncData.adjustment_note,
          intention: syncData.intention
        })
        .select()
        .single();
    }

    if (result.error) {
      console.error('❌ Error saving weekly sync:', result.error);
      return { success: false, error: result.error.message };
    }

    console.log('✅ Saved successfully:', result.data);
    return { success: true, data: result.data };
    
  } catch (err) {
    console.error('❌ Exception saving weekly sync:', err);
    return { success: false, error: String(err) };
  }
}

/**
 * Loads weekly sync data for a specific week
 */
export async function loadWeeklySync(
  userId: string,
  weekStartDate?: Date
): Promise<WeeklySyncData | null> {
  const supabase = createClientComponentClient();
  const weekStart = getWeekStart(weekStartDate);

  console.log('📂 Loading weekly sync for week:', weekStart);

  try {
    const { data, error } = await supabase
      .from('weekly_sync')
      .select('*')
      .eq('user_id', userId)
      .eq('week_start', weekStart)
      .maybeSingle();

    if (error) {
      console.error('❌ Error loading weekly sync:', error);
      return null;
    }

    if (!data) {
      console.log('ℹ️ No weekly sync found for this week (this is OK for new weeks)');
      return null;
    }

    console.log('✅ Loaded weekly sync:', data);
    return data;
    
  } catch (err) {
    console.error('❌ Exception loading weekly sync:', err);
    return null;
  }
}
```

5. **Save the file**

✅ **File 3 complete!**

---

## ✅ Checkpoint: Verify All Files Exist

Your `lib` folder should now have:
```
📁 lib
  📄 dateHelpers.ts
  📄 comebackHelpers.ts
  📄 weeklySyncHelpers.ts