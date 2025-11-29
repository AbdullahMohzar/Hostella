import { useState, useEffect } from "react";
import { 
  X, Plus, Check, Star, MapPin, DollarSign, Wifi, Shield, Utensils, Search 
} from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import "./CompareHostels.css"; // <--- IMPORT THE NEW CSS FILE

export function CompareHostels() {
  const [selectedHostels, setSelectedHostels] = useState([]);
  const [availableHostels, setAvailableHostels] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Real Data
  useEffect(() => {
    const loadHostels = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "hostels"));
        const hostelsData = [];
        querySnapshot.forEach((doc) => {
          hostelsData.push({ id: doc.id, ...doc.data() });
        });
        setAvailableHostels(hostelsData);
        setLoading(false);
      } catch (error) {
        console.error("Error loading hostels:", error);
        setLoading(false);
      }
    };
    loadHostels();
  }, []);

  const handleAddHostel = (hostel) => {
    if (selectedHostels.length < 4) {
      setSelectedHostels([...selectedHostels, hostel]);
    }
    setIsDialogOpen(false);
  };

  const handleRemoveHostel = (hostelId) => {
    setSelectedHostels(selectedHostels.filter((h) => h.id !== hostelId));
  };

  const getBestStat = (statType) => {
    if (selectedHostels.length < 2) return null;
    const values = selectedHostels.map(h => {
      if (statType === 'price') return h.price;
      if (statType === 'rating') return h.rating;
      if (statType === 'speed') return parseInt(h.wifiSpeed) || 0;
      return 0;
    });
    if (statType === 'price') return Math.min(...values);
    return Math.max(...values);
  };

  const comparisonRows = [
    { label: "Free WiFi", key: "Wifi" },
    { label: "Kitchen", key: "Kitchen" },
    { label: "Lockers", key: "Lockers" },
    { label: "Common Area", key: "Common Area" },
    { label: "Laundry", key: "Laundry" },
    { label: "24/7 Reception", key: "24/7 Reception" },
    { label: "Pool", key: "Pool" },
    { label: "Bar", key: "Bar" },
    { label: "Rooftop Terrace", key: "Rooftop Terrace" }
  ];

  if (loading) return <div className="p-20 text-center">Loading comparison engine...</div>;

  return (
    <div className="compare-wrapper">
      
      {/* Header */}
      <div className="compare-header">
        <div className="compare-title">
          <h2>Compare Stays</h2>
          <p>Select up to 4 hostels to find your perfect match.</p>
        </div>
        {selectedHostels.length < 4 && (
          <button onClick={() => setIsDialogOpen(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Hostel
          </button>
        )}
      </div>

      {/* Main Table */}
      <div className="table-container">
        {selectedHostels.length > 0 ? (
          <table className="compare-table">
            <thead>
              <tr>
                <th className="feature-col">FEATURES</th>
                {selectedHostels.map((hostel) => (
                  <th key={hostel.id} className="hostel-col">
                    <div className="hostel-card-header">
                      <button className="remove-btn" onClick={() => handleRemoveHostel(hostel.id)}>
                        <X className="w-4 h-4" />
                      </button>
                      <div className="image-wrapper">
                        <img src={hostel.image} alt={hostel.name} className="hostel-img" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800">{hostel.name}</h3>
                      <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                        <MapPin className="w-3 h-3" /> {hostel.location}
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Price */}
              <tr>
                <td className="feature-col"><DollarSign className="w-4 h-4 inline mr-2 text-blue-500"/> Price</td>
                {selectedHostels.map((hostel) => (
                  <td key={hostel.id} className="row-data">
                    <div className="price-tag">${hostel.price}</div>
                    {hostel.price === getBestStat('price') && selectedHostels.length > 1 && (
                      <span className="badge best">Best Value</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Rating */}
              <tr>
                <td className="feature-col"><Star className="w-4 h-4 inline mr-2 text-yellow-500"/> Rating</td>
                {selectedHostels.map((hostel) => (
                  <td key={hostel.id} className="row-data">
                    <div className="font-bold text-lg">{hostel.rating} <span className="text-slate-400 text-sm font-normal">({hostel.reviews})</span></div>
                  </td>
                ))}
              </tr>

              {/* Wifi */}
              <tr>
                <td className="feature-col"><Wifi className="w-4 h-4 inline mr-2 text-indigo-500"/> WiFi Speed</td>
                {selectedHostels.map((hostel) => {
                  const speed = parseInt(hostel.wifiSpeed);
                  return (
                    <td key={hostel.id} className="row-data">
                      <div className="font-medium">{speed} Mbps</div>
                      {speed === getBestStat('speed') && selectedHostels.length > 1 && (
                        <span className="badge fast">Fastest</span>
                      )}
                    </td>
                  )
                })}
              </tr>

              {/* Gender Policy */}
              <tr>
                <td className="feature-col"><Shield className="w-4 h-4 inline mr-2 text-purple-500"/> Policy</td>
                {selectedHostels.map((hostel) => {
                   const amns = (hostel.amenities || []).join(' ').toLowerCase();
                   let policy = "Mixed";
                   let style = "mixed";
                   if (amns.includes('female only')) { policy = "Girls Only"; style = "female"; }
                   else if (amns.includes('male only')) { policy = "Male Only"; style = "male"; }
                   return (
                     <td key={hostel.id} className="row-data">
                       <span className={`badge ${style}`}>{policy}</span>
                     </td>
                   )
                })}
              </tr>

              {/* Dynamic Amenities */}
              {comparisonRows.map((row) => (
                <tr key={row.key}>
                  <td className="feature-col" style={{fontWeight: 'normal', paddingLeft: '40px'}}>{row.label}</td>
                  {selectedHostels.map((hostel) => {
                    const has = (hostel.amenities || []).some(a => a.toLowerCase() === row.key.toLowerCase());
                    return (
                      <td key={hostel.id} className="row-data">
                        {has ? (
                          <div className="check-circle"><Check className="w-4 h-4" /></div>
                        ) : (
                          <div className="cross-circle"><X className="w-4 h-4" /></div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}

              {/* Book Button */}
              <tr>
                <td className="feature-col"></td>
                {selectedHostels.map((hostel) => (
                  <td key={hostel.id} className="row-data">
                    <button className="book-btn">Book Now</button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <div className="empty-icon"><Search className="w-10 h-10 text-slate-300" /></div>
            <h3 className="text-xl font-bold mb-2">No Hostels Selected</h3>
            <p className="text-slate-500 mb-6">Select hostels to compare features and prices.</p>
            <button onClick={() => setIsDialogOpen(true)} className="btn-primary" style={{margin: '0 auto'}}>
              Select Hostels
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {isDialogOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="text-xl font-bold">Add to Comparison</h3>
              <button onClick={() => setIsDialogOpen(false)} className="bg-slate-100 p-2 rounded-full hover:bg-red-50 hover:text-red-500 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="modal-body">
              <div className="hostel-grid">
                {availableHostels
                  .filter(h => !selectedHostels.find(sh => sh.id === h.id))
                  .map((hostel) => (
                    <div key={hostel.id} className="selection-card" onClick={() => handleAddHostel(hostel)}>
                      <div className="selection-img-container">
                        <img src={hostel.image} alt={hostel.name} className="selection-img" />
                        <div className="selection-price">${hostel.price}</div>
                      </div>
                      <div className="selection-info">
                        <h4 className="selection-title">{hostel.name}</h4>
                        <div className="selection-meta">
                          <MapPin className="w-3 h-3" /> {hostel.location}
                        </div>
                        <div className="add-overlay">
                          <Plus className="w-4 h-4 inline mr-1" /> Add to Compare
                        </div>
                      </div>
                    </div>
                  ))}
                  {availableHostels.filter(h => !selectedHostels.find(sh => sh.id === h.id)).length === 0 && (
                    <p className="text-center w-full col-span-3 text-slate-400">No more hostels available.</p>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}