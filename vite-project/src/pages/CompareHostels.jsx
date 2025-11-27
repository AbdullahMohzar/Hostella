import { useState, useEffect } from "react";
import { X, Plus, Check, Wifi, Utensils, Shield, Star, MapPin, DollarSign } from "lucide-react";
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
    if (selectedHostels.length < 4) {
      setSelectedHostels([...selectedHostels, hostel]);
    }
    setIsDialogOpen(false);
  };

  const handleRemoveHostel = (hostelId) => {
    setSelectedHostels(selectedHostels.filter((h) => h.id !== hostelId));
  };

  const allAmenities = [...new Set(selectedHostels.flatMap(h => h.amenities || []))];

  const getBestValue = (property) => {
    const values = selectedHostels.map(h => {
      if (property === 'price') return h.price;
      if (property === 'rating') return h.rating;
      if (property === 'wifi') return parseInt(h.wifiSpeed) || 0;
      return 0;
    });
    if (property === 'price') return Math.min(...values);
    return Math.max(...values);
  };

  if (loading) return <p>Loading hostels...</p>;

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header and Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Compare Hostels</h2>
          <p className="text-gray-600">Compare features and prices side by side</p>
        </div>
        {selectedHostels.length < 4 && (
          <button
            onClick={() => setIsDialogOpen(true)}
            className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" /> Add Hostel
          </button>
        )}
      </div>

      {/* Modal for Selecting Hostels */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-screen overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center">
              <div>
                <h3 className="text-xl font-semibold">Select Hostel to Compare</h3>
                <p className="text-gray-600">Compare up to 4 hostels</p>
              </div>
              <button onClick={() => setIsDialogOpen(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto p-6 space-y-4">
              {availableHostels
                .filter(h => !selectedHostels.find(sh => sh.id === h.id))
                .map((hostel) => (
                  <div
                    key={hostel.id}
                    onClick={() => handleAddHostel(hostel)}
                    className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition"
                  >
                    <img src={hostel.image} alt={hostel.name} className="w-20 h-20 object-cover rounded-lg" />
                    <div className="flex-1">
                      <h4 className="font-semibold">{hostel.name}</h4>
                      <div className="flex items-center gap-2 text-gray-600 text-sm">
                        <MapPin className="w-4 h-4" />
                        <span>{hostel.location}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{hostel.rating}</span>
                        <span className="text-gray-500">({hostel.reviews || 0} reviews)</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">From</div>
                      <div className="text-xl font-bold text-blue-600">${hostel.price}/night</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Comparison Table */}
      {selectedHostels.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="p-4 text-left w-48 font-medium">Features</th>
                  {selectedHostels.map((hostel) => (
                    <th key={hostel.id} className="p-4 min-w-64 text-center">
                      <div className="relative">
                        <button
                          onClick={() => handleRemoveHostel(hostel.id)}
                          className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition z-10"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <img src={hostel.image} alt={hostel.name} className="w-full h-32 object-cover rounded-lg mb-3 shadow" />
                        <h4 className="font-bold text-lg">{hostel.name}</h4>
                        <div className="flex items-center justify-center gap-1 text-gray-600 text-sm">
                          <MapPin className="w-4 h-4" />
                          <span>{hostel.location}</span>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Price */}
                <tr className="border-b hover:bg-gray-50">
                  <td className="p-4 flex items-center gap-2 font-medium">
                    <DollarSign className="w-5 h-5 text-blue-600" /> Price per Night
                  </td>
                  {selectedHostels.map((hostel) => (
                    <td key={hostel.id} className="p-4 text-center">
                      <div className={`text-2xl font-bold ${hostel.price === getBestValue('price') ? 'text-green-600' : ''}`}>
                        ${hostel.price}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Add more rows like Rating, WiFi, Meals, Amenities... */}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
