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
    capacity: '',
    rating: '4.5',
    reviews: '0',
    image: '',
    wifiSpeed: '',
    checkInTime: '14:00',
    checkOutTime: '11:00',
    amenities: {
      wifi: false,
      kitchen: false,
      laundry: false,
      parking: false,
      breakfast: false,
      airConditioning: false,
      heating: false,
      pool: false,
      gym: false,
      lockers: false,
      commonRoom: false,
      bbq: false,
      security: false,
      reception24h: false
    }
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
    const { name, value, type, checked } = e.target
    if (name.startsWith('amenity_')) {
      const amenityKey = name.replace('amenity_', '')
      setFormData({
        ...formData,
        amenities: {
          ...formData.amenities,
          [amenityKey]: checked
        }
      })
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      location: '',
      price: '',
      description: '',
      capacity: '',
      rating: '4.5',
      reviews: '0',
      image: '',
      wifiSpeed: '',
      checkInTime: '14:00',
      checkOutTime: '11:00',
      amenities: {
        wifi: false,
        kitchen: false,
        laundry: false,
        parking: false,
        breakfast: false,
        airConditioning: false,
        heating: false,
        pool: false,
        gym: false,
        lockers: false,
        commonRoom: false,
        bbq: false,
        security: false,
        reception24h: false
      }
    })
  }

  const handleAddHostel = async (e) => {
    e.preventDefault()
    if (!currentUser) {
      alert('You must be logged in to add a hostel')
      return
    }

    try {
      const amenitiesArray = Object.keys(formData.amenities)
        .filter(key => formData.amenities[key])
        .map(key => key.replace(/([A-Z])/g, ' $1').trim()
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
        )

      const newHostel = {
        ownerId: currentUser.uid,
        ownerName: ownerProfile.name || currentUser.displayName || currentUser.email,
        name: formData.name,
        location: formData.location,
        price: parseFloat(formData.price),
        capacity: parseInt(formData.capacity) || 0,
        rating: parseFloat(formData.rating) || 4.5,
        reviews: parseInt(formData.reviews) || 0,
        description: formData.description || '',
        image: formData.image || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800',
        wifiSpeed: formData.wifiSpeed || '50',
        checkInTime: formData.checkInTime || '14:00',
        checkOutTime: formData.checkOutTime || '11:00',
        amenities: amenitiesArray,
        bookings: 0,
        revenue: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const docRef = await addDoc(collection(db, 'hostels'), newHostel)
      setHostels([...hostels, { id: docRef.id, ...newHostel }])
      resetForm()
      setShowAddForm(false)
      setEditingHostel(null)
      alert('Hostel added successfully!')
    } catch (error) {
      console.error('Error adding hostel:', error)
      alert('Failed to add hostel: ' + error.message)
    }
  }

  const handleEditHostel = (hostel) => {
    setEditingHostel(hostel)

    const amenitiesObj = {
      wifi: false, kitchen: false, laundry: false, parking: false, breakfast: false,
      airConditioning: false, heating: false, pool: false, gym: false, lockers: false,
      commonRoom: false, bbq: false, security: false, reception24h: false
    }

    if (hostel.amenities && Array.isArray(hostel.amenities)) {
      hostel.amenities.forEach(amenity => {
        const key = amenity.toLowerCase().replace(/\s+/g, '')
        if (key in amenitiesObj) amenitiesObj[key] = true
      })
    }

    setFormData({
      name: hostel.name || '',
      location: hostel.location || '',
      price: hostel.price?.toString() || '',
      description: hostel.description || '',
      capacity: hostel.capacity?.toString() || '',
      rating: hostel.rating?.toString() || '4.5',
      reviews: hostel.reviews?.toString() || '0',
      image: hostel.image || '',
      wifiSpeed: hostel.wifiSpeed || '50',
      checkInTime: hostel.checkInTime || '14:00',
      checkOutTime: hostel.checkOutTime || '11:00',
      amenities: amenitiesObj
    })
    setShowAddForm(true)
  }

  const handleUpdateHostel = async (e) => {
    e.preventDefault()
    if (!editingHostel) return

    try {
      const amenitiesArray = Object.keys(formData.amenities)
        .filter(key => formData.amenities[key])
        .map(key => key.replace(/([A-Z])/g, ' $1').trim()
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
        )

      const updateData = {
        name: formData.name,
        location: formData.location,
        price: parseFloat(formData.price),
        capacity: parseInt(formData.capacity) || 0,
        rating: parseFloat(formData.rating) || 4.5,
        reviews: parseInt(formData.reviews) || 0,
        description: formData.description || '',
        image: formData.image || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800',
        wifiSpeed: formData.wifiSpeed || '50',
        checkInTime: formData.checkInTime || '14:00',
        checkOutTime: formData.checkOutTime || '11:00',
        amenities: amenitiesArray,
        updatedAt: new Date().toISOString()
      }

      const hostelRef = doc(db, 'hostels', editingHostel.id)
      await updateDoc(hostelRef, updateData)

      setHostels(hostels.map(h => h.id === editingHostel.id ? { ...h, ...updateData } : h))
      resetForm()
      setEditingHostel(null)
      setShowAddForm(false)
      alert('Hostel updated successfully!')
    } catch (error) {
      console.error('Error updating hostel:', error)
      alert('Failed to update hostel: ' + error.message)
    }
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

  const totalRevenue = hostels.reduce((sum, h) => sum + (h.revenue || 0), 0)
  const totalBookings = hostels.reduce((sum, h) => sum + (h.bookings || 0), 0)
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
          <button className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>My Profile</button>
        </div>

        {/* Hostels Tab */}
        {activeTab === 'hostels' && (
          <div className="hostels-section">
            <div className="section-header">
              <h3 className="section-title">My Hostels</h3>
              <button
                onClick={() => {
                  if (showAddForm) {
                    setEditingHostel(null)
                    resetForm()
                    setShowAddForm(false)
                  } else {
                    setEditingHostel(null)
                    resetForm()
                    setShowAddForm(true)
                  }
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

                <div className="form-row">
                  <div className="form-group">
                    <label>Hostel Name *</label>
                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} required placeholder="e.g., Sunset Backpackers" />
                  </div>
                  <div className="form-group">
                    <label>Location *</label>
                    <input type="text" name="location" value={formData.location} onChange={handleInputChange} required placeholder="e.g., Bali, Indonesia" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Price per Night ($) *</label>
                    <input type="number" name="price" value={formData.price} onChange={handleInputChange} required min="1" step="0.01" placeholder="25" />
                  </div>
                  <div className="form-group">
                    <label>Capacity (Beds) *</label>
                    <input type="number" name="capacity" value={formData.capacity} onChange={handleInputChange} required min="1" placeholder="40" />
                  </div>
                  <div className="form-group">
                    <label>WiFi Speed (Mbps)</label>
                    <input type="text" name="wifiSpeed" value={formData.wifiSpeed} onChange={handleInputChange} placeholder="50" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Rating (0-5)</label>
                    <input type="number" name="rating" value={formData.rating} onChange={handleInputChange} min="0" max="5" step="0.1" />
                  </div>
                  <div className="form-group">
                    <label>Number of Reviews</label>
                    <input type="number" name="reviews" value={formData.reviews} onChange={handleInputChange} min="0" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Check-in Time</label>
                    <input type="time" name="checkInTime" value={formData.checkInTime} onChange={handleInputChange} />
                  </div>
                  <div className="form-group">
                    <label>Check-out Time</label>
                    <input type="time" name="checkOutTime" value={formData.checkOutTime} onChange={handleInputChange} />
                  </div>
                </div>

                <div className="form-group">
                  <label>Image URL</label>
                  <input type="url" name="image" value={formData.image} onChange={handleInputChange} placeholder="https://images.unsplash.com/photo-..." />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea name="description" value={formData.description} onChange={handleInputChange} rows="4" placeholder="Describe your hostel..." />
                </div>

                <div className="form-group" style={{marginTop: '20px'}}>
                  <label style={{fontSize: '1.1rem', fontWeight: 600, marginBottom: '15px', display: 'block'}}>Amenities & Features</label>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '12px',
                    background: '#f9fafb',
                    padding: '20px',
                    borderRadius: '8px'
                  }}>
                    {[
                      { key: 'wifi', label: 'WiFi' },
                      { key: 'kitchen', label: 'Kitchen' },
                      { key: 'laundry', label: 'Laundry' },
                      { key: 'parking', label: 'Parking' },
                      { key: 'breakfast', label: 'Breakfast' },
                      { key: 'airConditioning', label: 'Air Conditioning' },
                      { key: 'heating', label: 'Heating' },
                      { key: 'pool', label: 'Pool' },
                      { key: 'gym', label: 'Gym' },
                      { key: 'lockers', label: 'Lockers' },
                      { key: 'commonRoom', label: 'Common Room' },
                      { key: 'bbq', label: 'BBQ Area' },
                      { key: 'security', label: 'Security' },
                      { key: 'reception24h', label: '24/7 Reception' }
                    ].map(item => (
                      <label key={item.key} style={{display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'}}>
                        <input
                          type="checkbox"
                          name={`amenity_${item.key}`}
                          checked={formData.amenities[item.key]}
                          onChange={handleInputChange}
                          style={{width: '18px', height: '18px'}}
                        />
                        <span>{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button type="submit" className="submit-button" style={{marginTop: '20px'}}>
                  {editingHostel ? 'Update Hostel' : 'Add Hostel'}
                </button>
              </form>
            )}

            <div className="hostels-list">
              {hostels.length > 0 ? (
                hostels.map(hostel => (
                  <div key={hostel.id} className="hostel-card">
                    {hostel.image && (
                      <img src={hostel.image} alt={hostel.name} style={{width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px 8px 0 0', marginBottom: '15px'}} />
                    )}
                    <div className="hostel-info">
                      <h4 className="hostel-name">{hostel.name}</h4>
                      <p className="hostel-location">Location: {hostel.location}</p>
                      <p className="hostel-description">{hostel.description}</p>
                      {hostel.amenities?.length > 0 && (
                        <div style={{margin: '10px 0'}}>
                          <strong style={{fontSize: '0.9rem', color: '#6b7280'}}>Amenities:</strong>
                          <div style={{display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px'}}>
                            {hostel.amenities.slice(0, 5).map((a, i) => (
                              <span key={i} style={{background: '#e5e7eb', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem'}}>{a}</span>
                            ))}
                            {hostel.amenities.length > 5 && <span style={{fontSize: '0.8rem', color: '#6b7280'}}>+{hostel.amenities.length - 5} more</span>}
                          </div>
                        </div>
                      )}
                      <div className="hostel-stats">
                        <span>Price: ${hostel.price}/night</span>
                        <span>Beds: {hostel.capacity}</span>
                        <span>Rating: {hostel.rating} ({hostel.reviews} reviews)</span>
                      </div>
                      <div className="hostel-stats">
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
                      <th>User</th>
                      <th>Email</th>
                      <th>Hostel</th>
                      <th>Check-in</th>
                      <th>Check-out</th>
                      <th>Guests</th>
                      <th>Price</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allBookings.map(booking => (
                      <tr key={booking.id}>
                        <td>{booking.userName || 'N/A'}</td>
                        <td>{booking.userEmail || 'N/A'}</td>
                        <td>{booking.hostelName}</td>
                        <td>{booking.checkIn}</td>
                        <td>{booking.checkOut}</td>
                        <td>{booking.guests || 1}</td>
                        <td>${booking.price}</td>
                        <td>
                          <select value={booking.status} onChange={(e) => handleBookingStatusChange(booking.id, e.target.value)} className={`status-select ${booking.status}`}>
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
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">Calendar</div>
                <h3>No Bookings Yet</h3>
                <p>Bookings will appear here once users start booking your hostels</p>
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
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
                        <td>{user.role}</td>
                        <td>{user.phone || 'N/A'}</td>
                        <td>
                          <select value={user.status || 'active'} onChange={(e) => handleUserStatusChange(user.id, e.target.value)} className={`status-select ${user.status || 'active'}`}>
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
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">People</div>
                <h3>No Users Found</h3>
                <p>User accounts will appear here</p>
              </div>
            )}
          </div>
        )}

        {/* Profile Tab */}
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
                    <div className="avatar-placeholder">
                      {(ownerProfile.name?.charAt(0) || 'O').toUpperCase()}
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
                      <input type="text" value={ownerProfile.name} onChange={(e) => setOwnerProfile({...ownerProfile, name: e.target.value})} required />
                    </div>
                    <div className="form-group">
                      <label>Phone Number</label>
                      <input type="tel" value={ownerProfile.phone} onChange={(e) => setOwnerProfile({...ownerProfile, phone: e.target.value})} placeholder="+123 456 7890" />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Email (cannot be changed)</label>
                      <input type="email" value={ownerProfile.email} disabled />
                    </div>
                    <div className="form-group">
                      <label>Profile Photo URL</label>
                      <input type="url" value={ownerProfile.photoURL} onChange={(e) => setOwnerProfile({...ownerProfile, photoURL: e.target.value})} placeholder="https://example.com/photo.jpg" />
                    </div>
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
      </div>
    </div>
  )
}

export default OwnerDashboard