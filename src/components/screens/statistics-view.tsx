import { useState, useEffect, useCallback } from 'react'
import {
  ChartLine,
  Users,
  Fire,
  CurrencyCircleDollar,
  ChatCircleDots,
  TrendUp,
  TrendDown,
  ArrowsClockwise,
  CaretDown,
  CaretUp,
  Trophy,
  Handshake,
  Sparkle,
  Clock
} from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from '@/components/ui/chart'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
  Tooltip
} from 'recharts'
import { supabase } from '@/lib/supabase'
import { format, subDays, startOfDay, eachDayOfInterval } from 'date-fns'
import { getBadgeForFlareCount } from '@/lib/economy'

interface StatisticsViewProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user?: any
  isAdmin?: boolean
}

interface StatsOverview {
  totalUsers: number
  activeUsers: number
  newUsersToday: number
  newUsersWeek: number
  totalFlares: number
  activeFlares: number
  completedFlares: number
  flareCompletionRate: number
  totalMessages: number
  messagesThisWeek: number
  totalLanterns: number
  lanternsTransferred: number
  avgReputation: number
  totalHelpRequests: number
  acceptedHelpRequests: number
  helpAcceptRate: number
}

interface TimeSeriesData {
  date: string
  users: number
  flares: number
  messages: number
  transactions: number
}

interface CategoryData {
  name: string
  value: number
  fill: string
}

interface TopUser {
  id: string
  displayName: string
  avatarUrl: string | null
  trustScore: number
  lanternBalance: number
  completedFlares: number
}

interface FlareStatusData {
  name: string
  value: number
  fill: string
}

const CATEGORY_COLORS: Record<string, string> = {
  Mechanical: 'hsl(var(--chart-1))',
  Food: 'hsl(var(--chart-2))',
  Talk: 'hsl(var(--chart-3))',
  Other: 'hsl(var(--chart-4))',
  Unknown: 'hsl(var(--chart-5))'
}

const STATUS_COLORS = {
  active: 'hsl(142, 71%, 45%)',
  accepted: 'hsl(45, 93%, 47%)',
  completed: 'hsl(199, 89%, 48%)',
  cancelled: 'hsl(0, 84%, 60%)'
}

const chartConfig: ChartConfig = {
  users: {
    label: 'Users',
    color: 'hsl(var(--chart-1))'
  },
  flares: {
    label: 'Flares',
    color: 'hsl(var(--chart-2))'
  },
  messages: {
    label: 'Messages',
    color: 'hsl(var(--chart-3))'
  },
  transactions: {
    label: 'Transactions',
    color: 'hsl(var(--chart-4))'
  }
}

export function StatisticsView({ isAdmin = false }: StatisticsViewProps) {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [stats, setStats] = useState<StatsOverview | null>(null)
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([])
  const [categoryData, setCategoryData] = useState<CategoryData[]>([])
  const [statusData, setStatusData] = useState<FlareStatusData[]>([])
  const [topHelpers, setTopHelpers] = useState<TopUser[]>([])
  const [topEarners, setTopEarners] = useState<TopUser[]>([])
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d')
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  // Demo data function for when Supabase is not available
  const loadDemoData = useCallback(() => {
    // Set demo overview stats
    setStats({
      totalUsers: 156,
      activeUsers: 42,
      newUsersToday: 3,
      newUsersWeek: 18,
      totalFlares: 234,
      activeFlares: 12,
      completedFlares: 189,
      flareCompletionRate: 80.8,
      totalMessages: 1247,
      messagesThisWeek: 156,
      totalLanterns: 892,
      lanternsTransferred: 567,
      avgReputation: 45,
      totalHelpRequests: 312,
      acceptedHelpRequests: 256,
      helpAcceptRate: 82.1
    })

    // Generate demo time series data
    const now = new Date()
    const rangeStart = subDays(now, timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90)
    const days = eachDayOfInterval({ start: rangeStart, end: now })
    const demoTimeSeries: TimeSeriesData[] = days.map((day) => ({
      date: format(day, 'MMM d'),
      users: Math.floor(Math.random() * 5) + 1,
      flares: Math.floor(Math.random() * 8) + 2,
      messages: Math.floor(Math.random() * 30) + 10,
      transactions: Math.floor(Math.random() * 15) + 5
    }))
    setTimeSeriesData(demoTimeSeries)

    // Set demo category data
    setCategoryData([
      { name: 'Mechanical', value: 45, fill: CATEGORY_COLORS['Mechanical'] },
      { name: 'Food', value: 38, fill: CATEGORY_COLORS['Food'] },
      { name: 'Talk', value: 52, fill: CATEGORY_COLORS['Talk'] },
      { name: 'Other', value: 28, fill: CATEGORY_COLORS['Other'] }
    ])

    // Set demo status data
    setStatusData([
      { name: 'Active', value: 12, fill: STATUS_COLORS.active },
      { name: 'Accepted', value: 33, fill: STATUS_COLORS.accepted },
      { name: 'Completed', value: 189, fill: STATUS_COLORS.completed }
    ])

    // Set demo top helpers
    setTopHelpers([
      { id: '1', displayName: 'Sarah Chen', avatarUrl: null, trustScore: 245, lanternBalance: 8, completedFlares: 47 },
      { id: '2', displayName: 'Marcus Johnson', avatarUrl: null, trustScore: 198, lanternBalance: 6, completedFlares: 38 },
      { id: '3', displayName: 'Emily Rodriguez', avatarUrl: null, trustScore: 156, lanternBalance: 9, completedFlares: 31 },
      { id: '4', displayName: 'James Kim', avatarUrl: null, trustScore: 134, lanternBalance: 7, completedFlares: 26 },
      { id: '5', displayName: 'Lisa Thompson', avatarUrl: null, trustScore: 112, lanternBalance: 5, completedFlares: 22 }
    ])

    // Set demo top earners
    setTopEarners([
      { id: '1', displayName: 'Alex Rivera', avatarUrl: null, trustScore: 178, lanternBalance: 10, completedFlares: 35 },
      { id: '2', displayName: 'Sarah Chen', avatarUrl: null, trustScore: 245, lanternBalance: 8, completedFlares: 47 },
      { id: '3', displayName: 'David Park', avatarUrl: null, trustScore: 89, lanternBalance: 8, completedFlares: 18 },
      { id: '4', displayName: 'James Kim', avatarUrl: null, trustScore: 134, lanternBalance: 7, completedFlares: 26 },
      { id: '5', displayName: 'Marcus Johnson', avatarUrl: null, trustScore: 198, lanternBalance: 6, completedFlares: 38 }
    ])
  }, [timeRange])

  const fetchAllStats = useCallback(async () => {
    try {
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (profilesError) throw profilesError

      // Fetch flares
      const { data: flares, error: flaresError } = await supabase
        .from('flares')
        .select('*')
        .order('created_at', { ascending: false })

      if (flaresError) throw flaresError

      // Fetch messages
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('id, created_at')
        .order('created_at', { ascending: false })

      if (messagesError) throw messagesError

      // Fetch transactions
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })

      if (transactionsError) throw transactionsError

      // Fetch help requests (flare_participants)
      const { data: helpRequests, error: helpRequestsError } = await supabase
        .from('flare_participants')
        .select('*')

      if (helpRequestsError) throw helpRequestsError

      // Calculate time boundaries
      const now = new Date()
      const today = startOfDay(now)
      const oneWeekAgo = subDays(now, 7)
      const rangeStart = subDays(now, timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90)

      // Calculate overview stats
      const totalUsers = profiles?.length || 0
      const newUsersToday = profiles?.filter(p => 
        new Date(p.created_at) >= today
      ).length || 0
      const newUsersWeek = profiles?.filter(p => 
        new Date(p.created_at) >= oneWeekAgo
      ).length || 0
      // Active users = users who have sent messages or created flares in the last 7 days
      const activeUserIds = new Set([
        ...(messages?.filter(m => new Date(m.created_at) >= oneWeekAgo).map(m => 'sender_id' in m ? (m as { sender_id: string }).sender_id : '') || []),
        ...(flares?.filter(f => new Date(f.created_at) >= oneWeekAgo).map(f => f.creator_id) || [])
      ].filter(Boolean))
      const activeUsers = activeUserIds.size

      const totalFlares = flares?.length || 0
      const activeFlares = flares?.filter(f => f.status === 'active').length || 0
      const completedFlares = flares?.filter(f => f.status === 'completed').length || 0
      const flareCompletionRate = totalFlares > 0 ? (completedFlares / totalFlares) * 100 : 0

      const totalMessages = messages?.length || 0
      const messagesThisWeek = messages?.filter(m => 
        new Date(m.created_at) >= oneWeekAgo
      ).length || 0

      const totalLanterns = profiles?.reduce((sum, p) => sum + (p.lantern_balance || 0), 0) || 0
      const lanternsTransferred = transactions?.filter(t => 
        t.type === 'transfer_in' || t.type === 'transfer_out'
      ).reduce((sum, t) => sum + Math.abs(t.amount || 0), 0) || 0

      const avgReputation = totalUsers > 0 
        ? Math.round((profiles?.reduce((sum, p) => sum + (p.trust_score || 0), 0) || 0) / totalUsers)
        : 0

      const totalHelpRequests = helpRequests?.length || 0
      const acceptedHelpRequests = helpRequests?.filter(hr => 
        hr.status === 'accepted' || hr.status === 'completed'
      ).length || 0
      const helpAcceptRate = totalHelpRequests > 0 
        ? (acceptedHelpRequests / totalHelpRequests) * 100 
        : 0

      setStats({
        totalUsers,
        activeUsers,
        newUsersToday,
        newUsersWeek,
        totalFlares,
        activeFlares,
        completedFlares,
        flareCompletionRate,
        totalMessages,
        messagesThisWeek,
        totalLanterns,
        lanternsTransferred,
        avgReputation,
        totalHelpRequests,
        acceptedHelpRequests,
        helpAcceptRate
      })

      // Generate time series data
      const days = eachDayOfInterval({ start: rangeStart, end: now })
      const timeSeries: TimeSeriesData[] = days.map(day => {
        const dayStart = startOfDay(day)
        const dayEnd = new Date(dayStart)
        dayEnd.setDate(dayEnd.getDate() + 1)

        return {
          date: format(day, 'MMM d'),
          users: profiles?.filter(p => {
            const created = new Date(p.created_at)
            return created >= dayStart && created < dayEnd
          }).length || 0,
          flares: flares?.filter(f => {
            const created = new Date(f.created_at)
            return created >= dayStart && created < dayEnd
          }).length || 0,
          messages: messages?.filter(m => {
            const created = new Date(m.created_at)
            return created >= dayStart && created < dayEnd
          }).length || 0,
          transactions: transactions?.filter(t => {
            const created = new Date(t.created_at)
            return created >= dayStart && created < dayEnd
          }).length || 0
        }
      })
      setTimeSeriesData(timeSeries)

      // Calculate category distribution
      const categoryCounts: Record<string, number> = {}
      flares?.forEach(f => {
        const category = f.category || 'Unknown'
        categoryCounts[category] = (categoryCounts[category] || 0) + 1
      })
      const categoryChartData: CategoryData[] = Object.entries(categoryCounts).map(([name, value]) => ({
        name,
        value,
        fill: CATEGORY_COLORS[name] || CATEGORY_COLORS['Unknown']
      }))
      setCategoryData(categoryChartData)

      // Calculate status distribution
      const statusCounts: Record<string, number> = {
        active: 0,
        accepted: 0,
        completed: 0,
        cancelled: 0
      }
      flares?.forEach(f => {
        const status = f.status || 'active'
        if (status in statusCounts) {
          statusCounts[status]++
        }
      })
      const statusChartData: FlareStatusData[] = Object.entries(statusCounts)
        .filter(([, value]) => value > 0)
        .map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value,
          fill: STATUS_COLORS[name as keyof typeof STATUS_COLORS] || 'hsl(var(--chart-5))'
        }))
      setStatusData(statusChartData)

      // Get top helpers (by completed_flares_count)
      const sortedByHelps = [...(profiles || [])].sort((a, b) => 
        (b.completed_flares_count || 0) - (a.completed_flares_count || 0)
      ).slice(0, 5)
      setTopHelpers(sortedByHelps.map(p => ({
        id: p.user_id,
        displayName: p.display_name,
        avatarUrl: p.avatar_url,
        trustScore: p.trust_score || 0,
        lanternBalance: p.lantern_balance || 0,
        completedFlares: p.completed_flares_count || 0
      })))

      // Get top earners (by lantern_balance)
      const sortedByLanterns = [...(profiles || [])].sort((a, b) => 
        (b.lantern_balance || 0) - (a.lantern_balance || 0)
      ).slice(0, 5)
      setTopEarners(sortedByLanterns.map(p => ({
        id: p.user_id,
        displayName: p.display_name,
        avatarUrl: p.avatar_url,
        trustScore: p.trust_score || 0,
        lanternBalance: p.lantern_balance || 0,
        completedFlares: p.completed_flares_count || 0
      })))

    } catch (err) {
      console.error('Error fetching stats:', err)
      // Load demo data when Supabase is not available
      loadDemoData()
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [timeRange, loadDemoData])

  useEffect(() => {
    fetchAllStats()
  }, [fetchAllStats])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchAllStats()
  }

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-background items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-foreground">Loading statistics...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-border bg-gradient-to-b from-violet-950/20 via-card/80 to-transparent">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-violet-500/30 blur-xl animate-pulse" />
                <div className="relative p-2.5 sm:p-3 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-500/10 border border-violet-500/20">
                  <ChartLine size={24} weight="duotone" className="text-violet-400 sm:w-7 sm:h-7" />
                </div>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
                  Statistics
                  <Sparkle size={18} weight="fill" className="text-violet-400 hidden sm:inline" />
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {isAdmin ? 'Full admin analytics & insights' : 'Community analytics & insights'}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="gap-2 rounded-xl"
            >
              <ArrowsClockwise size={16} className={refreshing ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>

          {/* Time Range Selector */}
          <div className="flex gap-2">
            <Button
              variant={timeRange === '7d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange('7d')}
              className="rounded-xl text-xs sm:text-sm"
            >
              7 days
            </Button>
            <Button
              variant={timeRange === '30d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange('30d')}
              className="rounded-xl text-xs sm:text-sm"
            >
              30 days
            </Button>
            <Button
              variant={timeRange === '90d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange('90d')}
              className="rounded-xl text-xs sm:text-sm"
            >
              90 days
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-3 sm:p-4 max-w-4xl mx-auto space-y-4 sm:space-y-6 pb-20">
          
          {/* Overview Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
            <StatCard
              icon={Users}
              label="Total Users"
              value={stats?.totalUsers || 0}
              subLabel={`+${stats?.newUsersWeek || 0} this week`}
              trend={stats?.newUsersWeek && stats.newUsersWeek > 0 ? 'up' : 'neutral'}
              color="blue"
            />
            <StatCard
              icon={Fire}
              label="Total Flares"
              value={stats?.totalFlares || 0}
              subLabel={`${stats?.activeFlares || 0} active`}
              color="orange"
            />
            <StatCard
              icon={CurrencyCircleDollar}
              label="Lanterns"
              value={stats?.totalLanterns || 0}
              subLabel={`${stats?.lanternsTransferred || 0} transferred`}
              color="amber"
            />
            <StatCard
              icon={ChatCircleDots}
              label="Messages"
              value={stats?.totalMessages || 0}
              subLabel={`${stats?.messagesThisWeek || 0} this week`}
              color="green"
            />
          </div>

          {/* Key Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
            <Card className="p-3 sm:p-4 bg-card/80 border-border/50">
              <div className="flex items-center gap-2 mb-1 sm:mb-2">
                <Trophy size={16} className="text-amber-400" />
                <span className="text-xs sm:text-sm text-muted-foreground">Completion Rate</span>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-foreground">
                {(stats?.flareCompletionRate || 0).toFixed(1)}%
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                {stats?.completedFlares || 0} of {stats?.totalFlares || 0} flares
              </p>
            </Card>
            <Card className="p-3 sm:p-4 bg-card/80 border-border/50">
              <div className="flex items-center gap-2 mb-1 sm:mb-2">
                <Handshake size={16} className="text-green-400" />
                <span className="text-xs sm:text-sm text-muted-foreground">Help Accept Rate</span>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-foreground">
                {(stats?.helpAcceptRate || 0).toFixed(1)}%
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                {stats?.acceptedHelpRequests || 0} of {stats?.totalHelpRequests || 0} requests
              </p>
            </Card>
            <Card className="p-3 sm:p-4 bg-card/80 border-border/50 col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2 mb-1 sm:mb-2">
                <Users size={16} className="text-blue-400" />
                <span className="text-xs sm:text-sm text-muted-foreground">Active Users</span>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-foreground">
                {stats?.activeUsers || 0}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                {stats?.totalUsers ? ((stats.activeUsers / stats.totalUsers) * 100).toFixed(1) : 0}% of total
              </p>
            </Card>
          </div>

          {/* Activity Over Time Chart */}
          <Card className="p-3 sm:p-4 bg-card/80 border-border/50">
            <div 
              className="flex items-center justify-between mb-3 sm:mb-4 cursor-pointer"
              onClick={() => toggleSection('activity')}
            >
              <div className="flex items-center gap-2">
                <TrendUp size={18} className="text-violet-400" />
                <h3 className="text-sm sm:text-base font-semibold text-foreground">Activity Over Time</h3>
              </div>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 sm:hidden">
                {expandedSection === 'activity' ? <CaretUp size={16} /> : <CaretDown size={16} />}
              </Button>
            </div>
            <div className={`transition-all duration-300 ${expandedSection === 'activity' ? '' : 'hidden sm:block'}`}>
              <Tabs defaultValue="combined" className="w-full">
                <TabsList className="mb-4 flex-wrap h-auto gap-1">
                  <TabsTrigger value="combined" className="text-xs sm:text-sm">Combined</TabsTrigger>
                  <TabsTrigger value="users" className="text-xs sm:text-sm">Users</TabsTrigger>
                  <TabsTrigger value="flares" className="text-xs sm:text-sm">Flares</TabsTrigger>
                  <TabsTrigger value="messages" className="text-xs sm:text-sm">Messages</TabsTrigger>
                </TabsList>
                
                <TabsContent value="combined" className="mt-0">
                  <ChartContainer config={chartConfig} className="h-[200px] sm:h-[300px] w-full">
                    <LineChart data={timeSeriesData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="date" 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line 
                        type="monotone" 
                        dataKey="users" 
                        stroke="hsl(var(--chart-1))" 
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="flares" 
                        stroke="hsl(var(--chart-2))" 
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="messages" 
                        stroke="hsl(var(--chart-3))" 
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ChartContainer>
                </TabsContent>

                <TabsContent value="users" className="mt-0">
                  <ChartContainer config={chartConfig} className="h-[200px] sm:h-[300px] w-full">
                    <AreaChart data={timeSeriesData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="date" 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area 
                        type="monotone" 
                        dataKey="users" 
                        stroke="hsl(var(--chart-1))" 
                        fill="hsl(var(--chart-1))"
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ChartContainer>
                </TabsContent>

                <TabsContent value="flares" className="mt-0">
                  <ChartContainer config={chartConfig} className="h-[200px] sm:h-[300px] w-full">
                    <BarChart data={timeSeriesData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="date" 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar 
                        dataKey="flares" 
                        fill="hsl(var(--chart-2))"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ChartContainer>
                </TabsContent>

                <TabsContent value="messages" className="mt-0">
                  <ChartContainer config={chartConfig} className="h-[200px] sm:h-[300px] w-full">
                    <AreaChart data={timeSeriesData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="date" 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area 
                        type="monotone" 
                        dataKey="messages" 
                        stroke="hsl(var(--chart-3))" 
                        fill="hsl(var(--chart-3))"
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ChartContainer>
                </TabsContent>
              </Tabs>
            </div>
          </Card>

          {/* Flare Analytics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category Distribution */}
            <Card className="p-3 sm:p-4 bg-card/80 border-border/50">
              <div 
                className="flex items-center justify-between mb-3 cursor-pointer"
                onClick={() => toggleSection('category')}
              >
                <div className="flex items-center gap-2">
                  <Fire size={18} className="text-orange-400" />
                  <h3 className="text-sm sm:text-base font-semibold text-foreground">Flare Categories</h3>
                </div>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 sm:hidden">
                  {expandedSection === 'category' ? <CaretUp size={16} /> : <CaretDown size={16} />}
                </Button>
              </div>
              <div className={`transition-all duration-300 ${expandedSection === 'category' ? '' : 'hidden sm:block'}`}>
                {categoryData.length > 0 ? (
                  <div className="h-[180px] sm:h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            color: 'hsl(var(--foreground))'
                          }} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">
                    No flare data available
                  </div>
                )}
                <div className="flex flex-wrap gap-2 mt-2 justify-center">
                  {categoryData.map((cat) => (
                    <Badge key={cat.name} variant="outline" className="text-xs gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.fill }} />
                      {cat.name}: {cat.value}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>

            {/* Status Distribution */}
            <Card className="p-3 sm:p-4 bg-card/80 border-border/50">
              <div 
                className="flex items-center justify-between mb-3 cursor-pointer"
                onClick={() => toggleSection('status')}
              >
                <div className="flex items-center gap-2">
                  <Clock size={18} className="text-blue-400" />
                  <h3 className="text-sm sm:text-base font-semibold text-foreground">Flare Status</h3>
                </div>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 sm:hidden">
                  {expandedSection === 'status' ? <CaretUp size={16} /> : <CaretDown size={16} />}
                </Button>
              </div>
              <div className={`transition-all duration-300 ${expandedSection === 'status' ? '' : 'hidden sm:block'}`}>
                {statusData.length > 0 ? (
                  <div className="h-[180px] sm:h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            color: 'hsl(var(--foreground))'
                          }} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">
                    No status data available
                  </div>
                )}
                <div className="flex flex-wrap gap-2 mt-2 justify-center">
                  {statusData.map((stat) => (
                    <Badge key={stat.name} variant="outline" className="text-xs gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: stat.fill }} />
                      {stat.name}: {stat.value}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Top Contributors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Top Helpers */}
            <Card className="p-3 sm:p-4 bg-card/80 border-border/50">
              <div 
                className="flex items-center justify-between mb-3 cursor-pointer"
                onClick={() => toggleSection('helpers')}
              >
                <div className="flex items-center gap-2">
                  <Handshake size={18} className="text-green-400" />
                  <h3 className="text-sm sm:text-base font-semibold text-foreground">Top Helpers</h3>
                </div>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 sm:hidden">
                  {expandedSection === 'helpers' ? <CaretUp size={16} /> : <CaretDown size={16} />}
                </Button>
              </div>
              <div className={`transition-all duration-300 ${expandedSection === 'helpers' ? '' : 'hidden sm:block'}`}>
                <div className="space-y-2">
                  {topHelpers.length > 0 ? topHelpers.map((helper, index) => (
                    <LeaderboardItem
                      key={helper.id}
                      rank={index + 1}
                      user={helper}
                      metric={`${helper.completedFlares} helps`}
                    />
                  )) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No helpers yet</p>
                  )}
                </div>
              </div>
            </Card>

            {/* Top Earners */}
            <Card className="p-3 sm:p-4 bg-card/80 border-border/50">
              <div 
                className="flex items-center justify-between mb-3 cursor-pointer"
                onClick={() => toggleSection('earners')}
              >
                <div className="flex items-center gap-2">
                  <CurrencyCircleDollar size={18} className="text-amber-400" />
                  <h3 className="text-sm sm:text-base font-semibold text-foreground">Top Earners</h3>
                </div>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 sm:hidden">
                  {expandedSection === 'earners' ? <CaretUp size={16} /> : <CaretDown size={16} />}
                </Button>
              </div>
              <div className={`transition-all duration-300 ${expandedSection === 'earners' ? '' : 'hidden sm:block'}`}>
                <div className="space-y-2">
                  {topEarners.length > 0 ? topEarners.map((earner, index) => (
                    <LeaderboardItem
                      key={earner.id}
                      rank={index + 1}
                      user={earner}
                      metric={`🏮 ${earner.lanternBalance}`}
                    />
                  )) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No earners yet</p>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Community Health Metrics */}
          <Card className="p-3 sm:p-4 bg-gradient-to-br from-violet-500/10 to-purple-500/5 border-violet-500/20">
            <div className="flex items-center gap-2 mb-4">
              <Sparkle size={18} className="text-violet-400" />
              <h3 className="text-sm sm:text-base font-semibold text-foreground">Community Health</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <HealthMetric
                label="Avg Reputation"
                value={stats?.avgReputation || 0}
                icon="⭐"
                description="Average trust score"
              />
              <HealthMetric
                label="Daily Active"
                value={`${stats?.totalUsers ? ((stats.activeUsers / stats.totalUsers) * 100).toFixed(0) : 0}%`}
                icon="📈"
                description="Weekly engagement"
              />
              <HealthMetric
                label="Response Rate"
                value={`${(stats?.helpAcceptRate || 0).toFixed(0)}%`}
                icon="💬"
                description="Help requests answered"
              />
              <HealthMetric
                label="Success Rate"
                value={`${(stats?.flareCompletionRate || 0).toFixed(0)}%`}
                icon="✅"
                description="Flares completed"
              />
            </div>
          </Card>

        </div>
      </ScrollArea>
    </div>
  )
}

// Stat Card Component
interface StatCardProps {
  icon: React.ElementType
  label: string
  value: number | string
  subLabel?: string
  trend?: 'up' | 'down' | 'neutral'
  color: 'blue' | 'orange' | 'amber' | 'green' | 'purple'
}

function StatCard({ icon: Icon, label, value, subLabel, trend, color }: StatCardProps) {
  const colorClasses = {
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    orange: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    green: 'text-green-400 bg-green-500/10 border-green-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20'
  }

  return (
    <Card className={`p-3 sm:p-4 border ${colorClasses[color].split(' ').slice(1).join(' ')}`}>
      <div className="flex items-center gap-2 mb-1 sm:mb-2">
        <Icon size={16} className={colorClasses[color].split(' ')[0]} />
        <span className="text-[10px] sm:text-xs text-muted-foreground truncate">{label}</span>
      </div>
      <div className="flex items-end justify-between">
        <p className="text-lg sm:text-2xl font-bold text-foreground">{typeof value === 'number' ? value.toLocaleString() : value}</p>
        {trend && trend !== 'neutral' && (
          <div className={`flex items-center gap-0.5 text-[10px] sm:text-xs ${trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
            {trend === 'up' ? <TrendUp size={12} /> : <TrendDown size={12} />}
          </div>
        )}
      </div>
      {subLabel && (
        <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">{subLabel}</p>
      )}
    </Card>
  )
}

// Leaderboard Item Component
interface LeaderboardItemProps {
  rank: number
  user: TopUser
  metric: string
}

function LeaderboardItem({ rank, user, metric }: LeaderboardItemProps) {
  const badge = getBadgeForFlareCount(user.completedFlares)
  const rankColors = ['text-amber-400', 'text-gray-300', 'text-amber-600']
  const rankBgColors = ['bg-amber-400/10', 'bg-gray-300/10', 'bg-amber-600/10']

  return (
    <div className="flex items-center gap-2 sm:gap-3 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold ${rank <= 3 ? rankBgColors[rank - 1] : 'bg-muted/50'} ${rank <= 3 ? rankColors[rank - 1] : 'text-muted-foreground'}`}>
        {rank}
      </div>
      <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
        <AvatarImage src={user.avatarUrl || undefined} />
        <AvatarFallback className="bg-gradient-to-br from-primary/30 to-accent/20 text-[10px] sm:text-xs">
          {user.displayName.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs sm:text-sm font-medium text-foreground truncate">{user.displayName}</span>
          <span className="text-[10px] sm:text-xs">{badge.emoji}</span>
        </div>
        <p className="text-[10px] sm:text-xs text-muted-foreground">⭐ {user.trustScore} rep</p>
      </div>
      <Badge variant="outline" className="text-[10px] sm:text-xs shrink-0">
        {metric}
      </Badge>
    </div>
  )
}

// Health Metric Component
interface HealthMetricProps {
  label: string
  value: number | string
  icon: string
  description: string
}

function HealthMetric({ label, value, icon, description }: HealthMetricProps) {
  return (
    <div className="text-center">
      <div className="text-xl sm:text-2xl mb-1">{icon}</div>
      <p className="text-lg sm:text-xl font-bold text-foreground">{value}</p>
      <p className="text-[10px] sm:text-xs font-medium text-foreground/80">{label}</p>
      <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">{description}</p>
    </div>
  )
}
