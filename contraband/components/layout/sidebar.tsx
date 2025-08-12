"use client"

import {
  Home,
  Package,
  Scan,
  Warehouse,
  FileText,
  Users,
  Settings,
  Shield,
  Truck,
  Trash2,
  MessageSquare,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface SidebarProps {
  userRole: string
  activeItem?: string
  onItemClick?: (item: string) => void
}

const menuItems = {
  Admin: [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "messages", label: "Messages", icon: MessageSquare }, // Added messaging for Admin
    { id: "users", label: "User Management", icon: Users },
    { id: "contraband", label: "Contraband Records", icon: Package },
    { id: "locations", label: "Storage Locations", icon: Warehouse },
    { id: "reports", label: "Reports & Audit", icon: FileText },
    { id: "settings", label: "System Settings", icon: Settings },
  ],
  Supervisor: [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "messages", label: "Messages", icon: MessageSquare }, // Added messaging for Supervisor
    { id: "approvals", label: "Pending Approvals", icon: Shield },
    { id: "contraband", label: "Contraband Records", icon: Package },
    { id: "transfers", label: "Custody Transfers", icon: Truck },
    { id: "destruction", label: "Destruction Requests", icon: Trash2 },
    { id: "reports", label: "Reports", icon: FileText },
  ],
  "Field Officer": [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "messages", label: "Messages", icon: MessageSquare }, // Added messaging for Field Officer
    { id: "register", label: "Register Seizure", icon: Scan },
    { id: "contraband", label: "My Seizures", icon: Package },
    { id: "transfers", label: "Transfer Requests", icon: Truck },
    { id: "field", label: "Field Registration", icon: Scan }, // Added field officer page link
  ],
  "Warehouse Manager": [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "messages", label: "Messages", icon: MessageSquare }, // Added messaging for Warehouse Manager
    { id: "inventory", label: "Inventory Management", icon: Warehouse },
    { id: "scan", label: "Barcode Scanner", icon: Scan },
    { id: "transfers", label: "Custody Transfers", icon: Truck },
    { id: "contraband", label: "Stored Items", icon: Package },
  ],
  Auditor: [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "messages", label: "Messages", icon: MessageSquare }, // Added messaging for Auditor
    { id: "audit", label: "Audit Logs", icon: FileText },
    { id: "contraband", label: "Evidence Records", icon: Package },
    { id: "reports", label: "Compliance Reports", icon: FileText },
  ],
}

export function Sidebar({ userRole, activeItem = "dashboard", onItemClick }: SidebarProps) {
  const items = menuItems[userRole as keyof typeof menuItems] || menuItems.Admin

  return (
    <aside className="w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="p-4">
        <div className="mb-6">
          <h2 className="font-serif font-bold text-lg text-sidebar-foreground">{userRole} Portal</h2>
          <p className="text-sm text-sidebar-foreground/70">Evidence Management</p>
        </div>

        <nav className="space-y-2">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <Button
                key={item.id}
                variant={activeItem === item.id ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 text-left",
                  activeItem === item.id
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
                onClick={() => onItemClick?.(item.id)}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Button>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
