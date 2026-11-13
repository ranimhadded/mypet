import { Component, OnInit } from '@angular/core';
import { SideBarComponent } from '../../components/sidebar/sidebar.component';
import { ChatMessage } from '../../core/models/ChatMessage';
import { ChatThread } from '../../core/models/ChatThread';
import { ChatService } from '../../core/services/chat.service';
import { Auth, authState } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [SideBarComponent, FormsModule, CommonModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent implements OnInit {
  chatId!: string;
  receiverId!: string;
  receiverName = '';
  receiverAvatar = '';
  messages$: Observable<ChatMessage[]> | undefined;
  newMessage = '';
  currentUserId = '';
  currentUserName = '';

  chatThreads: ChatThread[] = [];
  currentChatId = '';

  constructor(
    private route: ActivatedRoute,
    private chatService: ChatService,
    private auth: Auth
  ) {}

 ngOnInit(): void {
  authState(this.auth).subscribe(user => {
    if (!user) return;

    this.currentUserId = user.uid;
    this.currentUserName = user.displayName || 'Me';

    // Load chat threads for the sidebar
    this.chatService.getUserChats(this.currentUserId).subscribe(threads => {
      this.chatThreads = threads;

      // Now handle query params
      this.route.queryParams.subscribe(params => {
        const chatId = params['chatId'];
        const receiverId = params['receiverId'];
        const receiverName = params['receiverName'];
        const receiverAvatar = params['receiverAvatar'];

        if (chatId && receiverId) {
          // Open chat from query params
          this.openChat(chatId, receiverId, receiverName || 'Unknown', receiverAvatar);
        } else if (threads.length) {
          // No query params → open first chat by default
          const first = threads[0];
          this.openChat(first.chatId, first.receiverId, first.receiverName, first.receiverAvatar);
        }
      });
    });
  });
}


  openChat(chatId: string, receiverId: string, receiverName: string, receiverAvatar?: string) {
    this.currentChatId = chatId;
    this.chatId = chatId;
    this.receiverId = receiverId;
    this.receiverName = receiverName;
    this.receiverAvatar = receiverAvatar || 'assets/user.png';

    // Load messages for this chat
    this.messages$ = this.chatService.getMessages(chatId);
  }

  sendMessage() {
    if (!this.newMessage.trim()) return;

const msg: ChatMessage = {
  senderId: this.currentUserId,
  receiverId: this.receiverId,
  senderName: this.currentUserName,
  receiverName: this.receiverName, // <--- add this
  message: this.newMessage,
  timestamp: Date.now(),
};


    this.chatService.sendMessage(this.chatId, msg);
    this.newMessage = '';
  }
}
