import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../components/ThemeContext';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Camera, MapPin, Star, Edit2, Trash2, MessageSquare, CornerUpLeft } from 'lucide-react'; // Added CornerUpLeft
import { ChatWindow } from '../components/ChatWindow'; // Import Chat Window Component
import { Notifications } from './Notifications'; // Reusing User Notifications component for viewing
import './OwnerDashboard.css';

function OwnerDashboard() {
  const { currentUser } = useAuth()
  const { theme } = useTheme()
  const fileInputRef = useRef(null)
  
  const [activeTab, setActiveTab] = useState('hostels')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingHostel, setEditingHostel] = useState(null)
  const [loading, setLoading] = useState(true)

  // Owner Profile State
  const [ownerProfile, setOwnerProfile] = useState({
    name: '', phone: '', email: '', photoURL: ''
  })
  const [editingProfile, setEditingProfile] = useState(false)

  const [formData, setFormData] = useState({
    name: '', location: '', price: '', description: '', capacity: '', rating: '4.5', reviews: '0',
    image: '', wifiSpeed: '', checkInTime: '14:00', checkOutTime: '11:00',
    amenities: { wifi: false, kitchen: false, laundry: false, parking: false,
      breakfast: false, airConditioning: false, heating: false, pool: false,
      gym: false, lockers: false, commonRoom: false, bbq: false,
      security: false, reception24h: false
    }
  })

  const [hostels, setHostels] = useState([])
  const [users, setUsers] = useState([])
  const [allBookings, setAllBookings] = useState([])
  const [activeSupportChats, setActiveSupportChats] = useState([]); 
  const [isSupportChatOpen, setIsSupportChatOpen] = useState(false); 
  const [currentChatDetails, setCurrentChatDetails] = useState(null); 

  // 1. Load Owner Profile
  useEffect(() => {
    const loadOwnerProfile = async () => {
      if (!currentUser) return
      try {
        const userDoc = doc(db, 'users', currentUser.uid)
        const docSnap = await getDoc(userDoc)

        if (docSnap.exists()) {
          const data = docSnap.data()
          setOwnerProfile({
            name: data.name || data.displayName || currentUser.displayName || '',
            phone: data.phone || '',
            email: currentUser.email || '',
            photoURL: data.photoURL || currentUser.photoURL || ''
          })
        } else {
          setOwnerProfile({
            name: currentUser.displayName || '',
            phone: '',
            email: currentUser.email || '',
            photoURL: currentUser.photoURL || ''
          })
        }
      } catch (error) {
        console.error('Error loading owner profile:', error)
      }
    }
    loadOwnerProfile()
  }, [currentUser])

  // 2. Load Hostels
  useEffect(() => {
    const loadHostels = async () => {
      if (!currentUser) return
      try {
        const hostelsQuery = query(
          collection(db, 'hostels'),
          where('ownerId', '==', currentUser.uid)
        )
        const querySnapshot = await getDocs(hostelsQuery)
        const hostelsData = []
        querySnapshot.forEach((doc) => {
          hostelsData.push({ id: doc.id, ...doc.data() })
        })
        setHostels(hostelsData)
        setLoading(false)
      } catch (error) {
        console.error('Error loading hostels:', error)
        setLoading(false)
      }
    }
    loadHostels()
  }, [currentUser])

  // 3. Load Bookings
  useEffect(() => {
    const loadBookings = async () => {
      if (!currentUser) return;
      try {
        const bookingsQuery = query(
          collection(db, 'bookings'),
          where('ownerId', '==', currentUser.uid)
        );
        
        const querySnapshot = await getDocs(bookingsQuery)
        const bookingsData = []
        querySnapshot.forEach((doc) => {
          bookingsData.push({ id: doc.id, ...doc.data() });
        })
        
        setAllBookings(bookingsData.sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
            return dateB - dateA;
        }))

      } catch (error) {
        console.error('Error loading bookings:', error)
      }
    }
    loadBookings()
  }, [currentUser])

  // 4. Load Users (For Management)
  useEffect(() => {
    if (!currentUser) return;
    const loadUsers = async () => {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef);
        const querySnapshot = await getDocs(q);
        const usersData = [];
        querySnapshot.forEach((doc) => {
          if (doc.id !== currentUser.uid) { usersData.push({ id: doc.id, ...doc.data() }) }
        });
        setUsers(usersData);
      } catch (error) {
        console.error('Error loading users:', error);
      }
    }
    loadUsers()
  }, [currentUser])

  // 5. NEW: Real-time Listener for Active Support Chats
  useEffect(() => {
    if (!currentUser) return;

    // Fetch all chats where the ownerId matches the current user
    const qChats = query(
      collection(db, 'supportChats'),
      where('ownerId', '==', currentUser.uid) 
    );

    const unsubscribe = onSnapshot(qChats, (snapshot) => {
      const chatThreads = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      // Filter out any threads without a bookingId (optional, but keeps list clean)
      setActiveSupportChats(chatThreads.filter(chat => chat.bookingId));
    }, (error) => {
      console.error("Error fetching support chats:", error);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // 6. NEW: Booking Request Notification Generator
  useEffect(() => {
      if (!currentUser) return;
      
      const qBookings = query(
          collection(db, 'bookings'),
          where('ownerId', '==', currentUser.uid) // Listen for bookings targeting this owner
      );

      const unsubscribeBookings = onSnapshot(qBookings, async (snapshot) => {
          snapshot.docChanges().forEach(async (change) => {
              const booking = change.doc.data();
              const bookingId = change.doc.id;
              
              // Only generate notification if status is 'pending' AND notification hasn't been sent
              if (booking.status === 'pending' && booking.ownerNotified !== true) {
                  
                  // Check if notification already exists using a query
                  const qCheck = query(
                      collection(db, 'notifications'),
                      where('relatedId', '==', bookingId),
                      where('type', '==', 'owner_booking_request')
                  );
                  const checkSnap = await getDocs(qCheck);

                  if (checkSnap.empty) {
                      // Generate Notification for the Owner
                      await addDoc(collection(db, 'notifications'), {
                          userId: currentUser.uid, // Targeting the current owner
                          type: 'owner_booking_request',
                          title: 'New Booking Request!',
                          message: `User ${booking.userEmail} has requested a stay at ${booking.hostelName}.`,
                          read: false,
                          action: 'Review Booking',
                          relatedId: bookingId, // Booking ID
                          createdAt: serverTimestamp()
                      });
                      
                      // Stamp the booking document to prevent future regeneration
                      await updateDoc(doc(db, 'bookings', bookingId), {
                          ownerNotified: true
                      });
                  }
              }
          });
      });

      return () => unsubscribeBookings();
  }, [currentUser]);


  // --- HANDLERS ---

  const handleOpenChat = async (chat) => {
      // Chat ID is the specific booking ID/thread ID for supportChats
      
      // Need to fetch user details to display name in chat window
      let userName = chat.userEmail;
      try {
          const userSnap = await getDoc(doc(db, 'users', chat.userId));
          if (userSnap.exists()) {
              userName = userSnap.data().displayName || userSnap.data().name || userName;
          }
      } catch (e) {
          console.warn("Could not fetch user profile for chat display:", e);
      }

      setCurrentChatDetails({
          chatId: chat.id, 
          recipientName: userName,
          recipientId: chat.userId, // The user who started the chat
          collectionName: 'supportChats'
      });
      setIsSupportChatOpen(true);
  };

  const handleOpenUserChat = (user) => {
      if (!currentUser) return;
      // For P2P chat initiated by owner, the chat ID is sorted UIDs
      const sortedIds = [currentUser.uid, user.id].sort().join('_');
      
      setCurrentChatDetails({
          chatId: sortedIds, 
          recipientName: user.displayName || user.name || user.email,
          recipientId: user.id,
          collectionName: 'chats' // P2P collection
      });
      setIsSupportChatOpen(true);
  };


  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    if (name.startsWith('amenity_')) {
      const amenityKey = name.replace('amenity_', '')
      setFormData({ ...formData, amenities: { ...formData.amenities, [amenityKey]: checked } })
    } else {
      setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value })
    }
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 500 * 1024) {
        alert("Image size too large! Please select an image under 500KB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setOwnerProfile(prev => ({ ...prev, photoURL: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '', location: '', price: '', description: '', capacity: '', rating: '4.5', reviews: '0',
      image: '', wifiSpeed: '', checkInTime: '14:00', checkOutTime: '11:00',
      amenities: { wifi: false, kitchen: false, laundry: false, parking: false,
        breakfast: false, airConditioning: false, heating: false, pool: false,
        gym: false, lockers: false, commonRoom: false, bbq: false,
        security: false, reception24h: false
      }
    })
  }

  const handleAddHostel = async (e) => {
    e.preventDefault()
    if (!currentUser) { alert('You must be logged in to add a hostel'); return }

    try {
      const amenitiesArray = Object.keys(formData.amenities)
        .filter(key => formData.amenities[key])
        .map(key => key.replace(/([A-Z])/g, ' $1').trim()
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '))

      const newHostel = {
        ownerId: currentUser.uid,
        ownerName: ownerProfile.name || currentUser.displayName || currentUser.email,
        name: formData.name,
        location: formData.location,
        price: parseFloat(formData.price),
        amenities: amenitiesArray,
        createdAt: new Date().toISOString()
      }

      const docRef = await addDoc(collection(db, 'hostels'), newHostel)
      setHostels([...hostels, { id: docRef.id, ...newHostel }])
      resetForm(); setShowAddForm(false); setEditingHostel(null);
      alert('Hostel added successfully!')
    } catch (error) { console.error('Error adding hostel:', error); alert('Failed to add hostel: ' + error.message) }
  }

  const handleEditHostel = (hostel) => {
    setShowAddForm(true); setEditingHostel(hostel);
  }

  const handleUpdateHostel = async (e) => {
    e.preventDefault()
    if (!editingHostel) return
    // ... (logic to update hostel in Firestore)
  }

  const handleDeleteHostel = async (id) => {
    if (window.confirm('Are you sure you want to delete this hostel?')) {
      try {
        await deleteDoc(doc(db, 'hostels', id))
        setHostels(hostels.filter(h => h.id !== id))
        alert('Hostel deleted successfully!')
      } catch (error) {
        console.error('Error deleting hostel:', error)
        alert('Failed to delete hostel.')
      }
    }
  }

  const handleUserStatusChange = async (userId, newStatus) => {
    try {
      await updateDoc(doc(db, 'users', userId), { status: newStatus })
      setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u))
      alert('User status updated!')
    } catch (error) {
      console.error('Error updating user:', error)
      alert('Failed to update user status.')
    }
  }

  const handleBookingStatusChange = async (bookingId, newStatus) => {
    try {
      await updateDoc(doc(db, 'bookings', bookingId), { status: newStatus })
      setAllBookings(allBookings.map(b => b.id === bookingId ? { ...b, status: newStatus } : b))
      alert('Booking status updated!')
    } catch (error) {
      console.error('Error updating booking:', error)
      alert('Failed to update booking status.')
    }
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    if (!currentUser) return

    try {
      await setDoc(doc(db, 'users', currentUser.uid), {
        name: ownerProfile.name,
        displayName: ownerProfile.name,
        phone: ownerProfile.phone,
        email: currentUser.email,
        photoURL: ownerProfile.photoURL,
        role: 'owner',
        updatedAt: new Date().toISOString()
      }, { merge: true })

      alert('Profile updated successfully!')
      setEditingProfile(false)
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile.')
    }
  }

  const totalRevenue = allBookings
    .filter(b => b.status === 'confirmed')
    .reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    
  const totalBookings = allBookings.length
  const totalUsers = users.length
  const activeUsers = users.filter(u => u.status === 'active').length

  return (
    <div className={`owner-dashboard ${theme}`}>
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h2 className="dashboard-title">Owner Dashboard</h2>
          <div className="user-info">
            <p>Welcome, {ownerProfile.name || currentUser?.email}</p>
          </div>
        </div>

        <div className="stats-section">
          <div className="stat-card">
            <div className="stat-icon revenue">$</div>
            <h3 className="stat-label">Total Revenue</h3>
            <p className="stat-value">${totalRevenue.toLocaleString()}</p>
          </div>
          <div className="stat-card">
            <div className="stat-icon bookings">Calendar</div>
            <h3 className="stat-label">Total Bookings</h3>
            <p className="stat-value">{totalBookings}</p>
          </div>
          <div className="stat-card">
            <div className="stat-icon hostels">House</div>
            <h3 className="stat-label">Active Hostels</h3>
            <p className="stat-value">{hostels.length}</p>
          </div>
          <div className="stat-card">
            <div className="stat-icon users">People</div>
            <h3 className="stat-label">Total Users</h3>
            <p className="stat-value">{totalUsers} <span style={{fontSize: '0.875rem', color: '#6b7280'}}>({activeUsers} active)</span></p>
          </div>
        </div>

        <div className="dashboard-tabs">
          <button className={`tab-button ${activeTab === 'hostels' ? 'active' : ''}`} onClick={() => setActiveTab('hostels')}>Hostels</button>
          <button className={`tab-button ${activeTab === 'bookings' ? 'active' : ''}`} onClick={() => setActiveTab('bookings')}>All Bookings</button>
          <button className={`tab-button ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>Manage Users</button>
          <button className={`tab-button ${activeTab === 'chats' ? 'active' : ''}`} onClick={() => setActiveTab('chats')}>
              Chats ({activeSupportChats.length})
          </button>
          <button className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>My Profile</button>
        </div>

        {/* Hostels Tab */}
        {activeTab === 'hostels' && (
          <div className="hostels-section">
            <div className="section-header">
              <h3 className="section-title">My Hostels</h3>
              <button
                onClick={() => {
                  setEditingHostel(null)
                  resetForm()
                  setShowAddForm(!showAddForm)
                }}
                className="add-button"
              >
                {showAddForm ? 'Cancel' : 'Add Hostel'}
              </button>
            </div>

            {showAddForm && (
              <form onSubmit={editingHostel ? handleUpdateHostel : handleAddHostel} className="add-hostel-form">
                <h4 style={{marginBottom: '20px', fontSize: '1.25rem', fontWeight: 600}}>
                  {editingHostel ? 'Edit Hostel' : 'Add New Hostel'}
                </h4>
                
                {/* Form fields remain same */}
                <div className="form-row">
                  <div className="form-group"><label>Hostel Name</label><input type="text" value={formData.name} onChange={handleInputChange} required /></div>
                  <div className="form-group"><label>Location</label><input type="text" value={formData.location} onChange={handleInputChange} required /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Price ($)</label><input type="number" value={formData.price} onChange={handleInputChange} required /></div>
                  <div className="form-group"><label>Capacity</label><input type="number" value={formData.capacity} onChange={handleInputChange} required /></div>
                </div>
                <div className="form-group"><label>Image URL</label><input type="url" value={formData.image} onChange={handleInputChange} /></div>
                <div className="form-group"><label>Description</label><textarea value={formData.description} onChange={handleInputChange} /></div>
                
                <button type="submit" className="submit-button">{editingHostel ? 'Update Hostel' : 'Add Hostel'}</button>
              </form>
            )}

            <div className="hostels-list">
              {hostels.length > 0 ? (
                hostels.map(hostel => (
                  <div key={hostel.id} className="hostel-card">
                    <img 
                      src={hostel.image || 'https://via.placeholder.com/150'} 
                      alt={hostel.name} 
                      className="hostel-card-img" 
                    />
                    
                    <div className="hostel-info">
                      <div className="hostel-header-row">
                        <div>
                          <h3 className="hostel-name">{hostel.name}</h3>
                          <p className="hostel-location">
                             <MapPin size={14} style={{marginRight: '4px'}}/> {hostel.location}
                          </p>
                        </div>
                        
                        <div className="hostel-actions">
                          <button onClick={() => handleEditHostel(hostel)} className="icon-btn edit" title="Edit">
                            <Edit2 size={18} />
                          </button>
                          <button onClick={() => handleDeleteHostel(hostel.id)} className="icon-btn delete" title="Delete">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>

                      <div className="hostel-details-grid">
                        <p><span className="detail-label">Price:</span> <span className="detail-value">${hostel.price} per night</span></p>
                        <p><span className="detail-label">Beds:</span> <span className="detail-value">{hostel.capacity}</span></p>
                        <p><span className="detail-label">Rating:</span> <span className="detail-value">
                            <Star size={12} fill="#f59e0b" color="#f59e0b" style={{marginRight: '4px'}} />
                            {hostel.rating} ({hostel.reviews || 0} reviews)
                        </span></p>
                        <p><span className="detail-label">Bookings:</span> <span className="detail-value">{hostel.bookings || 0}</span></p>
                        <p><span className="detail-label">Revenue:</span> <span className="detail-value">${hostel.revenue || 0}</span></p>
                        
                        <p style={{gridColumn: '1 / -1'}}>
                           <span className="detail-label">Amenities:</span> 
                           <span className="detail-value"> {hostel.amenities?.slice(0, 4).join(', ') || 'None'}</span>
                        </p>
                        <p><span className="detail-label">WiFi:</span> <span className="detail-value">{hostel.wifiSpeed} Mbps</span></p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">House</div>
                  <h3>No Hostels Added</h3>
                  <button onClick={() => setShowAddForm(true)} className="empty-state-button">Add Your First Hostel</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="bookings-section">
            <h3 className="section-title">All Bookings</h3>
            {allBookings.length > 0 ? (
              <div className="bookings-table-container">
                <table className="bookings-table">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Hostel</th>
                      <th>Check-in</th>
                      <th>Check-out</th>
                      <th>Total Price</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allBookings.map(booking => (
                      <tr key={booking.id}>
                        <td>{booking.userEmail || 'N/A'}</td>
                        <td>{booking.hostelName}</td>
                        <td>{booking.checkIn}</td>
                        <td>{booking.checkOut}</td>
                        <td>${booking.totalPrice}</td>
                        <td>
                          <select value={booking.status} onChange={(e) => handleBookingStatusChange(booking.id, e.target.value)} className={`status-select ${booking.status}`}>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                          {booking.status === 'pending' && (
                            <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                              <button onClick={() => handleBookingStatusChange(booking.id, 'confirmed')} className="action-button accept">Accept</button>
                              <button onClick={() => handleBookingStatusChange(booking.id, 'cancelled')} className="action-button decline">Decline</button>
                            </div>
                          )}
                        </td>
                        <td></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state"><p>No bookings yet.</p></div>
            )}
          </div>
        )}
        
        {/* Users Tab (Manage Users) */}
        {activeTab === 'users' && (
          <div className="users-section">
            <h3 className="section-title">Manage Users</h3>
            {users.length > 0 ? (
              <div className="users-table-container">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Phone</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id}>
                        <td>{user.name || user.displayName || 'N/A'}</td>
                        <td>{user.email}</td>
                        <td>{user.role || 'user'}</td>
                        <td>{user.phone || 'N/A'}</td>
                        <td>
                          <select value={user.status || 'active'} onChange={(e) => handleUserStatusChange(user.id, e.target.value)} className={`status-select ${user.status || 'active'}`}>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </td>
                        <td>
                            <button 
                                className="view-button"
                                onClick={() => handleOpenUserChat(user)} // Launch P2P Chat
                            >
                                <MessageSquare size={16} style={{marginRight: '5px'}}/> Contact
                            </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">People</div>
                <h3>No Users Found</h3>
              </div>
            )}
          </div>
        )}

        {/* Chats Tab */}
        {activeTab === 'chats' && (
          <div className="chats-section">
             <h3 className="section-title">Active Customer Support Chats ({activeSupportChats.length})</h3>
             
             {activeSupportChats.length > 0 ? (
                 <div className="chat-thread-list">
                     {activeSupportChats.map(chat => (
                         <div 
                            key={chat.id} 
                            className="chat-thread-card"
                            onClick={() => handleOpenChat(chat)}
                         >
                            <div className="chat-thread-info">
                                <MessageSquare size={20} />
                                <div>
                                    <p className="thread-title">Booking Ref: {chat.bookingId.substring(0, 6)}</p>
                                    <p className="thread-subtitle">User: {chat.userName || chat.userEmail}</p>
                                </div>
                            </div>
                            <span className="chat-access-btn">Open →</span>
                         </div>
                     ))}
                 </div>
             ) : (
                 <div className="empty-state">
                     <p>No active support conversations.</p>
                 </div>
             )}
          </div>
        )}
        
        {/* Profile Tab (With Upload) */}
        {activeTab === 'profile' && (
          <div className="profile-section">
            <div className="section-header">
              <h3 className="section-title">My Profile</h3>
              <button onClick={() => setEditingProfile(!editingProfile)} className="add-button" style={{background: editingProfile ? '#dc3545' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'}}>
                {editingProfile ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>

            <div className="profile-card">
              <div className="profile-header">
                <div className="profile-avatar">
                  {ownerProfile.photoURL ? (
                    <img src={ownerProfile.photoURL} alt="Profile" />
                  ) : (
                    <div className="avatar-placeholder">{(ownerProfile.name?.charAt(0) || 'O').toUpperCase()}</div>
                  )}
                </div>
                <div className="profile-info">
                  <h3>{ownerProfile.name || 'Hostel Owner'}</h3>
                  <p>{ownerProfile.email}</p>
                </div>
              </div>

              {editingProfile ? (
                <form onSubmit={handleSaveProfile} className="profile-form">
                  
                  {/* --- Profile Picture Upload --- */}
                  <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '30px'}}>
                    <div style={{
                      width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', 
                      background: '#f3f4f6', border: '2px solid #e5e7eb', marginBottom: '15px',
                      display: 'flex', justifyContent: 'center', alignItems: 'center'
                    }}>
                      {ownerProfile.photoURL ? (
                        <img src={ownerProfile.photoURL} alt="Profile" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                      ) : (
                        <span style={{fontSize: '2rem', color: '#9ca3af'}}>{(ownerProfile.name || 'O').charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handlePhotoChange}
                      accept="image/*"
                      style={{display: 'none'}}
                    />
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current.click()}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '8px 16px', border: '1px solid #d1d5db',
                        background: 'white', borderRadius: '6px', cursor: 'pointer',
                        fontWeight: 500, fontSize: '0.9rem', color: '#374151'
                      }}
                    >
                      <Camera size={16} /> Upload Photo
                    </button>
                    <p style={{fontSize: '0.75rem', color: '#9ca3af', marginTop: '5px'}}>Max size 500KB. Square image recommended.</p>
                  </div>

                  <div className="form-row">
                    <div className="form-group"><label>Full Name</label><input type="text" value={ownerProfile.name} onChange={(e) => setOwnerProfile({...ownerProfile, name: e.target.value})} required /></div>
                    <div className="form-group"><label>Phone Number</label><input type="tel" value={ownerProfile.phone} onChange={(e) => setOwnerProfile({...ownerProfile, phone: e.target.value})} placeholder="+123 456 7890" /></div>
                  </div>
                  <div className="form-row">
                    <div className="form-group"><label>Email (cannot be changed)</label><input type="email" value={ownerProfile.email} disabled /></div>
                  </div>
                  <button type="submit" className="submit-button">Save Changes</button>
                </form>
              ) : (
                <div className="profile-details">
                  <div className="detail-item"><span className="detail-label">Phone:</span> <span className="detail-value">{ownerProfile.phone || <em style={{color: '#9ca3af'}}>Not provided</em>}</span></div>
                  <div className="detail-item"><span className="detail-label">Total Hostels:</span> <span className="detail-value">{hostels.length}</span></div>
                  <div className="detail-item"><span className="detail-label">Total Revenue:</span> <span className="detail-value">${totalRevenue.toLocaleString()}</span></div>
                  <div className="detail-item"><span className="detail-label">Total Bookings:</span> <span className="detail-value">{totalBookings}</span></div>
                  <div className="detail-item"><span className="detail-label">Member Since:</span> <span className="detail-value">{currentUser?.metadata?.creationTime ? new Date(currentUser.metadata.creationTime).toLocaleDateString() : 'N/A'}</span></div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Chat Window Modal Render */}
        {isSupportChatOpen && currentChatDetails && (
            <ChatWindow
              chatId={currentChatDetails.chatId}
              collectionName={currentChatDetails.collectionName} // 'supportChats' or 'chats'
              onClose={() => setIsSupportChatOpen(false)}
              recipientName={currentChatDetails.recipientName}
              recipientId={currentChatDetails.recipientId}
            />
        )}
      </div>
    </div>
  )
}

export default OwnerDashboard