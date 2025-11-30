import { useState, useEffect, useRef } from 'react';
import { Send, User, CornerUpLeft, Building } from 'lucide-react';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { 
    collection, query, orderBy, limit, onSnapshot, 
    addDoc, serverTimestamp, doc, setDoc, getDoc
} from 'firebase/firestore';
import './ChatWindow.css';

export function ChatWindow({ chatId, collectionName, onClose, recipientName, recipientId, hostelName }) {
    const { currentUser } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);

    // Ensure support chat document exists
    useEffect(() => {
        const ensureSupportChatExists = async () => {
            if (collectionName === 'supportChats' && chatId && currentUser) {
                try {
                    const chatRef = doc(db, 'supportChats', chatId);
                    const chatSnap = await getDoc(chatRef);
                    
                    if (!chatSnap.exists()) {
                        // Create the support chat document if it doesn't exist
                        await setDoc(chatRef, {
                            ownerId: currentUser.uid,
                            userId: recipientId,
                            userEmail: recipientName,
                            hostelName: hostelName || 'General Support',
                            createdAt: serverTimestamp(),
                            lastMessageAt: serverTimestamp()
                        });
                    }
                } catch (error) {
                    console.error("Error ensuring support chat exists:", error);
                }
            }
        };

        ensureSupportChatExists();
    }, [chatId, collectionName, currentUser, recipientId, recipientName, hostelName]);

    // 1. Real-time Message Listener
    useEffect(() => {
        if (!chatId || !collectionName) return;

        setLoading(true);
        
        const messagesRef = collection(db, collectionName, chatId, 'messages');
        const q = query(messagesRef, orderBy('createdAt', 'asc'), limit(100));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMessages(msgs);
            setLoading(false);
        }, (error) => {
            console.error(`Error fetching messages from ${collectionName}:`, error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [chatId, collectionName]);

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (newMessage.trim() === '' || !currentUser || !chatId || !recipientId) return;

        const messageText = newMessage.trim();
        const senderName = currentUser.displayName || currentUser.email || 'Guest';

        try {
            // 1. Send the Message
            const messagesRef = collection(db, collectionName, chatId, 'messages');
            await addDoc(messagesRef, {
                senderId: currentUser.uid,
                senderName: senderName,
                text: messageText,
                createdAt: serverTimestamp(),
            });
            
            // 2. Update last message timestamp in support chat document
            if (collectionName === 'supportChats') {
                const chatRef = doc(db, 'supportChats', chatId);
                await setDoc(chatRef, {
                    lastMessageAt: serverTimestamp()
                }, { merge: true });
            }
            
            // 3. Generate Notification for the Recipient
            await addDoc(collection(db, 'notifications'), {
                userId: recipientId,
                type: 'chat',
                title: `💬 New Message from ${senderName}`,
                message: `You have a new message in your chat with ${senderName}.`,
                date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                read: false,
                action: 'View Chat',
                relatedId: chatId,
                createdAt: serverTimestamp()
            });

            setNewMessage('');
        } catch (error) {
            console.error("Error sending message or notification:", error);
            console.error("Error details:", error.code, error.message);
            alert(`Failed to send message: ${error.message}`);
        }
    };

    const formatMessageTime = (timestamp) => {
        if (!timestamp?.toDate) return 'Sending...';
        
        const messageDate = timestamp.toDate();
        const now = new Date();
        const diffInHours = (now - messageDate) / (1000 * 60 * 60);
        
        if (diffInHours < 24) {
            return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
            return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
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
                    <div className="chat-header-info">
                        <h3 className="recipient-name">Chat with {recipientName || 'User'}</h3>
                        {hostelName && (
                            <p className="hostel-context">
                                <Building size={14} style={{ marginRight: '6px' }} />
                                Regarding: {hostelName}
                            </p>
                        )}
                        <span className="chat-type-badge">
                            {collectionName === 'supportChats' ? 'Support Chat' : 'Direct Message'}
                        </span>
                    </div>
                </div>

                {/* Messages Body */}
                <div className="chat-messages">
                    {loading ? (
                        <div className="empty-chat">
                            <div className="loading-spinner"></div>
                            <p>Loading messages...</p>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="empty-chat">
                            <User size={40} />
                            <p>Start your conversation!</p>
                            <p className="empty-chat-subtitle">
                                {collectionName === 'supportChats' 
                                    ? 'This is a support chat about ' + (hostelName || 'your hostel')
                                    : 'Send a message to start chatting'
                                }
                            </p>
                        </div>
                    ) : (
                        <>
                            {messages.map((msg, index) => {
                                const showSender = index === 0 || 
                                    messages[index - 1].senderId !== msg.senderId;
                                
                                return (
                                    <div 
                                        key={msg.id} 
                                        className={`message ${msg.senderId === currentUser?.uid ? 'mine' : 'theirs'} ${showSender ? 'show-sender' : 'compact'}`}
                                    >
                                        {showSender && msg.senderId !== currentUser?.uid && (
                                            <span className="message-sender-name">
                                                {msg.senderName}
                                            </span>
                                        )}
                                        <div className="message-bubble">
                                            <p className="message-text">{msg.text}</p>
                                            <span className="message-time">
                                                {formatMessageTime(msg.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </>
                    )}
                </div>

                {/* Input Form */}
                <form onSubmit={handleSend} className="chat-input-form">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={collectionName === 'supportChats' 
                            ? `Type your response about ${hostelName || 'the hostel'}...` 
                            : "Type a message..."
                        }
                        disabled={!currentUser || !chatId || loading}
                    />
                    <button 
                        type="submit" 
                        disabled={!currentUser || !chatId || loading || newMessage.trim() === ''}
                        className={newMessage.trim() === '' ? 'disabled' : ''}
                    >
                        <Send size={20} />
                    </button>
                </form>
            </div>
        </div>
    );
}