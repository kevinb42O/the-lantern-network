import { useState } from 'react'
import { Wrench, ForkKnife, ChatsCircle, Lightbulb } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import type { Flare } from '@/lib/types'

interface CreateFlareProps {
  userLocation: { lat: number; lng: number }
  onSubmit: (flare: Omit<Flare, 'id' | 'createdAt' | 'userId' | 'username' | 'status'>) => void
  onCancel: () => void
}

const categories: Array<Flare['category']> = ['Mechanical', 'Food', 'Talk', 'Other']

const categoryIcons = {
  Mechanical: Wrench,
  Food: ForkKnife,
  Talk: ChatsCircle,
  Other: Lightbulb
}

export function CreateFlare({ userLocation, onSubmit, onCancel }: CreateFlareProps) {
  const [category, setCategory] = useState<Flare['category']>('Other')
  const [description, setDescription] = useState('')
  const [useGPS, setUseGPS] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!description.trim()) return

    setIsSubmitting(true)

    onSubmit({
      category,
      description: description.trim(),
      location: useGPS ? userLocation : { lat: 0, lng: 0 },
      acceptedBy: undefined
    })

    setTimeout(() => setIsSubmitting(false), 500)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-3">
        <Label className="text-base font-semibold">What kind of help do you need?</Label>
        <div className="grid grid-cols-2 gap-3">
          {categories.map((cat) => {
            const Icon = categoryIcons[cat]
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`
                  p-4 rounded-lg border-2 transition-all
                  flex flex-col items-center gap-2
                  hover:scale-105 active:scale-95
                  ${category === cat 
                    ? 'border-primary bg-primary/10 shadow-lg' 
                    : 'border-border hover:border-primary/50'
                  }
                `}
              >
                <Icon 
                  size={32} 
                  weight={category === cat ? 'duotone' : 'regular'}
                  className={category === cat ? 'text-primary' : 'text-muted-foreground'}
                />
                <span className={`text-sm font-medium ${category === cat ? 'text-primary' : ''}`}>
                  {cat}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-base font-semibold">
          Describe what you need
        </Label>
        <Textarea
          id="description"
          placeholder="Example: I need help fixing my bike chain, or I'm looking for someone to share a meal with..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          maxLength={500}
          required
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground text-right">
          {description.length}/500 characters
        </p>
      </div>

      <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
        <div className="space-y-1">
          <Label htmlFor="gps-toggle" className="text-sm font-medium">
            Share my location
          </Label>
          <p className="text-xs text-muted-foreground">
            Helps neighbors find you nearby
          </p>
        </div>
        <Switch
          id="gps-toggle"
          checked={useGPS}
          onCheckedChange={setUseGPS}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="flex-1"
          disabled={!description.trim() || isSubmitting}
        >
          {isSubmitting ? 'Posting...' : 'Post Flare'}
        </Button>
      </div>
    </form>
  )
}
