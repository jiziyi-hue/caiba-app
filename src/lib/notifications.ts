// Hook for unread notification count
import { useEffect, useState } from 'react';
import { supabase } from './supabase';

export function useUnreadCount(userId: string | null) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!userId) {
      setCount(0);
      return;
    }
    let cancel = false;
    (async () => {
      const { data } = await supabase
        .rpc('get_my_notifications')
        .single();
      if (cancel || !data) return;
      const total =
        (data.new_likes ?? 0) +
        (data.new_comments ?? 0) +
        (data.new_followers ?? 0) +
        (data.new_settlements ?? 0);
      setCount(total);
    })();
    return () => {
      cancel = true;
    };
  }, [userId]);

  return count;
}
