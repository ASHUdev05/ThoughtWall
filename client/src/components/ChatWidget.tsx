import React, { useEffect, useState, useRef } from 'react';
import { Client, type IMessage } from '@stomp/stompjs'; // Import IMessage interface
import { chatService, type ChatMessage } from '../services/chatService';
import { userService } from '../services/userService';
import './ChatWidget.css'; 

interface ChatWidgetProps {
  roomId: string;
  stompClient: Client | null;
  connected: boolean;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ roomId, stompClient, connected }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false); 
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Use the new helper method we just added
  const currentUserEmail = userService.getUser()?.sub || userService.getUser()?.email;

  useEffect(() => {
    if (roomId) {
      chatService.getHistory(roomId).then(setMessages).catch(console.error);
    }
  }, [roomId]);

  useEffect(() => {
    if (stompClient && connected && roomId) {
      // Added type annotation (message: IMessage)
      const subscription = stompClient.subscribe(`/topic/room/${roomId}/chat`, (message: IMessage) => {
        const receivedMsg: ChatMessage = JSON.parse(message.body);
        setMessages((prev) => [...prev, receivedMsg]);
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [stompClient, connected, roomId]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = () => {
    if (stompClient && newMessage.trim() && currentUserEmail) {
      stompClient.publish({
        destination: `/app/chat/${roomId}`,
        body: JSON.stringify({
          content: newMessage,
          email: currentUserEmail
        })
      });
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend();
  };

  if (!isOpen) {
    return (
      <button className="chat-toggle-btn" onClick={() => setIsOpen(true)}>
        💬 Chat
      </button>
    );
  }

  return (
    <div className="chat-widget">
      <div className="chat-header">
        <h3>Room Chat</h3>
        <button onClick={() => setIsOpen(false)}>×</button>
      </div>
      <div className="chat-messages">
        {messages.map((msg) => {
          // Compare emails safely
          const isMe = msg.sender.email === currentUserEmail;
          return (
            <div key={msg.id} className={`message-bubble ${isMe ? 'my-message' : 'other-message'}`}>
              {!isMe && <div className="message-sender">{msg.sender.email}</div>}
              <div className="message-text">{msg.content}</div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-input-area">
        <input 
          type="text" 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type a message..."
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
};

export default ChatWidget;