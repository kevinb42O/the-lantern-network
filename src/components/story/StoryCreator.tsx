import React, { useRef, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Camera, Image as ImageIcon, PencilSimple, TextT, Check, PaperPlaneTilt } from '@phosphor-icons/react'

interface StoryCreatorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (blob: Blob, text: string) => Promise<void>
}

type Point = { x: number; y: number }
type Path = { points: Point[]; color: string; width: number }
type TextOverlay = { id: string; text: string; x: number; y: number; color: string; size: number }

const COLORS = ['#FFFFFF', '#000000', '#FF3B30', '#FF9500', '#FFCC00', '#4CD964', '#5AC8FA', '#007AFF', '#5856D6', '#FF2D55']
const FILTERS = [
  { name: 'Normaal', value: 'none' },
  { name: 'Warm', value: 'sepia(40%) contrast(110%) brightness(110%) saturate(130%)' },
  { name: 'Koel', value: 'grayscale(30%) sepia(20%) hue-rotate(180deg) saturate(150%) brightness(110%)' },
  { name: 'Zwart/Wit', value: 'grayscale(100%) contrast(120%)' },
  { name: 'Vintage', value: 'sepia(60%) contrast(90%) brightness(120%) saturate(80%)' },
]

export function StoryCreator({ open, onOpenChange, onSave }: StoryCreatorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  
  const [paths, setPaths] = useState<Path[]>([])
  const [currentPath, setCurrentPath] = useState<Path | null>(null)
  const [texts, setTexts] = useState<TextOverlay[]>([])
  const [filter, setFilter] = useState(FILTERS[0].value)
  
  const [mode, setMode] = useState<'view' | 'draw' | 'text'>('view')
  const [currentColor, setCurrentColor] = useState('#FF3B30')
  const [isDrawing, setIsDrawing] = useState(false)
  const [draggingTextId, setDraggingTextId] = useState<string | null>(null)
  
  const [newText, setNewText] = useState('')
  const [caption, setCaption] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Redraw everything
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !image) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas dimensions to match image aspect ratio
    const maxWidth = window.innerWidth * 0.9
    const maxHeight = window.innerHeight * 0.6
    let w = image.width
    let h = image.height
    
    if (w > maxWidth || h > maxHeight) {
      const ratio = Math.min(maxWidth / w, maxHeight / h)
      w *= ratio
      h *= ratio
    }
    
    canvas.width = w
    canvas.height = h

    ctx.clearRect(0, 0, w, h)
    
    // Draw Image with filter
    ctx.filter = filter
    ctx.drawImage(image, 0, 0, w, h)
    ctx.filter = 'none'

    // Draw Paths
    const allPaths = currentPath ? [...paths, currentPath] : paths
    allPaths.forEach(p => {
      if (p.points.length === 0) return
      ctx.beginPath()
      ctx.moveTo(p.points[0].x, p.points[0].y)
      for (let i = 1; i < p.points.length; i++) {
        ctx.lineTo(p.points[i].x, p.points[i].y)
      }
      ctx.strokeStyle = p.color
      ctx.lineWidth = p.width
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.stroke()
    })

    // Draw Texts
    texts.forEach(t => {
      ctx.font = `bold ${t.size}px sans-serif`
      ctx.fillStyle = t.color
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      
      // Text shadow for readability
      ctx.shadowColor = 'rgba(0,0,0,0.5)'
      ctx.shadowBlur = 4
      ctx.shadowOffsetX = 1
      ctx.shadowOffsetY = 1
      
      ctx.fillText(t.text, t.x, t.y)
      
      // Reset shadow
      ctx.shadowColor = 'transparent'
    })
  }, [image, paths, currentPath, texts, filter])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      setImage(img)
      setPaths([])
      setTexts([])
      setFilter(FILTERS[0].value)
    }
    img.src = url
  }

  const getCanvasPoint = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    let clientX, clientY
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = (e as React.MouseEvent).clientX
      clientY = (e as React.MouseEvent).clientY
    }
    
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    }
  }

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (!image) return
    const pt = getCanvasPoint(e)

    if (mode === 'draw') {
      setIsDrawing(true)
      setCurrentPath({ points: [pt], color: currentColor, width: 5 })
    } else if (mode === 'view' || mode === 'text') {
      // Check if we hit a text to drag
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      
      let found = false
      for (let i = texts.length - 1; i >= 0; i--) {
        const t = texts[i]
        ctx.font = `bold ${t.size}px sans-serif`
        const metrics = ctx.measureText(t.text)
        const height = t.size
        const width = metrics.width
        
        if (Math.abs(pt.x - t.x) < width / 2 && Math.abs(pt.y - t.y) < height / 2) {
          setDraggingTextId(t.id)
          found = true
          break
        }
      }
      // If we didn't hit a text and we are in text mode, do nothing (wait for user to use input)
    }
  }

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!image) return
    const pt = getCanvasPoint(e)

    if (isDrawing && currentPath) {
      setCurrentPath({ ...currentPath, points: [...currentPath.points, pt] })
    } else if (draggingTextId) {
      setTexts(texts.map(t => t.id === draggingTextId ? { ...t, x: pt.x, y: pt.y } : t))
    }
  }

  const handlePointerUp = () => {
    if (isDrawing && currentPath) {
      setPaths([...paths, currentPath])
      setCurrentPath(null)
      setIsDrawing(false)
    }
    if (draggingTextId) {
      setDraggingTextId(null)
    }
  }

  const addText = () => {
    if (!newText.trim() || !canvasRef.current) return
    const canvas = canvasRef.current
    setTexts([...texts, {
      id: Math.random().toString(),
      text: newText,
      x: canvas.width / 2,
      y: canvas.height / 2,
      color: currentColor,
      size: Math.max(30, canvas.width / 15)
    }])
    setNewText('')
    setMode('view')
  }

  const handleSave = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    setIsSaving(true)
    
    // Export to WebP for smaller size
    canvas.toBlob(async (blob) => {
      if (blob) {
        try {
          await onSave(blob, caption)
          handleClose()
        } catch (err) {
          console.error(err)
        }
      }
      setIsSaving(false)
    }, 'image/webp', 0.8)
  }
  
  const handleClose = () => {
    setImage(null)
    setPaths([])
    setTexts([])
    setCaption('')
    setMode('view')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md w-full p-0 overflow-hidden bg-background border-border/50 h-[90vh] sm:h-auto sm:max-h-[90vh] flex flex-col">
        <DialogHeader className="p-4 border-b border-border/30 absolute top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md">
          <DialogTitle className="text-center">Nieuw Verhaal</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pt-16 pb-4 px-4 flex flex-col">
          {!image ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-6 py-12">
              <div className="p-6 rounded-full bg-primary/10">
                <Camera size={48} weight="duotone" className="text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Deel een moment</h3>
              
              <div className="flex flex-col gap-3 w-full max-w-xs">
                <Button 
                  onClick={() => cameraInputRef.current?.click()} 
                  className="gap-2 h-12 rounded-xl"
                >
                  <Camera size={20} />
                  Maak een foto
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2 h-12 rounded-xl border-primary/20 hover:bg-primary/5"
                >
                  <ImageIcon size={20} />
                  Kies uit galerij
                </Button>
              </div>
              
              <input 
                type="file" 
                accept="image/*" 
                capture="environment" 
                ref={cameraInputRef} 
                className="hidden" 
                onChange={handleImageUpload} 
              />
              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleImageUpload} 
              />
            </div>
          ) : (
            <div className="flex flex-col h-full gap-4">
              {/* Toolbar */}
              <div className="flex items-center justify-between bg-card p-2 rounded-xl border border-border/50 shadow-sm">
                <div className="flex gap-1">
                  <Button 
                    variant={mode === 'view' ? 'secondary' : 'ghost'} 
                    size="icon" 
                    onClick={() => setMode('view')}
                  >
                    <ImageIcon size={20} />
                  </Button>
                  <Button 
                    variant={mode === 'draw' ? 'secondary' : 'ghost'} 
                    size="icon" 
                    onClick={() => setMode('draw')}
                  >
                    <PencilSimple size={20} />
                  </Button>
                  <Button 
                    variant={mode === 'text' ? 'secondary' : 'ghost'} 
                    size="icon" 
                    onClick={() => setMode('text')}
                  >
                    <TextT size={20} />
                  </Button>
                </div>
                
                {/* Undo / Clear */}
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => { setPaths([]); setTexts([]) }}
                    className="text-xs text-muted-foreground"
                  >
                    Wissen
                  </Button>
                </div>
              </div>

              {/* Color Picker (for draw/text) */}
              {(mode === 'draw' || mode === 'text') && (
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-1">
                  {COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setCurrentColor(c)}
                      className={`w-8 h-8 rounded-full shrink-0 border-2 transition-transform ${currentColor === c ? 'scale-110 border-primary' : 'border-transparent'}`}
                      style={{ backgroundColor: c, boxShadow: c === '#000000' ? '0 0 0 1px rgba(255,255,255,0.2)' : 'none' }}
                    />
                  ))}
                </div>
              )}

              {/* Filters */}
              {mode === 'view' && (
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {FILTERS.map(f => (
                    <Button
                      key={f.name}
                      variant={filter === f.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilter(f.value)}
                      className="rounded-full text-xs"
                    >
                      {f.name}
                    </Button>
                  ))}
                </div>
              )}

              {/* Canvas Container */}
              <div 
                className="relative flex-1 bg-black/5 rounded-xl overflow-hidden flex items-center justify-center touch-none cursor-crosshair"
                onMouseDown={handlePointerDown}
                onMouseMove={handlePointerMove}
                onMouseUp={handlePointerUp}
                onMouseLeave={handlePointerUp}
                onTouchStart={handlePointerDown}
                onTouchMove={handlePointerMove}
                onTouchEnd={handlePointerUp}
                onTouchCancel={handlePointerUp}
              >
                <canvas 
                  ref={canvasRef} 
                  className="max-w-full max-h-full object-contain shadow-lg"
                  style={{ touchAction: 'none' }}
                />
              </div>

              {/* Add Text Input */}
              {mode === 'text' && (
                <div className="flex gap-2 animate-in slide-in-from-bottom-4">
                  <Input 
                    placeholder="Typ iets en druk op enter..." 
                    value={newText}
                    onChange={e => setNewText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addText()}
                  />
                  <Button onClick={addText} size="icon" className="shrink-0"><Check /></Button>
                </div>
              )}

              {/* Finalize step */}
              {mode === 'view' && (
                <div className="flex gap-2 mt-2">
                  <Input 
                    placeholder="Voeg een kort bijschrift toe..." 
                    value={caption}
                    onChange={e => setCaption(e.target.value)}
                    className="flex-1 bg-muted/50 border-transparent focus-visible:ring-1"
                  />
                  <Button 
                    onClick={handleSave} 
                    disabled={isSaving}
                    className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                  >
                    {isSaving ? 'Opslaan...' : <><PaperPlaneTilt weight="fill" /> Plaatsen</>}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
