import { useState, useEffect } from 'react';
import { MapPin, Star, Trash2, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './MyWishlist.css'; // Ensure this matches the CSS file name

export function Wishlist() {
  const { currentUser } = useAuth();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch Wishlist Real-time
  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    // Query 'wishlist' collection where userId matches current user
    const q = query(
      collection(db, 'wishlist'), 
      where('userId', '==', currentUser.uid)
    );

    // Real-time listener
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id // FIX: Put id LAST to ensure it overwrites any 'id' inside data
      }));
      setWishlistItems(items);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching wishlist:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleRemove = async (docId) => {
    if(window.confirm("Remove this hostel from your wishlist?")) {
      try {
        await deleteDoc(doc(db, 'wishlist', docId));
      } catch (error) {
        console.error("Error removing item:", error);
        alert("Failed to remove item.");
      }
    }
  };

  const handleViewDetails = (hostelId) => {
    navigate(`/hostel/${hostelId}`);
  };

  // Helper to format Firestore Timestamp or Date strings
  const formatDate = (dateVal) => {
    if (!dateVal) return 'Recently';
    // If it's a Firestore Timestamp (has toDate method)
    if (dateVal.toDate) return dateVal.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    // If it's a standard date string
    return new Date(dateVal).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) return <div className="wishlist-container"><p className="text-center p-10 text-gray-500">Loading your favorites...</p></div>;

  return (
    <div className="wishlist-container">
      
      {/* Header */}
      <div className="wishlist-header">
        <div>
          <h2 className="wishlist-title">My Wishlist</h2>
          <p className="wishlist-subtitle">Save your favorite hostels to visit later</p>
        </div>
        <div className="wishlist-badge">
          {wishlistItems.length} Saved
        </div>
      </div>

      {/* Grid */}
      {wishlistItems.length > 0 ? (
        <div className="wishlist-grid">
          {wishlistItems.map((item) => (
            <div key={item.id} className="wishlist-card">
              
              {/* Image Section */}
              <div className="card-image-container">
                <img 
                  src={item.image || 'https://via.placeholder.com/400x300?text=No+Image'} 
                  alt={item.name} 
                  className="card-image" 
                />
                
                {/* Overlays */}
                <div className="price-overlay">
                  ${item.price}/night
                </div>
                <button 
                  className="delete-btn" 
                  onClick={(e) => { e.stopPropagation(); handleRemove(item.id); }}
                  title="Remove from wishlist"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>

              {/* Content Section */}
              <div className="card-content">
                <div className="card-main">
                  <h3 className="hostel-name">{item.name}</h3>
                  <div className="hostel-location">
                    <MapPin className="w-3 h-3" /> {item.location}
                  </div>
                  <div className="hostel-rating">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /> 
                    <span className="rating-num">{item.rating || 'New'}</span>
                    <span className="review-count">({item.reviews || 0} reviews)</span>
                  </div>
                </div>

                <div className="card-footer">
                  <span className="added-date">Added {formatDate(item.addedDate)}</span>
                  <button 
                    className="view-btn"
                    onClick={() => handleViewDetails(item.hostelId)}
                  >
                    View Details <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-wishlist">
          <p>Your wishlist is empty. Start exploring hostels to add some!</p>
        </div>
      )}
    </div>
  );
}