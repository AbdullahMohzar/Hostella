import { useState, useEffect, useRef } from 'react';
import { Send, User, CornerUpLeft } from 'lucide-react';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { 
    collection, query, orderBy, limit, onSnapshot, 
    addDoc, serverTimestamp 
} from 'firebase/firestore';
import './ChatWindow.css';

// Reusable component for P2P or Support chats
export function ChatWindow({ chatId, collectionName, onClose, recipientName, recipientId }) {
    const { currentUser } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);

    // 1. Real-time Message Listener
    useEffect(() => {
        if (!chatId || !collectionName) return;

        // Path dynamically uses the correct collection: /chats/ or /supportChats/
        const messagesRef = collection(db, collectionName, chatId, 'messages');
        const q = query(messagesRef, orderBy('createdAt', 'asc'), limit(50));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMessages(msgs);
        }, (error) => {
            console.error(`Error fetching messages from ${collectionName}:`, error);
        });

        return () => unsubscribe();
    }, [chatId, collectionName]);

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        // Check for required fields (especially recipientId for notification targeting)
        if (newMessage.trim() === '' || !currentUser || !chatId || !recipientId) return;

        const messageText = newMessage.trim();
        const senderName = currentUser.displayName || 'Guest';

        try {
            // 1. Send the Message to the specific thread in the correct collection
            const messagesRef = collection(db, collectionName, chatId, 'messages');
            await addDoc(messagesRef, {
                senderId: currentUser.uid,
                senderName: senderName,
                text: messageText,
                createdAt: serverTimestamp(),
            });
            
            // 2. Generate Notification for the Recipient (Stored in /notifications)
            await addDoc(collection(db, 'notifications'), {
                userId: recipientId, // TARGET: This is the recipient's UID
                type: 'chat',
                title: `💬 New Message from ${senderName}`,
                message: `You have a new message in your chat with ${senderName}.`,
                date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                read: false,
                action: 'View Chat',
                relatedId: chatId, // This chatId links the notification to the thread
                createdAt: serverTimestamp()
            });

            setNewMessage('');
        } catch (error) {
            console.error("Error sending message or notification:", error);
            alert("Failed to send message/notification. Check permissions.");
        }
    };

    return (
        <div className="chat-modal">
            <div className="chat-window">
                {/* Header */}
                <div className="chat-header">
                    <button className="back-btn" onClick={onClose}>
                        <CornerUpLeft size={20} />
                    </button>
                    <h3 className="recipient-name">Chatting with {recipientName || 'Hostella Support'}</h3>
                </div>

                {/* Messages Body */}
                <div className="chat-messages">
                    {messages.length === 0 && (
                        <div className="empty-chat">
                            <User size={40} />
                            <p>Start your conversation!</p>
                        </div>
                    )}
                    {messages.map((msg) => (
                        <div 
                            key={msg.id} 
                            className={`message ${msg.senderId === currentUser?.uid ? 'mine' : 'theirs'}`}
                        >
                            <div className="message-bubble">
                                <span className="message-sender">{msg.senderName.split(' ')[0]}</span>
                                <p className="message-text">{msg.text}</p>
                                <span className="message-time">
                                    {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sending...'}
                                </span>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Form */}
                <form onSubmit={handleSend} className="chat-input-form">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        disabled={!currentUser || !chatId}
                    />
                    <button type="submit" disabled={!currentUser || !chatId}>
                        <Send size={20} />
                    </button>
                </form>
            </div>
        </div>
    );
}