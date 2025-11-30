import { useState, useEffect } from 'react'
import { 
  Flag, 
  FunnelSimple,
  Eye,
  Warning,
  Trash,
  X,
  Check,
  ChatCircleDots,
  Fire,
  User as UserIcon,
  Clock,
  Sparkle
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { Report, ReportStatus, ReportAction } from '@/lib/types'

interface ReportsViewProps {
  isAdmin?: boolean
}

const statusColors: Record<ReportStatus, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  reviewed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  dismissed: 'bg-muted text-muted-foreground border-muted',
  action_taken: 'bg-green-500/20 text-green-400 border-green-500/30'
}

const categoryLabels: Record<string, string> = {
  harassment: 'Harassment',
  spam: 'Spam',
  inappropriate_content: 'Inappropriate Content',
  safety_concern: 'Safety Concern',
  other: 'Other'
}

const typeIcons = {
  message: ChatCircleDots,
  flare: Fire,
  user: UserIcon
}

export function ReportsView({ isAdmin = false }: ReportsViewProps) {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | ReportStatus>('all')
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [reviewNotes, setReviewNotes] = useState('')
  const [updating, setUpdating] = useState(false)
  const [reportCounts, setReportCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching reports:', error)
        toast.error('Failed to fetch reports')
        return
      }

      // Get user profiles for reporters and reported users
      const userIds = [...new Set([
        ...(data?.map(r => r.reporter_id) || []),
        ...(data?.map(r => r.reported_user_id) || [])
      ])]

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds)

      const profileMap: Record<string, { name: string; avatar: string | null }> = {}
      profilesData?.forEach(p => {
        profileMap[p.user_id] = { name: p.display_name, avatar: p.avatar_url }
      })

      // Calculate report counts per user
      const counts: Record<string, number> = {}
      data?.forEach(r => {
        counts[r.reported_user_id] = (counts[r.reported_user_id] || 0) + 1
      })
      setReportCounts(counts)

      // Format reports with profile data
      const formattedReports: Report[] = (data || []).map(r => ({
        ...r,
        reporter_name: profileMap[r.reporter_id]?.name || 'Unknown',
        reporter_avatar: profileMap[r.reporter_id]?.avatar,
        reported_user_name: profileMap[r.reported_user_id]?.name || 'Unknown',
        reported_user_avatar: profileMap[r.reported_user_id]?.avatar
      }))

      setReports(formattedReports)
    } catch (err) {
      console.error('Reports fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDetail = (report: Report) => {
    setSelectedReport(report)
    setReviewNotes(report.review_notes || '')
    setShowDetailModal(true)
  }

  const handleUpdateReport = async (action: ReportAction | 'dismiss') => {
    if (!selectedReport) return

    setUpdating(true)
    try {
      const { data: userData } = await supabase.auth.getUser()
      
      const updates: Record<string, unknown> = {
        reviewed_by: userData.user?.id,
        reviewed_at: new Date().toISOString(),
        review_notes: reviewNotes || null
      }

      if (action === 'dismiss') {
        updates.status = 'dismissed'
        updates.action_taken = 'none'
      } else {
        updates.status = 'action_taken'
        updates.action_taken = action
      }

      // If action is content_removed, attempt to delete the content
      if (action === 'content_removed' && selectedReport.target_id) {
        let contentDeleted = false
        if (selectedReport.report_type === 'message') {
          const { error: deleteError } = await supabase.from('messages').delete().eq('id', selectedReport.target_id)
          if (deleteError) {
            console.error('Error deleting message:', deleteError)
            toast.error('Failed to remove message content. Report will still be updated.')
          } else {
            contentDeleted = true
          }
        } else if (selectedReport.report_type === 'flare') {
          const { error: deleteError } = await supabase.from('flares').delete().eq('id', selectedReport.target_id)
          if (deleteError) {
            console.error('Error deleting flare:', deleteError)
            toast.error('Failed to remove flare content. Report will still be updated.')
          } else {
            contentDeleted = true
          }
        }
        if (contentDeleted) {
          toast.success('Content removed successfully')
        }
      }

      const { error } = await supabase
        .from('reports')
        .update(updates)
        .eq('id', selectedReport.id)

      if (error) {
        console.error('Error updating report:', error)
        toast.error('Failed to update report')
        return
      }

      const actionMessages = {
        dismiss: 'Report dismissed',
        none: 'Report reviewed - no action taken',
        warning: 'User warned',
        content_removed: 'Content removed',
        user_banned: 'User banned (pending implementation)'
      }

      toast.success(actionMessages[action] || 'Report updated')
      setShowDetailModal(false)
      fetchReports()
    } catch (err) {
      console.error('Update error:', err)
      toast.error('Failed to update report')
    } finally {
      setUpdating(false)
    }
  }

  const filteredReports = filter === 'all' 
    ? reports 
    : reports.filter(r => r.status === filter)

  const counts = {
    all: reports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    reviewed: reports.filter(r => r.status === 'reviewed').length,
    action_taken: reports.filter(r => r.status === 'action_taken').length,
    dismissed: reports.filter(r => r.status === 'dismissed').length
  }

  const formatTimeAgo = (dateStr: string) => {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-xl ${isAdmin ? 'bg-amber-500/10' : 'bg-cyan-500/10'}`}>
            <Flag size={24} weight="duotone" className={isAdmin ? 'text-amber-400' : 'text-cyan-400'} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              Reports Queue
              {counts.pending > 0 && (
                <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                  {counts.pending} pending
                </Badge>
              )}
            </h2>
            <p className="text-xs text-muted-foreground">
              Review and take action on user reports
            </p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(['all', 'pending', 'reviewed', 'action_taken'] as const).map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(status)}
              className="gap-1.5 rounded-xl whitespace-nowrap"
            >
              <FunnelSimple size={14} />
              {status === 'all' ? 'All' : status === 'action_taken' ? 'Actioned' : status.charAt(0).toUpperCase() + status.slice(1)}
              <Badge variant="secondary" className="ml-1 text-xs">
                {counts[status]}
              </Badge>
            </Button>
          ))}
        </div>
      </div>

      {/* Reports list */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Flag size={48} className="mx-auto mb-2 opacity-50" />
              <p>No reports to display</p>
            </div>
          ) : (
            filteredReports.map((report) => {
              const TypeIcon = typeIcons[report.report_type]
              const isRepeatOffender = (reportCounts[report.reported_user_id] || 0) >= 3

              return (
                <Card
                  key={report.id}
                  className="p-4 bg-card/80 border-border/50 hover:bg-card/90 transition-colors cursor-pointer"
                  onClick={() => handleOpenDetail(report)}
                >
                  <div className="flex items-start gap-3">
                    {/* Reporter avatar */}
                    <div className="relative">
                      <Avatar className="h-10 w-10 ring-2 ring-border">
                        <AvatarImage src={report.reporter_avatar || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-primary/30 to-accent/20 text-sm">
                          {(report.reporter_name || 'U').slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Header row */}
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-medium text-foreground">
                          {report.reporter_name}
                        </span>
                        <span className="text-muted-foreground text-xs">reported</span>
                        <span className="text-sm font-medium text-foreground">
                          {report.reported_user_name}
                        </span>
                        {isRepeatOffender && (
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs gap-1">
                            <Warning size={10} weight="fill" />
                            Repeat
                          </Badge>
                        )}
                      </div>

                      {/* Badges row */}
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <Badge variant="outline" className="text-xs gap-1">
                          <TypeIcon size={12} />
                          {report.report_type.charAt(0).toUpperCase() + report.report_type.slice(1)}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {categoryLabels[report.category]}
                        </Badge>
                        <Badge className={`text-xs ${statusColors[report.status]}`}>
                          {report.status === 'action_taken' ? 'Action Taken' : report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                        </Badge>
                      </div>

                      {/* Description preview */}
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {report.description}
                      </p>

                      {/* Timestamp */}
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <Clock size={12} />
                        {formatTimeAgo(report.created_at)}
                      </div>
                    </div>

                    <Button variant="ghost" size="icon" className="shrink-0">
                      <Eye size={18} />
                    </Button>
                  </div>
                </Card>
              )
            })
          )}
        </div>
      </ScrollArea>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="sm:max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Flag size={24} weight="duotone" className={isAdmin ? 'text-amber-400' : 'text-cyan-400'} />
              Report Details
            </DialogTitle>
            <DialogDescription>
              Review the report and take appropriate action
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-5 py-2">
              {/* Reporter Info */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedReport.reporter_avatar || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-primary/30 to-accent/20">
                    {(selectedReport.reporter_name || 'U').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm text-muted-foreground">Reported by</p>
                  <p className="font-medium text-foreground">{selectedReport.reporter_name}</p>
                </div>
              </div>

              {/* Reported User Info */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/5 border border-red-500/20">
                <Avatar className="h-10 w-10 ring-2 ring-red-500/30">
                  <AvatarImage src={selectedReport.reported_user_avatar || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-red-500/30 to-orange-500/20">
                    {(selectedReport.reported_user_name || 'U').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Reported user</p>
                  <p className="font-medium text-foreground">{selectedReport.reported_user_name}</p>
                </div>
                {(reportCounts[selectedReport.reported_user_id] || 0) >= 3 && (
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30 gap-1">
                    <Warning size={12} weight="fill" />
                    {reportCounts[selectedReport.reported_user_id]} reports
                  </Badge>
                )}
              </div>

              {/* Report Details */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-muted-foreground">Type:</Label>
                  <Badge variant="outline" className="gap-1">
                    {(() => {
                      const TypeIcon = typeIcons[selectedReport.report_type]
                      return <TypeIcon size={12} />
                    })()}
                    {selectedReport.report_type.charAt(0).toUpperCase() + selectedReport.report_type.slice(1)}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-muted-foreground">Category:</Label>
                  <Badge variant="secondary">
                    {categoryLabels[selectedReport.category]}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-muted-foreground">Status:</Label>
                  <Badge className={statusColors[selectedReport.status]}>
                    {selectedReport.status === 'action_taken' ? 'Action Taken' : selectedReport.status.charAt(0).toUpperCase() + selectedReport.status.slice(1)}
                  </Badge>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Description</Label>
                <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {selectedReport.description}
                  </p>
                </div>
              </div>

              {/* Review Notes */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Review Notes</Label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add notes about this report..."
                  className="w-full h-20 px-3 py-2 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  disabled={selectedReport.status !== 'pending'}
                />
              </div>

              {/* Actions */}
              {selectedReport.status === 'pending' && (
                <div className="space-y-3 pt-2">
                  <Label className="text-sm font-medium">Take Action</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      className="gap-2 rounded-xl"
                      onClick={() => handleUpdateReport('dismiss')}
                      disabled={updating}
                    >
                      <X size={16} />
                      Dismiss
                    </Button>
                    <Button
                      variant="outline"
                      className="gap-2 rounded-xl border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10"
                      onClick={() => handleUpdateReport('warning')}
                      disabled={updating}
                    >
                      <Warning size={16} />
                      Warn User
                    </Button>
                    <Button
                      variant="outline"
                      className="gap-2 rounded-xl border-red-500/30 text-red-500 hover:bg-red-500/10"
                      onClick={() => handleUpdateReport('content_removed')}
                      disabled={updating || !selectedReport.target_id}
                    >
                      <Trash size={16} />
                      Remove Content
                    </Button>
                    <Button
                      variant="outline"
                      className="gap-2 rounded-xl opacity-50 cursor-not-allowed"
                      disabled
                      title="Coming soon"
                    >
                      <Sparkle size={16} />
                      Ban User
                    </Button>
                  </div>
                </div>
              )}

              {/* Already reviewed info */}
              {selectedReport.status !== 'pending' && selectedReport.action_taken && (
                <div className="p-3 rounded-xl bg-green-500/5 border border-green-500/20">
                  <p className="text-sm text-green-400 flex items-center gap-2">
                    <Check size={16} />
                    Action taken: {selectedReport.action_taken.replace('_', ' ')}
                  </p>
                  {selectedReport.reviewed_at && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Reviewed {formatTimeAgo(selectedReport.reviewed_at)}
                    </p>
                  )}
                </div>
              )}

              {/* Close button */}
              <Button
                variant="outline"
                className="w-full rounded-xl"
                onClick={() => setShowDetailModal(false)}
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
