"use client"

import { useState } from "react"
import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { StatsCard } from "@/components/dashboard/stats-card"
import { SeizureForm } from "@/components/contraband/seizure-form"
import { ContrabandList } from "@/components/contraband/contraband-list"
import { MessageCenter } from "@/components/messaging/message-center" // Added MessageCenter import
import { Package, Truck, AlertTriangle, FileText, Warehouse } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function HomePage() {
  const [currentUser] = useState({
    name: "Officer Tadesse Bekele",
    role: "Field Officer",
  })
  const [activeView, setActiveView] = useState("dashboard")
  const [selectedRole, setSelectedRole] = useState("Field Officer")

  const renderContent = () => {
    switch (activeView) {
      case "register":
        return <SeizureForm />
      case "contraband":
        return <ContrabandList />
      case "messages": // Added messages case
        return <MessageCenter currentUser={{ name: currentUser.name, role: selectedRole }} />
      case "dashboard":
      default:
        return (
          <div className="space-y-6">
            {/* Role Selector for Demo */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Demo: Switch User Role</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Supervisor">Supervisor</SelectItem>
                    <SelectItem value="Field Officer">Field Officer</SelectItem>
                    <SelectItem value="Warehouse Manager">Warehouse Manager</SelectItem>
                    <SelectItem value="Auditor">Auditor</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard
                title="Total Seizures"
                value="1,247"
                description="Active contraband records"
                icon={Package}
                trend={{ value: 12, isPositive: true }}
              />
              <StatsCard
                title="Pending Transfers"
                value="23"
                description="Awaiting approval"
                icon={Truck}
                trend={{ value: -5, isPositive: false }}
              />
              <StatsCard title="Storage Locations" value="8" description="Active warehouses" icon={Warehouse} />
              <StatsCard title="Audit Flags" value="3" description="Require attention" icon={AlertTriangle} />
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-3 border rounded-lg">
                    <Package className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <p className="font-medium">New seizure registered</p>
                      <p className="text-sm text-muted-foreground">CMS-2024-004 - Drugs (Cocaine) - 1.2kg</p>
                    </div>
                    <span className="text-sm text-muted-foreground">2 hours ago</span>
                  </div>

                  <div className="flex items-center gap-4 p-3 border rounded-lg">
                    <Truck className="h-5 w-5 text-accent" />
                    <div className="flex-1">
                      <p className="font-medium">Transfer approved</p>
                      <p className="text-sm text-muted-foreground">CMS-2024-002 moved to Warehouse B</p>
                    </div>
                    <span className="text-sm text-muted-foreground">4 hours ago</span>
                  </div>

                  <div className="flex items-center gap-4 p-3 border rounded-lg">
                    <FileText className="h-5 w-5 text-green-600" />
                    <div className="flex-1">
                      <p className="font-medium">Audit report generated</p>
                      <p className="text-sm text-muted-foreground">Monthly compliance report completed</p>
                    </div>
                    <span className="text-sm text-muted-foreground">1 day ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header userRole={selectedRole} userName={currentUser.name} notifications={5} />

      <div className="flex">
        <Sidebar userRole={selectedRole} activeItem={activeView} onItemClick={setActiveView} />

        <main className="flex-1 p-6">{renderContent()}</main>
      </div>
    </div>
  )
}
