import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../components/ThemeContext'
import './HostelDetails.css'

function HostelDetails() {
  const { id } = useParams()
  const { currentUser } = useAuth()
  const { theme } = useTheme()
  const navigate = useNavigate()
  const [bookingDates, setBookingDates] = useState({
    checkIn: '',
    checkOut: ''
  })

  // Sample hostel data - in a real app, this would come from Firebase
  const hostel = {
    id: parseInt(id),
    name: 'Sunset Hostel',
    location: 'Downtown',
    price: 25,
    rating: 4.5,
    description: 'A cozy hostel located in the heart of downtown. Perfect for travelers looking for affordable accommodation with great amenities.',
    amenities: ['WiFi', 'Kitchen', 'Laundry', '24/7 Reception', 'Common Area'],
    images: [
      'https://via.placeholder.com/800x400',
      'https://via.placeholder.com/800x400',
      'https://via.placeholder.com/800x400'
    ]
  }

  const handleBooking = () => {
    if (!currentUser) {
      navigate('/login')
      return
    }
    
    if (!bookingDates.checkIn || !bookingDates.checkOut) {
      alert('Please select check-in and check-out dates')
      return
    }
    
    // In a real app, this would create a booking in Firebase
    alert('Booking successful! Check your dashboard for details.')
    navigate('/user-dashboard')
  }

  return (
    <div className={`hostel-details ${theme}`}>
      <div className="details-container">
        <button onClick={() => navigate(-1)} className="back-button">
          ← Back
        </button>

        <div className="hostel-header">
          <h1 className="hostel-title">{hostel.name}</h1>
          <div className="hostel-meta">
            <span className="hostel-location">📍 {hostel.location}</span>
            <span className="hostel-rating">⭐ {hostel.rating}</span>
          </div>
        </div>

        <div className="hostel-content">
          <div className="hostel-images">
            <div className="main-image">
              <img src={hostel.images[0]} alt={hostel.name} />
            </div>
            <div className="thumbnail-images">
              {hostel.images.slice(1).map((img, idx) => (
                <img key={idx} src={img} alt={`${hostel.name} ${idx + 2}`} />
              ))}
            </div>
          </div>

          <div className="hostel-info-section">
            <div className="description-section">
              <h2>Description</h2>
              <p>{hostel.description}</p>
            </div>

            <div className="amenities-section">
              <h2>Amenities</h2>
              <div className="amenities-list">
                {hostel.amenities.map((amenity, idx) => (
                  <span key={idx} className="amenity-tag">
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="booking-section">
            <div className="booking-card">
              <div className="price-display">
                <span className="price-amount">${hostel.price}</span>
                <span className="price-unit">per night</span>
              </div>

              <div className="booking-form">
                <div className="date-inputs">
                  <div className="date-input">
                    <label>Check-in</label>
                    <input
                      type="date"
                      value={bookingDates.checkIn}
                      onChange={(e) => setBookingDates({
                        ...bookingDates,
                        checkIn: e.target.value
                      })}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="date-input">
                    <label>Check-out</label>
                    <input
                      type="date"
                      value={bookingDates.checkOut}
                      onChange={(e) => setBookingDates({
                        ...bookingDates,
                        checkOut: e.target.value
                      })}
                      min={bookingDates.checkIn || new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                <button onClick={handleBooking} className="book-button">
                  {currentUser ? 'Book Now' : 'Login to Book'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HostelDetails

