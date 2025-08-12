"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Truck, User, MapPin, Clock, FileText } from "lucide-react"
import { supabase } from "@/lib/supabase/client"

interface CustodyRecord {
  id: string
  contraband_id: string
  from_user_id?: string
  to_user_id: string
  transfer_reason: string
  transfer_date: string
  location: string
  notes?: string
  from_user?: { full_name: string; badge_number: string }
  to_user?: { full_name: string; badge_number: string }
}

interface ChainOfCustodyProps {
  contrabandId: string
  contrabandName: string
}

export function ChainOfCustody({ contrabandId, contrabandName }: ChainOfCustodyProps) {
  const [custodyChain, setCustodyChain] = useState<CustodyRecord[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showTransferDialog, setShowTransferDialog] = useState(false)
  const [transferData, setTransferData] = useState({
    toUserId: "",
    reason: "",
    location: "",
    notes: "",
  })

  useEffect(() => {
    fetchCustodyChain()
    fetchUsers()
  }, [contrabandId])

  const fetchCustodyChain = async () => {
    try {
      const { data, error } = await supabase
        .from("custody_chain")
        .select(`
          *,
          from_user:users!custody_chain_from_user_id_fkey(full_name, badge_number),
          to_user:users!custody_chain_to_user_id_fkey(full_name, badge_number)
        `)
        .eq("contraband_id", contrabandId)
        .order("transfer_date", { ascending: false })

      if (error) throw error
      setCustodyChain(data || [])
    } catch (error) {
      console.error("Error fetching custody chain:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, full_name, badge_number, role")
        .eq("is_active", true)
        .order("full_name")

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }

  const handleTransfer = async () => {
    try {
      const { error } = await supabase.from("custody_chain").insert({
        contraband_id: contrabandId,
        from_user_id: (await supabase.auth.getUser()).data.user?.id,
        to_user_id: transferData.toUserId,
        transfer_reason: transferData.reason,
        location: transferData.location,
        notes: transferData.notes,
      })

      if (error) throw error

      if (transferData.reason.toLowerCase().includes("destruction")) {
        await supabase.from("contraband_items").update({ status: "pending_destruction" }).eq("id", contrabandId)
      }

      setTransferData({ toUserId: "", reason: "", location: "", notes: "" })
      setShowTransferDialog(false)
      fetchCustodyChain()
    } catch (error) {
      console.error("Error creating transfer:", error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return <div className="text-center py-4">Loading custody chain...</div>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-serif">Chain of Custody - {contrabandName}</CardTitle>
          <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
            <DialogTrigger asChild>
              <Button>
                <Truck className="h-4 w-4 mr-2" />
                New Transfer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Transfer Contraband</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Transfer To</Label>
                  <Select
                    value={transferData.toUserId}
                    onValueChange={(value) => setTransferData((prev) => ({ ...prev, toUserId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select recipient" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name} ({user.badge_number}) - {user.role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Transfer Reason</Label>
                  <Input
                    value={transferData.reason}
                    onChange={(e) => setTransferData((prev) => ({ ...prev, reason: e.target.value }))}
                    placeholder="e.g., Investigation, Storage, Destruction"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    value={transferData.location}
                    onChange={(e) => setTransferData((prev) => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g., Evidence Room A, Warehouse B"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={transferData.notes}
                    onChange={(e) => setTransferData((prev) => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes about the transfer..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowTransferDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleTransfer} disabled={!transferData.toUserId || !transferData.reason}>
                    Create Transfer
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {custodyChain.map((record, index) => (
            <div key={record.id} className="flex items-start gap-4 p-4 border rounded-lg">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {custodyChain.length - index}
                </div>
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{formatDate(record.transfer_date)}</span>
                  </div>
                  <Badge variant="outline">{record.transfer_reason}</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {record.from_user && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>
                        From: {record.from_user.full_name} ({record.from_user.badge_number})
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>
                      To: {record.to_user?.full_name} ({record.to_user?.badge_number})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>Location: {record.location}</span>
                  </div>
                </div>

                {record.notes && (
                  <div className="flex items-start gap-2 mt-2">
                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <p className="text-sm text-muted-foreground">{record.notes}</p>
                  </div>
                )}
              </div>
            </div>
          ))}

          {custodyChain.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">No custody transfers recorded yet.</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
