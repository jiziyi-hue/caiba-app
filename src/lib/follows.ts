// Follow system: user→user, user→topic
// Reference: GDD §4.1 user_follows / topic_follows tables

import { useEffect, useState } from 'react';
import { supabase } from './supabase';

export interface FollowCounts {
  followers: number;
  following: number;
}

export function useFollowCounts(userId: string | null) {
  const [counts, setCounts] = useState<FollowCounts>({ followers: 0, following: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      const [{ count: followers }, { count: following }] = await Promise.all([
        supabase
          .from('user_follows')
          .select('follower_id', { count: 'exact', head: true })
          .eq('followee_id', userId),
        supabase
          .from('user_follows')
          .select('followee_id', { count: 'exact', head: true })
          .eq('follower_id', userId),
      ]);
      setCounts({ followers: followers ?? 0, following: following ?? 0 });
      setLoading(false);
    })();
  }, [userId]);

  return { counts, loading };
}

export function useIsFollowing(targetUserId: string | null, myId: string | null) {
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!targetUserId || !myId || targetUserId === myId) {
      setFollowing(false);
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('user_follows')
        .select('follower_id')
        .eq('follower_id', myId)
        .eq('followee_id', targetUserId)
        .maybeSingle();
      setFollowing(!!data);
      setLoading(false);
    })();
  }, [targetUserId, myId]);

  async function toggle() {
    if (!targetUserId || !myId) return;
    if (following) {
      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', myId)
        .eq('followee_id', targetUserId);
      if (!error) setFollowing(false);
    } else {
      const { error } = await supabase
        .from('user_follows')
        .insert({ follower_id: myId, followee_id: targetUserId });
      if (!error) setFollowing(true);
    }
  }

  return { following, loading, toggle };
}

export function useIsTopicFollowed(topicId: string | null, myId: string | null) {
  const [followed, setFollowed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!topicId || !myId) {
      setFollowed(false);
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('topic_follows')
        .select('user_id')
        .eq('user_id', myId)
        .eq('topic_id', topicId)
        .maybeSingle();
      setFollowed(!!data);
      setLoading(false);
    })();
  }, [topicId, myId]);

  async function toggle() {
    if (!topicId || !myId) return;
    if (followed) {
      const { error } = await supabase
        .from('topic_follows')
        .delete()
        .eq('user_id', myId)
        .eq('topic_id', topicId);
      if (!error) setFollowed(false);
    } else {
      const { error } = await supabase
        .from('topic_follows')
        .insert({ user_id: myId, topic_id: topicId });
      if (!error) setFollowed(true);
    }
  }

  return { followed, loading, toggle };
}

// Get list of user IDs the current user follows
export async function fetchFollowingIds(myId: string): Promise<string[]> {
  const { data } = await supabase
    .from('user_follows')
    .select('followee_id')
    .eq('follower_id', myId);
  return (data ?? []).map((r) => r.followee_id);
}
