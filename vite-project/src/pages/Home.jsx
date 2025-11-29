import { useState, useEffect } from 'react'
import { useTheme } from '../components/ThemeContext'
import HostelCard from '../components/HostelCard'
import RoommateCard from '../components/RoommateCard'
import { CompareHostels } from './CompareHostels' 
import { SeedRoommates } from '../components/SeedRoomates' 
import { collection, getDocs, query, writeBatch, doc, getDoc, where, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import hostelsData from '../data/hostels.json'
import heroImage from '../assets/2280feee79ed9810e3a864e738a4ea7ee9086c87.png'
import { useAuth } from '../context/AuthContext'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom' 
import './Home.css'

function Home() {
  const { theme } = useTheme()
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('hostels')
  const [hostels, setHostels] = useState([])
  const [filteredHostels, setFilteredHostels] = useState([])
  const [roommates, setRoommates] = useState([])
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState(null)
  const [blockedRoommates, setBlockedRoommates] = useState(new Set()); 

  // --- FILTER STATE ---
  const [hostelFilters, setHostelFilters] = useState({ location: '', minPrice: '', maxPrice: '', rating: '' })
  const [roommateFilters, setRoommateFilters] = useState({ gender: '', smoker: '', cleanliness: '' });
  
  // Local Searchbar UI State
  const [searchLocation, setSearchLocation] = useState('')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [rating, setRating] = useState('')
  
  // Note: activeFilters state is now redundant, replaced by hostelFilters

  // ==========================================
  //  FETCH BLOCKED USERS
  // ==========================================
  useEffect(() => {
    if (!currentUser) return;
    
    // Path: /users/{currentUser.uid}/blockedRoommates
    const blockedRef = collection(db, 'users', currentUser.uid, 'blockedRoommates');
    
    // Fetch once on load
    const fetchBlocked = async () => {
        try {
            const snapshot = await getDocs(blockedRef);
            const blockedIds = new Set(snapshot.docs.map(doc => doc.id));
            setBlockedRoommates(blockedIds);
        } catch (error) {
            console.error("Failed to fetch blocked users:", error);
        }
    };
    
    fetchBlocked();
  }, [currentUser]);


  // ==========================================
  //  DATA INITIALIZATION & HOSTEL SEEDING
  // ==========================================
  useEffect(() => {
    const initializeData = async () => {
      try {
        // --- 1. HOSTEL SEEDING (Ensure hostels exist) ---
        const firstRef = doc(db, "hostels", hostelsData[0].id);
        const firstSnap = await getDoc(firstRef);
        if (!firstSnap.exists()) {
           const batch = writeBatch(db);
           let newUploadsCount = 0;
           for (const hostel of hostelsData) {
              const docRef = doc(db, "hostels", hostel.id);
              const { id, ...hostelData } = hostel;
              const finalData = {
                  ...hostelData,
                  createdAt: new Date().toISOString(),
                  ownerEmail: "i243124@isb.nu.edu.pk", 
                  ownerId: "i243124_sample"
              };
              batch.set(docRef, finalData);
              newUploadsCount++;
           }
           if (newUploadsCount > 0) await batch.commit();
        }

        // --- 2. FETCH HOSTELS ---
        const hostelsQuery = query(collection(db, 'hostels'))
        const querySnapshot = await getDocs(hostelsQuery)
        const allHostels = []
        querySnapshot.forEach((doc) => {
          allHostels.push({ id: doc.id, ...doc.data() })
        })
        setHostels(allHostels)
        setFilteredHostels(allHostels)

        // --- 3. FETCH CURRENT USER PROFILE (For Compatibility) ---
        if (currentUser) {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            setUserProfile(userDoc.data());
          } else {
             setUserProfile({}); 
          }
        }

        setLoading(false)
      } catch (error) {
        console.error('Error in initialization:', error)
        setLoading(false)
      }
    }

    initializeData()
  }, [currentUser]) 

  // ==========================================
  //  BLOCK/HIDE ROOMMATE HANDLER (Saves to Firestore)
  // ==========================================
  const handleBlockRoommate = async (roommateId) => {
      if (!currentUser) return alert("You must be logged in to hide a profile.");
      
      const blockRef = doc(db, 'users', currentUser.uid, 'blockedRoommates', roommateId);
      
      try {
          // Add a simple document (name is sufficient) to the subcollection
          await setDoc(blockRef, { blockedAt: new Date().toISOString() });
          
          // Update local state to hide it instantly
          setBlockedRoommates(prev => new Set(prev).add(roommateId));
          
      } catch (error) {
          console.error("Error blocking roommate:", error);
          alert("Could not hide profile. Check security rules.");
      }
  };


  // ==========================================
  //  FETCH ROOMMATES & CALCULATE SCORES
  // ==========================================
  useEffect(() => {
    const fetchRoommates = async () => {
        try {
            const qSample = query(collection(db, 'roommates'));
            const qRealUsers = query(collection(db, 'users'), where('lookingForRoommate', '==', true));
            
            const [sampleSnapshot, realUserSnapshot] = await Promise.all([
                getDocs(qSample), 
                getDocs(qRealUsers)
            ]);
            
            let fetchedRoommates = [];
            
            // Combine sample and real users
            sampleSnapshot.docs.forEach(doc => { fetchedRoommates.push({ id: doc.id, ...doc.data(), isSample: true }); });
            realUserSnapshot.docs.forEach(doc => {
                const data = doc.data();
                if (doc.id !== currentUser?.uid) { fetchedRoommates.push({ id: doc.id, ...data }); }
            });

            // --- 0. Filter Out Blocked Users ---
            fetchedRoommates = fetchedRoommates.filter(r => !blockedRoommates.has(r.id));
            
            // --- 1. Apply UI Filtering ---
            let filtered = fetchedRoommates;
            
            if (roommateFilters.gender) { filtered = filtered.filter(r => r.gender === roommateFilters.gender); }
            if (roommateFilters.smoker) { filtered = filtered.filter(r => r.smoker === roommateFilters.smoker); }
            if (roommateFilters.cleanliness) { filtered = filtered.filter(r => r.cleanliness === roommateFilters.cleanliness); }


            // --- 2. Compatibility Logic (Scoring) ---
            if (userProfile && currentUser) {
                filtered = filtered.map(roommate => {
                    let score = 50; 
                    const userAge = parseInt(userProfile.age) || 25;
                    const roommateAge = parseInt(roommate.age) || 25;

                    if (userProfile.smoker === roommate.smoker) score += 15; else score -= 10;
                    if (userProfile.cleanliness === roommate.cleanliness) score += 15;
                    if (userProfile.sleepSchedule === roommate.sleepSchedule) score += 15;
                    else if (userProfile.sleepSchedule === 'Flexible' || roommate.sleepSchedule === 'Flexible') score += 10;
                    if (userProfile.occupation === roommate.occupation) score += 5;

                    const ageDiff = Math.abs(userAge - roommateAge);
                    if (ageDiff <= 3) score += 10;

                    return { ...roommate, matchScore: Math.min(100, Math.max(0, score)) };
                });
                filtered.sort((a, b) => b.matchScore - a.matchScore);
            } else {
                filtered = filtered.map(r => ({ ...r, matchScore: Math.floor(Math.random() * 20) + 70 }));
            }

            setRoommates(filtered);

        } catch (error) {
            console.error("Error fetching and calculating roommates:", error);
        }
    };

    if (activeTab === 'roommates' || userProfile !== null) {
      fetchRoommates();
    }
  }, [currentUser, userProfile, activeTab, roommateFilters, blockedRoommates]);

  // ==========================================
  //  HOSTEL FILTERING LOGIC
  // ==========================================
  useEffect(() => {
    let result = [...hostels];

    if (hostelFilters.location) {
      const term = hostelFilters.location.toLowerCase();
      result = result.filter(h => 
        (h.location && h.location.toLowerCase().includes(term)) || 
        (h.name && h.name.toLowerCase().includes(term))
      );
    }
    if (hostelFilters.minPrice) {
      const min = parseFloat(hostelFilters.minPrice);
      if (!isNaN(min)) result = result.filter(h => h.price >= min);
    }
    if (hostelFilters.maxPrice) {
      const max = parseFloat(hostelFilters.maxPrice);
      if (!isNaN(max)) result = result.filter(h => h.price <= max);
    }
    if (hostelFilters.rating) {
      const rate = parseFloat(hostelFilters.rating);
      if (!isNaN(rate)) result = result.filter(h => h.rating >= rate);
    }

    setFilteredHostels(result);
  }, [hostelFilters, hostels]);

  // --- Handlers ---
  const handleApplyHostelFilters = () => {
    setHostelFilters({ location: searchLocation, minPrice, maxPrice, rating });
    setIsFilterOpen(false);
  };
  
  const handleApplyRoommateFilters = (newFilters) => {
    // This handler is now responsible for setting the main filters for roommates
    setRoommateFilters(newFilters);
    setIsFilterOpen(false);
  };

  const handleClearHostelFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setRating('');
    setSearchLocation('');
    setHostelFilters({ location: '', minPrice: '', maxPrice: '', rating: '' });
  };
  
  const handleGoToProfile = () => {
    navigate('/user-dashboard');
  };
  
  const handleSearchInputChange = (e) => {
    setSearchLocation(e.target.value);
    if (!isFilterOpen) {
      setHostelFilters(prev => ({ ...prev, location: e.target.value }));
    }
  };

  return (
    <div className={`home ${theme}`}>
      <SeedRoommates /> 
      
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
            Your next adventure starts here.
          </p>
          
          {/* INTEGRATED SEARCH BAR CONTAINER */}
          <div className="search-bar-container">
            <div className="search-bar">
              {/* Location Input */}
              <div className="search-input-group">
                <Search className="search-icon" />
                <input
                  type="text"
                  placeholder="Where do you want to go?"
                  value={searchLocation}
                  onChange={handleSearchInputChange}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyHostelFilters()}
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
                  {(minPrice || maxPrice || rating || roommateFilters.gender || roommateFilters.smoker || roommateFilters.cleanliness) && <div className="filter-dot"></div>}
              </button>

              {/* Filter Popup */}
              {isFilterOpen && (
                <div className="filter-dropdown">
                    <div className="filter-header">
                        <h4>Filter Options</h4>
                        <button className="close-filter" onClick={() => setIsFilterOpen(false)}>
                            <X size={16} />
                        </button>
                    </div>
                    
                    {/* --- HOSTEL FILTERS (Price/Rating) --- */}
                    <div className="filter-section">
                        <label>Hostel Price Range ($)</label>
                        <div className="price-inputs">
                            <input type="number" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
                            <span>-</span>
                            <input type="number" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
                        </div>
                    </div>

                    <div className="filter-section">
                        <label>Hostel Min Rating</label>
                        <div className="rating-options">
                            {[4, 3, 2].map(star => (<button key={star} className={`rating-chip ${rating == star ? 'selected' : ''}`} onClick={() => setRating(star === rating ? '' : star)}>{star}+ ⭐</button>))}
                        </div>
                    </div>
                    
                    {/* Divider for Roommates */}
                    <hr style={{margin: '15px 0', border: 'none', borderTop: '1px dashed #eee'}}/>

                    {/* --- ROOMMATE FILTERS --- */}
                    <div className="filter-section">
                        <label>Gender Preference</label>
                        <div className="select-options">
                            <select value={roommateFilters.gender} onChange={(e) => setRoommateFilters(prev => ({...prev, gender: e.target.value}))}>
                                <option value="">Any Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </select>
                        </div>
                    </div>

                    <div className="filter-section">
                        <label>Smoker Status</label>
                        <div className="select-options">
                            <select value={roommateFilters.smoker} onChange={(e) => setRoommateFilters(prev => ({...prev, smoker: e.target.value}))}>
                                <option value="">Doesn't Matter</option>
                                <option value="No">Non-Smoker Only</option>
                                <option value="Yes">Smoker OK</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className="filter-section">
                        <label>Cleanliness Level</label>
                        <div className="select-options">
                            <select value={roommateFilters.cleanliness} onChange={(e) => setRoommateFilters(prev => ({...prev, cleanliness: e.target.value}))}>
                                <option value="">Any Level</option>
                                <option value="Neat Freak">Neat Freak</option>
                                <option value="Average">Average</option>
                                <option value="Messy">Messy</option>
                            </select>
                        </div>
                    </div>

                    <div className="filter-actions">
                        <button 
                            className="clear-btn" 
                            onClick={() => { handleClearHostelFilters(); setRoommateFilters({gender: '', smoker: '', cleanliness: ''}); }}
                        >
                            Clear All
                        </button>
                        <button className="apply-btn" onClick={handleApplyHostelFilters}>Apply Filters</button>
                    </div>
                </div>
              )}
              {isFilterOpen && <div className="filter-overlay" onClick={() => setIsFilterOpen(false)}></div>}

              {/* Search Action */}
              <button className="search-button" onClick={handleApplyHostelFilters}>
                Search
              </button>
            </div>
          </div>
          
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
              <button 
                className={`tab-button ${activeTab === 'hostels' ? 'active' : ''}`}
                onClick={() => setActiveTab('hostels')}
              >
                Hostels
              </button>
              <button 
                className={`tab-button ${activeTab === 'roommates' ? 'active' : ''}`}
                onClick={() => setActiveTab('roommates')}
              >
                Roommates
              </button>
              <button 
                className={`tab-button ${activeTab === 'compare' ? 'active' : ''}`}
                onClick={() => setActiveTab('compare')}
              >
                Compare
              </button>
            </div>
          </div>

          {/* TAB CONTENT AREAS */}

          {/* 1. Hostels Grid */}
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

          {/* 2. Roommates Grid (FIXED) */}
          {activeTab === 'roommates' && (
            <div className="roommates-grid">
              {/* Logic Check: If user is logged in but profile is missing key compatibility data */}
              {!currentUser || !userProfile || !userProfile.age ? (
                  <div className="compatibility-warning">
                      <h3>Complete Your Profile!</h3>
                      <p>Log in and set your Age, Smoker Status, and Cleanliness preferences in 'My Profile' to see accurate compatibility scores.</p>
                      <button onClick={handleGoToProfile} className="cta-button">Go to Profile</button>
                  </div>
              ) : roommates.length > 0 ? (
                 roommates.map((roommate) => (
                    <RoommateCard key={roommate.id} {...roommate} onBlock={handleBlockRoommate} /> 
                 ))
              ) : (
                 <div className="no-results"><p>No roommates found matching your current criteria.</p></div>
              )}
            </div>
          )}

          {/* 3. Compare Hostels Tool */}
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