import { useState, useEffect } from 'react';
import { Check, X, Tag, Bell, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { 
  collection, query, where, onSnapshot, 
  addDoc, serverTimestamp, updateDoc, doc, writeBatch, getDocs, deleteDoc
} from 'firebase/firestore';
import './Notifications.css';

// Added onAction prop to handle navigation/logic when button is clicked
export function Notifications({ onAction }) {
  const { currentUser } = useAuth();
  const [filter, setFilter] = useState('All');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- 1. REAL-TIME LISTENER: Fetch Notifications ---
  useEffect(() => {
    if (!currentUser) { 
        setLoading(false); 
        return;
    }

    const q = query(
      collection(db, 'notifications'), 
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      items.sort((a, b) => {
         const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date();
         const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date();
         return dateB - dateA;
      });

      setNotifications(items);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching notifications:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);


  // --- 2. BOOKING SYNC: Generate Notification when Booking is Confirmed (FINAL FIX) ---
  useEffect(() => {
    if (!currentUser) return;

    const qBookings = query(
      collection(db, 'bookings'),
      where('userId', '==', currentUser.uid)
      // Filter out bookings that have ALREADY been notified
      // where('hasNotified', '!=', true) <-- This requires an index, so we check existence in the loop
    );

    const unsubscribeBookings = onSnapshot(qBookings, async (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        const booking = change.doc.data();
        const bookingId = change.doc.id;

        // Condition 1: Status is CONFIRMED
        // Condition 2: Ensure we haven't already processed this status change
        if (booking.status === 'confirmed' && booking.hasNotified !== true) {
          
          // 1. GENERATE NOTIFICATION
          await addDoc(collection(db, 'notifications'), {
               userId: currentUser.uid,
               type: 'booking',
               title: 'Booking Confirmed!',
               message: `Your stay at ${booking.hostelName} is confirmed for ${booking.checkIn}.`,
               date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
               read: false,
               action: 'View Booking',
               relatedId: bookingId, 
               hostelId: booking.hostelId,
               createdAt: serverTimestamp()
          });

          // 2. STAMP THE BOOKING DOCUMENT (CRITICAL STEP)
          // This stops the listener from firing for this confirmed booking ever again on reload/status change
          await updateDoc(doc(db, 'bookings', bookingId), {
              hasNotified: true
          });
        }
      });
    });

    return () => unsubscribeBookings();
  }, [currentUser]);


  // --- Actions ---

  const handleMarkRead = async (id) => {
    try {
        await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (error) {
        console.error("Error marking read:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
        await deleteDoc(doc(db, 'notifications', id));
    } catch (error) {
        console.error("Error deleting notification:", error);
        alert("Failed to delete notification. Check permissions.");
    }
  };

  const handleMarkAllRead = async () => {
    const batch = writeBatch(db);
    notifications.forEach(n => {
       if (!n.read) {
         batch.update(doc(db, 'notifications', n.id), { read: true });
       }
    });
    try {
        await batch.commit();
    } catch (error) {
        console.error("Error marking all read:", error);
        alert("Failed to mark all read. Check permissions.");
    }
  };

  const handleClearAll = async () => {
    if(window.confirm("Clear all notifications? This action cannot be undone.")) {
      const batch = writeBatch(db);
      notifications.forEach(n => batch.delete(doc(db, 'notifications', n.id)));
      try {
          await batch.commit();
      } catch (error) {
          console.error("Error clearing all:", error);
          alert("Failed to clear all notifications. Check permissions.");
      }
    }
  };

  // --- Filtering Logic ---
  const filteredNotifications = notifications.filter(n => {
    if (filter === 'All') return true;
    if (filter === 'Unread') return !n.read;
    if (filter === 'Bookings') return n.type === 'booking';
    if (filter === 'Offers') return n.type === 'offer';
    if (filter === 'Chat') return n.type === 'chat';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const offersCount = notifications.filter(n => n.type === 'offer').length;
  const chatCount = notifications.filter(n => n.type === 'chat').length;


  if (loading) return <div className="p-10 text-center text-gray-500">Loading updates...</div>;

  return (
    <div className="notifications-container">
      
      {/* Header Section */}
      <div className="notif-header-row">
        <div>
          <h2 className="notif-title">Notifications</h2>
          <p className="notif-subtitle">Stay updated with your bookings and special offers</p>
        </div>
        <div className="header-actions">
          <button className="btn-outline" onClick={handleMarkAllRead}>
            <Check className="w-4 h-4 mr-2" /> Mark All Read
          </button>
          <button className="btn-outline" onClick={handleClearAll}>
            Clear All
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button className={`pill-tab ${filter === 'All' ? 'active' : ''}`} onClick={() => setFilter('All')}>All ({notifications.length})</button>
        <button className={`pill-tab ${filter === 'Unread' ? 'active' : ''}`} onClick={() => setFilter('Unread')}>Unread ({unreadCount})</button>
        <button className={`pill-tab ${filter === 'Bookings' ? 'active' : ''}`} onClick={() => setFilter('Bookings')}>Bookings</button>
        <button className={`pill-tab ${filter === 'Offers' ? 'active' : ''}`} onClick={() => setFilter('Offers')}>Offers ({offersCount})</button>
        <button className={`pill-tab ${filter === 'Chat' ? 'active' : ''}`} onClick={() => setFilter('Chat')}>Chat ({chatCount})</button>
      </div>

      {/* Notification List */}
      <div className="notif-list">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notif) => (
            <div key={notif.id} className={`notif-card ${!notif.read ? 'unread' : ''}`}>
              
              {/* Icon Logic */}
              <div className={`notif-icon ${
                  notif.type === 'booking' ? 'bg-green-100 text-green-600' : 
                  notif.type === 'offer' ? 'bg-purple-100 text-purple-600' : 
                  notif.type === 'chat' ? 'bg-blue-100 text-blue-600' :
                  'bg-blue-100 text-blue-600' // Default
              }`}>
                {notif.type === 'booking' && <Check className="w-6 h-6" />}
                {notif.type === 'offer' && <Tag className="w-6 h-6" />}
                {notif.type === 'chat' && <MessageSquare size={20} />}
              </div>

              {/* Content */}
              <div className="notif-content">
                <div className="notif-top">
                  <h4 className="notif-heading">{notif.title}</h4>
                  <div className="notif-actions">
                    {!notif.read && (
                      <button className="icon-btn" onClick={() => handleMarkRead(notif.id)} title="Mark as read">
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    <button className="icon-btn delete" onClick={() => handleDelete(notif.id)} title="Delete">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <p className="notif-message">{notif.message}</p>
                
                <div className="notif-footer">
                  <span className="notif-date">
                    {notif.createdAt?.toDate ? notif.createdAt.toDate().toLocaleDateString() : 'Just now'}
                  </span>
                  
                  {/* ACTION BUTTON (View Booking / View Chat / View Offer) */}
                  {notif.action && (
                    <button 
                      className="action-btn"
                      onClick={() => {
                        // Pass control back to UserDashboard via the onAction prop
                        if (onAction) {
                           onAction({ 
                             type: notif.type, 
                             relatedId: notif.relatedId, 
                             discount: notif.discount || 0,
                             hostelId: notif.hostelId 
                           });
                           handleMarkRead(notif.id); // Mark read when action is taken
                        }
                      }}
                    >
                      {notif.action}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-notif">
            <Bell className="w-12 h-12 text-gray-300 mb-3" />
            <p>No notifications found.</p>
          </div>
        )}
      </div>
    </div>
  );
}