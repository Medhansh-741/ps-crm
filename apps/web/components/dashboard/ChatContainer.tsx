import ChatPanel from "@/components/ChatPanel";

interface ChatContainerProps {
  className?: string;
}

export default function ChatContainer({ className = "" }: ChatContainerProps) {
  return (
    <div className={`h-full ${className}`.trim()}>
      <ChatPanel />
    </div>
  );
}