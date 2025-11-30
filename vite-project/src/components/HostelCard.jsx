import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, X, Star } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { db } from '../firebase' 
import { collection, addDoc, deleteDoc, query, where, onSnapshot, doc, serverTimestamp, getDocs, setDoc, getDoc } from 'firebase/firestore'
import './HostelCard.css'

function HostelCard({ id, name, location, price, rating, reviews, image, beds, hasRoommates }) {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const [wishlistId, setWishlistId] = useState(null) 
  const [isLoading, setIsLoading] = useState(false)
  const [isBlocked, setIsBlocked] = useState(false); 

  // 1. Real-time Wishlist Listener
  useEffect(() => {
    // CRITICAL GUARDRAIL: Only run if currentUser and its UID are present
    if (!currentUser || !currentUser.uid) return;

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
    }, (error) => {
      console.error("Wishlist listener error:", error);
    });

    return () => unsubscribe()
  }, [currentUser, id])
  
  // 2. Check Block Status (Runs once on load)
  useEffect(() => {
    // CRITICAL GUARDRAIL: Only run if currentUser and its UID are present
    if (!currentUser || !currentUser.uid) return;
    
    const checkBlocked = async () => {
        try {
            const blockRef = doc(db, 'users', currentUser.uid, 'blockedHostels', id);
            const docSnap = await getDoc(blockRef);
            setIsBlocked(docSnap.exists());
        } catch (error) {
            console.error("Error checking block status:", error);
        }
    };
    checkBlocked();
  }, [currentUser, id]);


  // 3. Toggle Wishlist (Add/Remove)
  const handleWishlistToggle = async (e) => {
    e.stopPropagation(); 
    
    if (!currentUser || !currentUser.uid) { 
        alert("Please login to save hostels."); 
        return; 
    }
    
    if (isLoading) return;
    setIsLoading(true);

    try {
      if (wishlistId) {
        await deleteDoc(doc(db, 'wishlist', wishlistId));
      } else {
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
        });
      }
    } catch (error) {
      console.error("Error updating wishlist:", error);
      alert("Failed to update wishlist. Check console for permission details.");
    } finally {
        setIsLoading(false);
    }
  }
  
  // 4. Block/Hide Hostel Handler
  const handleBlockHostel = async (e) => {
    e.stopPropagation();
    if (!currentUser || !currentUser.uid) return alert("Please login to hide hostels.");

    if (window.confirm(`Are you sure you want to hide "${name}"? It will be removed from your list.`)) {
        const blockRef = doc(db, 'users', currentUser.uid, 'blockedHostels', id);
        try {
            await setDoc(blockRef, { hostelName: name, blockedAt: serverTimestamp() });
            setIsBlocked(true); 
        } catch (error) {
            console.error("Error blocking hostel:", error);
            alert("Failed to hide hostel. Check security rule 1c.");
        }
    }
  };

  if (isBlocked) {
    return null;
  }
  
  const handleViewDetailsClick = () => {
    navigate(`/hostel/${id}`)
  }
  
  const handleContactClick = (e) => {
      e.stopPropagation(); 
      navigate(`/hostel/${id}`); 
  }

  return (
    <div className="hostel-card" onClick={handleViewDetailsClick}>
      <div className="hostel-card-image">
        <img src={image} alt={name} />
        
        {/* Wishlist Heart Button */}
        <button 
          className={`wishlist-btn ${wishlistId ? 'active' : ''}`}
          onClick={handleWishlistToggle}
          title={wishlistId ? "Remove from Wishlist" : "Add to Wishlist"}
          disabled={isLoading || !currentUser}
        >
          <Heart 
            size={18} 
            color={wishlistId ? "#ef4444" : "#1f2937"} 
            fill={wishlistId ? "#ef4444" : "none"} 
          />
        </button>
        
        {/* Block Button */}
        <button 
          className="block-btn"
          onClick={handleBlockHostel}
          title="Hide this hostel"
          disabled={!currentUser}
        >
          <X size={18} />
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
        
        {/* Hostel Card Footer - Updated for Contact Button */}
        <div className="hostel-card-footer">
          <div className="hostel-card-price-info">
            <div className="hostel-card-price">
              <span className="price-amount">${price}</span>
              <span className="price-unit">/night</span>
            </div>
            <div className="hostel-card-info">
               {beds} beds
            </div>
          </div>
          
          <button 
              className="contact-hostel-btn" 
              onClick={handleContactClick}
          >
              View Details
          </button>
        </div>
      </div>
    </div>
  )
}

export default HostelCard