import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../components/ThemeContext'
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
  setDoc
} from 'firebase/firestore'
import { db } from '../firebase'
import './OwnerDashboard.css'

function OwnerDashboard() {
  const { currentUser } = useAuth()
  const { theme } = useTheme()
  const [activeTab, setActiveTab] = useState('hostels')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingHostel, setEditingHostel] = useState(null)
  const [loading, setLoading] = useState(true)

  // Owner Profile State
  const [ownerProfile, setOwnerProfile] = useState({
    name: '',
    phone: '',
    email: '',
    photoURL: ''
  })
  const [editingProfile, setEditingProfile] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    price: '',
    description: '',
    beds: '',
    rating: 4.5,
    reviews: 0,
    image: '',
    hasRoommates: false
  })

  const [hostels, setHostels] = useState([])
  const [users, setUsers] = useState([])
  const [allBookings, setAllBookings] = useState([])

  // Load Owner Profile
  useEffect(() => {
    const loadOwnerProfile = async () => {
      if (!currentUser) return

      try {
        const userDoc = doc(db, 'users', currentUser.uid)
        const docSnap = await getDoc(userDoc)
        
        if (docSnap.exists()) {
          const data = docSnap.data()
          setOwnerProfile({
            name: data.name || currentUser.displayName || '',
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

  // Load Hostels
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

  // Load Bookings
  useEffect(() => {
    const loadBookings = async () => {
      if (!currentUser || hostels.length === 0) return
      
      try {
        const bookingsQuery = query(collection(db, 'bookings'))
        const querySnapshot = await getDocs(bookingsQuery)
        const bookingsData = []
        const ownerHostelIds = hostels.map(h => h.id)
        
        querySnapshot.forEach((doc) => {
          const booking = { id: doc.id, ...doc.data() }
          if (ownerHostelIds.includes(booking.hostelId)) {
            bookingsData.push(booking)
          }
        })
        setAllBookings(bookingsData.sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate)))
      } catch (error) {
        console.error('Error loading bookings:', error)
      }
    }

    loadBookings()
  }, [hostels, currentUser])

  // Load Users
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const usersQuery = query(
          collection(db, 'users'),
          where('role', '==', 'user')
        )
        const querySnapshot = await getDocs(usersQuery)
        const usersData = []
        querySnapshot.forEach((doc) => {
          usersData.push({ id: doc.id, ...doc.data() })
        })
        setUsers(usersData)
      } catch (error) {
        console.error('Error loading users:', error)
      }
    }

    loadUsers()
  }, [])

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleAddHostel = async (e) => {
    e.preventDefault()
    if (!currentUser) return
    
    try {
      const newHostel = {
        ownerId: currentUser.uid,
        name: formData.name,
        location: formData.location,
        price: parseFloat(formData.price),
        beds: parseInt(formData.beds) || 0,
        rating: parseFloat(formData.rating) || 4.5,
        reviews: parseInt(formData.reviews) || 0,
        description: formData.description || '',
        image: formData.image || '',
        hasRoommates: formData.hasRoommates || false,
        bookings: 0,
        revenue: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      const docRef = await addDoc(collection(db, 'hostels'), newHostel)
      setHostels([...hostels, { id: docRef.id, ...newHostel }])
      setFormData({ name: '', location: '', price: '', description: '', beds: '', rating: 4.5, reviews: 0, image: '', hasRoommates: false })
      setShowAddForm(false)
      alert('Hostel added successfully!')
    } catch (error) {
      console.error('Error adding hostel:', error)
      alert('Failed to add hostel. Please try again.')
    }
  }

  const handleEditHostel = (hostel) => {
    setEditingHostel(hostel)
    setFormData({
      name: hostel.name || '',
      location: hostel.location || '',
      price: hostel.price?.toString() || '',
      description: hostel.description || '',
      beds: hostel.beds?.toString() || '',
      rating: hostel.rating || 4.5,
      reviews: hostel.reviews?.toString() || '0',
      image: hostel.image || '',
      hasRoommates: hostel.hasRoommates || false
    })
    setShowAddForm(true)
  }

  const handleUpdateHostel = async (e) => {
    e.preventDefault()
    if (!editingHostel) return
    
    try {
      const hostelRef = doc(db, 'hostels', editingHostel.id)
      await updateDoc(hostelRef, {
        name: formData.name,
        location: formData.location,
        price: parseFloat(formData.price),
        beds: parseInt(formData.beds) || 0,
        rating: parseFloat(formData.rating) || 4.5,
        reviews: parseInt(formData.reviews) || 0,
        description: formData.description || '',
        image: formData.image || '',
        hasRoommates: formData.hasRoommates || false,
        updatedAt: new Date().toISOString()
      })
      
      setHostels(hostels.map(hostel => 
        hostel.id === editingHostel.id
          ? { ...hostel, ...formData, price: parseFloat(formData.price), beds: parseInt(formData.beds) || 0 }
          : hostel
      ))
      setEditingHostel(null)
      setFormData({ name: '', location: '', price: '', description: '', beds: '', rating: 4.5, reviews: 0, image: '', hasRoommates: false })
      setShowAddForm(false)
      alert('Hostel updated successfully!')
    } catch (error) {
      console.error('Error updating hostel:', error)
      alert('Failed to update hostel. Please try again.')
    }
  }

  const handleDeleteHostel = async (id) => {
    if (window.confirm('Are you sure you want to delete this hostel?')) {
      try {
        await deleteDoc(doc(db, 'hostels', id))
        setHostels(hostels.filter(hostel => hostel.id !== id))
        alert('Hostel deleted successfully!')
      } catch (error) {
        console.error('Error deleting hostel:', error)
        alert('Failed to delete hostel. Please try again.')
      }
    }
  }

  const handleUserStatusChange = async (userId, newStatus) => {
    try {
      const userRef = doc(db, 'users', userId)
      await updateDoc(userRef, { status: newStatus })
      setUsers(users.map(user => 
        user.id === userId ? { ...user, status: newStatus } : user
      ))
      alert('User status updated successfully!')
    } catch (error) {
      console.error('Error updating user status:', error)
      alert('Failed to update user status. Please try again.')
    }
  }

  const handleBookingStatusChange = async (bookingId, newStatus) => {
    try {
      const bookingRef = doc(db, 'bookings', bookingId)
      await updateDoc(bookingRef, { status: newStatus })
      setAllBookings(allBookings.map(booking => 
        booking.id === bookingId ? { ...booking, status: newStatus } : booking
      ))
      alert('Booking status updated successfully!')
    } catch (error) {
      console.error('Error updating booking status:', error)
      alert('Failed to update booking status. Please try again.')
    }
  }

  // Save Profile
  const handleSaveProfile = async (e) => {
    e.preventDefault()
    if (!currentUser) return

    try {
      const userRef = doc(db, 'users', currentUser.uid)
      await setDoc(userRef, {
        name: ownerProfile.name,
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

  const totalRevenue = hostels.reduce((sum, hostel) => sum + (hostel.revenue || 0), 0)
  const totalBookings = hostels.reduce((sum, hostel) => sum + (hostel.bookings || 0), 0)
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
            <div className="stat-icon users">Users</div>
            <h3 className="stat-label">Total Users</h3>
            <p className="stat-value">{totalUsers} <span style={{fontSize: '0.875rem', fontWeight: 400, color: '#6b7280'}}>({activeUsers} active)</span></p>
          </div>
        </div>

        <div className="dashboard-tabs">
          <button className={`tab-button ${activeTab === 'hostels' ? 'active' : ''}`} onClick={() => setActiveTab('hostels')}>
            Hostels
          </button>
          <button className={`tab-button ${activeTab === 'bookings' ? 'active' : ''}`} onClick={() => setActiveTab('bookings')}>
            All Bookings
          </button>
          <button className={`tab-button ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
            Manage Users
          </button>
          <button className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
            My Profile
          </button>
        </div>

        {/* Hostels Tab */}
        {activeTab === 'hostels' && (
          <div className="hostels-section">
            <div className="section-header">
              <h3 className="section-title">My Hostels</h3>
              <button
                onClick={() => {
                  setEditingHostel(null)
                  setFormData({ name: '', location: '', price: '', description: '', beds: '', rating: 4.5, reviews: 0, image: '', hasRoommates: false })
                  setShowAddForm(!showAddForm)
                }}
                className="add-button"
              >
                {showAddForm ? 'Cancel' : 'Add Hostel'}
              </button>
            </div>

            {showAddForm && (
              <form onSubmit={editingHostel ? handleUpdateHostel : handleAddHostel} className="add-hostel-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Hostel Name</label>
                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
                  </div>
                  <div className="form-group">
                    <label>Location</label>
                    <input type="text" name="location" value={formData.location} onChange={handleInputChange} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Price per Night ($)</label>
                    <input type="number" name="price" value={formData.price} onChange={handleInputChange} required min="1" />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea name="description" value={formData.description} onChange={handleInputChange} rows="3" />
                  </div>
                </div>
                <button type="submit" className="submit-button">
                  {editingHostel ? 'Update Hostel' : 'Add Hostel'}
                </button>
              </form>
            )}

            <div className="hostels-list">
              {hostels.length > 0 ? (
                hostels.map((hostel) => (
                  <div key={hostel.id} className="hostel-card">
                    <div className="hostel-info">
                      <h4 className="hostel-name">{hostel.name}</h4>
                      <p className="hostel-location">{hostel.location}</p>
                      <p className="hostel-description">{hostel.description}</p>
                      <div className="hostel-stats">
                        <span>Price: ${hostel.price}/night</span>
                        <span>Bookings: {hostel.bookings || 0}</span>
                        <span>Revenue: ${hostel.revenue || 0}</span>
                      </div>
                    </div>
                    <div className="hostel-actions">
                      <button onClick={() => handleEditHostel(hostel)} className="edit-button">Edit</button>
                      <button onClick={() => handleDeleteHostel(hostel.id)} className="delete-button">Delete</button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">House</div>
                  <h3>No Hostels Added</h3>
                  <p>Start by adding your first hostel listing</p>
                  <button onClick={() => setShowAddForm(true)} className="empty-state-button">
                    Add Your First Hostel
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="bookings-section">
            <h3 className="section-title">All Bookings</h3>
            <div className="bookings-table-container">
              <table className="bookings-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Hostel</th>
                    <th>Check-in</th>
                    <th>Check-out</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allBookings.map((booking) => (
                    <tr key={booking.id}>
                      <td>{booking.userName}</td>
                      <td>{booking.userEmail}</td>
                      <td>{booking.hostelName}</td>
                      <td>{booking.checkIn}</td>
                      <td>{booking.checkOut}</td>
                      <td>${booking.price}</td>
                      <td>
                        <select
                          value={booking.status}
                          onChange={(e) => handleBookingStatusChange(booking.id, e.target.value)}
                          className={`status-select ${booking.status}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td><button className="view-button">View</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="users-section">
            <h3 className="section-title">Manage Users</h3>
            <div className="users-table-container">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Bookings</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.role}</td>
                      <td>{user.bookings || 0}</td>
                      <td>
                        <select
                          value={user.status || 'active'}
                          onChange={(e) => handleUserStatusChange(user.id, e.target.value)}
                          className={`status-select ${user.status || 'active'}`}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </td>
                      <td><button className="view-button">View Details</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="profile-section">
            <div className="section-header">
              <h3 className="section-title">My Profile</h3>
              <button
                onClick={() => setEditingProfile(!editingProfile)}
                className="add-button"
                style={{ background: editingProfile ? '#dc3545' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}
              >
                {editingProfile ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>

            <div className="profile-card">
              <div className="profile-header">
                <div className="profile-avatar">
                  {ownerProfile.photoURL ? (
                    <img src={ownerProfile.photoURL} alt="Profile" />
                  ) : (
                    <div className="avatar-placeholder">
                      {ownerProfile.name.charAt(0).toUpperCase() || 'O'}
                    </div>
                  )}
                </div>
                <div className="profile-info">
                  <h3>{ownerProfile.name || 'Hostel Owner'}</h3>
                  <p>{ownerProfile.email}</p>
                </div>
              </div>

              {editingProfile ? (
                <form onSubmit={handleSaveProfile} className="profile-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Full Name</label>
                      <input
                        type="text"
                        value={ownerProfile.name}
                        onChange={(e) => setOwnerProfile({...ownerProfile, name: e.target.value})}
                        required
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div className="form-group">
                      <label>Phone Number</label>
                      <input
                        type="tel"
                        value={ownerProfile.phone}
                        onChange={(e) => setOwnerProfile({...ownerProfile, phone: e.target.value})}
                        placeholder="+123 456 7890"
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Email (cannot be changed)</label>
                      <input type="email" value={ownerProfile.email} disabled />
                    </div>
                    <div className="form-group">
                      <label>Profile Photo URL</label>
                      <input
                        type="url"
                        value={ownerProfile.photoURL}
                        onChange={(e) => setOwnerProfile({...ownerProfile, photoURL: e.target.value})}
                        placeholder="https://example.com/photo.jpg"
                      />
                    </div>
                  </div>
                  <button type="submit" className="submit-button">Save Changes</button>
                </form>
              ) : (
                <div className="profile-details">
                  <div className="detail-item">
                    <span className="detail-label">Phone:</span>
                    <span className="detail-value">
                      {ownerProfile.phone || <em style={{color: '#9ca3af'}}>Not provided</em>}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Total Hostels:</span>
                    <span className="detail-value">{hostels.length}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Total Revenue:</span>
                    <span className="detail-value">${totalRevenue.toLocaleString()}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Member Since:</span>
                    <span className="detail-value">
                      {currentUser?.metadata?.creationTime ? new Date(currentUser.metadata.creationTime).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default OwnerDashboard