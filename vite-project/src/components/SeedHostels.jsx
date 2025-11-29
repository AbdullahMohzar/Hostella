import { useState } from "react";
import { writeBatch, doc } from "firebase/firestore";
import { db } from "../firebase";
import hostelsData from "../data/hostels.json"; 

export function SeedHostels() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const uploadData = async () => {
    setLoading(true);
    setStatus("Preparing to upload...");

    try {
      const batch = writeBatch(db);
      
      hostelsData.forEach((hostel) => {
        // 1. Create a reference
        const docRef = doc(db, "hostels", hostel.id);
        
        // 2. Remove 'id' from the data body
        const { id, ...hostelData } = hostel;
        
        // 3. Add Timestamp AND the specific Owner Email
        const finalData = {
            ...hostelData,
            createdAt: new Date().toISOString(),
            ownerEmail: "i243124@isb.nu.edu.pk", // <--- Added specifically for you
            ownerId: "i243124_manual_upload"     // Placeholder ID since we don't have the auth UID
        }

        batch.set(docRef, finalData);
      });

      await batch.commit();
      setStatus(`Success! 20 Hostels uploaded for i243124@isb.nu.edu.pk`);
    } catch (error) {
      console.error(error);
      setStatus("Error uploading data. Check console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 border-2 border-dashed border-blue-400 bg-blue-50 rounded-xl text-center my-8">
        <h3 className="font-bold text-xl mb-2 text-blue-900">Database Seeder</h3>
        <p className="mb-4 text-gray-700">
            Upload 20 hostels to Firestore linked to: <br/> 
            <span className="font-mono bg-white px-2 py-1 rounded border">i243124@isb.nu.edu.pk</span>
        </p>
        <button 
            onClick={uploadData} 
            disabled={loading}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition shadow-lg"
        >
            {loading ? "Uploading..." : "Upload Now"}
        </button>
        {status && <p className="mt-4 font-bold text-green-700 text-lg">{status}</p>}
    </div>
  );
}