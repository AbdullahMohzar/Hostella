import { MapPin, Calendar, X } from 'lucide-react'; // Import X icon
import './RoommateCard.css';

// Added onBlock prop to handle user removal/blocking in the parent component (Home.jsx)
function RoommateCard({ id, name, displayName, age, occupation, location, moveInDate, budget, image, photoURL, matchScore, smoker, cleanliness, sleepSchedule, bio, onBlock }) {
  
  // Determine display name and image source based on available props
  const displayUserName = name || displayName || 'Hostella User';
  const displayImage = image || photoURL || `https://ui-avatars.com/api/?name=${displayUserName}&background=random`;
  
  // Determine match color
  const getMatchColor = (score) => {
      if (score >= 85) return '#16a34a'; // Green
      if (score >= 60) return '#ca8a04'; // Yellow/Orange
      return '#dc2626'; // Red
  };

  return (
    <div className="roommate-card">
      <div className="roommate-image-container">
        <img 
          src={displayImage} 
          alt={displayUserName} 
          className="roommate-img" 
        />
        {matchScore && (
            <div className="match-badge" style={{ backgroundColor: getMatchColor(matchScore) }}>
                {matchScore}% Match
            </div>
        )}
        
        {/* Hide/Block Button */}
        <button 
          className="hide-btn"
          onClick={(e) => {
            e.stopPropagation(); // Prevent card click
            if (window.confirm(`Are you sure you want to hide ${displayUserName}? You won't see them again.`)) {
                onBlock(id); // Call the parent function to block this ID
            }
          }}
          title="Hide this profile"
        >
            <X size={18} />
        </button>
      </div>
      
      <div className="roommate-content">
        <div className="roommate-header">
            <h3 className="roommate-name">{displayUserName}, {age}</h3>
            <p className="roommate-job">{occupation}</p>
        </div>

        <div className="roommate-details">
            <p className="detail-row"><MapPin size={14} /> {location}</p>
            <p className="detail-row"><Calendar size={14} /> Move-in: {moveInDate}</p>
            <p className="budget-row">Budget: <span>${budget}</span></p>
        </div>

        {/* Tags for lifestyle */}
        <div className="roommate-tags">
            {smoker === 'No' && <span className="tag">Non-Smoker</span>}
            <span className="tag">{sleepSchedule}</span>
            <span className="tag">{cleanliness}</span>
        </div>

        <p className="roommate-bio">"{bio}"</p>

        <button className="contact-btn">Contact Roommate</button>
      </div>
    </div>
  );
}

export default RoommateCard;