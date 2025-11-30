import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore'; // ADDED updateDoc
import { db } from '../firebase';
import { MapPin, Calendar, Clock, Plus, User, X } from 'lucide-react';
import { useTheme } from '../components/ThemeContext';
import { useAuth } from '../context/AuthContext'; // ADDED useAuth
import './BookingDetails.css';

function BookingDetails() {
    const { bookingId } = useParams();
    const { theme } = useTheme();
    const navigate = useNavigate();
    const { currentUser } = useAuth(); // Get current user for security and updates
    
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBooking = async () => {
            if (!bookingId) {
                setLoading(false);
                return;
            }
            try {
                // Fetch the specific booking document
                const docRef = doc(db, 'bookings', bookingId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setBooking({ id: docSnap.id, ...docSnap.data() });
                }
            } catch (error) {
                console.error("Error fetching booking details:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchBooking();
    }, [bookingId]);
    
    // Helper function for UI display
    const formatBookingDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const getNights = (checkIn, checkOut) => {
        if (!checkIn || !checkOut) return 0;
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        const diff = end - start;
        return Math.ceil(Math.abs(diff) / (1000 * 60 * 60 * 24));
    };

    // --- Action Handlers ---

    const handleExtendStay = () => {
        // Placeholder for complex extension logic
        alert(`Request to extend stay at ${booking.hostelName}. Please contact the owner or make a new booking!`);
        navigate('/user-dashboard');
    };

    const handleCancelBooking = async () => {
        if (!currentUser) return alert("You must be logged in to cancel a booking.");

        if (booking.status === 'cancelled') {
            alert("This booking is already cancelled.");
            return;
        }

        if (window.confirm('Are you sure you want to cancel this booking? This action cannot be reversed.')) {
            try {
                // 1. Update Booking Status to 'cancelled'
                const bookingRef = doc(db, 'bookings', booking.id);
                await updateDoc(bookingRef, { status: 'cancelled' });

                // 2. Refund Logic (Update user's totalSpent)
                const refundAmount = parseFloat(booking.price) || 0;
                
                // Fetch user's current totalSpent to ensure accurate subtraction
                const userDocRef = doc(db, 'users', currentUser.uid);
                const userSnap = await getDoc(userDocRef);
                const currentSpent = (userSnap.exists() && parseFloat(userSnap.data().totalSpent)) || 0;

                const newTotalSpent = Math.max(0, currentSpent - refundAmount);

                await updateDoc(userDocRef, { totalSpent: newTotalSpent });


                alert(`Booking for ${booking.hostelName} cancelled. $${refundAmount.toFixed(2)} refunded.`);
                
                // Update local state and navigate away
                setBooking(prev => ({ ...prev, status: 'cancelled' }));
                navigate('/user-dashboard'); 

            } catch (error) {
                console.error("Error during cancellation:", error);
                alert("Failed to cancel booking due to a database error. Check permissions.");
            }
        }
    };


    if (loading) return <div className={`booking-detail-page ${theme}`}><p className="loading-message">Loading Booking Details...</p></div>;
    if (!booking) return <div className={`booking-detail-page ${theme}`}><p className="error-message">Booking Not Found.</p></div>;

    const duration = getNights(booking.checkIn, booking.checkOut);
    
    // Determine if cancellation is allowed
    const isCancellable = booking.status !== 'cancelled';
    
    return (
        <div className={`booking-detail-page ${theme}`}>
            <div className="detail-container">
                <button onClick={() => navigate('/user-dashboard')} className="back-button">
                    ← Back to Dashboard
                </button>
                
                <div className="booking-header-area">
                    <h1 className="booking-main-title">Reservation Details</h1>
                    <span className={`status-pill ${booking.status}`}>{booking.status}</span>
                </div>
                
                <div className="booking-content-grid">
                    
                    {/* --- LEFT: Image and Hostel Info --- */}
                    <div className="hostel-summary-card">
                        <img src={booking.hostelImage || 'https://via.placeholder.com/600'} alt={booking.hostelName} className="hostel-image" />
                        <div className="hostel-text-info">
                            <h2 className="hostel-title">{booking.hostelName}</h2>
                            <p className="hostel-location-tag">
                                <MapPin size={16} /> {booking.location}
                            </p>
                            <p className="booking-ref">Ref: {bookingId.substring(0, 8).toUpperCase()}</p>
                        </div>
                    </div>

                    {/* --- RIGHT: Booking Details and Price --- */}
                    <div className="booking-info-card">
                        
                        <div className="detail-row-item">
                            <Calendar size={20} className="detail-icon" />
                            <div className="detail-text">
                                <span className="detail-label">Check-in Date</span>
                                <span className="detail-value">{formatBookingDate(booking.checkIn)}</span>
                            </div>
                        </div>

                        <div className="detail-row-item">
                            <Calendar size={20} className="detail-icon" />
                            <div className="detail-text">
                                <span className="detail-label">Check-out Date</span>
                                <span className="detail-value">{formatBookingDate(booking.checkOut)}</span>
                            </div>
                        </div>

                        <div className="detail-row-item">
                            <Clock size={20} className="detail-icon" />
                            <div className="detail-text">
                                <span className="detail-label">Duration</span>
                                <span className="detail-value">{duration} Nights</span>
                            </div>
                        </div>

                        <div className="detail-row-item">
                            <User size={20} className="detail-icon" />
                            <div className="detail-text">
                                <span className="detail-label">Guests</span>
                                <span className="detail-value">{booking.guests} {booking.guests > 1 ? 'People' : 'Person'}</span>
                            </div>
                        </div>
                        
                        <div className="price-summary-box">
                            <span className="summary-label">Total Booking Price</span>
                            <span className="summary-amount">${booking.price}</span>
                            {booking.discountApplied > 0 && (
                                <span className="discount-applied">
                                    {booking.discountApplied}% Discount Applied
                                </span>
                            )}
                        </div>
                        
                        <div className="action-area">
                            <button className="contact-owner-btn">
                                Contact Owner
                            </button>
                            
                            {booking.status === 'confirmed' && (
                                <button className="btn-extend" onClick={handleExtendStay}>
                                    <Plus size={18} /> Extend Stay
                                </button>
                            )}
                            
                            {isCancellable && (
                                <button 
                                    className="btn-cancel-big" 
                                    onClick={handleCancelBooking}
                                >
                                    <X size={18} /> Cancel Booking
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default BookingDetails;