"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Camera, MapPin, Save, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase/client"
import { toast } from "@/hooks/use-toast"

interface SeizureFormData {
  item_name: string
  category_id: string
  description: string
  quantity: number
  unit: string
  estimated_value: number
  weight_kg: number
  seizure_location: string
  gps_latitude?: number
  gps_longitude?: number
  case_number: string
  barcode: string
  storage_location: string
}

export function SeizureForm() {
  const [formData, setFormData] = useState<SeizureFormData>({
    item_name: "",
    category_id: "",
    description: "",
    quantity: 0,
    unit: "",
    estimated_value: 0,
    weight_kg: 0,
    seizure_location: "",
    case_number: "",
    barcode: "",
    storage_location: "",
  })
  const [photos, setPhotos] = useState<File[]>([])
  const [photoUrls, setPhotoUrls] = useState<string[]>([])
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useState(() => {
    fetchCategories()
  })

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase.from("contraband_categories").select("*").order("name")

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      const newFiles = Array.from(files)
      setPhotos([...photos, ...newFiles])

      // Create preview URLs
      newFiles.forEach((file) => {
        const url = URL.createObjectURL(file)
        setPhotoUrls((prev) => [...prev, url])
      })
    }
  }

  const getLocation = () => {
    if (navigator.geolocation) {
      setLoading(true)
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          setLocation(coords)
          setFormData((prev) => ({
            ...prev,
            gps_latitude: coords.lat,
            gps_longitude: coords.lng,
          }))
          setLoading(false)
        },
        (error) => {
          console.error("Error getting location:", error)
          toast({
            title: "Location Error",
            description: "Could not get GPS coordinates. Please enter location manually.",
            variant: "destructive",
          })
          setLoading(false)
        },
      )
    }
  }

  const uploadPhotos = async (contrabandId: string) => {
    const uploadPromises = photos.map(async (photo, index) => {
      const fileExt = photo.name.split(".").pop()
      const fileName = `${contrabandId}_${index}.${fileExt}`
      const filePath = `evidence/${fileName}`

      const { error: uploadError } = await supabase.storage.from("evidence-photos").upload(filePath, photo)

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from("evidence-photos").getPublicUrl(filePath)

      // Save file record to database
      await supabase.from("evidence_files").insert({
        contraband_id: contrabandId,
        file_name: fileName,
        file_type: photo.type,
        file_size: photo.size,
        file_url: publicUrl,
        uploaded_by: (await supabase.auth.getUser()).data.user?.id,
        description: `Evidence photo ${index + 1}`,
      })
    })

    await Promise.all(uploadPromises)
  }

  const generateSeizureNumber = () => {
    const year = new Date().getFullYear()
    const timestamp = Date.now().toString().slice(-6)
    return `CMS-${year}-${timestamp}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const user = await supabase.auth.getUser()
      if (!user.data.user) throw new Error("Not authenticated")

      const seizureNumber = generateSeizureNumber()

      // Insert contraband item
      const { data: contrabandData, error: contrabandError } = await supabase
        .from("contraband_items")
        .insert({
          seizure_number: seizureNumber,
          ...formData,
          seized_by: user.data.user.id,
          seizure_date: new Date().toISOString(),
          status: "seized",
        })
        .select()
        .single()

      if (contrabandError) throw contrabandError

      // Upload photos if any
      if (photos.length > 0) {
        await uploadPhotos(contrabandData.id)
      }

      // Create initial custody record
      await supabase.from("custody_chain").insert({
        contraband_id: contrabandData.id,
        to_user_id: user.data.user.id,
        transfer_reason: "Initial seizure",
        location: formData.seizure_location,
        notes: "Item seized and registered in system",
      })

      // Log audit trail
      await supabase.from("audit_logs").insert({
        user_id: user.data.user.id,
        action: "CREATE_SEIZURE",
        table_name: "contraband_items",
        record_id: contrabandData.id,
        new_values: formData,
      })

      toast({
        title: "Seizure Registered",
        description: `Seizure ${seizureNumber} has been successfully registered.`,
      })

      // Reset form
      setFormData({
        item_name: "",
        category_id: "",
        description: "",
        quantity: 0,
        unit: "",
        estimated_value: 0,
        weight_kg: 0,
        seizure_location: "",
        case_number: "",
        barcode: "",
        storage_location: "",
      })
      setPhotos([])
      setPhotoUrls([])
      setLocation(null)
    } catch (error) {
      console.error("Error submitting seizure:", error)
      toast({
        title: "Error",
        description: "Failed to register seizure. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="font-serif text-xl">Register New Seizure</CardTitle>
        <p className="text-muted-foreground">Complete all required fields to register contraband evidence</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Contraband Category *</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, category_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name} ({category.risk_level})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="item_name">Item Name *</Label>
              <Input
                id="item_name"
                value={formData.item_name}
                onChange={(e) => setFormData((prev) => ({ ...prev, item_name: e.target.value }))}
                placeholder="e.g., Cocaine, AK-47, Counterfeit iPhone"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Detailed description of seized items..."
              className="min-h-20"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                value={formData.quantity}
                onChange={(e) => setFormData((prev) => ({ ...prev, quantity: Number.parseFloat(e.target.value) || 0 }))}
                placeholder="0"
                required
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
                  <SelectItem value="liters">Liters</SelectItem>
                  <SelectItem value="boxes">Boxes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight_kg">Weight (kg)</Label>
              <Input
                id="weight_kg"
                type="number"
                step="0.001"
                value={formData.weight_kg}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, weight_kg: Number.parseFloat(e.target.value) || 0 }))
                }
                placeholder="0.000"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estimated_value">Estimated Value (ETB)</Label>
              <Input
                id="estimated_value"
                type="number"
                step="0.01"
                value={formData.estimated_value}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, estimated_value: Number.parseFloat(e.target.value) || 0 }))
                }
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="case_number">Case Number</Label>
              <Input
                id="case_number"
                value={formData.case_number}
                onChange={(e) => setFormData((prev) => ({ ...prev, case_number: e.target.value }))}
                placeholder="Optional case reference"
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label>Seizure Location *</Label>
            <div className="flex gap-2">
              <Input
                value={formData.seizure_location}
                onChange={(e) => setFormData((prev) => ({ ...prev, seizure_location: e.target.value }))}
                placeholder="Enter address or location description"
                required
              />
              <Button type="button" variant="outline" onClick={getLocation} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                GPS
              </Button>
            </div>
            {location && (
              <Badge variant="secondary" className="text-xs">
                GPS: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="barcode">Barcode/RFID</Label>
              <Input
                id="barcode"
                value={formData.barcode}
                onChange={(e) => setFormData((prev) => ({ ...prev, barcode: e.target.value }))}
                placeholder="Scan or enter manually"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="storage_location">Storage Location</Label>
              <Input
                id="storage_location"
                value={formData.storage_location}
                onChange={(e) => setFormData((prev) => ({ ...prev, storage_location: e.target.value }))}
                placeholder="e.g., Warehouse A, Evidence Room 1"
              />
            </div>
          </div>

          {/* Photos */}
          <div className="space-y-2">
            <Label>Evidence Photos</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-4">
              <div className="flex flex-col items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-upload"
                />
                <label htmlFor="photo-upload">
                  <Button type="button" variant="outline" asChild>
                    <span>
                      <Camera className="h-4 w-4 mr-2" />
                      Take/Upload Photos
                    </span>
                  </Button>
                </label>
              </div>

              {photoUrls.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {photoUrls.map((url, index) => (
                    <img
                      key={index}
                      src={url || "/placeholder.svg"}
                      alt={`Evidence photo ${index + 1}`}
                      className="w-full h-20 object-cover rounded border"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Register Seizure
                </>
              )}
            </Button>
            <Button type="button" variant="outline">
              Save Draft
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
