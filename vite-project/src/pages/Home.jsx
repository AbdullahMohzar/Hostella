import { useState, useEffect } from 'react'
import { useTheme } from '../components/ThemeContext'
import HostelCard from '../components/HostelCard'
import RoommateCard from '../components/RoommateCard'
import SearchBar from '../components/SearchBar'
import { CompareHostels } from './CompareHostels' // <--- 1. Import Comparison Component
// import { SeedHostels } from '../components/SeedHostels'    // <--- 2. Import Seeder (Uncomment to use)
import { collection, getDocs, query } from 'firebase/firestore'
import { db } from '../firebase'
import heroImage from '../assets/2280feee79ed9810e3a864e738a4ea7ee9086c87.png'
import './Home.css'

function Home() {
  const { theme } = useTheme()
  const [activeTab, setActiveTab] = useState('hostels')
  const [hostels, setHostels] = useState([])
  const [filteredHostels, setFilteredHostels] = useState([])
  const [filters, setFilters] = useState({
    location: '',
    checkIn: '',
    checkOut: '',
    minPrice: '',
    maxPrice: '',
    rating: ''
  })
  const [loading, setLoading] = useState(true)

  // Load hostels from Firestore
  useEffect(() => {
    const loadHostels = async () => {
      try {
        const hostelsQuery = query(collection(db, 'hostels'))
        const querySnapshot = await getDocs(hostelsQuery)
        const hostelsData = []
        querySnapshot.forEach((doc) => {
          hostelsData.push({ id: doc.id, ...doc.data() })
        })
        setHostels(hostelsData)
        setFilteredHostels(hostelsData)
        setLoading(false)
      } catch (error) {
        console.error('Error loading hostels:', error)
        setLoading(false)
      }
    }

    loadHostels()
  }, [])

  // Apply filters
  useEffect(() => {
    let filtered = [...hostels]

    if (filters.location) {
      filtered = filtered.filter(h => 
        h.location?.toLowerCase().includes(filters.location.toLowerCase())
      )
    }

    if (filters.minPrice) {
      filtered = filtered.filter(h => h.price >= parseFloat(filters.minPrice))
    }

    if (filters.maxPrice) {
      filtered = filtered.filter(h => h.price <= parseFloat(filters.maxPrice))
    }

    if (filters.rating) {
      filtered = filtered.filter(h => h.rating >= parseFloat(filters.rating))
    }

    setFilteredHostels(filtered)
  }, [filters, hostels])

  const handleSearch = (searchFilters) => {
    setFilters(prev => ({
      ...prev,
      ...searchFilters
    }))
  }

  // Hardcoded roommates data
  const roommates = [
    {
      id: '1',
      name: 'Sarah Chen',
      age: 24,
      occupation: 'Software Engineer',
      location: 'San Francisco, CA',
      moveInDate: 'Dec 1, 2025',
      budget: 1200,
      interests: ['Hiking', 'Cooking', 'Yoga', 'Reading'],
      image: 'https://images.unsplash.com/photo-1730152243945-1d856eb767ff?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMHRyYXZlbGVyc3xlbnwxfHx8fDE3NjE1NzkxNjZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
      matchScore: 92
    },
    {
      id: '2',
      name: 'Marcus Johnson',
      age: 27,
      occupation: 'Graphic Designer',
      location: 'Brooklyn, NY',
      moveInDate: 'Nov 15, 2025',
      budget: 1400,
      interests: ['Photography', 'Music', 'Coffee'],
      image: 'https://images.unsplash.com/photo-1524538198441-241ff79d153b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMHByb2Zlc3Npb25hbCUyMG1hbnxlbnwxfHx8fDE3NjI1NDgyODV8MA&ixlib=rb-4.1.0&q=80&w=1080',
      matchScore: 88
    },
    {
      id: '3',
      name: 'Emma Rodriguez',
      age: 23,
      occupation: 'Graduate Student',
      location: 'Los Angeles, CA',
      moveInDate: 'Jan 1, 2026',
      budget: 950,
      interests: ['Running', 'Art', 'Podcasts', 'Vegan Cooking'],
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMHByb2Zlc3Npb25hbCUyMHdvbWFufGVufDF8fHwxNzYyMzY5NTJ8MA&ixlib=rb-4.1.0&q=80&w=1080',
      matchScore: 85
    }
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
            Your next adventure starts here.
          </p>
          <SearchBar onSearch={handleSearch} />
          
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
          <div className="feature-item">
            <div className="feature-icon">🛡️</div>
            <h3>Verified Listings</h3>
            <p>All hostels and roommates are verified for your safety</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon">👥</div>
            <h3>Smart Matching</h3>
            <p>AI-powered roommate compatibility matching</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon">⭐</div>
            <h3>Top Rated</h3>
            <p>Browse thousands of reviewed hostels worldwide</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon">📶</div>
            <h3>Great Amenities</h3>
            <p>WiFi, kitchens, and more at every location</p>
          </div>
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
              {/* 3. New Compare Button */}
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
                <div className="no-results">
                    <p>No hostels found matching your criteria.</p>
                    
                    {/* Uncomment below to show Seeder Button if list is empty */}
                    {/* <div style={{marginTop: '20px'}}>
                         <SeedHostels /> 
                    </div> */}
                </div>
              ) : (
                filteredHostels.map((hostel) => (
                  <HostelCard key={hostel.id} {...hostel} />
                ))
              )}
            </div>
          )}

          {/* 2. Roommates Grid */}
          {activeTab === 'roommates' && (
            <div className="roommates-grid">
              {roommates.map((roommate) => (
                <RoommateCard key={roommate.id} {...roommate} />
              ))}
            </div>
          )}

          {/* 3. Compare Hostels Tool */}
          {activeTab === 'compare' && (
            <div className="compare-container">
               <CompareHostels />
            </div>
          )}

        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <h2>Ready to Start Your Journey?</h2>
          <p>
            Join thousands of travelers who have found their perfect hostel and roommate through Hostella.
          </p>
          <button className="cta-button">Get Started Today</button>
        </div>
      </section>
    </div>
  )
}

export default Home