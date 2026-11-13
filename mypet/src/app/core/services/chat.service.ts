import { Injectable } from '@angular/core';
import { Database, ref, push, onValue } from '@angular/fire/database';
import { Observable } from 'rxjs';
import { ChatMessage } from '../models/ChatMessage';
import { ChatThread } from '../models/ChatThread';

@Injectable({ providedIn: 'root' })
export class ChatService {
  constructor(private db: Database) {}

  /** Get all messages for a specific chat */
  getMessages(chatId: string): Observable<ChatMessage[]> {
    const refPath = ref(this.db, `chats/${chatId}/messages`);

    return new Observable(observer => {
      onValue(refPath, snapshot => {
        const data = snapshot.val() || {};
        const messages: ChatMessage[] = Object.values(data);
        observer.next(messages);
      });
    });
  }

  /** Send a new message to a chat */
  sendMessage(chatId: string, msg: ChatMessage) {
    const refPath = ref(this.db, `chats/${chatId}/messages`);
    return push(refPath, msg);
  }

  /** Get all chat threads for the current user */
  getUserChats(currentUserId: string): Observable<ChatThread[]> {
  const chatsRef = ref(this.db, 'chats');

  return new Observable(observer => {
    onValue(chatsRef, snapshot => {
      const data = snapshot.val() || {};
      const threads: ChatThread[] = [];

      Object.keys(data).forEach(chatId => {
        const chat = data[chatId];
        const messages = chat.messages || {};
        const messageArray = Object.values(messages) as ChatMessage[];

        if (!messageArray.length) return;

        // Only include chats where current user is sender or receiver
        const lastMsg = messageArray[messageArray.length - 1];
        if (lastMsg.senderId !== currentUserId && lastMsg.receiverId !== currentUserId) return;

        // Determine the "other user" in the chat
        const receiverId = lastMsg.senderId === currentUserId ? lastMsg.receiverId : lastMsg.senderId;
        const receiverName = lastMsg.senderId === currentUserId ? lastMsg.receiverName : lastMsg.senderName;
        const receiverAvatar = lastMsg.avatarUrl || 'assets/user.png';

        threads.push({
          chatId,
          receiverId,
          receiverName,
          lastMessage: lastMsg.message,
          lastTimestamp: lastMsg.timestamp,
          receiverAvatar
        });
      });

      threads.sort((a, b) => b.lastTimestamp - a.lastTimestamp);
      observer.next(threads);
    });
  });
}
}
