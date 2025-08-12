"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, Eye, Truck, QrCode, MapPin, Calendar, User } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { supabase } from "@/lib/supabase/client"
import { ChainOfCustody } from "./chain-of-custody"

interface ContrabandItem {
  id: string
  seizure_number: string
  item_name: string
  description: string
  quantity: number
  unit: string
  estimated_value: number
  status: string
  seizure_date: string
  seizure_location: string
  storage_location: string
  seized_by: string
  barcode?: string
  category?: { name: string; risk_level: string }
  seized_by_user?: { full_name: string; badge_number: string }
}

const statusColors = {
  seized: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  in_custody: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  under_investigation: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  pending_destruction: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  destroyed: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  released: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
}

export function ContrabandList() {
  const [items, setItems] = useState<ContrabandItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedItem, setSelectedItem] = useState<ContrabandItem | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [showCustody, setShowCustody] = useState(false)

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from("contraband_items")
        .select(`
          *,
          category:contraband_categories(name, risk_level),
          seized_by_user:users!contraband_items_seized_by_fkey(full_name, badge_number)
        `)
        .order("seizure_date", { ascending: false })

      if (error) throw error
      setItems(data || [])
    } catch (error) {
      console.error("Error fetching contraband items:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.seizure_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.seized_by_user?.full_name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || item.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "ETB",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const updateItemStatus = async (itemId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("contraband_items")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", itemId)

      if (error) throw error

      // Log audit trail
      const user = await supabase.auth.getUser()
      if (user.data.user) {
        await supabase.from("audit_logs").insert({
          user_id: user.data.user.id,
          action: "UPDATE_STATUS",
          table_name: "contraband_items",
          record_id: itemId,
          new_values: { status: newStatus },
        })
      }

      fetchItems() // Refresh the list
    } catch (error) {
      console.error("Error updating status:", error)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading contraband records...</div>
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Contraband Records</CardTitle>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by ID, item name, or officer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="seized">Seized</SelectItem>
                <SelectItem value="in_custody">In Custody</SelectItem>
                <SelectItem value="under_investigation">Under Investigation</SelectItem>
                <SelectItem value="pending_destruction">Pending Destruction</SelectItem>
                <SelectItem value="destroyed">Destroyed</SelectItem>
                <SelectItem value="released">Released</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Seizure ID</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Officer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-sm">{item.seizure_number}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.item_name}</div>
                        {item.estimated_value > 0 && (
                          <div className="text-sm text-muted-foreground">
                            Est. {formatCurrency(item.estimated_value)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div>{item.category?.name}</div>
                        {item.category?.risk_level && (
                          <Badge variant="outline" className="text-xs">
                            {item.category.risk_level}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.quantity} {item.unit}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[item.status as keyof typeof statusColors]}>
                        {item.status.replace("_", " ").toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.seized_by_user?.full_name}</div>
                        <div className="text-sm text-muted-foreground">{item.seized_by_user?.badge_number}</div>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(item.seizure_date)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedItem(item)
                            setShowDetails(true)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {item.barcode && (
                          <Button size="sm" variant="ghost">
                            <QrCode className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedItem(item)
                            setShowCustody(true)
                          }}
                        >
                          <Truck className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredItems.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm || statusFilter !== "all"
                  ? "No items match your search criteria."
                  : "No contraband records found."}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Item Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Contraband Details - {selectedItem?.seizure_number}</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Item Name</Label>
                  <p>{selectedItem.item_name}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="flex gap-2">
                    <Badge className={statusColors[selectedItem.status as keyof typeof statusColors]}>
                      {selectedItem.status.replace("_", " ").toUpperCase()}
                    </Badge>
                    <Select
                      value={selectedItem.status}
                      onValueChange={(value) => updateItemStatus(selectedItem.id, value)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="seized">Seized</SelectItem>
                        <SelectItem value="in_custody">In Custody</SelectItem>
                        <SelectItem value="under_investigation">Under Investigation</SelectItem>
                        <SelectItem value="pending_destruction">Pending Destruction</SelectItem>
                        <SelectItem value="destroyed">Destroyed</SelectItem>
                        <SelectItem value="released">Released</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Description</Label>
                <p className="text-sm">{selectedItem.description}</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Quantity</Label>
                  <p>
                    {selectedItem.quantity} {selectedItem.unit}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Estimated Value</Label>
                  <p>{formatCurrency(selectedItem.estimated_value)}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Storage</Label>
                  <p>{selectedItem.storage_location || "Not specified"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Seizure Location
                  </Label>
                  <p className="text-sm">{selectedItem.seizure_location}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Seizure Date
                  </Label>
                  <p className="text-sm">{formatDate(selectedItem.seizure_date)}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Seized By
                </Label>
                <p className="text-sm">
                  {selectedItem.seized_by_user?.full_name} ({selectedItem.seized_by_user?.badge_number})
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Chain of Custody Dialog */}
      <Dialog open={showCustody} onOpenChange={setShowCustody}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Chain of Custody</DialogTitle>
          </DialogHeader>
          {selectedItem && <ChainOfCustody contrabandId={selectedItem.id} contrabandName={selectedItem.item_name} />}
        </DialogContent>
      </Dialog>
    </>
  )
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>
}
