import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { X } from '@phosphor-icons/react';
import { INITIAL_LANTERNS } from '@/lib/economy';
import { LanternBackground } from '@/components/ui/lantern-background';

const SUGGESTED_TAGS = [
  'Koken', 'Tuinieren', 'Computerhulp', 'Dierenverzorging', 'Bijles',
  'Muziek', 'Kunst', 'Sport', 'Talen', 'Klusjes', 'Kinderopvang',
  'Fotografie', 'Schrijven', 'Fitness', 'Knutselen', 'Auto\'s'
];

interface ProfileSetupProps {
  onComplete?: () => void;
}

export function ProfileSetup({ onComplete }: ProfileSetupProps = {}) {
  const { user, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [vibeTags, setVibeTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addTag = (tag: string) => {
    const normalizedTag = tag.trim().toLowerCase();
    if (normalizedTag && !vibeTags.includes(normalizedTag) && vibeTags.length < 5) {
      setVibeTags([...vibeTags, normalizedTag]);
    }
  };

  const removeTag = (tag: string) => {
    setVibeTags(vibeTags.filter((t) => t !== tag));
  };

  const handleAddCustomTag = (e: React.FormEvent) => {
    e.preventDefault();
    addTag(customTag);
    setCustomTag('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !displayName.trim() || vibeTags.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      console.log('Creating profile for user:', user.id);
      
      // Try to create the profile using upsert (insert or update)
      // Don't use .select() - just fire and forget, then reload
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          display_name: displayName.trim(),
          bio: bio.trim() || null,
          vibe_tags: vibeTags,
          trust_score: 0,
          lantern_balance: INITIAL_LANTERNS,
          location: null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (upsertError) {
        console.error('Upsert error:', upsertError);
        throw upsertError;
      }
      
      console.log('Profile upsert successful, reloading...');

      // Don't bother with transaction - just reload immediately
      window.location.reload();
      
    } catch (err: any) {
      console.error('Profile setup error:', err);
      setError(err.message || 'Failed to create profile');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-amber-950 via-background to-background relative overflow-hidden">
      {/* Lantern mascot background */}
      <LanternBackground opacity={0.35} />
      
      <Card className="w-full max-w-md relative z-10">
        <CardHeader>
          <CardTitle>Maak je profiel aan</CardTitle>
          <CardDescription>
            Vertel je buren iets over jezelf
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="displayName">Je naam *</Label>
              <Input
                id="displayName"
                placeholder="Hoe mogen je buren je noemen?"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                maxLength={30}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio (optioneel)</Label>
              <Textarea
                id="bio"
                placeholder="Vertel wat over jezelf..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={200}
                rows={3}
              />
              <p className="text-xs text-muted-foreground text-right">
                {bio.length}/200
              </p>
            </div>

            <div className="space-y-3">
              <Label>Je vaardigheden * (1-5 vaardigheden/interesses)</Label>
              
              {/* Selected tags */}
              {vibeTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {vibeTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="capitalize flex items-center gap-1"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-destructive"
                      >
                        <X size={14} />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Custom tag input */}
              {vibeTags.length < 5 && (
                <div className="flex gap-2">
                  <Input
                    placeholder="Voeg een vaardigheid toe..."
                    value={customTag}
                    onChange={(e) => setCustomTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomTag(e);
                      }
                    }}
                    maxLength={20}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddCustomTag}
                    disabled={!customTag.trim()}
                  >
                    Toevoegen
                  </Button>
                </div>
              )}

              {/* Suggested tags */}
              {vibeTags.length < 5 && (
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_TAGS.filter((t) => !vibeTags.includes(t.toLowerCase())).map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary/10"
                      onClick={() => addTag(tag)}
                    >
                      + {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !displayName.trim() || vibeTags.length === 0}
            >
              {loading ? 'Profiel aanmaken...' : 'Profiel voltooien'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
