import { useState } from "react";
import { X, Plus, Check, Wifi, Utensils, Shield, Star, MapPin, DollarSign } from "lucide-react";
// import { motion } from "framer-motion"; // kept only for potential animations (optional)

export function CompareHostels() {
  const [selectedHostels, setSelectedHostels] = useState([
    {
      id: "1",
      name: "Urban Nest Hostel",
      location: "Downtown, New York",
      price: 45,
      rating: 4.8,
      reviews: 234,
      wifiSpeed: "100 Mbps",
      mealsIncluded: true,
      mealType: "Breakfast",
      gender: "Mixed",
      image: "https://images.unsplash.com/photo-1709805619372-40de3f158e83?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3N0ZWwlMjBiZWRyb29tfGVufDF8fHx8MTc2MTU3OTE2NXww&ixlib=rb-4.1.0&q=80&w=1080",
      amenities: ["Free WiFi", "Kitchen", "Lockers", "Common Area", "Laundry", "24/7 Reception"],
      verified: true
    },
    {
      id: "7",
      name: "Nomad's Haven",
      location: "Barcelona, Spain",
      price: 32,
      rating: 4.9,
      reviews: 445,
      wifiSpeed: "150 Mbps",
      mealsIncluded: true,
      mealType: "Breakfast & Dinner",
      gender: "Mixed",
      image: "https://images.unsplash.com/photo-1549881567-c622c1080d78?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3N0ZWwlMjBkb3JtJTIwcm9vbXxlbnwxfHx8fDE3NjI2NzI2NjR8MA&ixlib=rb-4.1.0&q=80&w=1080",
      amenities: ["Free WiFi", "Kitchen", "Pool", "Bar", "Common Area", "Rooftop Terrace", "Laundry"],
      verified: true
    }
  ]);

  const availableHostels = [
    {
      id: "8",
      name: "Rooftop Retreat",
      location: "Lisbon, Portugal",
      price: 29,
      rating: 4.8,
      reviews: 367,
      wifiSpeed: "80 Mbps",
      mealsIncluded: false,
      mealType: "None",
      gender: "Girls Only",
      image: "https://images.unsplash.com/photo-1747990927764-ae2bc17a008d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3N0ZWwlMjByb29mdG9wJTIwdGVycmFjZXxlbnwxfHx8fDE3NjI2NzI2NjV8MA&ixlib=rb-4.1.0&q=80&w=1080",
      amenities: ["Free WiFi", "Kitchen", "Rooftop Terrace", "Common Area"],
      verified: true
    },
    {
      id: "14",
      name: "Tropical Vibes Hostel",
      location: "Bali, Indonesia",
      price: 22,
      rating: 4.8,
      reviews: 634,
      wifiSpeed: "50 Mbps",
      mealsIncluded: true,
      mealType: "All Meals",
      gender: "Mixed",
      image: "https://images.unsplash.com/photo-1549881567-c622c1080d78?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3N0ZWwlMjBkb3JtJTIwcm9vbXxlbnwxfHx8fDE3NjI2NzI2NjR8MA&ixlib=rb-4.1.0&q=80&w=1080",
      amenities: ["Free WiFi", "Pool", "Yoga Classes", "Beach Access", "Restaurant"],
      verified: true
    },
    {
      id: "3",
      name: "The Modern Traveler",
      location: "Mission District, SF",
      price: 52,
      rating: 4.9,
      reviews: 312,
      wifiSpeed: "200 Mbps",
      mealsIncluded: true,
      mealType: "Breakfast",
      gender: "Boys Only",
      image: "https://images.unsplash.com/photo-1733348610896-52e34b27e70d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBob3N0ZWx8ZW58MXx8fHwxNzYxNTc5MTY1fDA&ixlib=rb-4.1.0&q=80&w=1080",
      amenities: ["Free WiFi", "Kitchen", "Gym", "Co-working Space", "Game Room", "24/7 Reception"],
      verified: true
    }
  ];

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAddHostel = (hostel) => {
    if (selectedHostels.length < 4) {
      setSelectedHostels([...selectedHostels, hostel]);
    }
    setIsDialogOpen(false);
  };

  const handleRemoveHostel = (hostelId) => {
    setSelectedHostels(selectedHostels.filter(h => h.id !== hostelId));
  };

  const allAmenities = [...new Set(selectedHostels.flatMap(h => h.amenities))];

  const getBestValue = (property) => {
    const values = selectedHostels.map(h => {
      if (property === 'price') return h.price;
      if (property === 'rating') return h.rating;
      if (property === 'wifi') return parseInt(h.wifiSpeed);
      return 0;
    });

    if (property === 'price') return Math.min(...values);
    return Math.max(...values);
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
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
            <Plus className="w-4 h-4" />
            Add Hostel to Compare
          </button>
        )}
      </div>

      {/* Dialog / Modal */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-screen overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-semibold">Select Hostel to Compare</h3>
                  <p className="text-gray-600">You can compare up to 4 hostels at once</p>
                </div>
                <button
                  onClick={() => setIsDialogOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
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
                    <img
                      src={hostel.image}
                      alt={hostel.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold">{hostel.name}</h4>
                      <div className="flex items-center gap-2 text-gray-600 text-sm">
                        <MapPin className="w-4 h-4" />
                        <span>{hostel.location}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{hostel.rating}</span>
                        <span className="text-gray-500">({hostel.reviews} reviews)</span>
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

      {selectedHostels.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-300">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-medium text-gray-700 mb-2">No Hostels Selected</h3>
          <p className="text-gray-500 mb-6">
            Add hostels to compare their features and prices
          </p>
          <button
            onClick={() => setIsDialogOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add Your First Hostel
          </button>
        </div>
      ) : (
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
                        <img
                          src={hostel.image}
                          alt={hostel.name}
                          className="w-full h-32 object-cover rounded-lg mb-3 shadow"
                        />
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
                  <td className="p-4">
                    <div className="flex items-center gap-2 font-medium">
                      <DollarSign className="w-5 h-5 text-blue-600" />
                      Price per Night
                    </div>
                  </td>
                  {selectedHostels.map((hostel) => (
                    <td key={hostel.id} className="p-4 text-center">
                      <div className="text-2xl font-bold">
                        <span className={hostel.price === getBestValue('price') ? 'text-green-600' : ''}>
                          ${hostel.price}
                        </span>
                        {hostel.price === getBestValue('price') && (
                          <span className="block text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded mt-1">
                            Best Value
                          </span>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Rating */}
                <tr className="border-b hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-2 font-medium">
                      <Star className="w-5 h-5 text-yellow-600" />
                      Rating
                    </div>
                  </td>
                  {selectedHostels.map((hostel) => (
                    <td key={hostel.id} className="p-4 text-center">
                      <div>
                        <div className={`text-xl font-bold ${hostel.rating === getBestValue('rating') ? 'text-green-600' : ''}`}>
                          {hostel.rating}
                        </div>
                        <div className="text-gray-500 text-sm">({hostel.reviews} reviews)</div>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* WiFi */}
                <tr className="border-b hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-2 font-medium">
                      <Wifi className="w-5 h-5 text-blue-600" />
                      WiFi Speed
                    </div>
                  </td>
                  {selectedHostels.map((hostel) => (
                    <td key={hostel.id} className="p-4 text-center">
                      <div>
                        <div className={`font-semibold ${parseInt(hostel.wifiSpeed) === getBestValue('wifi') ? 'text-green-600' : ''}`}>
                          {hostel.wifiSpeed}
                        </div>
                        {parseInt(hostel.wifiSpeed) === getBestValue('wifi') && (
                          <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded">
                            Fastest
                          </span>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Meals */}
                <tr className="border-b hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-2 font-medium">
                      <Utensils className="w-5 h-5 text-orange-600" />
                      Meals Included
                    </div>
                  </td>
                  {selectedHostels.map((hostel) => (
                    <td key={hostel.id} className="p-4 text-center">
                      {hostel.mealsIncluded ? (
                        <div>
                          <Check className="w-6 h-6 text-green-600 mx-auto mb-1" />
                          <span className="text-xs font-medium bg-gray-100 px-3 py-1 rounded">{hostel.mealType}</span>
                        </div>
                      ) : (
                        <X className="w-6 h-6 text-red-500 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>

                {/* Gender Policy */}
                <tr className="border-b hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-2 font-medium">
                      <Shield className="w-5 h-5 text-purple-600" />
                      Gender Policy
                    </div>
                  </td>
                  {selectedHostels.map((hostel) => (
                    <td key={hostel.id} className="p-4 text-center">
                      <span className="inline-block px-3 py-1 text-sm font-medium border rounded-full">
                        {hostel.gender}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Amenities */}
                {allAmenities.map((amenity) => (
                  <tr key={amenity} className="border-b hover:bg-gray-50">
                    <td className="p-4 pl-12 text-gray-700 text-sm">{amenity}</td>
                    {selectedHostels.map((hostel) => (
                      <td key={hostel.id} className="p-4 text-center">
                        {hostel.amenities.includes(amenity) ? (
                          <Check className="w-6 h-6 text-green-600 mx-auto" />
                        ) : (
                          <X className="w-6 h-6 text-gray-300 mx-auto" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}

                {/* Book Now */}
                <tr>
                  <td className="p-4"></td>
                  {selectedHostels.map((hostel) => (
                    <td key={hostel.id} className="p-6">
                      <button className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition shadow-md">
                        Book Now
                      </button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}