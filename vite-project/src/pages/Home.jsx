import { useState, useEffect } from 'react'
import { useTheme } from '../components/ThemeContext'
import HostelCard from '../components/HostelCard'
import RoommateCard from '../components/RoommateCard'
import { CompareHostels } from './CompareHostels' 
import { collection, getDocs, query, writeBatch, doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import hostelsData from '../data/hostels.json'
import heroImage from '../assets/2280feee79ed9810e3a864e738a4ea7ee9086c87.png'
import { Search, SlidersHorizontal, X } from 'lucide-react' // Added Icons
import './Home.css'

function Home() {
  const { theme } = useTheme()
  const [activeTab, setActiveTab] = useState('hostels')
  const [hostels, setHostels] = useState([])
  const [filteredHostels, setFilteredHostels] = useState([])
  const [loading, setLoading] = useState(true)

  // --- Search & Filter State ---
  const [searchLocation, setSearchLocation] = useState('')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [rating, setRating] = useState('')

  // Main Filter State (Applied only when Search is clicked)
  const [activeFilters, setActiveFilters] = useState({
    location: '',
    minPrice: '',
    maxPrice: '',
    rating: ''
  })

  // ==========================================
  //  DATA INITIALIZATION
  // ==========================================
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Seeding Logic (Same as before)
        const firstRef = doc(db, "hostels", hostelsData[0].id);
        const firstSnap = await getDoc(firstRef);

        if (!firstSnap.exists()) {
           const batch = writeBatch(db);
           let newUploadsCount = 0;
           for (const hostel of hostelsData) {
              const docRef = doc(db, "hostels", hostel.id);
              const { id, ...hostelData } = hostel;
              const finalData = { ...hostelData, createdAt: new Date().toISOString(), ownerEmail: "i243124@isb.nu.edu.pk", ownerId: "i243124_sample" };
              batch.set(docRef, finalData);
              newUploadsCount++;
           }
           if (newUploadsCount > 0) await batch.commit();
        }

        // Fetch Data
        const hostelsQuery = query(collection(db, 'hostels'))
        const querySnapshot = await getDocs(hostelsQuery)
        const allHostels = []
        querySnapshot.forEach((doc) => {
          allHostels.push({ id: doc.id, ...doc.data() })
        })

        setHostels(allHostels)
        setFilteredHostels(allHostels)
        setLoading(false)

      } catch (error) {
        console.error('Error in initialization:', error)
        setLoading(false)
      }
    }
    initializeData()
  }, []) 

  // ==========================================
  //  FILTERING LOGIC
  // ==========================================
  useEffect(() => {
    let result = [...hostels];

    // 1. Location Filter
    if (activeFilters.location) {
      const term = activeFilters.location.toLowerCase();
      result = result.filter(h => 
        (h.location && h.location.toLowerCase().includes(term)) || 
        (h.name && h.name.toLowerCase().includes(term))
      );
    }

    // 2. Min Price
    if (activeFilters.minPrice) {
      const min = parseFloat(activeFilters.minPrice);
      if (!isNaN(min)) result = result.filter(h => h.price >= min);
    }

    // 3. Max Price
    if (activeFilters.maxPrice) {
      const max = parseFloat(activeFilters.maxPrice);
      if (!isNaN(max)) result = result.filter(h => h.price <= max);
    }

    // 4. Rating
    if (activeFilters.rating) {
      const rate = parseFloat(activeFilters.rating);
      if (!isNaN(rate)) result = result.filter(h => h.rating >= rate);
    }

    setFilteredHostels(result);
  }, [activeFilters, hostels]);

  // --- Handlers ---
  const handleApplyFilters = () => {
    setActiveFilters({
      location: searchLocation,
      minPrice,
      maxPrice,
      rating
    });
    setIsFilterOpen(false);
  };

  const handleClearFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setRating('');
    setSearchLocation('');
    setActiveFilters({ location: '', minPrice: '', maxPrice: '', rating: '' });
  };

  const roommates = [
    { id: '1', name: 'Sarah Chen', age: 24, occupation: 'Software Engineer', location: 'San Francisco, CA', moveInDate: 'Dec 1, 2025', budget: 1200, interests: ['Hiking', 'Cooking'], image: 'https://images.unsplash.com/photo-1730152243945-1d856eb767ff?w=800', matchScore: 92 },
    { id: '2', name: 'Marcus Johnson', age: 27, occupation: 'Graphic Designer', location: 'Brooklyn, NY', moveInDate: 'Nov 15, 2025', budget: 1400, interests: ['Photography', 'Music'], image: 'https://images.unsplash.com/photo-1524538198441-241ff79d153b?w=800', matchScore: 88 },
    { id: '3', name: 'Emma Rodriguez', age: 23, occupation: 'Student', location: 'Los Angeles, CA', moveInDate: 'Jan 1, 2026', budget: 950, interests: ['Art', 'Vegan Cooking'], image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800', matchScore: 85 }
  ]

  return (
    <div className={`home ${theme}`}>
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background">
          <img src={heroImage} alt="Hero background" />
        </div>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <div className="hero-badge">
            <span>Over 10,000+ Happy Travelers</span>
          </div>
          <h1 className="hero-title">Find Your Perfect Hostel & Roommate</h1>
          <p className="hero-subtitle">
            Discover amazing hostels and connect with compatible roommates around the world. 
          </p>
          
          {/* --- INTEGRATED SEARCH BAR --- */}
          <div className="search-bar-container">
            <div className="search-bar">
              {/* Location Input */}
              <div className="search-input-group">
                <Search className="search-icon" />
                <input
                  type="text"
                  placeholder="Where do you want to go?"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                />
              </div>

              <div className="search-divider"></div>

              {/* Filter Toggle */}
              <button 
                  className={`filter-toggle-btn ${isFilterOpen ? 'active' : ''}`}
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
              >
                  <SlidersHorizontal size={18} />
                  <span>Filters</span>
                  {(minPrice || maxPrice || rating) && <div className="filter-dot"></div>}
              </button>

              {/* Search Action */}
              <button className="search-button" onClick={handleApplyFilters}>
                Search
              </button>
            </div>

            {/* Filter Popup */}
            {isFilterOpen && (
              <div className="filter-dropdown">
                  <div className="filter-header">
                      <h4>Filters</h4>
                      <button className="close-filter" onClick={() => setIsFilterOpen(false)}>
                          <X size={16} />
                      </button>
                  </div>
                  
                  <div className="filter-section">
                      <label>Price Range ($)</label>
                      <div className="price-inputs">
                          <input 
                              type="number" placeholder="Min" 
                              value={minPrice} onChange={(e) => setMinPrice(e.target.value)}
                          />
                          <span>-</span>
                          <input 
                              type="number" placeholder="Max" 
                              value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}
                          />
                      </div>
                  </div>

                  <div className="filter-section">
                      <label>Min Rating</label>
                      <div className="rating-options">
                          {[4, 3, 2].map(star => (
                              <button 
                                  key={star}
                                  className={`rating-chip ${rating == star ? 'selected' : ''}`}
                                  onClick={() => setRating(star === rating ? '' : star)}
                              >
                                  {star}+ ⭐
                              </button>
                          ))}
                      </div>
                  </div>

                  <div className="filter-actions">
                      <button className="clear-btn" onClick={handleClearFilters}>Clear</button>
                      <button className="apply-btn" onClick={handleApplyFilters}>Apply</button>
                  </div>
              </div>
            )}
            {isFilterOpen && <div className="filter-overlay" onClick={() => setIsFilterOpen(false)}></div>}
          </div>
          {/* ----------------------------- */}
          
          {/* Stats Section */}
          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-number">15,000+</span>
              <span className="stat-label">Verified Hostels</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">50,000+</span>
              <span className="stat-label">Active Roommates</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">150+</span>
              <span className="stat-label">Countries</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">4.8/5</span>
              <span className="stat-label">Average Rating</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="features-container">
          <div className="feature-item"><div className="feature-icon">🛡️</div><h3>Verified Listings</h3><p>All hostels and roommates are verified for your safety</p></div>
          <div className="feature-item"><div className="feature-icon">👥</div><h3>Smart Matching</h3><p>AI-powered roommate compatibility matching</p></div>
          <div className="feature-item"><div className="feature-icon">⭐</div><h3>Top Rated</h3><p>Browse thousands of reviewed hostels worldwide</p></div>
          <div className="feature-item"><div className="feature-icon">📶</div><h3>Great Amenities</h3><p>WiFi, kitchens, and more at every location</p></div>
        </div>
      </section>

      {/* Main Content */}
      <section className="main-content-section">
        <div className="content-container">
          <div className="tabs-header">
            <h2>Explore Options</h2>
            <div className="tabs">
              <button className={`tab-button ${activeTab === 'hostels' ? 'active' : ''}`} onClick={() => setActiveTab('hostels')}>Hostels</button>
              <button className={`tab-button ${activeTab === 'roommates' ? 'active' : ''}`} onClick={() => setActiveTab('roommates')}>Roommates</button>
              <button className={`tab-button ${activeTab === 'compare' ? 'active' : ''}`} onClick={() => setActiveTab('compare')}>Compare</button>
            </div>
          </div>

          {activeTab === 'hostels' && (
            <div className="hostels-grid">
              {loading ? (
                <div className="loading-message">Loading hostels...</div>
              ) : filteredHostels.length === 0 ? (
                <div className="no-results"><p>No hostels found matching your criteria.</p></div>
              ) : (
                filteredHostels.map((hostel) => <HostelCard key={hostel.id} {...hostel} />)
              )}
            </div>
          )}

          {activeTab === 'roommates' && (
            <div className="roommates-grid">
              {roommates.map((roommate) => <RoommateCard key={roommate.id} {...roommate} />)}
            </div>
          )}

          {activeTab === 'compare' && (
            <div className="compare-container"><CompareHostels /></div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <h2>Ready to Start Your Journey?</h2>
          <p>Join thousands of travelers who have found their perfect hostel and roommate through Hostella.</p>
          <button className="cta-button">Get Started Today</button>
        </div>
      </section>
    </div>
  )
}

export default Home