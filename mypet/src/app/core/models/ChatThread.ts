export interface ChatThread {
  chatId: string;
  receiverId: string;
  receiverName: string;
  receiverAvatar?: string;
  lastMessage: string;
  lastTimestamp: number;
}
