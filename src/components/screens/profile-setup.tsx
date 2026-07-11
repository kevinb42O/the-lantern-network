import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { X, UploadSimple, Image as ImageIcon } from '@phosphor-icons/react';
import { INITIAL_LANTERNS } from '@/lib/economy';
import { uploadProfileBanner, uploadAvatar } from '@/lib/media';
import { LanternBackground } from '@/components/ui/lantern-background';

const SUGGESTED_TAGS = [
  'Koken', 'Tuinieren', 'Computerhulp', 'Dierenverzorging', 'Bijles',
  'Muziek', 'Kunst', 'Sport', 'Talen', 'Klusjes', 'Kinderopvang',
  'Fotografie', 'Schrijven', 'Fitness', 'Knutselen', 'Auto\'s'
];

interface ProfileSetupProps {
  onComplete?: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function ProfileSetup({ onComplete }: ProfileSetupProps = {}) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [vibeTags, setVibeTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [pendingBannerFile, setPendingBannerFile] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const avatarInputRef = React.useRef<HTMLInputElement>(null);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPendingBannerFile(file);
      setBannerUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !displayName.trim() || vibeTags.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      console.log('Creating profile for user:', user.id);
      
      let finalBannerUrl: string | null = null;
      if (pendingBannerFile) {
        finalBannerUrl = await uploadProfileBanner(pendingBannerFile);
      }

      let finalAvatarUrl: string | null = null;
      if (pendingAvatarFile) {
        finalAvatarUrl = await uploadAvatar(pendingAvatarFile);
      }

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
          banner_url: finalBannerUrl,
          avatar_url: finalAvatarUrl,
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
      
    } catch (err: unknown) {
      console.error('Profile setup error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create profile');
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
            {/* Avatar Upload */}
            <div className="flex flex-col items-center justify-center space-y-4 mb-6">
              <div 
                className="relative w-24 h-24 rounded-full border-4 border-card ring-2 ring-border overflow-hidden bg-muted group cursor-pointer shadow-sm"
                onClick={() => avatarInputRef.current?.click()}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-serif bg-primary/10 text-primary">
                    {displayName.slice(0, 2).toUpperCase() || user?.email?.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  <UploadSimple className="text-white w-6 h-6" />
                </div>
              </div>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={avatarInputRef} 
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setPendingAvatarFile(file)
                    setAvatarUrl(URL.createObjectURL(file))
                  }
                }}
              />
              <Label className="text-sm text-muted-foreground">Profielfoto uploaden</Label>
            </div>

            {/* Banner Upload */}
            <div className="space-y-2">
              <Label>Profiel Banner</Label>
              <div 
                className="relative h-32 rounded-xl border-2 border-dashed border-border overflow-hidden bg-muted group cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                {bannerUrl ? (
                  <>
                    <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <span className="text-white flex items-center gap-2"><ImageIcon /> Wijzig banner</span>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground group-hover:text-foreground transition">
                    <UploadSimple size={24} className="mb-2" />
                    <span className="text-sm font-medium">Klik om een banner te uploaden</span>
                  </div>
                )}
              </div>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleFileChange}
              />
            </div>

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
