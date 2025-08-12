"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { GPSCapture } from "@/components/mobile/gps-capture"
import { BarcodeScanner } from "@/components/mobile/barcode-scanner"
import { OfflineIndicator } from "@/components/mobile/offline-indicator"
import { Camera, Save } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface GPSLocation {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
}

export default function FieldOfficerPage() {
  const [formData, setFormData] = useState({
    item_type: "",
    description: "",
    quantity: "",
    unit: "",
    estimated_value: "",
    seizure_location: "",
    circumstances: "",
  })
  const [location, setLocation] = useState<GPSLocation | null>(null)
  const [barcode, setBarcode] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const supabase = createClient()

  const handleLocationCapture = (gpsLocation: GPSLocation) => {
    setLocation(gpsLocation)
    setFormData((prev) => ({
      ...prev,
      seizure_location: `${gpsLocation.latitude}, ${gpsLocation.longitude}`,
    }))
    toast.success("Location captured successfully")
  }

  const handleBarcodeScanned = (scannedBarcode: string) => {
    setBarcode(scannedBarcode)
    toast.success("Barcode/RFID captured")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const contrabandData = {
        ...formData,
        quantity: Number.parseInt(formData.quantity) || 0,
        estimated_value: Number.parseFloat(formData.estimated_value) || 0,
        seized_by: user.id,
        status: "seized",
        barcode_rfid: barcode || null,
        gps_coordinates: location ? `${location.latitude},${location.longitude}` : null,
        gps_accuracy: location?.accuracy || null,
      }

      const { error } = await supabase.from("contraband_items").insert([contrabandData])

      if (error) throw error

      // Reset form
      setFormData({
        item_type: "",
        description: "",
        quantity: "",
        unit: "",
        estimated_value: "",
        seizure_location: "",
        circumstances: "",
      })
      setLocation(null)
      setBarcode("")

      toast.success("Contraband item registered successfully")
    } catch (error) {
      console.error("Error submitting form:", error)
      toast.error("Failed to register contraband item")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <OfflineIndicator />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Field Seizure Registration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="item_type">Item Type</Label>
                <Select
                  value={formData.item_type}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, item_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select item type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="drugs">Drugs</SelectItem>
                    <SelectItem value="weapons">Weapons</SelectItem>
                    <SelectItem value="counterfeit">Counterfeit Goods</SelectItem>
                    <SelectItem value="wildlife">Wildlife Products</SelectItem>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="documents">Documents</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData((prev) => ({ ...prev, quantity: e.target.value }))}
                  placeholder="Enter quantity"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Select
                  value={formData.unit}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, unit: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">Kilograms</SelectItem>
                    <SelectItem value="g">Grams</SelectItem>
                    <SelectItem value="pieces">Pieces</SelectItem>
                    <SelectItem value="boxes">Boxes</SelectItem>
                    <SelectItem value="liters">Liters</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimated_value">Estimated Value (ETB)</Label>
                <Input
                  id="estimated_value"
                  type="number"
                  step="0.01"
                  value={formData.estimated_value}
                  onChange={(e) => setFormData((prev) => ({ ...prev, estimated_value: e.target.value }))}
                  placeholder="Enter estimated value"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Detailed description of the contraband item"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="circumstances">Circumstances of Seizure</Label>
              <Textarea
                id="circumstances"
                value={formData.circumstances}
                onChange={(e) => setFormData((prev) => ({ ...prev, circumstances: e.target.value }))}
                placeholder="Describe the circumstances under which the item was seized"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <GPSCapture onLocationCapture={handleLocationCapture} />
              <BarcodeScanner onBarcodeScanned={handleBarcodeScanned} />
            </div>

            {barcode && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-800">Barcode/RFID: {barcode}</p>
              </div>
            )}

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                "Registering..."
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Register Contraband Item
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
