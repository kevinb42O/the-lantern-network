import { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { X, UploadSimple, Image as ImageIcon, CircleNotch } from '@phosphor-icons/react'
import { uploadProfileBanner, uploadAvatar } from '@/lib/media'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'

const SUGGESTED_TAGS = [
  'Koken', 'Tuinieren', 'Computerhulp', 'Dierenverzorging', 'Bijles',
  'Muziek', 'Kunst', 'Sport', 'Talen', 'Klusjes', 'Kinderopvang',
  'Fotografie', 'Schrijven', 'Fitness', 'Knutselen', 'Auto\'s'
]

interface ProfileSettingsModalProps {
  open: boolean
  onClose: () => void
  onUpdated: () => void
}

export function ProfileSettingsModal({ open, onClose, onUpdated }: ProfileSettingsModalProps) {
  const { user, profile } = useAuth()
  
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [vibeTags, setVibeTags] = useState<string[]>([])
  const [customTag, setCustomTag] = useState('')
  const [bannerUrl, setBannerUrl] = useState('')
  const [pendingBannerFile, setPendingBannerFile] = useState<File | null>(null)
  
  const [avatarUrl, setAvatarUrl] = useState('')
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null)
  
  const [saving, setSaving] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open && profile) {
      setDisplayName(profile.display_name || '')
      setBio(profile.bio || '')
      setVibeTags(profile.vibe_tags || [])
      setBannerUrl(profile.banner_url || '')
      setAvatarUrl(profile.avatar_url || '')
      setPendingBannerFile(null)
      setPendingAvatarFile(null)
    }
  }, [open, profile])

  if (!user || !profile) return null

  const addTag = (tag: string) => {
    const normalizedTag = tag.trim().toLowerCase()
    if (normalizedTag && !vibeTags.includes(normalizedTag) && vibeTags.length < 5) {
      setVibeTags([...vibeTags, normalizedTag])
    }
  }

  const removeTag = (tag: string) => {
    setVibeTags(vibeTags.filter((t) => t !== tag))
  }

  const handleAddCustomTag = (e: React.FormEvent) => {
    e.preventDefault()
    addTag(customTag)
    setCustomTag('')
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPendingBannerFile(file)
      // Preview
      const objectUrl = URL.createObjectURL(file)
      setBannerUrl(objectUrl)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!displayName.trim() || vibeTags.length === 0) {
      toast.error('Naam en minimaal 1 vaardigheid zijn verplicht')
      return
    }

    setSaving(true)

    try {
      let finalBannerUrl = profile.banner_url
      if (pendingBannerFile) {
        setUploadingBanner(true)
        finalBannerUrl = await uploadProfileBanner(pendingBannerFile)
      }

      let finalAvatarUrl = profile.avatar_url
      if (pendingAvatarFile) {
        finalAvatarUrl = await uploadAvatar(pendingAvatarFile)
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName.trim(),
          bio: bio.trim() || null,
          vibe_tags: vibeTags,
          banner_url: finalBannerUrl,
          avatar_url: finalAvatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)

      if (error) throw error
      
      toast.success('Profiel bijgewerkt!')
      onUpdated()
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'Profiel bijwerken mislukt')
    } finally {
      setSaving(false)
      setUploadingBanner(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="rounded-2xl sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Profiel bewerken</DialogTitle>
          <DialogDescription>
            Pas je banner, naam, bio en vaardigheden aan.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          
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
                  {displayName.slice(0, 2).toUpperCase() || user.email?.slice(0, 2).toUpperCase()}
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
            <Label className="text-sm text-muted-foreground">Profielfoto wijzigen</Label>
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

            {vibeTags.length < 5 && (
              <div className="flex gap-2">
                <Input
                  placeholder="Voeg een vaardigheid toe..."
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddCustomTag(e)
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

            {vibeTags.length < 5 && (
              <div className="flex flex-wrap gap-2 pt-2">
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

          <div className="pt-4 flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={onClose}
              disabled={saving}
            >
              Annuleren
            </Button>
            <Button
              type="submit"
              className="flex-1 rounded-xl"
              disabled={saving}
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <CircleNotch className="animate-spin" /> {uploadingBanner ? 'Afbeelding uploaden...' : 'Opslaan...'}
                </span>
              ) : 'Opslaan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
