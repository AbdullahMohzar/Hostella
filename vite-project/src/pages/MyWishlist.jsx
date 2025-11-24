import { useState } from "react";
import { Heart, MapPin, Star, Trash2, ExternalLink } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { toast } from "sonner@2.0.3";

export function MyWishlist() {
  const [wishlist, setWishlist] = useState([
    {
      id: "1",
      name: "Urban Nest Hostel",
      location: "Downtown, New York",
      price: 45,
      rating: 4.8,
      reviews: 234,
      image: "https://images.unsplash.com/photo-1709805619372-40de3f158e83?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3N0ZWwlMjBiZWRyb29tfGVufDF8fHx8MTc2MTU3OTE2NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      addedDate: "2025-11-15"
    },
    {
      id: "7",
      name: "Nomad's Haven",
      location: "Barcelona, Spain",
      price: 32,
      rating: 4.9,
      reviews: 445,
      image: "https://images.unsplash.com/photo-1549881567-c622c1080d78?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3N0ZWwlMjBkb3JtJTIwcm9vbXxlbnwxfHx8fDE3NjI2NzI2NjR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      addedDate: "2025-11-18"
    },
    {
      id: "8",
      name: "Rooftop Retreat",
      location: "Lisbon, Portugal",
      price: 29,
      rating: 4.8,
      reviews: 367,
      image: "https://images.unsplash.com/photo-1747990927764-ae2bc17a008d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3N0ZWwlMjByb29mdG9wJTIwdGVycmFjZXxlbnwxfHx8fDE3NjI2NzI2NjV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      addedDate: "2025-11-20"
    },
    {
      id: "14",
      name: "Tropical Vibes Hostel",
      location: "Bali, Indonesia",
      price: 22,
      rating: 4.8,
      reviews: 634,
      image: "https://images.unsplash.com/photo-1549881567-c622c1080d78?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3N0ZWwlMjBkb3JtJTIwcm9vbXxlbnwxfHx8fDE3NjI2NzI2NjR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      addedDate: "2025-11-22"
    }
  ]);

  const handleRemoveFromWishlist = (hostelId) => {
    setWishlist(wishlist.filter(h => h.id !== hostelId));
    toast.success("Removed from wishlist");
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="mb-2">My Wishlist</h2>
          <p className="text-gray-600">Save your favorite hostels to visit later</p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {wishlist.length} Saved
        </Badge>
      </div>

      {wishlist.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="mb-2 text-gray-600">No Saved Hostels</h3>
          <p className="text-gray-500">
            Start exploring and save your favorite hostels here!
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {wishlist.map((hostel) => (
            <motion.div
              key={hostel.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-md overflow-hidden group hover:shadow-xl transition-shadow"
            >
              <div className="relative h-48">
                <img 
                  src={hostel.image} 
                  alt={hostel.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <button
                  onClick={() => handleRemoveFromWishlist(hostel.id)}
                  className="absolute top-3 right-3 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-5 h-5 text-red-600" />
                </button>
                <div className="absolute bottom-3 left-3">
                  <Badge className="bg-white/90 backdrop-blur-sm text-gray-900">
                    ${hostel.price}/night
                  </Badge>
                </div>
              </div>

              <div className="p-5">
                <h3 className="mb-2">{hostel.name}</h3>
                
                <div className="flex items-center gap-2 text-gray-600 mb-3">
                  <MapPin className="w-4 h-4" />
                  <span>{hostel.location}</span>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span>{hostel.rating}</span>
                  </div>
                  <span className="text-gray-500">({hostel.reviews} reviews)</span>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="text-gray-500">
                    Added {formatDate(hostel.addedDate)}
                  </div>
                  <Button size="sm" className="gap-2">
                    View Details
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
