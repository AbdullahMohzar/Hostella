import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { db } from '../firebase.js' 
import { collection, addDoc, deleteDoc, query, where, onSnapshot, doc, serverTimestamp, getDocs } from 'firebase/firestore'
import './HostelCard.css'

function HostelCard({ id, name, location, price, rating, reviews, image, beds, hasRoommates }) {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const [wishlistId, setWishlistId] = useState(null) 
  const [isLoading, setIsLoading] = useState(false)

  // 1. Real-time Wishlist Listener
  useEffect(() => {
    if (!currentUser) {
        setWishlistId(null);
        return;
    }

    // Listen for ANY changes to this specific hostel in the user's wishlist
    const q = query(
      collection(db, 'wishlist'),
      where('userId', '==', currentUser.uid),
      where('hostelId', '==', id)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        // It exists -> Set ID (Button turns RED)
        setWishlistId(snapshot.docs[0].id)
      } else {
        // It doesn't exist -> Set Null (Button turns WHITE)
        setWishlistId(null)
      }
    }, (error) => {
      console.error("Wishlist listener error:", error);
    });

    return () => unsubscribe()
  }, [currentUser, id])

  // 2. Toggle Logic
  const handleWishlistToggle = async (e) => {
    e.stopPropagation() 
    
    if (!currentUser) {
      alert("Please login to save hostels.")
      return
    }
    
    // Prevent double-clicks
    if (isLoading) return;
    setIsLoading(true);

    try {
      if (wishlistId) {
        // Remove: Listener will update UI automatically
        await deleteDoc(doc(db, 'wishlist', wishlistId))
      } else {
        // Add: Listener will update UI automatically
        await addDoc(collection(db, 'wishlist'), {
          userId: currentUser.uid,
          hostelId: id,
          name: name || '',
          location: location || '',
          price: price || 0,
          rating: rating || 0,
          reviews: reviews || 0,
          image: image || '',
          addedDate: serverTimestamp()
        })
      }
    } catch (error) {
      console.error("Error updating wishlist:", error)
      alert("Failed to update wishlist.")
    } finally {
        setIsLoading(false);
    }
  }

  const handleClick = () => {
    navigate(`/hostel/${id}`)
  }

  return (
    <div className="hostel-card" onClick={handleClick}>
      <div className="hostel-card-image">
        <img src={image} alt={name} />
        
        <button 
          className={`wishlist-btn ${wishlistId ? 'active' : ''}`}
          onClick={handleWishlistToggle}
          title={wishlistId ? "Remove from Wishlist" : "Add to Wishlist"}
          disabled={isLoading}
        >
          <Heart size={18} />
        </button>
      </div>
      
      <div className="hostel-card-content">
        <div className="hostel-card-header">
          <h3 className="hostel-card-name">{name}</h3>
          <div className="hostel-card-rating">
            <span className="rating-star">⭐</span>
            <span className="rating-value">{rating}</span>
            <span className="rating-reviews">({reviews})</span>
          </div>
        </div>
        <p className="hostel-card-location">{location}</p>
        <div className="hostel-card-footer">
          <div className="hostel-card-info">
             beds
          </div>
          <div className="hostel-card-price">
            <span className="price-amount">${price}</span>
            <span className="price-unit">/night</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HostelCard