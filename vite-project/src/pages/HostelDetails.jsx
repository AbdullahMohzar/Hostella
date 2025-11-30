import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Heart, Star, User, MessageSquare } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../components/ThemeContext'
import { 
  doc, getDoc, addDoc, deleteDoc, updateDoc, collection, 
  serverTimestamp, query, where, onSnapshot 
} from 'firebase/firestore'
import { db } from '../firebase'
import { ChatWindow } from '../components/ChatWindow' // Import ChatWindow
import './HostelDetails.css'

function HostelDetails() {
  const { id } = useParams()
  const { currentUser } = useAuth()
  const { theme } = useTheme()
  const navigate = useNavigate()
  
  const [hostel, setHostel] = useState(null)
  const [loading, setLoading] = useState(true)
  const [bookingLoading, setBookingLoading] = useState(false)
  
  const [wishlistId, setWishlistId] = useState(null)
  const [wishlistLoading, setWishlistLoading] = useState(false)
  
  // Review State
  const [reviews, setReviews] = useState([])
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' })
  const [reviewLoading, setReviewLoading] = useState(false)
  
  // Chat State (NEW)
  const [isOwnerChatOpen, setIsOwnerChatOpen] = useState(false);

  const [bookingDates, setBookingDates] = useState({
    checkIn: '',
    checkOut: ''
  })

  // 1. Fetch Hostel Data
  useEffect(() => {
    const fetchHostel = async () => {
      try {
        const docRef = doc(db, 'hostels', id)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const data = docSnap.data()
          setHostel({ 
            id: docSnap.id, 
            ...data,
            images: data.images || [data.image, data.image, data.image], 
            amenities: data.amenities || []
          })
        } else {
          console.log("No such document!")
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchHostel()
  }, [id])

  // 2. Real-time Wishlist Listener
  useEffect(() => {
    if (!currentUser || !id) return;

    const q = query(
      collection(db, 'wishlist'),
      where('userId', '==', currentUser.uid),
      where('hostelId', '==', id)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setWishlistId(snapshot.docs[0].id)
      } else {
        setWishlistId(null)
      }
    })

    return () => unsubscribe()
  }, [currentUser, id])

  // 3. Real-time Reviews Listener
  useEffect(() => {
    if (!id) return;

    const q = query(
      collection(db, 'reviews'),
      where('hostelId', '==', id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reviewsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      reviewsData.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
        return dateB - dateA;
      });
      setReviews(reviewsData);
    });

    return () => unsubscribe();
  }, [id]);

  // --- Handlers ---

  const handleWishlistToggle = async () => {
    if (!currentUser) {
      alert("Please login to save to wishlist.")
      return
    }
    if (!hostel) return;
    if (wishlistLoading) return;

    setWishlistLoading(true);

    try {
      if (wishlistId) {
        await deleteDoc(doc(db, 'wishlist', wishlistId))
      } else {
        await addDoc(collection(db, 'wishlist'), {
          userId: currentUser.uid,
          hostelId: hostel.id,
          name: hostel.name,
          location: hostel.location,
          price: hostel.price,
          rating: hostel.rating,
          reviews: hostel.reviews,
          image: hostel.images?.[0] || hostel.image || '',
          addedDate: serverTimestamp()
        })
      }
    } catch (error) {
      console.error("Error updating wishlist:", error)
    } finally {
      setWishlistLoading(false)
    }
  }

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) { alert("Please login to leave a review."); return; }
    if (!reviewForm.comment.trim()) { alert("Please write a comment."); return; }

    setReviewLoading(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        hostelId: id,
        userId: currentUser.uid,
        userName: currentUser.displayName || 'Anonymous User',
        rating: parseInt(reviewForm.rating),
        comment: reviewForm.comment,
        createdAt: serverTimestamp()
      });

      const currentRating = parseFloat(hostel.rating) || 0;
      const currentReviews = parseInt(hostel.reviews) || 0;
      const newRatingValue = parseInt(reviewForm.rating);

      const newReviewCount = currentReviews + 1;
      const newAverageRating = ((currentRating * currentReviews) + newRatingValue) / newReviewCount;
      const roundedRating = Math.round(newAverageRating * 10) / 10;

      const hostelRef = doc(db, 'hostels', id);
      await updateDoc(hostelRef, {
        rating: roundedRating,
        reviews: newReviewCount
      });

      setHostel(prev => ({ ...prev, rating: roundedRating, reviews: newReviewCount }));
      setReviewForm({ rating: 5, comment: '' }); 
      alert("Review submitted! Hostel rating updated.");
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Failed to submit review.");
    } finally {
      setReviewLoading(false);
    }
  };

  const calculateTotal = () => {
    if (!bookingDates.checkIn || !bookingDates.checkOut || !hostel) return 0
    const start = new Date(bookingDates.checkIn)
    const end = new Date(bookingDates.checkOut)
    const diffTime = Math.abs(end - start)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays * hostel.price : 0
  }

  const handleBooking = async () => {
    if (!currentUser) { navigate('/login'); return }
    if (!bookingDates.checkIn || !bookingDates.checkOut) { alert('Please select check-in and check-out dates'); return }
    const totalPrice = calculateTotal()
    if (totalPrice === 0) { alert('Invalid date range'); return }

    setBookingLoading(true)

    try {
      await addDoc(collection(db, 'bookings'), {
        userId: currentUser.uid, userEmail: currentUser.email, ownerId: hostel.ownerId || 'unknown',
        hostelId: hostel.id, hostelName: hostel.name, hostelImage: hostel.images?.[0] || hostel.image || '',
        location: hostel.location, checkIn: bookingDates.checkIn, checkOut: bookingDates.checkOut,
        totalPrice: totalPrice, status: 'pending', createdAt: serverTimestamp(),
        bookingDate: new Date().toISOString()
      })

      alert('Booking request sent successfully!')
      navigate('/user-dashboard')
    } catch (error) {
      console.error("Error creating booking:", error)
      alert('Failed to book. Please try again.')
    } finally {
      setBookingLoading(false)
    }
  }
  
  // NEW: Handler to launch Owner Chat
  const handleContactOwner = () => {
      if (!currentUser) {
          alert("You must be logged in to contact the owner.");
          return;
      }
      if (!hostel.ownerId) {
          alert("Owner ID not found for this hostel.");
          return;
      }
      
      // Determine a unique chat ID for this thread (HostelID_UserID)
      const chatId = `${hostel.id}_${currentUser.uid}`;
      
      // Launch the chat window modal
      setIsOwnerChatOpen(true);
  };


  if (loading) return <div className="loading-container">Loading details...</div>
  if (!hostel) return <div className="error-container">Hostel not found.</div>

  const totalPrice = calculateTotal()

  return (
    <div className={`hostel-details ${theme}`}>
      <div className="details-container">
        <button onClick={() => navigate(-1)} className="back-button">
          ← Back
        </button>

        <div className="hostel-header">
          <div>
            <h1 className="hostel-title">{hostel.name}</h1>
            <div className="hostel-meta">
              <span className="hostel-location">📍 {hostel.location}</span>
              <span className="hostel-rating">⭐ {hostel.rating} ({hostel.reviews || 0} reviews)</span>
            </div>
          </div>
          
          <button 
            onClick={handleWishlistToggle}
            className={`wishlist-action-btn ${wishlistId ? 'active' : ''}`}
            disabled={wishlistLoading}
          >
            <Heart 
              size={20} 
              fill={wishlistId ? "#ef4444" : "none"} 
              color={wishlistId ? "#ef4444" : "currentColor"}
            />
            {wishlistId ? 'Saved' : 'Save'}
          </button>
        </div>

        <div className="hostel-content">
          {/* Images Section */}
          <div className="hostel-images">
            <div className="main-image">
              <img src={hostel.images[0] || hostel.image} alt={hostel.name} />
            </div>
            <div className="thumbnail-images">
              {hostel.images.slice(1, 3).map((img, idx) => (
                <img key={idx} src={img} alt={`${hostel.name} view ${idx + 2}`} />
              ))}
            </div>
          </div>

          <div className="hostel-info-section">
            <div className="description-section">
              <h2>Description</h2>
              <p>{hostel.description || "No description available."}</p>
              <div className="info-grid">
                 <div><strong>WiFi Speed:</strong> {hostel.wifiSpeed} Mbps</div>
                 <div><strong>Check-in:</strong> {hostel.checkInTime || '14:00'}</div>
                 <div><strong>Check-out:</strong> {hostel.checkOutTime || '11:00'}</div>
                 <div><strong>Capacity:</strong> {hostel.capacity} beds</div>
              </div>
            </div>

            <div className="amenities-section">
              <h2>Amenities</h2>
              <div className="amenities-list">
                {hostel.amenities && hostel.amenities.map((amenity, idx) => (
                  <span key={idx} className="amenity-tag">{amenity}</span>
                ))}
              </div>
            </div>

            {/* --- REVIEWS SECTION --- */}
            <div className="reviews-section">
              <h2>User Reviews ({reviews.length})</h2>
              
              {/* Add Review Form */}
              {currentUser ? (
                <form onSubmit={handleReviewSubmit} className="review-form">
                  <h4>Write a Review</h4>
                  <div className="rating-input">
                    <label>Rating:</label>
                    <select 
                      value={reviewForm.rating} 
                      onChange={(e) => setReviewForm({...reviewForm, rating: e.target.value})}
                    >
                      <option value="5">5 - Excellent</option>
                      <option value="4">4 - Good</option>
                      <option value="3">3 - Average</option>
                      <option value="2">2 - Poor</option>
                      <option value="1">1 - Terrible</option>
                    </select>
                  </div>
                  <textarea 
                    placeholder="Share your experience..." 
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({...reviewForm, comment: e.target.value})}
                    required
                  />
                  <button type="submit" disabled={reviewLoading}>
                    {reviewLoading ? "Posting..." : "Post Review"}
                  </button>
                </form>
              ) : (
                <div className="login-to-review">
                  <p>Please log in to write a review.</p>
                </div>
              )}

              {/* Reviews List */}
              <div className="reviews-list">
                {reviews.length > 0 ? (
                  reviews.map((review) => (
                    <div key={review.id} className="review-card">
                      <div className="review-header">
                        <div className="reviewer-info">
                           <div className="reviewer-avatar">
                             <User size={16} />
                           </div>
                           <span className="reviewer-name">{review.userName}</span>
                        </div>
                        <span className="review-date">
                          {review.createdAt?.toDate ? review.createdAt.toDate().toLocaleDateString() : 'Just now'}
                        </span>
                      </div>
                      <div className="review-rating">
                        {[...Array(review.rating)].map((_, i) => (
                          <Star key={i} size={14} fill="#f59e0b" color="#f59e0b" />
                        ))}
                      </div>
                      <p className="review-comment">{review.comment}</p>
                    </div>
                  ))
                ) : (
                  <div className="no-reviews">
                    <MessageSquare size={32} />
                    <p>No reviews yet. Be the first to review!</p>
                  </div>
                )}
              </div>
            </div>
            {/* ----------------------- */}

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
                    <input type="date" value={bookingDates.checkIn} onChange={(e) => setBookingDates({...bookingDates, checkIn: e.target.value})} min={new Date().toISOString().split('T')[0]} />
                  </div>
                  <div className="date-input">
                    <label>Check-out</label>
                    <input type="date" value={bookingDates.checkOut} onChange={(e) => setBookingDates({...bookingDates, checkOut: e.target.value})} min={bookingDates.checkIn || new Date().toISOString().split('T')[0]} />
                  </div>
                </div>
                {totalPrice > 0 && (
                  <div className="price-breakdown">
                    <div style={{display: 'flex', justifyContent: 'space-between'}}>
                        <span>Total Price:</span>
                        <span style={{fontWeight: 'bold', fontSize: '1.2rem'}}>${totalPrice}</span>
                    </div>
                  </div>
                )}
                
                {/* NEW: CONTACT OWNER BUTTON */}
                <button 
                    onClick={handleContactOwner} 
                    className="book-button contact-owner-btn-detail"
                    disabled={!currentUser || !hostel.ownerId}
                    style={{marginBottom: '10px'}}
                >
                    <MessageSquare size={16} /> Contact Owner
                </button>
                
                <button onClick={handleBooking} className="book-button" disabled={bookingLoading}>
                  {bookingLoading ? 'Processing...' : (currentUser ? 'Book Now' : 'Login to Book')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* NEW: Chat Modal Render */}
      {isOwnerChatOpen && currentUser && (
          <ChatWindow
            chatId={`${hostel.id}_${currentUser.uid}`} // Unique Hostel-User Chat ID
            collectionName="supportChats"
            onClose={() => setIsOwnerChatOpen(false)}
            recipientName={hostel.ownerName || 'Hostel Owner'}
            recipientId={hostel.ownerId} // Owner's UID
        />
      )}
    </div>
  )
}

export default HostelDetails