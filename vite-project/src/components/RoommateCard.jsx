import './RoommateCard.css'

function RoommateCard({ id, name, age, occupation, location, moveInDate, budget, interests, image, matchScore }) {
  return (
    <div className="roommate-card">
      <div className="roommate-card-header">
        <div className="roommate-card-image">
          <img src={image} alt={name} />
        </div>
        <div className="roommate-card-match">
          <span className="match-score">{matchScore}%</span>
          <span className="match-label">Match</span>
        </div>
      </div>
      <div className="roommate-card-content">
        <h3 className="roommate-card-name">{name}, {age}</h3>
        <p className="roommate-card-occupation">{occupation}</p>
        <p className="roommate-card-location">{location}</p>
        <div className="roommate-card-details">
          <div className="detail-item">
            <span className="detail-label">Move-in:</span>
            <span className="detail-value">{moveInDate}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Budget:</span>
            <span className="detail-value">${budget}/mo</span>
          </div>
        </div>
        <div className="roommate-card-interests">
          {interests.map((interest, idx) => (
            <span key={idx} className="interest-tag">{interest}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default RoommateCard

