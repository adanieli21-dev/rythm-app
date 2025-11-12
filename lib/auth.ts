import { supabase } from './supabase';

export async function isAuthenticated(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;

  if (data.user) {
    await supabase.from('user_settings').insert({
      user_id: data.user.id,
      survival_mode: false,
      tracker_date: new Date().toISOString().split('T')[0],
    });

    const defaultSystems = [
      {
        user_id: data.user.id,
        name: 'Morning Movement',
        trigger: 'After waking up',
        full_action: '30-min walk/gym',
        survival_action: '5-min stretch',
        is_paused: false,
      },
      {
        user_id: data.user.id,
        name: 'Ship Something Small',
        trigger: 'During work hours',
        full_action: '30-min focused work',
        survival_action: 'Send one email',
        is_paused: false,
      },
      {
        user_id: data.user.id,
        name: 'Family Connection',
        trigger: 'After work',
        full_action: '30-min quality time',
        survival_action: '5-min check-in',
        is_paused: false,
      },
      {
        user_id: data.user.id,
        name: 'Partner Wind-Down',
        trigger: 'Before bed',
        full_action: '30-min together time',
        survival_action: '5-min gratitude share',
        is_paused: false,
      },
    ];

    await supabase.from('systems').insert(defaultSystems);
  }

  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
