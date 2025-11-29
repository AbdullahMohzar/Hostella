import { useState } from "react";
import { collection, writeBatch, doc } from "firebase/firestore";
import { db } from "../firebase";
import hostelsData from "../data/hostels.json"; // Make sure path matches

export function SeedHostels() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const uploadData = async () => {
    setLoading(true);
    setStatus("Preparing to upload...");

    try {
      const batch = writeBatch(db);
      
      hostelsData.forEach((hostel) => {
        // Create a reference for a new doc with the ID from JSON
        const docRef = doc(db, "hostels", hostel.id);
        
        // Remove 'id' from the data body since it's the doc key now
        const { id, ...hostelData } = hostel;
        
        // Add timestamp
        const dataWithTime = {
            ...hostelData,
            createdAt: new Date().toISOString()
        }

        batch.set(docRef, dataWithTime);
      });

      await batch.commit();
      setStatus(`Success! Uploaded ${hostelsData.length} hostels.`);
    } catch (error) {
      console.error(error);
      setStatus("Error uploading data. Check console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-10 text-center">
        <h2 className="text-xl font-bold mb-4">Database Seeder</h2>
        <button 
            onClick={uploadData} 
            disabled={loading}
            className="bg-green-600 text-white px-6 py-3 rounded disabled:opacity-50"
        >
            {loading ? "Uploading..." : "Upload 20 Hostels to Firebase"}
        </button>
        <p className="mt-4 text-gray-600">{status}</p>
    </div>
  );
}