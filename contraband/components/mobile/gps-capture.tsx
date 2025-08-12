"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface GPSLocation {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
}

interface GPSCaptureProps {
  onLocationCapture: (location: GPSLocation) => void
  disabled?: boolean
}

export function GPSCapture({ onLocationCapture, disabled }: GPSCaptureProps) {
  const [isCapturing, setIsCapturing] = useState(false)
  const [location, setLocation] = useState<GPSLocation | null>(null)
  const [error, setError] = useState<string | null>(null)

  const captureLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser")
      return
    }

    setIsCapturing(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation: GPSLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now(),
        }
        setLocation(newLocation)
        onLocationCapture(newLocation)
        setIsCapturing(false)
      },
      (error) => {
        let errorMessage = "Failed to get location"
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied by user"
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable"
            break
          case error.TIMEOUT:
            errorMessage = "Location request timed out"
            break
        }
        setError(errorMessage)
        setIsCapturing(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          GPS Location Capture
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={captureLocation} disabled={disabled || isCapturing} className="w-full">
          {isCapturing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Capturing Location...
            </>
          ) : (
            <>
              <MapPin className="mr-2 h-4 w-4" />
              Capture Current Location
            </>
          )}
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {location && (
          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="font-medium">Latitude:</span>
                <div className="text-muted-foreground">{location.latitude.toFixed(6)}</div>
              </div>
              <div>
                <span className="font-medium">Longitude:</span>
                <div className="text-muted-foreground">{location.longitude.toFixed(6)}</div>
              </div>
            </div>
            <div>
              <span className="font-medium">Accuracy:</span>
              <span className="text-muted-foreground ml-2">{location.accuracy.toFixed(0)}m</span>
            </div>
            <div>
              <span className="font-medium">Captured:</span>
              <span className="text-muted-foreground ml-2">{new Date(location.timestamp).toLocaleString()}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
