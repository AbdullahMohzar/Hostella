import { useEffect } from 'react';
import { writeBatch, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import roommatesData from '../data/roommates.json';
import { User, Mail } from 'lucide-react'; 

export function SeedRoommates() {
  // Collection name changed from 'users' to 'roommates'
  const ROOMMATE_COLLECTION = 'roommates'; 

  useEffect(() => {
    const seedData = async () => {
      try {
        // Check if the first roommate exists to avoid re-seeding
        const firstId = roommatesData[0].id;
        const docRef = doc(db, ROOMMATE_COLLECTION, firstId);
        const docSnap = await getDoc(docRef);
        
        let statusMessage = "";

        if (!docSnap.exists()) {
          console.log(`Seeding 20 Roommate Profiles to /${ROOMMATE_COLLECTION}...`);
          const batch = writeBatch(db);
          let index = 1;
          
          roommatesData.forEach((roommate) => {
            const userRef = doc(db, ROOMMATE_COLLECTION, roommate.id);
            const generatedEmail = `${roommate.name.toLowerCase().replace(/\s/g, '.')}.${index}@hostella-demo.com`;
            
            batch.set(userRef, {
              ...roommate,
              // We keep the email for display/compatibility checks, but it's not a real auth account
              email: generatedEmail, 
              role: 'sample_roommate', 
              lookingForRoommate: true,
              createdAt: new Date().toISOString(),
              isSample: true
            });
            index++;
          });

          await batch.commit();
          statusMessage = `✅ 20 Sample Roommate Profiles Uploaded to /${ROOMMATE_COLLECTION}.`;
          console.log(statusMessage);
        } else {
          statusMessage = `👍 Sample Roommate Profiles already exist in /${ROOMMATE_COLLECTION}.`;
        }
        
        // Update the status box visibility
        const statusElement = document.getElementById('roommate-seed-status');
        if (statusElement) {
            statusElement.innerHTML = statusMessage;
        }

      } catch (error) {
        console.error("Error seeding roommates:", error);
        const statusElement = document.getElementById('roommate-seed-status');
        if (statusElement) {
            statusElement.innerHTML = "❌ Error seeding data. Check console.";
        }
      }
    };

    seedData();
  }, []);

  // This status box is purely for visual debugging on the frontend
  return (
    <div 
        id="roommate-seed-container"
        style={{
            position: 'fixed', bottom: 10, right: 10, zIndex: 100, 
            padding: '10px 15px', background: '#f3f4f6', 
            borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
            fontSize: '0.8rem', color: '#333'
        }}
    >
        <span id="roommate-seed-status">Checking for sample data...</span>
    </div>
  );
}