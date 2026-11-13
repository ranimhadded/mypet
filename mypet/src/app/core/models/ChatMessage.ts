export interface ChatMessage {
  senderId: string;       // UID of the sender
  receiverId: string;     // UID of the receiver (or a group/chat room id)
  senderName: string;     // Display name of sender
  receiverName: string;
  message: string;        // Message text
  timestamp: number;      // Unix timestamp or Date.now()
  avatarUrl?: string;     // Optional avatar for the sender
  read?: boolean;         // Optional read status
}
