import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../components/ThemeContext'
import { useNavigate } from 'react-router-dom'
import './UserDashboard.css'

function UserDashboard() {
  const { currentUser } = useAuth()
  const { theme } = useTheme()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('bookings')
  const [showProfileEdit, setShowProfileEdit] = useState(false)
  const [profileData, setProfileData] = useState({
    name: currentUser?.displayName || '',
    email: currentUser?.email || '',
    phone: '',
    address: '',
    bio: ''
  })

  // Sample bookings data
  const [bookings, setBookings] = useState([
    {
      id: 1,
      hostelName: 'Sunset Hostel',
      hostelId: 1,
      checkIn: '2024-01-15',
      checkOut: '2024-01-20',
      status: 'confirmed',
      price: 125,
      bookingDate: '2024-01-10'
    },
    {
      id: 2,
      hostelName: 'Mountain View Hostel',
      hostelId: 2,
      checkIn: '2024-02-01',
      checkOut: '2024-02-05',
      status: 'pending',
      price: 120,
      bookingDate: '2024-01-25'
    },
    {
      id: 3,
      hostelName: 'Riverside Hostel',
      hostelId: 3,
      checkIn: '2024-03-10',
      checkOut: '2024-03-15',
      status: 'confirmed',
      price: 140,
      bookingDate: '2024-02-28'
    }
  ])

  // Sample available hostels for booking
  const availableHostels = [
    {
      id: 1,
      name: 'Sunset Hostel',
      location: 'Downtown',
      price: 25,
      rating: 4.5,
      available: true
    },
    {
      id: 2,
      name: 'Mountain View Hostel',
      location: 'City Center',
      price: 30,
      rating: 4.8,
      available: true
    },
    {
      id: 3,
      name: 'Riverside Hostel',
      location: 'Waterfront',
      price: 28,
      rating: 4.3,
      available: true
    }
  ]

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

  const handleProfileSubmit = (e) => {
    e.preventDefault()
    // In a real app, this would update the user profile in Firebase
    console.log('Profile updated:', profileData)
    setShowProfileEdit(false)
    alert('Profile updated successfully!')
  }

  const handleBookingFormChange = (e) => {
    setBookingForm({
      ...bookingForm,
      [e.target.name]: e.target.value
    })
  }

  const handleMakeBooking = (e) => {
    e.preventDefault()
    if (!bookingForm.hostelId || !bookingForm.checkIn || !bookingForm.checkOut) {
      alert('Please fill in all booking details')
      return
    }

    const selectedHostel = availableHostels.find(h => h.id === parseInt(bookingForm.hostelId))
    const nights = Math.ceil((new Date(bookingForm.checkOut) - new Date(bookingForm.checkIn)) / (1000 * 60 * 60 * 24))
    const totalPrice = selectedHostel.price * nights * bookingForm.guests

    const newBooking = {
      id: Date.now(),
      hostelName: selectedHostel.name,
      hostelId: selectedHostel.id,
      checkIn: bookingForm.checkIn,
      checkOut: bookingForm.checkOut,
      status: 'pending',
      price: totalPrice,
      bookingDate: new Date().toISOString().split('T')[0],
      guests: bookingForm.guests
    }

    setBookings([...bookings, newBooking])
    setBookingForm({ hostelId: '', checkIn: '', checkOut: '', guests: 1 })
    alert('Booking request submitted successfully!')
  }

  const handleViewHostel = (hostelId) => {
    navigate(`/hostel/${hostelId}`)
  }

  const handleCancelBooking = (bookingId) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      setBookings(bookings.map(booking => 
        booking.id === bookingId ? { ...booking, status: 'cancelled' } : booking
      ))
    }
  }

  const totalSpent = bookings
    .filter(b => b.status === 'confirmed')
    .reduce((sum, booking) => sum + booking.price, 0)

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
            <h3 className="stat-label">Total Bookings</h3>
            <p className="stat-value">{bookings.length}</p>
          </div>
          <div className="stat-card">
            <h3 className="stat-label">Confirmed</h3>
            <p className="stat-value">
              {bookings.filter(b => b.status === 'confirmed').length}
            </p>
          </div>
          <div className="stat-card">
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
              <div className="profile-display">
                <div className="profile-info">
                  <div className="info-item">
                    <span className="info-label">Name:</span>
                    <span className="info-value">{profileData.name || 'Not set'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Email:</span>
                    <span className="info-value">{profileData.email}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Phone:</span>
                    <span className="info-value">{profileData.phone || 'Not set'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Address:</span>
                    <span className="info-value">{profileData.address || 'Not set'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Bio:</span>
                    <span className="info-value">{profileData.bio || 'No bio added yet'}</span>
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
                    const selectedHostel = availableHostels.find(h => h.id === parseInt(bookingForm.hostelId))
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
      </div>
    </div>
  )
}

export default UserDashboard
