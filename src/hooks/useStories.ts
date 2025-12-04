import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Story, StoryReactionType } from '@/lib/types';

interface StoryData {
  id: string;
  creator_id: string;
  content: string;
  photo_url: string | null;
  created_at: string;
  expires_at: string;
  profiles: {
    display_name: string;
    avatar_url: string | null;
  } | null;
}

interface ReactionCount {
  reaction: string;
  count: number;
}

// Transform database story to Story type
function transformStory(
  storyData: StoryData,
  reactionCounts: ReactionCount[],
  userReaction: string | null
): Story {
  const reactions = {
    heart: 0,
    celebrate: 0,
    home: 0,
  };

  reactionCounts.forEach((r) => {
    if (r.reaction === 'heart' || r.reaction === 'celebrate' || r.reaction === 'home') {
      reactions[r.reaction] = r.count;
    }
  });

  return {
    id: storyData.id,
    creatorId: storyData.creator_id,
    creatorName: storyData.profiles?.display_name || 'Anonymous',
    creatorAvatar: storyData.profiles?.avatar_url || null,
    content: storyData.content,
    photoUrl: storyData.photo_url,
    createdAt: new Date(storyData.created_at).getTime(),
    expiresAt: new Date(storyData.expires_at).getTime(),
    reactions,
    userReaction: userReaction as StoryReactionType | null,
  };
}

// Fetch all non-expired stories
export function useStories() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['stories'],
    queryFn: async () => {
      const now = new Date().toISOString();

      // Fetch stories that haven't expired
      const { data: storiesData, error: storiesError } = await supabase
        .from('stories')
        .select('*, profiles:creator_id(display_name, avatar_url)')
        .gt('expires_at', now)
        .order('created_at', { ascending: false });

      if (storiesError) throw storiesError;
      if (!storiesData || storiesData.length === 0) return [];

      const storyIds = storiesData.map((s) => s.id);

      // Fetch reaction counts for all stories
      const { data: reactionsData, error: reactionsError } = await supabase
        .from('story_reactions')
        .select('story_id, reaction')
        .in('story_id', storyIds);

      if (reactionsError) throw reactionsError;

      // Get user's reactions if logged in
      let userReactions: { story_id: string; reaction: string }[] = [];
      if (user) {
        const { data: userReactionsData } = await supabase
          .from('story_reactions')
          .select('story_id, reaction')
          .eq('user_id', user.id)
          .in('story_id', storyIds);

        userReactions = userReactionsData || [];
      }

      // Group reactions by story and count
      const reactionsByStory: Record<string, ReactionCount[]> = {};
      storyIds.forEach((id) => {
        reactionsByStory[id] = [];
      });

      if (reactionsData) {
        const counts: Record<string, Record<string, number>> = {};
        reactionsData.forEach((r) => {
          if (!counts[r.story_id]) {
            counts[r.story_id] = { heart: 0, celebrate: 0, home: 0 };
          }
          counts[r.story_id][r.reaction] = (counts[r.story_id][r.reaction] || 0) + 1;
        });

        Object.entries(counts).forEach(([storyId, reactions]) => {
          reactionsByStory[storyId] = Object.entries(reactions).map(([reaction, count]) => ({
            reaction,
            count,
          }));
        });
      }

      // Create user reaction lookup
      const userReactionLookup: Record<string, string | null> = {};
      storyIds.forEach((id) => {
        const userReaction = userReactions.find((r) => r.story_id === id);
        userReactionLookup[id] = userReaction?.reaction || null;
      });

      // Transform all stories
      return storiesData.map((story) =>
        transformStory(
          story as unknown as StoryData,
          reactionsByStory[story.id] || [],
          userReactionLookup[story.id]
        )
      );
    },
  });
}

// Create a new story
export function useCreateStory() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: { content: string; photoUrl?: string }) => {
      if (!user) throw new Error('Must be logged in to create a story');

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 48);

      const { data: story, error } = await supabase
        .from('stories')
        .insert({
          creator_id: user.id,
          content: data.content,
          photo_url: data.photoUrl || null,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return story;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
    },
  });
}

// Toggle reaction on a story
export function useToggleReaction() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      storyId,
      reaction,
    }: {
      storyId: string;
      reaction: StoryReactionType;
    }) => {
      if (!user) throw new Error('Must be logged in to react');

      // Check if user already has a reaction on this story
      const { data: existing } = await supabase
        .from('story_reactions')
        .select('id, reaction')
        .eq('story_id', storyId)
        .eq('user_id', user.id)
        .single();

      if (existing) {
        if (existing.reaction === reaction) {
          // Same reaction - remove it (toggle off)
          const { error } = await supabase
            .from('story_reactions')
            .delete()
            .eq('id', existing.id);

          if (error) throw error;
          return { action: 'removed' };
        } else {
          // Different reaction - update it
          const { error } = await supabase
            .from('story_reactions')
            .update({ reaction })
            .eq('id', existing.id);

          if (error) throw error;
          return { action: 'updated', reaction };
        }
      } else {
        // No existing reaction - add new one
        const { error } = await supabase.from('story_reactions').insert({
          story_id: storyId,
          user_id: user.id,
          reaction,
        });

        if (error) throw error;
        return { action: 'added', reaction };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
    },
  });
}

// Delete a story
export function useDeleteStory() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (storyId: string) => {
      if (!user) throw new Error('Must be logged in to delete a story');

      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', storyId)
        .eq('creator_id', user.id);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
    },
  });
}
