import { useState } from 'react'
import { Camera, ArrowRight } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { LanternBackground } from '@/components/ui/lantern-background'

interface ProfileCreationProps {
  onComplete: (username: string, skillTags: string[]) => void
}

const SKILL_OPTIONS = [
  'Timmerwerk', 'Loodgieter', 'Elektriciteit', 'Tuinieren',
  'Koken', 'Bakken', 'Kinderopvang', 'Dierenverzorging',
  'Computerhulp', 'Vertaling', 'Verhuishulp', 'Bijles',
  'Autoherstellingen', 'Naaien', 'Kunst', 'Muziek'
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
      toast.error('Je naam moet minstens 2 tekens bevatten')
      return
    }

    if (selectedSkills.length === 0) {
      toast.error('Selecteer minstens één vaardigheid')
      return
    }

    onComplete(username, selectedSkills)
  }

  return (
    <div className="min-h-screen bg-background px-6 py-12 relative overflow-hidden">
      {/* Lantern mascot background */}
      <LanternBackground opacity={0.35} />
      
      <div className="max-w-2xl mx-auto space-y-8 relative z-10">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-semibold text-foreground">
            Stel jezelf voor
          </h1>
          <p className="text-muted-foreground">
            Vertel de buurt wie je bent
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
              Foto uploaden
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Je naam</Label>
            <Input
              id="username"
              placeholder="Hoe mogen je buren je noemen?"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={20}
              autoFocus
            />
          </div>

          <div className="space-y-3">
            <Label>Vaardigheden en hulp</Label>
            <p className="text-sm text-muted-foreground">
              Selecteer waarmee je kan helpen
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
            Word lid van De Lantaarn
            <ArrowRight className="ml-2" size={20} />
          </Button>
        </form>
      </div>
    </div>
  )
}
