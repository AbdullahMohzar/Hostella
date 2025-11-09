import { useState } from 'react'
import './SearchBar.css'

function SearchBar() {
  const [searchQuery, setSearchQuery] = useState('')
  const [location, setLocation] = useState('')
  const [dateRange, setDateRange] = useState({ checkIn: '', checkOut: '' })

  const handleSubmit = (e) => {
    e.preventDefault()
    // Handle search logic
    console.log('Search:', { searchQuery, location, dateRange })
  }

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <div className="search-bar-container">
        <div className="search-input-group">
          <label>Location</label>
          <input
            type="text"
            placeholder="Where are you going?"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
        <div className="search-input-group">
          <label>Check-in</label>
          <input
            type="date"
            value={dateRange.checkIn}
            onChange={(e) => setDateRange({ ...dateRange, checkIn: e.target.value })}
          />
        </div>
        <div className="search-input-group">
          <label>Check-out</label>
          <input
            type="date"
            value={dateRange.checkOut}
            onChange={(e) => setDateRange({ ...dateRange, checkOut: e.target.value })}
            min={dateRange.checkIn}
          />
        </div>
        <button type="submit" className="search-bar-button">
          Search
        </button>
      </div>
    </form>
  )
}

export default SearchBar

