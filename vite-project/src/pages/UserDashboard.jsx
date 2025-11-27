import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../components/ThemeContext'
import { useNavigate } from 'react-router-dom'
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc,
  deleteDoc,
  setDoc,
  getDoc
} from 'firebase/firestore'

import { updateProfile } from 'firebase/auth'
import { db } from '../firebase'
import { CompareHostels } from './CompareHostels'
import './UserDashboard.css'

function UserDashboard() {
  const { currentUser, userProfile, updateUserProfile } = useAuth()
  const { theme } = useTheme()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('profile')
  const [showProfileEdit, setShowProfileEdit] = useState(false)
  const [loading, setLoading] = useState(true)
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    bio: ''
  })

  const [bookings, setBookings] = useState([])
  const [availableHostels, setAvailableHostels] = useState([])

  // Load profile data from Firestore
  useEffect(() => {
    const loadProfile = async () => {
      if (!currentUser) return

      try {
        const userDoc = doc(db, 'users', currentUser.uid)
        const docSnap = await getDoc(userDoc)

        if (docSnap.exists()) {
          const data = docSnap.data()
          setProfileData({
            name: data.displayName || currentUser.displayName || '',
            email: data.email || currentUser.email || '',
            phone: data.phone || '',
            address: data.location || '',
            bio: data.bio || ''
          })
        } else {
          setProfileData({
            name: currentUser.displayName || '',
            email: currentUser.email || '',
            phone: '',
            address: '',
            bio: ''
          })
        }
      } catch (error) {
        console.error('Error loading profile:', error)
      }
    }

    loadProfile()
  }, [currentUser])

  // Load bookings from Firestore
  useEffect(() => {
    const loadBookings = async () => {
      if (!currentUser) return
      
      try {
        const bookingsQuery = query(
          collection(db, 'bookings'),
          where('userId', '==', currentUser.uid)
        )
        const querySnapshot = await getDocs(bookingsQuery)
        const bookingsData = []
        querySnapshot.forEach((doc) => {
          bookingsData.push({ id: doc.id, ...doc.data() })
        })
        setBookings(bookingsData.sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate)))
      } catch (error) {
        console.error('Error loading bookings:', error)
      }
    }

    loadBookings()
  }, [currentUser])

  // Load available hostels from Firestore
  useEffect(() => {
    const loadHostels = async () => {
      try {
        const hostelsQuery = query(collection(db, 'hostels'))
        const querySnapshot = await getDocs(hostelsQuery)
        const hostelsData = []
        querySnapshot.forEach((doc) => {
          hostelsData.push({ id: doc.id, ...doc.data() })
        })
        setAvailableHostels(hostelsData)
        setLoading(false)
      } catch (error) {
        console.error('Error loading hostels:', error)
        setLoading(false)
      }
    }

    loadHostels()
  }, [])

  const [bookingForm, setBookingForm] = useState({
    hostelId: '',
    checkIn: '',
    checkOut: '',
    guests: 1
  })

  const handleProfileChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    })
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    if (!currentUser) return

    try {
      // Update Firebase Auth name
      await updateProfile(currentUser, {
        displayName: profileData.name
      })

      // SAVE TO FIRESTORE
      await setDoc(doc(db, 'users', currentUser.uid), {
        displayName: profileData.name,
        email: currentUser.email,
        phone: profileData.phone,
        location: profileData.address,
        bio: profileData.bio,
        role: 'user',
        updatedAt: new Date().toISOString()
      }, { merge: true })

      setShowProfileEdit(false)
      alert('Profile saved forever!')
    } catch (error) {
      console.error('Save failed:', error)
      alert('Error: ' + error.message)
    }
  }

  const handleBookingFormChange = (e) => {
    setBookingForm({
      ...bookingForm,
      [e.target.name]: e.target.value
    })
  }

  const handleMakeBooking = async (e) => {
    e.preventDefault()
    if (!bookingForm.hostelId || !bookingForm.checkIn || !bookingForm.checkOut) {
      alert('Please fill in all booking details')
      return
    }

    try {
      const selectedHostel = availableHostels.find(h => h.id === bookingForm.hostelId)
      if (!selectedHostel) {
        alert('Hostel not found')
        return
      }

      const nights = Math.ceil((new Date(bookingForm.checkOut) - new Date(bookingForm.checkIn)) / (1000 * 60 * 60 * 24))
      const totalPrice = selectedHostel.price * nights * bookingForm.guests

      const newBooking = {
        userId: currentUser.uid,
        hostelId: bookingForm.hostelId,
        hostelName: selectedHostel.name,
        checkIn: bookingForm.checkIn,
        checkOut: bookingForm.checkOut,
        status: 'pending',
        price: totalPrice,
        guests: bookingForm.guests,
        bookingDate: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }

      // Save to Firestore
      const docRef = await addDoc(collection(db, 'bookings'), newBooking)
      
      // Update local state
      setBookings([{ id: docRef.id, ...newBooking }, ...bookings])
      setBookingForm({ hostelId: '', checkIn: '', checkOut: '', guests: 1 })
      alert('Booking request submitted successfully!')
    } catch (error) {
      console.error('Error creating booking:', error)
      alert('Failed to create booking. Please try again.')
    }
  }

  const handleViewHostel = (hostelId) => {
    navigate(`/hostel/${hostelId}`)
  }

  const handleCancelBooking = async (bookingId) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      try {
        const bookingRef = doc(db, 'bookings', bookingId)
        await updateDoc(bookingRef, { status: 'cancelled' })
        
        // Update local state
        setBookings(bookings.map(booking => 
          booking.id === bookingId ? { ...booking, status: 'cancelled' } : booking
        ))
        alert('Booking cancelled successfully!')
      } catch (error) {
        console.error('Error cancelling booking:', error)
        alert('Failed to cancel booking. Please try again.')
      }
    }
  }

  const totalSpent = bookings
    .filter(b => b.status === 'confirmed')
    .reduce((sum, booking) => sum + booking.price, 0)

  const getMemberSince = () => {
    const created = currentUser?.metadata?.creationTime
    if (created) {
      return new Date(created).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    }
    return 'Nov 2025'
  }

  return (
    <div className={`user-dashboard ${theme}`}>
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h2 className="dashboard-title">My Dashboard</h2>
          <div className="user-info">
            <p>Welcome, {currentUser?.displayName || currentUser?.email}</p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="stats-section">
          <div className="stat-card">
            <div className="stat-icon calendar-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="6" width="18" height="15" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M3 10h18" stroke="currentColor" strokeWidth="2"/>
                <path d="M8 3v4M16 3v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h3 className="stat-label">Total Bookings</h3>
            <p className="stat-value">{bookings.length}</p>
          </div>
          <div className="stat-card">
            <div className="stat-icon check-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M8 12l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="stat-label">Confirmed</h3>
            <p className="stat-value">
              {bookings.filter(b => b.status === 'confirmed').length}
            </p>
          </div>
          <div className="stat-card">
            <div className="stat-icon dollar-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="stat-label">Total Spent</h3>
            <p className="stat-value">${totalSpent.toLocaleString()}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="dashboard-tabs">
          <button 
            className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            My Profile
          </button>
          <button 
            className={`tab-button ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            Booking History
          </button>
          <button 
            className={`tab-button ${activeTab === 'new-booking' ? 'active' : ''}`}
            onClick={() => setActiveTab('new-booking')}
          >
            Make Booking
          </button>
          <button 
            className={`tab-button ${activeTab === 'compare' ? 'active' : ''}`}
            onClick={() => setActiveTab('compare')}
          >
            Compare Hostels
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="profile-section">
            <div className="section-header">
              <h3 className="section-title">My Profile</h3>
              <button
                onClick={() => setShowProfileEdit(!showProfileEdit)}
                className="edit-button"
              >
                {showProfileEdit ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>

            {showProfileEdit ? (
              <form onSubmit={handleProfileSubmit} className="profile-form">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={profileData.name}
                    onChange={handleProfileChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    required
                    disabled
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                  />
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <input
                    type="text"
                    name="address"
                    value={profileData.address}
                    onChange={handleProfileChange}
                  />
                </div>
                <div className="form-group">
                  <label>Bio</label>
                  <textarea
                    name="bio"
                    value={profileData.bio}
                    onChange={handleProfileChange}
                    rows="4"
                    placeholder="Tell us about yourself..."
                  />
                </div>
                <button type="submit" className="submit-button">
                  Save Changes
                </button>
              </form>
            ) : (
              <div className="profile-display-card">
                <div className="profile-header-section">
                  <div className="profile-avatar">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
                      <path d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div className="profile-header-info">
                    <h3 className="profile-name">{profileData.name || 'User Name'}</h3>
                    <p className="profile-member-since">Member since {getMemberSince()}</p>
                  </div>
                </div>

                <div className="profile-details-grid">
                  <div className="profile-detail-item">
                    <div className="detail-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
                        <path d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div className="detail-content">
                      <p className="detail-label">Full Name</p>
                      <p className="detail-value">{profileData.name || 'Not set'}</p>
                    </div>
                  </div>

                  <div className="profile-detail-item">
                    <div className="detail-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                        <path d="M3 7l9 6 9-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="detail-content">
                      <p className="detail-label">Email Address</p>
                      <p className="detail-value">{profileData.email}</p>
                    </div>
                  </div>

                  <div className="profile-detail-item">
                    <div className="detail-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="detail-content">
                      <p className="detail-label">Phone Number</p>
                      <p className="detail-value">{profileData.phone || 'Not set'}</p>
                    </div>
                  </div>

                  <div className="profile-detail-item">
                    <div className="detail-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" strokeWidth="2"/>
                        <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </div>
                    <div className="detail-content">
                      <p className="detail-label">Location</p>
                      <p className="detail-value">{profileData.address || 'Not set'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Booking History Tab */}
        {activeTab === 'bookings' && (
          <div className="bookings-section">
            <h3 className="section-title">Booking History</h3>
            {bookings.length > 0 ? (
              <div className="bookings-list">
                {bookings.map((booking) => (
                  <div key={booking.id} className="booking-card">
                    <div className="booking-info">
                      <h4 className="booking-hostel-name">{booking.hostelName}</h4>
                      <div className="booking-details">
                        <div className="booking-dates">
                          <span>Check-in: {booking.checkIn}</span>
                          <span>Check-out: {booking.checkOut}</span>
                        </div>
                        <div className="booking-meta">
                          <span>Guests: {booking.guests || 1}</span>
                          <span>Booked on: {booking.bookingDate}</span>
                        </div>
                      </div>
                      <div className="booking-footer">
                        <span className={`booking-status ${booking.status}`}>
                          {booking.status}
                        </span>
                        <span className="booking-price">${booking.price}</span>
                      </div>
                    </div>
                    <div className="booking-actions">
                      <button
                        onClick={() => handleViewHostel(booking.hostelId)}
                        className="view-button"
                      >
                        View Hostel
                      </button>
                      {booking.status !== 'cancelled' && (
                        <button
                          onClick={() => handleCancelBooking(booking.id)}
                          className="cancel-button"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No bookings yet. Start exploring hostels!</p>
              </div>
            )}
          </div>
        )}

        {/* Make Booking Tab */}
        {activeTab === 'new-booking' && (
          <div className="new-booking-section">
            <h3 className="section-title">Make a New Booking</h3>
            <form onSubmit={handleMakeBooking} className="booking-form">
              <div className="form-group">
                <label>Select Hostel</label>
                <select
                  name="hostelId"
                  value={bookingForm.hostelId}
                  onChange={handleBookingFormChange}
                  required
                >
                  <option value="">Choose a hostel...</option>
                  {availableHostels.map((hostel) => (
                    <option key={hostel.id} value={hostel.id}>
                      {hostel.name} - ${hostel.price}/night ({hostel.location})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Check-in Date</label>
                  <input
                    type="date"
                    name="checkIn"
                    value={bookingForm.checkIn}
                    onChange={handleBookingFormChange}
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="form-group">
                  <label>Check-out Date</label>
                  <input
                    type="date"
                    name="checkOut"
                    value={bookingForm.checkOut}
                    onChange={handleBookingFormChange}
                    required
                    min={bookingForm.checkIn || new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="form-group">
                  <label>Number of Guests</label>
                  <input
                    type="number"
                    name="guests"
                    value={bookingForm.guests}
                    onChange={handleBookingFormChange}
                    required
                    min="1"
                    max="10"
                  />
                </div>
              </div>
              {bookingForm.hostelId && bookingForm.checkIn && bookingForm.checkOut && (
                <div className="booking-summary">
                  {(() => {
                    const selectedHostel = availableHostels.find(h => h.id === bookingForm.hostelId)
                    const nights = Math.ceil((new Date(bookingForm.checkOut) - new Date(bookingForm.checkIn)) / (1000 * 60 * 60 * 24))
                    const totalPrice = selectedHostel ? selectedHostel.price * nights * bookingForm.guests : 0
                    return (
                      <div className="summary-card">
                        <h4>Booking Summary</h4>
                        <p>Hostel: {selectedHostel?.name}</p>
                        <p>Nights: {nights}</p>
                        <p>Guests: {bookingForm.guests}</p>
                        <p className="total-price">Total: ${totalPrice}</p>
                      </div>
                    )
                  })()}
                </div>
              )}
              <button type="submit" className="submit-button">
                Submit Booking Request
              </button>
            </form>
          </div>
        )}

        {/* Compare Hostels Tab */}
        {activeTab === 'compare' && (
          <div className="compare-section">
            <CompareHostels />
          </div>
        )}
      </div>
    </div>
  )
}

export default UserDashboard