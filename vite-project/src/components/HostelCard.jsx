import { useNavigate } from 'react-router-dom'
import './HostelCard.css'

function HostelCard({ id, name, location, price, rating, reviews, image, beds, hasRoommates }) {
  const navigate = useNavigate()

  const handleClick = () => {
    navigate(`/hostel/${id}`)
  }

  return (
    <div className="hostel-card" onClick={handleClick}>
      <div className="hostel-card-image">
        <img src={image} alt={name} />
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
            <span className="hostel-beds">{beds} beds</span>
            {hasRoommates && <span className="hostel-roommates">Roommates</span>}
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

