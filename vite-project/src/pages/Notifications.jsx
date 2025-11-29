import { useState, useEffect } from 'react';
import { Check, X, Tag, Bell, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { db } from '../firebase.js';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  updateDoc, 
  doc, 
  serverTimestamp,
  writeBatch,
  getDocs
} from 'firebase/firestore';
import './Notifications.css';

export function Notifications() {
  const { currentUser } = useAuth();
  const [filter, setFilter] = useState('All');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- 1. REAL-TIME LISTENER: Fetch Notifications ---
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'notifications'), 
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort by date (newest first) locally since serverTimestamp can be null initially
      items.sort((a, b) => {
         const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date();
         const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date();
         return dateB - dateA;
      });

      setNotifications(items);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);


  // --- 2. BOOKING SYNC: Generate Notification when Booking is made ---
  useEffect(() => {
    if (!currentUser) return;

    // Listen to Bookings to auto-generate notifications
    const qBookings = query(
      collection(db, 'bookings'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribeBookings = onSnapshot(qBookings, async (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const booking = change.doc.data();
          const bookingId = change.doc.id;

          // Check if we already notified about this booking to avoid duplicates
          // We assume we store 'relatedId' in the notification
          const qCheck = query(
            collection(db, 'notifications'),
            where('relatedId', '==', bookingId)
          );
          const checkSnap = await getDocs(qCheck);

          if (checkSnap.empty) {
            // Generate "Booking Confirmed" Notification
            await addDoc(collection(db, 'notifications'), {
               userId: currentUser.uid,
               type: 'booking',
               title: 'Booking Confirmed',
               message: `Your stay at ${booking.hostelName} is confirmed for ${booking.checkIn}.`,
               date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
               read: false,
               action: 'View Booking',
               relatedId: bookingId, // Link to booking
               createdAt: serverTimestamp()
            });
            console.log("🔔 Notification generated for booking:", bookingId);
          }
        }
      });
    });

    return () => unsubscribeBookings();
  }, [currentUser]);


  // --- 3. RANDOM OFFER GENERATOR (Simulated) ---
  useEffect(() => {
    if (!currentUser) return;

    // Run a check every 60 seconds to maybe add an offer
    const interval = setInterval(async () => {
      const randomChance = Math.random();
      
      // 30% chance to get an offer, and ensure we don't spam (limit to 3 unread discounts)
      const discountCount = notifications.filter(n => n.type === 'discount' && !n.read).length;
      
      if (randomChance > 0.7 && discountCount < 3) {
        const offers = [
          { title: "Flash Sale: 20% Off!", msg: "Weekend special at Margalla View! Book now." },
          { title: "Free Breakfast Upgrade", msg: "Book your next stay in G-12 and get free breakfast." },
          { title: "Partner Discount", msg: "Get 10% off hiking gear with your next booking." }
        ];
        const randomOffer = offers[Math.floor(Math.random() * offers.length)];

        await addDoc(collection(db, 'notifications'), {
           userId: currentUser.uid,
           type: 'discount',
           title: randomOffer.title,
           message: randomOffer.msg,
           date: 'Just now',
           read: false,
           action: 'View Offer',
           createdAt: serverTimestamp()
        });
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [currentUser, notifications]);


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
    }
  };

  const handleMarkAllRead = async () => {
    const batch = writeBatch(db);
    notifications.forEach(n => {
       if (!n.read) {
         const ref = doc(db, 'notifications', n.id);
         batch.update(ref, { read: true });
       }
    });
    await batch.commit();
  };

  const handleClearAll = async () => {
    if(window.confirm("Clear all notifications?")) {
      const batch = writeBatch(db);
      notifications.forEach(n => {
         const ref = doc(db, 'notifications', n.id);
         batch.delete(ref);
      });
      await batch.commit();
    }
  };

  // --- Filtering Logic ---
  const filteredNotifications = notifications.filter(n => {
    if (filter === 'All') return true;
    if (filter === 'Unread') return !n.read;
    if (filter === 'Bookings') return n.type === 'booking';
    if (filter === 'Discounts') return n.type === 'discount';
    if (filter === 'Reminders') return n.type === 'reminder';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const discountCount = notifications.filter(n => n.type === 'discount').length;

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
        <button 
          className={`pill-tab ${filter === 'All' ? 'active' : ''}`} 
          onClick={() => setFilter('All')}
        >
          All ({notifications.length})
        </button>
        <button 
          className={`pill-tab ${filter === 'Unread' ? 'active' : ''}`} 
          onClick={() => setFilter('Unread')}
        >
          Unread ({unreadCount})
        </button>
        <button 
          className={`pill-tab ${filter === 'Bookings' ? 'active' : ''}`} 
          onClick={() => setFilter('Bookings')}
        >
          Bookings
        </button>
        <button 
          className={`pill-tab ${filter === 'Discounts' ? 'active' : ''}`} 
          onClick={() => setFilter('Discounts')}
        >
          Discounts ({discountCount})
        </button>
      </div>

      {/* Notification List */}
      <div className="notif-list">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notif) => (
            <div key={notif.id} className={`notif-card ${!notif.read ? 'unread' : ''}`}>
              
              {/* Icon Logic */}
              <div className={`notif-icon ${
                  notif.type === 'booking' ? 'bg-green-100 text-green-600' : 
                  notif.type === 'discount' ? 'bg-purple-100 text-purple-600' : 
                  'bg-blue-100 text-blue-600'
              }`}>
                {notif.type === 'booking' && <Check className="w-6 h-6" />}
                {notif.type === 'discount' && <Tag className="w-6 h-6" />}
                {notif.type === 'reminder' && <Bell className="w-6 h-6" />}
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
                  <span className="notif-date">{notif.date}</span>
                  {notif.action && (
                    <button className="action-btn">
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