import { MapPin, Calendar, X } from 'lucide-react';
import { ChatWindow } from './ChatWindow'; // FIX: Removed .jsx extension
import { useState } from 'react';
import './RoommateCard.css'; // FIX: Ensure this CSS file is present

// Added onBlock prop to handle user removal/blocking in the parent component (Home.jsx)
function RoommateCard({ id, name, displayName, age, occupation, location, moveInDate, budget, image, photoURL, matchScore, smoker, cleanliness, sleepSchedule, bio, onBlock, currentUserId }) {
  
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Determine display name and image source based on available props
  const displayUserName = name || displayName || 'Hostella User';
  const displayImage = image || photoURL || `https://ui-avatars.com/api/?name=${displayUserName}&background=random`;
  
  // Determine match color
  const getMatchColor = (score) => {
      if (score >= 85) return '#16a34a'; // Green
      if (score >= 60) return '#ca8a04'; // Yellow/Orange
      return '#dc2626'; // Red
  };
  
  // Function to generate the unique chat ID by sorting the two UIDs
  const getChatId = (uid1, uid2) => {
    // This creates the unique, consistent chat thread ID: UID_A_UID_B
    return [uid1, uid2].sort().join('_');
  };
  
  const handleContactClick = () => {
      if (!currentUserId) {
          alert("Please log in to start chatting.");
          return;
      }
      setIsChatOpen(true);
  };

  return (
    <>
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
              e.stopPropagation();
              if (window.confirm(`Are you sure you want to hide ${displayUserName}? You won't see them again.`)) {
                  onBlock(id);
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

          <button className="contact-btn" onClick={handleContactClick}>
            Contact Roommate
          </button>
        </div>
      </div>
      
      {/* Chat Modal */}
      {isChatOpen && currentUserId && (
        <ChatWindow
          chatId={getChatId(currentUserId, id)}
          collectionName="chats" 
          onClose={() => setIsChatOpen(false)}
          recipientName={displayUserName}
          recipientId={id} 
        />
      )}
    </>
  );
}

export default RoommateCard;