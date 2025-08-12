"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Eye, Download, Shield } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { toast } from "@/hooks/use-toast"

interface AuditLog {
  id: string
  user_id: string
  action: string
  table_name: string
  record_id?: string
  old_values?: any
  new_values?: any
  ip_address?: string
  user_agent?: string
  created_at: string
  user?: { full_name: string; role: string; badge_number?: string }
}

const actionColors = {
  CREATE_SEIZURE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  UPDATE_STATUS: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  CREATE_TRANSFER: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  UPDATE_USER: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  DELETE_RECORD: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  LOGIN: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  LOGOUT: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
}

export function AuditTrail() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [actionFilter, setActionFilter] = useState("all")
  const [tableFilter, setTableFilter] = useState("all")
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    getCurrentUser()
    fetchAuditLogs()
  }, [])

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

  const fetchAuditLogs = async () => {
    try {
      // Replace Supabase table select with direct REST call via fetch
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"}/audit-logs`, {
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      })
      if (!res.ok) throw new Error("Failed to fetch audit logs")
      const data = await res.json()
      setAuditLogs(
        (data || []).map((d: any) => ({
          id: d.id,
          user_id: d.userId,
          action: d.action,
          table_name: d.tableName,
          record_id: d.recordId,
          new_values: d.newValuesJson,
          created_at: d.createdAt,
        })),
      )
    } catch (error) {
      console.error("Error fetching audit logs:", error)
      toast({
        title: "Error",
        description: "Failed to load audit logs.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.user?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.table_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.record_id?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesAction = actionFilter === "all" || log.action === actionFilter
    const matchesTable = tableFilter === "all" || log.table_name === tableFilter

    return matchesSearch && matchesAction && matchesTable
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const formatAction = (action: string) => {
    return action
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const exportAuditLogs = async () => {
    try {
      // In a real implementation, this would generate a CSV or PDF
      const csvContent = [
        ["Timestamp", "User", "Action", "Table", "Record ID", "IP Address"].join(","),
        ...filteredLogs.map((log) =>
          [
            log.created_at,
            log.user?.full_name || "Unknown",
            log.action,
            log.table_name,
            log.record_id || "",
            log.ip_address || "",
          ].join(","),
        ),
      ].join("\n")

      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `audit_logs_${new Date().toISOString().split("T")[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)

      toast({
        title: "Export Complete",
        description: "Audit logs have been exported successfully.",
      })
    } catch (error) {
      console.error("Error exporting audit logs:", error)
      toast({
        title: "Export Failed",
        description: "Failed to export audit logs.",
        variant: "destructive",
      })
    }
  }

  // Check if user has access to audit logs
  const hasAuditAccess = currentUser?.role === "admin" || currentUser?.role === "auditor"

  if (!hasAuditAccess) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
          <p className="text-muted-foreground">You need administrator or auditor privileges to access audit logs.</p>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return <div className="text-center py-8">Loading audit logs...</div>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-serif">Audit Trail</CardTitle>
          <Button onClick={exportAuditLogs} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Logs
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by user, action, or record ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="CREATE_SEIZURE">Create Seizure</SelectItem>
              <SelectItem value="UPDATE_STATUS">Update Status</SelectItem>
              <SelectItem value="CREATE_TRANSFER">Create Transfer</SelectItem>
              <SelectItem value="UPDATE_USER">Update User</SelectItem>
              <SelectItem value="DELETE_RECORD">Delete Record</SelectItem>
              <SelectItem value="LOGIN">Login</SelectItem>
              <SelectItem value="LOGOUT">Logout</SelectItem>
            </SelectContent>
          </Select>

          <Select value={tableFilter} onValueChange={setTableFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by table" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tables</SelectItem>
              <SelectItem value="contraband_items">Contraband Items</SelectItem>
              <SelectItem value="custody_chain">Custody Chain</SelectItem>
              <SelectItem value="users">Users</SelectItem>
              <SelectItem value="messages">Messages</SelectItem>
              <SelectItem value="evidence_files">Evidence Files</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Table</TableHead>
                <TableHead>Record ID</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-sm">{formatDate(log.created_at)}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{log.user?.full_name || "System"}</div>
                      {log.user?.badge_number && (
                        <div className="text-sm text-muted-foreground">{log.user.badge_number}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={actionColors[log.action as keyof typeof actionColors] || "bg-gray-100 text-gray-800"}
                    >
                      {formatAction(log.action)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <code className="text-sm">{log.table_name}</code>
                  </TableCell>
                  <TableCell>
                    <code className="text-sm">{log.record_id || "—"}</code>
                  </TableCell>
                  <TableCell>
                    <code className="text-sm">{log.ip_address || "—"}</code>
                  </TableCell>
                  <TableCell>
                    {(log.old_values || log.new_values) && (
                      <Button size="sm" variant="ghost">
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredLogs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || actionFilter !== "all" || tableFilter !== "all"
                ? "No audit logs match your search criteria."
                : "No audit logs found."}
            </div>
          )}
        </div>

        <div className="mt-4 text-sm text-muted-foreground">
          Showing {filteredLogs.length} of {auditLogs.length} audit log entries
        </div>
      </CardContent>
    </Card>
  )
}
