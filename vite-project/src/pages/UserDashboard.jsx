import { useState, useEffect, useRef } from 'react'
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
  setDoc,
  getDoc
} from 'firebase/firestore'

import { updateProfile } from 'firebase/auth'
import { db } from '../firebase'
import { CompareHostels } from './CompareHostels'
import { Notifications } from './Notifications'
import { Wishlist } from './MyWishlist'
import { Camera, MapPin, Calendar, Clock, Plus, X } from 'lucide-react'
import './UserDashboard.css'

function UserDashboard() {
  const { currentUser } = useAuth()
  const { theme } = useTheme()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [activeTab, setActiveTab] = useState('profile')
  const [showProfileEdit, setShowProfileEdit] = useState(false)
  
  // --- STATE FOR PROFILE ---
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    bio: '',
    photoURL: '',
    age: '',
    gender: 'Prefer not to say',
    occupation: 'Student',
    smoker: 'No',
    sleepSchedule: 'Flexible',
    cleanliness: 'Average', 
    lookingForRoommate: false,
    totalSpent: 0 // <--- Will store the aggregate value
  })

  const [bookings, setBookings] = useState([])
  const [availableHostels, setAvailableHostels] = useState([])

  // 1. Load Profile Data (Ensuring totalSpent is a Number)
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
            bio: data.bio || '',
            photoURL: data.photoURL || currentUser.photoURL || '',
            age: data.age || '',
            gender: data.gender || 'Prefer not to say',
            occupation: data.occupation || 'Student',
            smoker: data.smoker || 'No',
            sleepSchedule: data.sleepSchedule || 'Flexible',
            cleanliness: data.cleanliness || 'Average',
            lookingForRoommate: data.lookingForRoommate || false,
            // FORCE NUMBER CONVERSION HERE to fix any string data in DB
            totalSpent: parseFloat(data.totalSpent) || 0 
          })
        } else {
          setProfileData(prev => ({
            ...prev,
            name: currentUser.displayName || '',
            email: currentUser.email || '',
            photoURL: currentUser.photoURL || '',
            totalSpent: 0
          }))
        }
      } catch (error) {
        console.error('Error loading profile:', error)
      }
    }
    loadProfile()
  }, [currentUser])

  // 2. Load Bookings
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

  // 3. Load Hostels
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
      } catch (error) {
        console.error('Error loading hostels:', error)
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

  // --- HELPER FUNCTIONS ---
  const getNights = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    const diff = end - start;
    if (diff <= 0) return 0; 
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  const calculateBookingPrice = (pricePerNight, nights, guests) => {
     const safePrice = parseFloat(pricePerNight) || 0;
     const safeNights = parseInt(nights) || 0;
     const safeGuests = parseInt(guests) || 1;
     return safePrice * safeNights * safeGuests;
  }

  const handleProfileChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setProfileData({
      ...profileData,
      [e.target.name]: value
    })
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
        setProfileData(prev => ({ ...prev, photoURL: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    if (!currentUser) return
    try {
      await updateProfile(currentUser, { displayName: profileData.name })
      await setDoc(doc(db, 'users', currentUser.uid), {
        displayName: profileData.name,
        email: currentUser.email,
        phone: profileData.phone,
        location: profileData.address,
        bio: profileData.bio,
        photoURL: profileData.photoURL,
        role: 'user',
        age: profileData.age,
        gender: profileData.gender,
        occupation: profileData.occupation,
        smoker: profileData.smoker,
        sleepSchedule: profileData.sleepSchedule,
        cleanliness: profileData.cleanliness,
        lookingForRoommate: profileData.lookingForRoommate,
        updatedAt: new Date().toISOString()
        // Note: We do NOT include totalSpent here to avoid overwriting it with old state if changed elsewhere
      }, { merge: true })
      setShowProfileEdit(false)
      alert('Profile updated successfully!')
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

    const nights = getNights(bookingForm.checkIn, bookingForm.checkOut);
    if (nights <= 0) {
        alert("Invalid dates. Check-out must be after Check-in.");
        return;
    }

    try {
      const selectedHostel = availableHostels.find(h => h.id === bookingForm.hostelId)
      if (!selectedHostel) {
        alert('Hostel not found')
        return
      }

      const totalPrice = calculateBookingPrice(selectedHostel.price, nights, bookingForm.guests);

      const newBooking = {
        userId: currentUser.uid,
        hostelId: bookingForm.hostelId,
        hostelName: selectedHostel.name,
        hostelImage: selectedHostel.image || '', 
        checkIn: bookingForm.checkIn,
        checkOut: bookingForm.checkOut,
        status: 'pending',
        price: totalPrice, 
        guests: parseInt(bookingForm.guests),
        bookingDate: new Date().toISOString(),
        ownerId: selectedHostel.ownerId, 
        location: selectedHostel.location,
        createdAt: new Date().toISOString()
      }

      // 1. Save Booking
      const docRef = await addDoc(collection(db, 'bookings'), newBooking)
      
      // 2. Update Total Spent (Read-Modify-Write to ensure numbers)
      const currentSpent = parseFloat(profileData.totalSpent) || 0;
      const newTotalSpent = currentSpent + totalPrice;
      
      await updateDoc(doc(db, 'users', currentUser.uid), {
        totalSpent: newTotalSpent
      });

      // 3. Update UI
      setBookings([{ id: docRef.id, ...newBooking }, ...bookings])
      setProfileData(prev => ({ ...prev, totalSpent: newTotalSpent }))
      setBookingForm({ hostelId: '', checkIn: '', checkOut: '', guests: 1 })
      
      alert(`Booking successful! Total billed: $${totalPrice}`)
      setActiveTab('bookings')
    } catch (error) {
      console.error('Error creating booking:', error)
      alert('Failed to create booking. Please try again.')
    }
  }

  const handleViewHostel = (hostelId) => {
    navigate(`/hostel/${hostelId}`)
  }

  const handleCancelBooking = async (bookingId) => {
    if (window.confirm('Are you sure you want to cancel this booking? Refund will be processed.')) {
      try {
        const bookingToCancel = bookings.find(b => b.id === bookingId);
        if (!bookingToCancel) return;

        const refundAmount = parseFloat(bookingToCancel.price) || 0;
        
        // 1. Update Booking Status
        const bookingRef = doc(db, 'bookings', bookingId)
        await updateDoc(bookingRef, { status: 'cancelled' })
        
        // 2. Update Total Spent (Subtract)
        const currentSpent = parseFloat(profileData.totalSpent) || 0;
        const newTotalSpent = Math.max(0, currentSpent - refundAmount);
        
        await updateDoc(doc(db, 'users', currentUser.uid), {
          totalSpent: newTotalSpent
        });

        // 3. Update UI
        setBookings(bookings.map(booking => 
          booking.id === bookingId ? { ...booking, status: 'cancelled' } : booking
        ))
        setProfileData(prev => ({ ...prev, totalSpent: newTotalSpent }))

        alert('Booking cancelled successfully! Amount refunded.')
      } catch (error) {
        console.error('Error cancelling booking:', error)
      }
    }
  }

  const getMemberSince = () => {
    const created = currentUser?.metadata?.creationTime
    if (created) {
      return new Date(created).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    }
    return 'Nov 2025'
  }

  const formatBookingDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
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
            <div className="stat-icon calendar-icon">📅</div>
            <h3 className="stat-label">Total Bookings</h3>
            <p className="stat-value">{bookings.length}</p>
          </div>
          <div className="stat-card">
            <div className="stat-icon check-icon">✔️</div>
            <h3 className="stat-label">Confirmed</h3>
            <p className="stat-value">
              {bookings.filter(b => b.status === 'confirmed').length}
            </p>
          </div>
          <div className="stat-card">
            <div className="stat-icon dollar-icon">💰</div>
            <h3 className="stat-label">Total Spent</h3>
            {/* Displaying the stored totalSpent from profileData */}
            <p className="stat-value">${(profileData.totalSpent || 0).toLocaleString()}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="dashboard-tabs">
          <button className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>My Profile</button>
          <button className={`tab-button ${activeTab === 'bookings' ? 'active' : ''}`} onClick={() => setActiveTab('bookings')}>Booking History</button>
          <button className={`tab-button ${activeTab === 'new-booking' ? 'active' : ''}`} onClick={() => setActiveTab('new-booking')}>Make Booking</button>
          <button className={`tab-button ${activeTab === 'compare' ? 'active' : ''}`} onClick={() => setActiveTab('compare')}>Compare Hostels</button>
          <button className={`tab-button ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>Notifications</button>
          <button className={`tab-button ${activeTab === 'wishlist' ? 'active' : ''}`} onClick={() => setActiveTab('wishlist')}>My Wishlist</button>
        </div>

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="profile-section">
            <div className="section-header">
              <h3 className="section-title">My Profile</h3>
              <button onClick={() => setShowProfileEdit(!showProfileEdit)} className="edit-button">
                {showProfileEdit ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>

            {showProfileEdit ? (
              <form onSubmit={handleProfileSubmit} className="profile-form">
                
                {/* --- Profile Picture Upload --- */}
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '30px'}}>
                  <div style={{
                    width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', 
                    background: '#f3f4f6', border: '2px solid #e5e7eb', marginBottom: '15px',
                    display: 'flex', justifyContent: 'center', alignItems: 'center'
                  }}>
                    {profileData.photoURL ? (
                      <img src={profileData.photoURL} alt="Profile" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                    ) : (
                      <span style={{fontSize: '2rem', color: '#9ca3af'}}>{(profileData.name || 'U').charAt(0).toUpperCase()}</span>
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

                {/* --- Basic Info Section --- */}
                <h4 style={{marginBottom: '15px', color: '#666', borderBottom: '1px solid #eee', paddingBottom: '5px'}}>Basic Information</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input type="text" name="name" value={profileData.name} onChange={handleProfileChange} required />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input type="email" name="email" value={profileData.email} disabled />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Phone</label>
                    <input type="tel" name="phone" value={profileData.phone} onChange={handleProfileChange} />
                  </div>
                  <div className="form-group">
                    <label>City / Location</label>
                    <input type="text" name="address" value={profileData.address} onChange={handleProfileChange} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Bio (Introduce yourself)</label>
                  <textarea name="bio" value={profileData.bio} onChange={handleProfileChange} rows="3" placeholder="I am a CS student looking for a quiet place..." />
                </div>

                {/* --- Roommate Matching Section --- */}
                <h4 style={{margin: '25px 0 15px', color: '#007bff', borderBottom: '1px solid #eee', paddingBottom: '5px'}}>Roommate Preferences (Required for Matching)</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Age</label>
                    <input type="number" name="age" value={profileData.age} onChange={handleProfileChange} placeholder="e.g. 21" min="16" />
                  </div>
                  <div className="form-group">
                    <label>Gender</label>
                    <select name="gender" value={profileData.gender} onChange={handleProfileChange}>
                      <option value="Prefer not to say">Prefer not to say</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Occupation</label>
                    <select name="occupation" value={profileData.occupation} onChange={handleProfileChange}>
                      <option value="Student">Student</option>
                      <option value="Professional">Professional</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Smoker?</label>
                    <select name="smoker" value={profileData.smoker} onChange={handleProfileChange}>
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Sleep Schedule</label>
                    <select name="sleepSchedule" value={profileData.sleepSchedule} onChange={handleProfileChange}>
                      <option value="Flexible">Flexible</option>
                      <option value="Early Bird">Early Bird (Before 11PM)</option>
                      <option value="Night Owl">Night Owl (After 12AM)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Cleanliness</label>
                    <select name="cleanliness" value={profileData.cleanliness} onChange={handleProfileChange}>
                      <option value="Average">Average</option>
                      <option value="Neat Freak">Neat Freak</option>
                      <option value="Messy">Messy</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label style={{display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 'bold'}}>
                    <input 
                      type="checkbox" 
                      name="lookingForRoommate" 
                      checked={profileData.lookingForRoommate} 
                      onChange={handleProfileChange}
                      style={{width: '20px', height: '20px'}}
                    />
                    I am actively looking for a roommate
                  </label>
                  <p style={{fontSize: '0.85rem', color: '#666', marginTop: '5px'}}>
                    Checking this makes your profile visible to others in the "Find Roommate" section.
                  </p>
                </div>

                <button type="submit" className="submit-button">Save Profile</button>
              </form>
            ) : (
              // --- VIEW MODE ---
              <div className="profile-display-card">
                <div className="profile-header-section">
                  <div className="profile-avatar">
                    {profileData.photoURL ? (
                      <img src={profileData.photoURL} alt="Profile" style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%'}} />
                    ) : (
                      (profileData.name || 'U').charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="profile-header-info">
                    <h3 className="profile-name">{profileData.name || 'User Name'}</h3>
                    <p className="profile-member-since">Member since {getMemberSince()}</p>
                    {profileData.lookingForRoommate && (
                      <span style={{background: '#d1fae5', color: '#065f46', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', marginTop: '5px', display: 'inline-block'}}>
                        Looking for Roommate
                      </span>
                    )}
                  </div>
                </div>

                <div className="profile-details-grid">
                  <div className="profile-detail-item"><div className="detail-content"><p className="detail-label">Email</p><p className="detail-value">{profileData.email}</p></div></div>
                  <div className="profile-detail-item"><div className="detail-content"><p className="detail-label">Phone</p><p className="detail-value">{profileData.phone || '-'}</p></div></div>
                  <div className="profile-detail-item"><div className="detail-content"><p className="detail-label">Location</p><p className="detail-value">{profileData.address || '-'}</p></div></div>
                  
                  {/* Matching Details Display */}
                  <div className="profile-detail-item"><div className="detail-content"><p className="detail-label">Occupation</p><p className="detail-value">{profileData.occupation}</p></div></div>
                  <div className="profile-detail-item"><div className="detail-content"><p className="detail-label">Age</p><p className="detail-value">{profileData.age || '-'}</p></div></div>
                  <div className="profile-detail-item"><div className="detail-content"><p className="detail-label">Gender</p><p className="detail-value">{profileData.gender}</p></div></div>
                  
                  <div className="profile-detail-item"><div className="detail-content"><p className="detail-label">Lifestyle</p>
                    <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '5px'}}>
                      <span style={{background: '#f3f4f6', padding: '2px 8px', borderRadius: '4px', fontSize: '0.85rem'}}>{profileData.smoker === 'Yes' ? 'Smoker' : 'Non-Smoker'}</span>
                      <span style={{background: '#f3f4f6', padding: '2px 8px', borderRadius: '4px', fontSize: '0.85rem'}}>{profileData.sleepSchedule}</span>
                      <span style={{background: '#f3f4f6', padding: '2px 8px', borderRadius: '4px', fontSize: '0.85rem'}}>{profileData.cleanliness}</span>
                    </div>
                  </div></div>
                </div>
                
                {profileData.bio && (
                  <div style={{padding: '24px 32px', borderTop: '1px solid #f0f0f0'}}>
                    <p style={{fontWeight: 'bold', marginBottom: '8px', color: '#666'}}>Bio</p>
                    <p style={{fontStyle: 'italic'}}>{profileData.bio}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Other Tabs */}
        {activeTab === 'bookings' && (
          <div className="bookings-section">
            <div className="section-header-row">
               <div>
                  <h3 className="section-title">My Bookings</h3>
                  <p className="section-subtitle">Manage your hostel reservations</p>
               </div>
               <div className="badge-pill">
                  {bookings.length} Total Bookings
               </div>
            </div>

            {bookings.length > 0 ? (
              <div className="bookings-list-modern">
                {bookings.map((booking) => (
                   <div key={booking.id} className="booking-card-modern">
                    {/* Image Side */}
                    <div className="booking-card-img-container">
                      <img src={booking.hostelImage || 'https://via.placeholder.com/300'} alt={booking.hostelName} className="booking-card-img" />
                    </div>

                    {/* Details Side */}
                    <div className="booking-card-content">
                      
                      {/* Top Header */}
                      <div className="booking-content-header">
                         <h4 className="booking-hostel-title">{booking.hostelName}</h4>
                         <span className={`status-badge ${booking.status}`}>{booking.status}</span>
                      </div>

                      {/* Location and ID */}
                      <div className="booking-sub-details">
                         <p className="booking-location"><MapPin size={14} /> {booking.location || 'Location not available'}</p>
                         <p className="booking-id">Booking ID: {booking.id.substring(0,6).toUpperCase()}</p>
                      </div>

                      {/* Timeline Grid */}
                      <div className="booking-timeline">
                         <div className="timeline-box">
                            <span className="label">Check-in</span>
                            <div className="value-row">
                               <Calendar size={16} /> {formatBookingDate(booking.checkIn)}
                            </div>
                         </div>
                         <div className="timeline-box">
                            <span className="label">Check-out</span>
                            <div className="value-row">
                               <Calendar size={16} /> {formatBookingDate(booking.checkOut)}
                            </div>
                         </div>
                         <div className="timeline-box">
                            <span className="label">Duration</span>
                            <div className="value-row">
                               <Clock size={16} /> {getNights(booking.checkIn, booking.checkOut)} nights
                            </div>
                         </div>
                      </div>

                      {/* Footer (Price & Actions) */}
                      <div className="booking-content-footer">
                         <div className="price-block">
                            <span className="label">Total:</span>
                            <span className="amount">${booking.price}</span>
                         </div>
                         <div className="action-buttons">
                            <button className="btn-extend" onClick={() => navigate(`/hostel/${booking.hostelId}`)}>
                               <Plus size={16} /> Extend Stay
                            </button>
                            {booking.status !== 'cancelled' && (
                              <button 
                                className="btn-cancel"
                                onClick={() => handleCancelBooking(booking.id)}
                              >
                                 <X size={16} /> Cancel
                              </button>
                            )}
                         </div>
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state"><p>No bookings yet.</p></div>
            )}
          </div>
        )}

        {activeTab === 'new-booking' && (
          <div className="new-booking-section">
             <h3 className="section-title">Make a New Booking</h3>
            <form onSubmit={handleMakeBooking} className="booking-form">
              <div className="form-group">
                <label>Select Hostel</label>
                <select name="hostelId" value={bookingForm.hostelId} onChange={handleBookingFormChange} required>
                  <option value="">Choose a hostel...</option>
                  {availableHostels.map((hostel) => (
                    <option key={hostel.id} value={hostel.id}>{hostel.name} - ${hostel.price}/night</option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Check-in Date</label><input type="date" name="checkIn" value={bookingForm.checkIn} onChange={handleBookingFormChange} required min={new Date().toISOString().split('T')[0]}/></div>
                <div className="form-group"><label>Check-out Date</label><input type="date" name="checkOut" value={bookingForm.checkOut} onChange={handleBookingFormChange} required min={bookingForm.checkIn}/></div>
              </div>
              <div className="form-group"><label>Guests</label><input type="number" name="guests" value={bookingForm.guests} onChange={handleBookingFormChange} required min="1" max="10"/></div>
              
              {/* --- BOOKING SUMMARY SECTION --- */}
              {bookingForm.hostelId && bookingForm.checkIn && bookingForm.checkOut && (
                <div className="booking-summary">
                  {(() => {
                    const selectedHostel = availableHostels.find(h => h.id === bookingForm.hostelId)
                    const nights = getNights(bookingForm.checkIn, bookingForm.checkOut)
                    const totalPrice = calculateBookingPrice(selectedHostel?.price, nights, bookingForm.guests)
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
              
              <button type="submit" className="submit-button">Submit Booking Request</button>
            </form>
          </div>
        )}

        {activeTab === 'compare' && (
          <div className="compare-section">
            <CompareHostels />
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="notifications-section">
            <Notifications />
          </div>
        )}

        {activeTab === 'wishlist' && (
          <div className="wishlist-section">
            <Wishlist />
          </div>
        )}
      </div>
    </div>
  )
}

export default UserDashboard