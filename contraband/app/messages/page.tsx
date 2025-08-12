import { MessageCenter } from "@/components/messaging/message-center"

export default function MessagesPage() {
  // In real implementation, this would come from authentication context
  const currentUser = {
    name: "Dawit Alemayehu",
    role: "Supervisor",
  }

  return (
    <div className="h-full">
      <MessageCenter currentUser={currentUser} />
    </div>
  )
}
