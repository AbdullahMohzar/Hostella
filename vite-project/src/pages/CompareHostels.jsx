import { useState, useEffect } from "react";
import { 
  X, Plus, Check, Wifi, Utensils, Shield, Star, 
  MapPin, DollarSign, Bed, Clock, Users 
} from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

export function CompareHostels() {
  const [selectedHostels, setSelectedHostels] = useState([]);
  const [availableHostels, setAvailableHostels] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load hostels from Firestore
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
    if (selectedHostels.length < 3) { // Limit usually 3 or 4 for UI fitting
      setSelectedHostels([...selectedHostels, hostel]);
    }
    setIsDialogOpen(false);
  };

  const handleRemoveHostel = (hostelId) => {
    setSelectedHostels(selectedHostels.filter((h) => h.id !== hostelId));
  };

  // Helper to determine best stats for highlighting
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

  // List of boolean amenities to check against the array
  const comparisonRows = [
    { label: "Free WiFi", key: "Wifi" }, // Checks for "Wifi" in amenities
    { label: "Kitchen", key: "Kitchen" },
    { label: "Lockers", key: "Lockers" },
    { label: "Common Area", key: "Common Area" },
    { label: "Laundry", key: "Laundry" },
    { label: "24/7 Reception", key: "24/7 Reception" },
    { label: "Pool", key: "Pool" },
    { label: "Bar", key: "Bar" },
    { label: "Rooftop Terrace", key: "Rooftop Terrace" }
  ];

  if (loading) return <div className="p-10 text-center">Loading hostels...</div>;

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Compare Hostels</h2>
          <p className="text-gray-600">Compare features and prices side by side</p>
        </div>
        {selectedHostels.length < 3 && (
          <button
            onClick={() => setIsDialogOpen(true)}
            className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Hostel
          </button>
        )}
      </div>

      {/* Comparison Table */}
      {selectedHostels.length > 0 ? (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="p-6 text-left w-64 font-bold text-gray-700">Features</th>
                  {selectedHostels.map((hostel) => (
                    <th key={hostel.id} className="p-4 min-w-[280px] text-center relative">
                      <button
                        onClick={() => handleRemoveHostel(hostel.id)}
                        className="absolute top-2 right-2 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      
                      <div className="flex flex-col items-center">
                        <img 
                          src={hostel.image} 
                          alt={hostel.name} 
                          className="w-full h-40 object-cover rounded-lg mb-3 shadow-sm" 
                        />
                        <h4 className="font-bold text-lg text-gray-900">{hostel.name}</h4>
                        <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                          <MapPin className="w-3 h-3" />
                          <span>{hostel.location}</span>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                
                {/* Price Row */}
                <tr className="hover:bg-blue-50/30 transition">
                  <td className="p-4 flex items-center gap-3 font-medium text-gray-700">
                    <DollarSign className="w-5 h-5 text-blue-500" /> Price per Night
                  </td>
                  {selectedHostels.map((hostel) => {
                    const isBestPrice = hostel.price === getBestStat('price');
                    return (
                      <td key={hostel.id} className="p-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-2xl font-bold text-gray-900">${hostel.price}</span>
                          {isBestPrice && selectedHostels.length > 1 && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                              Best Value
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>

                {/* Rating Row */}
                <tr className="hover:bg-blue-50/30 transition">
                  <td className="p-4 flex items-center gap-3 font-medium text-gray-700">
                    <Star className="w-5 h-5 text-yellow-500" /> Rating
                  </td>
                  {selectedHostels.map((hostel) => {
                     const isHighestRated = hostel.rating === getBestStat('rating');
                     return (
                      <td key={hostel.id} className="p-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center justify-center gap-1">
                            <span className="font-bold text-lg">{hostel.rating}</span>
                            <span className="text-gray-400 text-sm">({hostel.reviews || 0} reviews)</span>
                          </div>
                          {isHighestRated && selectedHostels.length > 1 && (
                            <span className="text-green-600 text-xs font-medium">Top Rated</span>
                          )}
                        </div>
                      </td>
                     )
                  })}
                </tr>

                {/* Wifi Speed Row */}
                <tr className="hover:bg-blue-50/30 transition">
                  <td className="p-4 flex items-center gap-3 font-medium text-gray-700">
                    <Wifi className="w-5 h-5 text-blue-500" /> WiFi Speed
                  </td>
                  {selectedHostels.map((hostel) => {
                    const speed = parseInt(hostel.wifiSpeed) || 0;
                    const isFastest = speed === getBestStat('speed');
                    return (
                      <td key={hostel.id} className="p-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-medium text-gray-900">{speed} Mbps</span>
                          {isFastest && selectedHostels.length > 1 && (
                             <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                               Fastest
                             </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>

                {/* Meals Row (Derived from amenities) */}
                <tr className="hover:bg-blue-50/30 transition">
                  <td className="p-4 flex items-center gap-3 font-medium text-gray-700">
                    <Utensils className="w-5 h-5 text-orange-500" /> Meals Included
                  </td>
                  {selectedHostels.map((hostel) => {
                    const amenities = (hostel.amenities || []).map(a => a.toLowerCase());
                    const hasBreakfast = amenities.includes('breakfast');
                    const hasDinner = amenities.includes('dinner');
                    
                    return (
                      <td key={hostel.id} className="p-4 text-center">
                        {hasBreakfast || hasDinner ? (
                          <div className="flex flex-col items-center gap-1">
                            <Check className="w-6 h-6 text-green-500" />
                            <div className="flex gap-1">
                              {hasBreakfast && <span className="text-xs bg-gray-100 px-2 py-1 rounded">Breakfast</span>}
                              {hasDinner && <span className="text-xs bg-gray-100 px-2 py-1 rounded">Dinner</span>}
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-center"><X className="w-6 h-6 text-gray-300" /></div>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* Gender Policy (Optional: Checks for specific tags or defaults to Mixed) */}
                <tr className="hover:bg-blue-50/30 transition">
                  <td className="p-4 flex items-center gap-3 font-medium text-gray-700">
                    <Shield className="w-5 h-5 text-purple-500" /> Gender Policy
                  </td>
                  {selectedHostels.map((hostel) => {
                     // Check amenities for gender specific tags, otherwise assume Mixed
                     const amns = (hostel.amenities || []).join(' ').toLowerCase();
                     let policy = "Mixed";
                     if (amns.includes('female only')) policy = "Female Only";
                     else if (amns.includes('male only')) policy = "Male Only";

                     return (
                      <td key={hostel.id} className="p-4 text-center">
                         <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">
                           {policy}
                         </span>
                      </td>
                     );
                  })}
                </tr>

                {/* Dynamic Amenities Rows */}
                {comparisonRows.map((row) => (
                  <tr key={row.key} className="hover:bg-blue-50/30 transition">
                    <td className="p-4 flex items-center gap-3 text-gray-600">
                       {row.label}
                    </td>
                    {selectedHostels.map((hostel) => {
                      // Case insensitive check
                      const hasAmenity = (hostel.amenities || []).some(
                        a => a.toLowerCase() === row.key.toLowerCase()
                      );
                      return (
                        <td key={hostel.id} className="p-4 text-center">
                          <div className="flex justify-center">
                            {hasAmenity ? (
                              <Check className="w-6 h-6 text-green-500" />
                            ) : (
                              <X className="w-6 h-6 text-gray-300" />
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {/* Book Now Button Row */}
                <tr className="bg-gray-50">
                   <td className="p-4"></td>
                   {selectedHostels.map(hostel => (
                     <td key={hostel.id} className="p-4 text-center">
                        <button className="w-full bg-slate-900 text-white py-3 rounded-lg font-semibold hover:bg-slate-800 transition">
                          Book Now
                        </button>
                     </td>
                   ))}
                </tr>

              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // Empty State
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
          <Bed className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900">No Hostels Selected</h3>
          <p className="text-gray-500 mb-6">Select hostels to compare their features</p>
          <button
            onClick={() => setIsDialogOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" /> Select Hostels
          </button>
        </div>
      )}

      {/* Modal for Selecting Hostels */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Select Hostel to Compare</h3>
                <p className="text-gray-500 text-sm">Choose from available hostels list</p>
              </div>
              <button 
                onClick={() => setIsDialogOpen(false)} 
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="overflow-y-auto p-4 space-y-3">
              {availableHostels
                .filter(h => !selectedHostels.find(sh => sh.id === h.id))
                .map((hostel) => (
                  <div
                    key={hostel.id}
                    onClick={() => handleAddHostel(hostel)}
                    className="flex items-center gap-4 p-3 border rounded-xl hover:border-blue-500 hover:bg-blue-50/50 cursor-pointer transition group"
                  >
                    <img src={hostel.image} alt={hostel.name} className="w-20 h-20 object-cover rounded-lg bg-gray-100" />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-gray-900 group-hover:text-blue-700 transition">{hostel.name}</h4>
                        <span className="font-bold text-blue-600">${hostel.price}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
                        <MapPin className="w-3 h-3" /> {hostel.location}
                      </div>
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" /> {hostel.rating}
                        </span>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 flex items-center gap-1">
                          <Wifi className="w-3 h-3" /> {hostel.wifiSpeed} Mbps
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                
                {availableHostels.filter(h => !selectedHostels.find(sh => sh.id === h.id)).length === 0 && (
                  <p className="text-center text-gray-500 py-8">No more hostels available to add.</p>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}