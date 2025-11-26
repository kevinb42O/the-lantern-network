import { useState } from 'react'
import { Camera, ArrowRight } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from 'sonner'

interface ProfileCreationProps {
  onComplete: (username: string, skillTags: string[]) => void
}

const SKILL_OPTIONS = [
  'Carpentry', 'Plumbing', 'Electrical', 'Gardening',
  'Cooking', 'Baking', 'Childcare', 'Pet Care',
  'Tech Support', 'Translation', 'Moving Help', 'Tutoring',
  'Car Repair', 'Sewing', 'Art', 'Music'
]

export function ProfileCreation({ onComplete }: ProfileCreationProps) {
  const [username, setUsername] = useState('')
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])

  const handleSkillToggle = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (username.length < 2) {
      toast.error('Username must be at least 2 characters')
      return
    }

    if (selectedSkills.length === 0) {
      toast.error('Select at least one skill')
      return
    }

    onComplete(username, selectedSkills)
  }

  return (
    <div className="min-h-screen bg-background px-6 py-12">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-semibold text-foreground">
            Create Your Vibe
          </h1>
          <p className="text-muted-foreground">
            Tell the neighborhood who you are
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-24 w-24 border-2 border-primary/20">
              <AvatarFallback className="bg-primary/10 text-primary text-3xl">
                {username.slice(0, 2).toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              className="gap-2"
            >
              <Camera size={16} />
              Upload Photo
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="What should neighbors call you?"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={20}
              autoFocus
            />
          </div>

          <div className="space-y-3">
            <Label>Skills & Offerings</Label>
            <p className="text-sm text-muted-foreground">
              Select what you can help with
            </p>
            <div className="flex flex-wrap gap-2">
              {SKILL_OPTIONS.map((skill) => (
                <Badge
                  key={skill}
                  variant={selectedSkills.includes(skill) ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/20 transition-colors"
                  onClick={() => handleSkillToggle(skill)}
                >
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            size="lg"
            disabled={username.length < 2 || selectedSkills.length === 0}
          >
            Join the Neighborhood
            <ArrowRight className="ml-2" size={20} />
          </Button>
        </form>
      </div>
    </div>
  )
}
