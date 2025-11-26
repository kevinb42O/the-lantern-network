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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!description.trim()) return

    onSubmit({
      category,
      description: description.trim(),
      location: useGPS ? userLocation : { lat: 0, lng: 0 },
      acceptedBy: undefined
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-3">
        <Label>Category</Label>
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
                  ${category === cat 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border hover:border-primary/50'
                  }
                `}
              >
                <Icon size={32} weight={category === cat ? 'duotone' : 'regular'} />
                <span className="text-sm font-medium">{cat}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">What do you need help with?</Label>
        <Textarea
          id="description"
          placeholder="Describe what you need..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          maxLength={500}
          required
        />
        <p className="text-xs text-muted-foreground text-right">
          {description.length}/500
        </p>
      </div>

      <div className="flex items-center justify-between p-4 rounded-lg bg-card">
        <div className="space-y-1">
          <Label htmlFor="gps-toggle">Use GPS Location</Label>
          <p className="text-xs text-muted-foreground">
            Help neighbors find you
          </p>
        </div>
        <Switch
          id="gps-toggle"
          checked={useGPS}
          onCheckedChange={setUseGPS}
        />
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="flex-1"
          disabled={!description.trim()}
        >
          Post Flare
        </Button>
      </div>
    </form>
  )
}
