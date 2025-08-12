"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { MessageSquare, Send, Search, Bell, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { toast } from "@/hooks/use-toast"

interface Message {
  id: string
  from_user_id: string
  to_user_id: string
  subject?: string
  content: string
  priority: "low" | "normal" | "high" | "urgent"
  message_type: "general" | "approval_request" | "status_update" | "alert"
  contraband_id?: string
  is_read: boolean
  requires_response: boolean
  parent_message_id?: string
  created_at: string
  read_at?: string
  from_user?: { full_name: string; role: string; badge_number?: string }
  to_user?: { full_name: string; role: string; badge_number?: string }
  contraband?: { seizure_number: string; item_name: string }
}

interface MessageCenterProps {
  currentUser: {
    name: string
    role: string
  }
}

export function MessageCenter({ currentUser }: MessageCenterProps) {
  const [activeTab, setActiveTab] = useState("inbox")
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [contrabandItems, setContrabandItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentUserId, setCurrentUserId] = useState<string>("")

  const [newMessage, setNewMessage] = useState({
    to_user_id: "",
    subject: "",
    content: "",
    priority: "normal" as const,
    message_type: "general" as const,
    contraband_id: "",
    requires_response: false,
  })

  useEffect(() => {
    initializeData()
  }, [])

  const initializeData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
        await Promise.all([fetchMessages(user.id), fetchUsers(), fetchContrabandItems()])
      }
    } catch (error) {
      console.error("Error initializing data:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select(`
          *,
          from_user:users!messages_from_user_id_fkey(full_name, role, badge_number),
          to_user:users!messages_to_user_id_fkey(full_name, role, badge_number),
          contraband:contraband_items(seizure_number, item_name)
        `)
        .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
        .order("created_at", { ascending: false })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error("Error fetching messages:", error)
    }
  }

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, full_name, role, badge_number")
        .eq("is_active", true)
        .order("full_name")

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }

  const fetchContrabandItems = async () => {
    try {
      const { data, error } = await supabase
        .from("contraband_items")
        .select("id, seizure_number, item_name")
        .in("status", ["seized", "in_custody", "under_investigation"])
        .order("seizure_date", { ascending: false })
        .limit(50)

      if (error) throw error
      setContrabandItems(data || [])
    } catch (error) {
      console.error("Error fetching contraband items:", error)
    }
  }

  const sendMessage = async () => {
    try {
      if (!newMessage.to_user_id || !newMessage.content) {
        toast({
          title: "Error",
          description: "Please select a recipient and enter a message.",
          variant: "destructive",
        })
        return
      }

      const { error } = await supabase.from("messages").insert({
        from_user_id: currentUserId,
        to_user_id: newMessage.to_user_id,
        subject: newMessage.subject || null,
        content: newMessage.content,
        priority: newMessage.priority,
        message_type: newMessage.message_type,
        contraband_id: newMessage.contraband_id || null,
        requires_response: newMessage.requires_response,
      })

      if (error) throw error

      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully.",
      })

      setNewMessage({
        to_user_id: "",
        subject: "",
        content: "",
        priority: "normal",
        message_type: "general",
        contraband_id: "",
        requires_response: false,
      })

      fetchMessages(currentUserId)
      setActiveTab("inbox")
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      })
    }
  }

  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from("messages")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("id", messageId)

      if (error) throw error
      fetchMessages(currentUserId)
    } catch (error) {
      console.error("Error marking message as read:", error)
    }
  }

  const handleApproval = async (messageId: string, approved: boolean) => {
    try {
      // Send response message
      const responseMessage = approved ? "Your request has been approved." : "Your request has been rejected."

      const { error } = await supabase.from("messages").insert({
        from_user_id: currentUserId,
        to_user_id: selectedMessage?.from_user_id,
        subject: `Re: ${selectedMessage?.subject}`,
        content: responseMessage,
        priority: "high",
        message_type: "status_update",
        parent_message_id: messageId,
        contraband_id: selectedMessage?.contraband_id,
      })

      if (error) throw error

      toast({
        title: approved ? "Request Approved" : "Request Rejected",
        description: "Response has been sent to the requester.",
      })

      fetchMessages(currentUserId)
    } catch (error) {
      console.error("Error handling approval:", error)
    }
  }

  const getRoleColor = (role: string) => {
    const colors = {
      admin: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      supervisor: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      field_officer: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      warehouse_manager: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      auditor: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
    }
    return colors[role as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      urgent: "bg-red-500",
      high: "bg-orange-500",
      normal: "bg-blue-500",
      low: "bg-green-500",
    }
    return colors[priority as keyof typeof colors]
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "high":
        return <Bell className="h-4 w-4 text-orange-500" />
      case "normal":
        return <Clock className="h-4 w-4 text-blue-500" />
      default:
        return <Clock className="h-4 w-4 text-green-500" />
    }
  }

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case "approval_request":
        return <CheckCircle className="h-4 w-4 text-yellow-500" />
      case "alert":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "status_update":
        return <Bell className="h-4 w-4 text-blue-500" />
      default:
        return <MessageSquare className="h-4 w-4 text-gray-500" />
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    }
  }

  const filteredMessages = messages.filter((message) => {
    const matchesSearch =
      message.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.from_user?.full_name.toLowerCase().includes(searchTerm.toLowerCase())

    if (activeTab === "inbox") {
      return message.to_user_id === currentUserId && matchesSearch
    } else if (activeTab === "sent") {
      return message.from_user_id === currentUserId && matchesSearch
    }
    return matchesSearch
  })

  const unreadCount = messages.filter((m) => m.to_user_id === currentUserId && !m.is_read).length

  if (loading) {
    return <div className="text-center py-8">Loading messages...</div>
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background">
      <div className="w-1/3 border-r border-border">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="h-5 w-5 text-primary" />
            <h2 className="font-serif font-semibold text-lg">Message Center</h2>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-auto">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search messages..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 m-2">
            <TabsTrigger value="inbox" className="relative">
              Inbox
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-1 h-4 w-4 p-0 text-xs">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent">Sent</TabsTrigger>
            <TabsTrigger value="compose">Compose</TabsTrigger>
          </TabsList>

          <TabsContent value="inbox" className="mt-0">
            <ScrollArea className="h-[calc(100vh-12rem)]">
              <div className="p-2">
                {filteredMessages.map((message) => (
                  <Card
                    key={message.id}
                    className={`mb-2 cursor-pointer transition-colors hover:bg-muted/50 ${
                      selectedMessage?.id === message.id ? "bg-muted" : ""
                    } ${!message.is_read ? "border-l-4 border-l-primary" : ""}`}
                    onClick={() => {
                      setSelectedMessage(message)
                      if (!message.is_read) {
                        markAsRead(message.id)
                      }
                    }}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {message.from_user?.full_name
                                .split(" ")
                                .map((n) => n[0])
                                .join("") || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{message.from_user?.full_name}</p>
                            <Badge
                              variant="outline"
                              className={`text-xs ${getRoleColor(message.from_user?.role || "")}`}
                            >
                              {message.from_user?.role?.replace("_", " ").toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {getPriorityIcon(message.priority)}
                          {getMessageTypeIcon(message.message_type)}
                          <span className="text-xs text-muted-foreground">{formatDate(message.created_at)}</span>
                        </div>
                      </div>
                      <h4 className="font-medium text-sm mb-1">
                        {message.subject || `${message.message_type.replace("_", " ").toUpperCase()}`}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-2">{message.content}</p>
                      {message.contraband && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          {message.contraband.seizure_number}
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                ))}
                {filteredMessages.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">No messages found.</div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="sent" className="mt-0">
            <ScrollArea className="h-[calc(100vh-12rem)]">
              <div className="p-2">
                {filteredMessages.map((message) => (
                  <Card
                    key={message.id}
                    className={`mb-2 cursor-pointer transition-colors hover:bg-muted/50 ${
                      selectedMessage?.id === message.id ? "bg-muted" : ""
                    }`}
                    onClick={() => setSelectedMessage(message)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {message.to_user?.full_name
                                .split(" ")
                                .map((n) => n[0])
                                .join("") || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">To: {message.to_user?.full_name}</p>
                            <Badge variant="outline" className={`text-xs ${getRoleColor(message.to_user?.role || "")}`}>
                              {message.to_user?.role?.replace("_", " ").toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {getPriorityIcon(message.priority)}
                          <span className="text-xs text-muted-foreground">{formatDate(message.created_at)}</span>
                        </div>
                      </div>
                      <h4 className="font-medium text-sm mb-1">
                        {message.subject || `${message.message_type.replace("_", " ").toUpperCase()}`}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-2">{message.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="compose" className="mt-0">
            <ScrollArea className="h-[calc(100vh-12rem)]">
              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label>To *</Label>
                  <Select
                    value={newMessage.to_user_id}
                    onValueChange={(value) => setNewMessage({ ...newMessage, to_user_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select recipient..." />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name} ({user.role.replace("_", " ")})
                          {user.badge_number && ` - ${user.badge_number}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Message Type</Label>
                  <Select
                    value={newMessage.message_type}
                    onValueChange={(value: any) => setNewMessage({ ...newMessage, message_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Message</SelectItem>
                      <SelectItem value="approval_request">Approval Request</SelectItem>
                      <SelectItem value="status_update">Status Update</SelectItem>
                      <SelectItem value="alert">Alert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input
                    value={newMessage.subject}
                    onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                    placeholder="Enter message subject..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={newMessage.priority}
                    onValueChange={(value: any) => setNewMessage({ ...newMessage, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newMessage.message_type === "approval_request" && (
                  <div className="space-y-2">
                    <Label>Related Contraband (Optional)</Label>
                    <Select
                      value={newMessage.contraband_id}
                      onValueChange={(value) => setNewMessage({ ...newMessage, contraband_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select contraband item..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {contrabandItems.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.seizure_number} - {item.item_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Message *</Label>
                  <Textarea
                    value={newMessage.content}
                    onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                    placeholder="Type your message here..."
                    rows={6}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="requires_response"
                    checked={newMessage.requires_response}
                    onChange={(e) => setNewMessage({ ...newMessage, requires_response: e.target.checked })}
                  />
                  <Label htmlFor="requires_response">Requires Response</Label>
                </div>

                <Button
                  onClick={sendMessage}
                  className="w-full"
                  disabled={!newMessage.to_user_id || !newMessage.content}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedMessage ? (
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-border">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {(activeTab === "sent"
                        ? selectedMessage.to_user?.full_name
                        : selectedMessage.from_user?.full_name
                      )
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("") || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">
                      {activeTab === "sent"
                        ? `To: ${selectedMessage.to_user?.full_name}`
                        : `From: ${selectedMessage.from_user?.full_name}`}
                    </h3>
                    <Badge
                      variant="outline"
                      className={getRoleColor(
                        (activeTab === "sent" ? selectedMessage.to_user?.role : selectedMessage.from_user?.role) || "",
                      )}
                    >
                      {(activeTab === "sent" ? selectedMessage.to_user?.role : selectedMessage.from_user?.role)
                        ?.replace("_", " ")
                        .toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedMessage.created_at).toLocaleString()}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {getPriorityIcon(selectedMessage.priority)}
                    <span className="text-xs capitalize">{selectedMessage.priority} Priority</span>
                    {getMessageTypeIcon(selectedMessage.message_type)}
                    <span className="text-xs">{selectedMessage.message_type.replace("_", " ")}</span>
                  </div>
                </div>
              </div>
              <h2 className="text-xl font-serif font-semibold">
                {selectedMessage.subject || `${selectedMessage.message_type.replace("_", " ").toUpperCase()}`}
              </h2>
              {selectedMessage.contraband && (
                <Badge variant="outline" className="mt-2">
                  Related: {selectedMessage.contraband.seizure_number} - {selectedMessage.contraband.item_name}
                </Badge>
              )}
            </div>
            <ScrollArea className="flex-1 p-4">
              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap">{selectedMessage.content}</p>
              </div>
            </ScrollArea>
            {activeTab === "inbox" && (
              <div className="p-4 border-t border-border">
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 bg-transparent">
                    Reply
                  </Button>
                  <Button variant="outline">Forward</Button>
                  {selectedMessage.message_type === "approval_request" && (
                    <>
                      <Button
                        variant="default"
                        onClick={() => handleApproval(selectedMessage.id, true)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button variant="destructive" onClick={() => handleApproval(selectedMessage.id, false)}>
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center">
            <div>
              <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Select a message</h3>
              <p className="text-muted-foreground">Choose a message from the list to view its contents</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
