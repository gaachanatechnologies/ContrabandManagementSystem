"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"
import { FileText, Download, TrendingUp, Package, Users, AlertTriangle } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { toast } from "@/hooks/use-toast"
import type { DateRange } from "react-day-picker"

interface ReportData {
  totalSeizures: number
  totalValue: number
  activeUsers: number
  pendingApprovals: number
  seizuresByCategory: Array<{ name: string; value: number; color: string }>
  seizuresByMonth: Array<{ month: string; seizures: number; value: number }>
  statusDistribution: Array<{ status: string; count: number; color: string }>
  topOfficers: Array<{ name: string; seizures: number; badge: string }>
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"]

export function ReportDashboard() {
  const [reportData, setReportData] = useState<ReportData>({
    totalSeizures: 0,
    totalValue: 0,
    activeUsers: 0,
    pendingApprovals: 0,
    seizuresByCategory: [],
    seizuresByMonth: [],
    statusDistribution: [],
    topOfficers: [],
  })
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth() - 6, 1),
    to: new Date(),
  })
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    getCurrentUser()
    fetchReportData()
  }, [dateRange, selectedCategory])

  const getCurrentUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single()
        setCurrentUser(profile)
      }
    } catch (error) {
      console.error("Error fetching current user:", error)
    }
  }

  const fetchReportData = async () => {
    try {
      setLoading(true)

      // Build date filter
      const dateFilter =
        dateRange?.from && dateRange?.to
          ? `seizure_date.gte.${dateRange.from.toISOString()}.and.seizure_date.lte.${dateRange.to.toISOString()}`
          : null

      // Fetch total seizures and value
      let seizuresQuery = supabase
        .from("contraband_items")
        .select(
          "*, category:contraband_categories(name), seized_by_user:users!contraband_items_seized_by_fkey(full_name, badge_number)",
        )

      if (dateFilter) {
        seizuresQuery = seizuresQuery
          .gte("seizure_date", dateRange!.from!.toISOString())
          .lte("seizure_date", dateRange!.to!.toISOString())
      }

      if (selectedCategory !== "all") {
        seizuresQuery = seizuresQuery.eq("category.name", selectedCategory)
      }

      const { data: seizures, error: seizuresError } = await seizuresQuery

      if (seizuresError) throw seizuresError

      // Calculate totals
      const totalSeizures = seizures?.length || 0
      const totalValue = seizures?.reduce((sum, item) => sum + (item.estimated_value || 0), 0) || 0

      // Fetch active users
      const { data: users, error: usersError } = await supabase.from("users").select("*").eq("is_active", true)

      if (usersError) throw usersError

      // Fetch pending approvals (messages requiring response)
      const { data: pendingMessages, error: messagesError } = await supabase
        .from("messages")
        .select("*")
        .eq("message_type", "approval_request")
        .eq("requires_response", true)

      if (messagesError) throw messagesError

      // Process seizures by category
      const categoryMap = new Map()
      seizures?.forEach((seizure) => {
        const category = seizure.category?.name || "Unknown"
        categoryMap.set(category, (categoryMap.get(category) || 0) + 1)
      })

      const seizuresByCategory = Array.from(categoryMap.entries()).map(([name, value], index) => ({
        name,
        value: value as number,
        color: COLORS[index % COLORS.length],
      }))

      // Process seizures by month
      const monthMap = new Map()
      seizures?.forEach((seizure) => {
        const month = new Date(seizure.seizure_date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
        })
        const existing = monthMap.get(month) || { seizures: 0, value: 0 }
        monthMap.set(month, {
          seizures: existing.seizures + 1,
          value: existing.value + (seizure.estimated_value || 0),
        })
      })

      const seizuresByMonth = Array.from(monthMap.entries()).map(([month, data]) => ({
        month,
        seizures: (data as any).seizures,
        value: (data as any).value,
      }))

      // Process status distribution
      const statusMap = new Map()
      seizures?.forEach((seizure) => {
        const status = seizure.status.replace("_", " ").toUpperCase()
        statusMap.set(status, (statusMap.get(status) || 0) + 1)
      })

      const statusDistribution = Array.from(statusMap.entries()).map(([status, count], index) => ({
        status,
        count: count as number,
        color: COLORS[index % COLORS.length],
      }))

      // Process top officers
      const officerMap = new Map()
      seizures?.forEach((seizure) => {
        if (seizure.seized_by_user) {
          const key = seizure.seized_by_user.full_name
          const existing = officerMap.get(key) || {
            name: seizure.seized_by_user.full_name,
            badge: seizure.seized_by_user.badge_number,
            seizures: 0,
          }
          officerMap.set(key, { ...existing, seizures: existing.seizures + 1 })
        }
      })

      const topOfficers = Array.from(officerMap.values())
        .sort((a: any, b: any) => b.seizures - a.seizures)
        .slice(0, 5)

      setReportData({
        totalSeizures,
        totalValue,
        activeUsers: users?.length || 0,
        pendingApprovals: pendingMessages?.length || 0,
        seizuresByCategory,
        seizuresByMonth,
        statusDistribution,
        topOfficers,
      })
    } catch (error) {
      console.error("Error fetching report data:", error)
      toast({
        title: "Error",
        description: "Failed to load report data.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const generateReport = async (reportType: string) => {
    try {
      const reportParams = {
        type: reportType,
        dateRange,
        category: selectedCategory,
        generatedBy: currentUser?.id,
      }

      const { error } = await supabase.from("reports").insert({
        report_type: reportType,
        title: `${reportType.replace("_", " ").toUpperCase()} Report - ${new Date().toLocaleDateString()}`,
        parameters: reportParams,
        generated_by: currentUser?.id,
      })

      if (error) throw error

      toast({
        title: "Report Generated",
        description: `${reportType.replace("_", " ")} report has been generated successfully.`,
      })
    } catch (error) {
      console.error("Error generating report:", error)
      toast({
        title: "Error",
        description: "Failed to generate report.",
        variant: "destructive",
      })
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "ETB",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Check if user has access to reports
  const hasReportAccess =
    currentUser?.role === "admin" || currentUser?.role === "supervisor" || currentUser?.role === "auditor"

  if (!hasReportAccess) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
          <p className="text-muted-foreground">You need supervisor, admin, or auditor privileges to access reports.</p>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return <div className="text-center py-8">Loading report data...</div>
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Report Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Date Range</label>
              <DatePickerWithRange date={dateRange} setDate={setDateRange} />
            </div>
            <div className="w-48">
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Drugs">Drugs</SelectItem>
                  <SelectItem value="Weapons">Weapons</SelectItem>
                  <SelectItem value="Counterfeit Goods">Counterfeit Goods</SelectItem>
                  <SelectItem value="Stolen Property">Stolen Property</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 items-end">
              <Button onClick={() => generateReport("summary")} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Seizures</p>
                <p className="text-2xl font-bold">{reportData.totalSeizures.toLocaleString()}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">{formatCurrency(reportData.totalValue)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold">{reportData.activeUsers}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Approvals</p>
                <p className="text-2xl font-bold">{reportData.pendingApprovals}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="officers">Top Officers</TabsTrigger>
        </TabsList>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Seizure Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={reportData.seizuresByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Bar yAxisId="left" dataKey="seizures" fill="#8884d8" name="Seizures" />
                  <Line yAxisId="right" type="monotone" dataKey="value" stroke="#82ca9d" name="Value (ETB)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Seizures by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={reportData.seizuresByCategory}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {reportData.seizuresByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full lg:w-64 space-y-2">
                  {reportData.seizuresByCategory.map((category, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                        <span className="text-sm">{category.name}</span>
                      </div>
                      <Badge variant="outline">{category.value}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={reportData.statusDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="officers">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Top Performing Officers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.topOfficers.map((officer, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{officer.name}</p>
                        <p className="text-sm text-muted-foreground">{officer.badge}</p>
                      </div>
                    </div>
                    <Badge variant="secondary">{officer.seizures} seizures</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
