import { useState } from "react";
import { Save, X, Plus, Trash2, MapPin, DollarSign, Wifi, Utensils, Image as ImageIcon } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { toast } from "sonner@2.0.3";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";

export function EditHostel({ hostel, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: hostel?.name || "",
    location: hostel?.location || "",
    pricePerNight: hostel?.price || "",
    beds: hostel?.beds || "",
    description: hostel?.description || "A comfortable hostel with modern amenities and friendly atmosphere.",
    amenities: hostel?.amenities || ["Free WiFi", "Kitchen", "Lockers", "Common Area"],
    wifiSpeed: hostel?.wifiSpeed || "100",
    mealsIncluded: hostel?.mealsIncluded || false,
    mealType: hostel?.mealType || "None",
    genderPolicy: hostel?.genderPolicy || "Mixed",
    images: hostel?.images || []
  });

  const [newAmenity, setNewAmenity] = useState("");

  const handleAddAmenity = () => {
    if (newAmenity.trim() && !formData.amenities.includes(newAmenity.trim())) {
      setFormData({
        ...formData,
        amenities: [...formData.amenities, newAmenity.trim()]
      });
      setNewAmenity("");
    }
  };

  const handleRemoveAmenity = (amenity) => {
    setFormData({
      ...formData,
      amenities: formData.amenities.filter(a => a !== amenity)
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.location || !formData.pricePerNight) {
      toast.error("Please fill in all required fields");
      return;
    }

    onSave?.(formData);
    toast.success("Hostel details updated successfully");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="mb-2">Edit Hostel Details</h2>
          <p className="text-gray-600">Update your hostel information to keep it current</p>
        </div>
        <Button variant="outline" onClick={onCancel}>
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8 space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3>Basic Information</h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="name">Hostel Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Urban Nest Hostel"
                required
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="location">Location *</Label>
              <div className="relative mt-2">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Downtown, New York"
                  required
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="price">Price per Night ($) *</Label>
              <div className="relative mt-2">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="price"
                  type="number"
                  min="0"
                  value={formData.pricePerNight}
                  onChange={(e) => setFormData({ ...formData, pricePerNight: e.target.value })}
                  placeholder="45"
                  required
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="beds">Number of Beds</Label>
              <Input
                id="beds"
                type="number"
                min="1"
                value={formData.beds}
                onChange={(e) => setFormData({ ...formData, beds: e.target.value })}
                placeholder="12"
                className="mt-2"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your hostel..."
              className="mt-2 min-h-24"
            />
          </div>
        </div>

        {/* Amenities & Services */}
        <div className="space-y-4 pt-6 border-t border-gray-200">
          <h3>Amenities & Services</h3>

          <div>
            <Label htmlFor="wifiSpeed">WiFi Speed (Mbps)</Label>
            <div className="relative mt-2">
              <Wifi className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                id="wifiSpeed"
                type="number"
                min="0"
                value={formData.wifiSpeed}
                onChange={(e) => setFormData({ ...formData, wifiSpeed: e.target.value })}
                placeholder="100"
                className="pl-10"
              />
            </div>
            <p className="text-gray-500 mt-1">Help travelers find hostels with fast internet</p>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Utensils className="w-5 h-5 text-gray-600" />
              <div>
                <Label htmlFor="mealsIncluded" className="mb-0">Meals Included</Label>
                <p className="text-gray-500">Offer meals to your guests</p>
              </div>
            </div>
            <Switch
              id="mealsIncluded"
              checked={formData.mealsIncluded}
              onCheckedChange={(checked) => setFormData({ 
                ...formData, 
                mealsIncluded: checked,
                mealType: checked ? "Breakfast" : "None"
              })}
            />
          </div>

          {formData.mealsIncluded && (
            <div>
              <Label htmlFor="mealType">Meal Type</Label>
              <Select 
                value={formData.mealType}
                onValueChange={(value) => setFormData({ ...formData, mealType: value })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Breakfast">Breakfast</SelectItem>
                  <SelectItem value="Breakfast & Dinner">Breakfast & Dinner</SelectItem>
                  <SelectItem value="All Meals">All Meals</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="genderPolicy">Gender Policy</Label>
            <Select 
              value={formData.genderPolicy}
              onValueChange={(value) => setFormData({ ...formData, genderPolicy: value })}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Mixed">Mixed Dorms</SelectItem>
                <SelectItem value="Boys Only">Boys Only</SelectItem>
                <SelectItem value="Girls Only">Girls Only</SelectItem>
                <SelectItem value="Private Rooms Available">Private Rooms Available</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-gray-500 mt-1">Help travelers filter by their preferences</p>
          </div>

          <div>
            <Label>Amenities</Label>
            <div className="flex gap-2 mt-2">
              <Input
                value={newAmenity}
                onChange={(e) => setNewAmenity(e.target.value)}
                placeholder="Add amenity (e.g., Pool, Gym)"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAmenity())}
              />
              <Button type="button" onClick={handleAddAmenity}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {formData.amenities.map((amenity) => (
                <Badge key={amenity} variant="secondary" className="gap-2 pr-2">
                  {amenity}
                  <button
                    type="button"
                    onClick={() => handleRemoveAmenity(amenity)}
                    className="hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Images Section */}
        <div className="space-y-4 pt-6 border-t border-gray-200">
          <h3>Photos</h3>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-2">Upload hostel photos</p>
            <p className="text-gray-500 mb-4">Add high-quality images to attract more guests</p>
            <Button type="button" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add Photos
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
