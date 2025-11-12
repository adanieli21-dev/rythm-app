'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data, error } = await supabase.auth.getSession();
      const user = data?.session?.user;

      if (user) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    };

    checkUser();
  }, [router]);

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Redirecting...</h1>
    </div>
  );
}
