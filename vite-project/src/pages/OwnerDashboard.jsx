import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../components/ThemeContext'
import './OwnerDashboard.css'

function OwnerDashboard() {
  const { currentUser } = useAuth()
  const { theme } = useTheme()
  const [activeTab, setActiveTab] = useState('hostels')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingHostel, setEditingHostel] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    price: '',
    description: ''
  })

  // Sample hostels data
  const [hostels, setHostels] = useState([
    {
      id: 1,
      name: 'Sunset Hostel',
      location: 'Downtown',
      price: 25,
      bookings: 12,
      revenue: 3000,
      description: 'A cozy hostel in the heart of downtown'
    },
    {
      id: 2,
      name: 'Mountain View Hostel',
      location: 'City Center',
      price: 30,
      bookings: 8,
      revenue: 2400,
      description: 'Beautiful views of the mountains'
    }
  ])

  // Sample users data
  const [users, setUsers] = useState([
    {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      role: 'user',
      bookings: 3,
      status: 'active'
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'user',
      bookings: 5,
      status: 'active'
    },
    {
      id: 3,
      name: 'Bob Johnson',
      email: 'bob@example.com',
      role: 'user',
      bookings: 1,
      status: 'inactive'
    }
  ])

  // Sample all bookings data
  const [allBookings, setAllBookings] = useState([
    {
      id: 1,
      userName: 'John Doe',
      userEmail: 'john@example.com',
      hostelName: 'Sunset Hostel',
      checkIn: '2024-01-15',
      checkOut: '2024-01-20',
      status: 'confirmed',
      price: 125,
      bookingDate: '2024-01-10'
    },
    {
      id: 2,
      userName: 'Jane Smith',
      userEmail: 'jane@example.com',
      hostelName: 'Mountain View Hostel',
      checkIn: '2024-02-01',
      checkOut: '2024-02-05',
      status: 'pending',
      price: 120,
      bookingDate: '2024-01-25'
    },
    {
      id: 3,
      userName: 'Bob Johnson',
      userEmail: 'bob@example.com',
      hostelName: 'Sunset Hostel',
      checkIn: '2024-03-10',
      checkOut: '2024-03-15',
      status: 'confirmed',
      price: 125,
      bookingDate: '2024-02-28'
    }
  ])

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleAddHostel = (e) => {
    e.preventDefault()
    const newHostel = {
      id: Date.now(),
      name: formData.name,
      location: formData.location,
      price: parseFloat(formData.price),
      bookings: 0,
      revenue: 0,
      description: formData.description
    }
    setHostels([...hostels, newHostel])
    setFormData({ name: '', location: '', price: '', description: '' })
    setShowAddForm(false)
  }

  const handleEditHostel = (hostel) => {
    setEditingHostel(hostel)
    setFormData({
      name: hostel.name,
      location: hostel.location,
      price: hostel.price.toString(),
      description: hostel.description || ''
    })
    setShowAddForm(true)
  }

  const handleUpdateHostel = (e) => {
    e.preventDefault()
    setHostels(hostels.map(hostel => 
      hostel.id === editingHostel.id
        ? { ...hostel, ...formData, price: parseFloat(formData.price) }
        : hostel
    ))
    setEditingHostel(null)
    setFormData({ name: '', location: '', price: '', description: '' })
    setShowAddForm(false)
  }

  const handleDeleteHostel = (id) => {
    if (window.confirm('Are you sure you want to delete this hostel?')) {
      setHostels(hostels.filter(hostel => hostel.id !== id))
    }
  }

  const handleUserStatusChange = (userId, newStatus) => {
    setUsers(users.map(user => 
      user.id === userId ? { ...user, status: newStatus } : user
    ))
  }

  const handleBookingStatusChange = (bookingId, newStatus) => {
    setAllBookings(allBookings.map(booking => 
      booking.id === bookingId ? { ...booking, status: newStatus } : booking
    ))
  }

  const totalRevenue = hostels.reduce((sum, hostel) => sum + hostel.revenue, 0)
  const totalBookings = hostels.reduce((sum, hostel) => sum + hostel.bookings, 0)
  const totalUsers = users.length
  const activeUsers = users.filter(u => u.status === 'active').length

  return (
    <div className={`owner-dashboard ${theme}`}>
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h2 className="dashboard-title">Owner Dashboard</h2>
          <div className="user-info">
            <p>Welcome, {currentUser?.displayName || currentUser?.email}</p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="stats-section">
          <div className="stat-card">
            <h3 className="stat-label">Total Revenue</h3>
            <p className="stat-value">${totalRevenue.toLocaleString()}</p>
          </div>
          <div className="stat-card">
            <h3 className="stat-label">Total Bookings</h3>
            <p className="stat-value">{totalBookings}</p>
          </div>
          <div className="stat-card">
            <h3 className="stat-label">Active Hostels</h3>
            <p className="stat-value">{hostels.length}</p>
          </div>
          <div className="stat-card">
            <h3 className="stat-label">Total Users</h3>
            <p className="stat-value">{totalUsers} ({activeUsers} active)</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="dashboard-tabs">
          <button 
            className={`tab-button ${activeTab === 'hostels' ? 'active' : ''}`}
            onClick={() => setActiveTab('hostels')}
          >
            Hostels
          </button>
          <button 
            className={`tab-button ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            All Bookings
          </button>
          <button 
            className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Manage Users
          </button>
        </div>

        {/* Hostels Tab */}
        {activeTab === 'hostels' && (
          <div className="hostels-section">
            <div className="section-header">
              <h3 className="section-title">My Hostels</h3>
              <button
                onClick={() => {
                  setEditingHostel(null)
                  setFormData({ name: '', location: '', price: '', description: '' })
                  setShowAddForm(!showAddForm)
                }}
                className="add-button"
              >
                {showAddForm ? 'Cancel' : '+ Add Hostel'}
              </button>
            </div>

            {showAddForm && (
              <form onSubmit={editingHostel ? handleUpdateHostel : handleAddHostel} className="add-hostel-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Hostel Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter hostel name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Location</label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter location"
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Price per Night ($)</label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      required
                      min="1"
                      placeholder="Enter price"
                    />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Enter description"
                      rows="3"
                    />
                  </div>
                </div>
                <button type="submit" className="submit-button">
                  {editingHostel ? 'Update Hostel' : 'Add Hostel'}
                </button>
              </form>
            )}

            <div className="hostels-list">
              {hostels.length > 0 ? (
                hostels.map((hostel) => (
                  <div key={hostel.id} className="hostel-card">
                    <div className="hostel-info">
                      <h4 className="hostel-name">{hostel.name}</h4>
                      <p className="hostel-location">{hostel.location}</p>
                      <p className="hostel-description">{hostel.description}</p>
                      <div className="hostel-stats">
                        <span>Price: ${hostel.price}/night</span>
                        <span>Bookings: {hostel.bookings}</span>
                        <span>Revenue: ${hostel.revenue}</span>
                      </div>
                    </div>
                    <div className="hostel-actions">
                      <button 
                        onClick={() => handleEditHostel(hostel)} 
                        className="edit-button"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteHostel(hostel.id)} 
                        className="delete-button"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <p>No hostels added yet. Add your first hostel!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* All Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="bookings-section">
            <h3 className="section-title">All Bookings</h3>
            <div className="bookings-table-container">
              <table className="bookings-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Hostel</th>
                    <th>Check-in</th>
                    <th>Check-out</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allBookings.map((booking) => (
                    <tr key={booking.id}>
                      <td>{booking.userName}</td>
                      <td>{booking.userEmail}</td>
                      <td>{booking.hostelName}</td>
                      <td>{booking.checkIn}</td>
                      <td>{booking.checkOut}</td>
                      <td>${booking.price}</td>
                      <td>
                        <select
                          value={booking.status}
                          onChange={(e) => handleBookingStatusChange(booking.id, e.target.value)}
                          className={`status-select ${booking.status}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td>
                        <button className="view-button">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Manage Users Tab */}
        {activeTab === 'users' && (
          <div className="users-section">
            <h3 className="section-title">Manage Users</h3>
            <div className="users-table-container">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Bookings</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.role}</td>
                      <td>{user.bookings}</td>
                      <td>
                        <select
                          value={user.status}
                          onChange={(e) => handleUserStatusChange(user.id, e.target.value)}
                          className={`status-select ${user.status}`}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </td>
                      <td>
                        <button className="view-button">View Details</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default OwnerDashboard
