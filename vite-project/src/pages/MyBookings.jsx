import { useState } from "react";
import { Calendar, Clock, MapPin, DollarSign, X, Plus, AlertCircle } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { toast } from "sonner@2.0.3";
import { Label } from "./ui/label";
import { Input } from "./ui/input";

export function MyBookings() {
  const [bookings, setBookings] = useState([
    {
      id: "BK001",
      hostelName: "Urban Nest Hostel",
      location: "Downtown, New York",
      checkIn: "2025-12-01",
      checkOut: "2025-12-07",
      nights: 6,
      totalPrice: 270,
      status: "confirmed",
      image: "https://images.unsplash.com/photo-1709805619372-40de3f158e83?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3N0ZWwlMjBiZWRyb29tfGVufDF8fHx8MTc2MTU3OTE2NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      pricePerNight: 45
    },
    {
      id: "BK002",
      hostelName: "Sunset Beach Hostel",
      location: "Santa Monica, LA",
      checkIn: "2025-12-15",
      checkOut: "2025-12-20",
      nights: 5,
      totalPrice: 190,
      status: "pending",
      image: "https://images.unsplash.com/photo-1721743169026-d18a016f8996?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzaGFyZWQlMjBhY2NvbW1vZGF0aW9ufGVufDF8fHx8MTc2MTU3OTE2NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      pricePerNight: 38
    },
    {
      id: "BK003",
      hostelName: "The Modern Traveler",
      location: "Mission District, SF",
      checkIn: "2025-11-20",
      checkOut: "2025-11-25",
      nights: 5,
      totalPrice: 260,
      status: "completed",
      image: "https://images.unsplash.com/photo-1733348610896-52e34b27e70d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBob3N0ZWx8ZW58MXx8fHwxNzYxNTc5MTY1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      pricePerNight: 52
    }
  ]);

  const [extendDialog, setExtendDialog] = useState(null);
  const [additionalNights, setAdditionalNights] = useState(1);

  const handleCancelBooking = (bookingId) => {
    setBookings(bookings.filter(b => b.id !== bookingId));
    toast.success("Booking cancelled successfully", {
      description: "Your refund will be processed within 3-5 business days"
    });
  };

  const handleExtendStay = (booking) => {
    const extendedBooking = {
      ...booking,
      nights: booking.nights + additionalNights,
      totalPrice: booking.totalPrice + (booking.pricePerNight * additionalNights)
    };
    
    setBookings(bookings.map(b => b.id === booking.id ? extendedBooking : b));
    setExtendDialog(null);
    setAdditionalNights(1);
    
    toast.success("Stay extended successfully", {
      description: `Added ${additionalNights} more night(s) to your booking`
    });
  };

  const getStatusColor = (status) => {
    switch(status) {
      case "confirmed": return "bg-green-100 text-green-700";
      case "pending": return "bg-yellow-100 text-yellow-700";
      case "completed": return "bg-blue-100 text-blue-700";
      case "cancelled": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
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
          <h2 className="mb-2">My Bookings</h2>
          <p className="text-gray-600">Manage your hostel reservations</p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {bookings.length} Total Bookings
        </Badge>
      </div>

      <div className="space-y-4">
        {bookings.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="mb-2 text-gray-600">No Bookings Yet</h3>
            <p className="text-gray-500">
              You haven't made any bookings yet. Start exploring hostels!
            </p>
          </div>
        ) : (
          bookings.map((booking) => (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-md overflow-hidden"
            >
              <div className="md:flex">
                <div className="md:w-48 h-48 md:h-auto">
                  <img 
                    src={booking.image} 
                    alt={booking.hostelName}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="flex-1 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3>{booking.hostelName}</h3>
                        <Badge className={getStatusColor(booking.status)}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 mb-1">
                        <MapPin className="w-4 h-4" />
                        <span>{booking.location}</span>
                      </div>
                      <div className="text-gray-500">Booking ID: {booking.id}</div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <div>
                        <div className="text-gray-500">Check-in</div>
                        <div>{formatDate(booking.checkIn)}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <div>
                        <div className="text-gray-500">Check-out</div>
                        <div>{formatDate(booking.checkOut)}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <div>
                        <div className="text-gray-500">Duration</div>
                        <div>{booking.nights} night{booking.nights > 1 ? 's' : ''}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      <span className="text-gray-600">Total:</span>
                      <span className="text-green-600">${booking.totalPrice}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {booking.status === "confirmed" && (
                        <>
                          <Dialog open={extendDialog === booking.id} onOpenChange={(open) => !open && setExtendDialog(null)}>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setExtendDialog(booking.id)}
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Extend Stay
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Extend Your Stay</DialogTitle>
                                <DialogDescription>
                                  Add more nights to your booking at {booking.hostelName}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div>
                                  <Label>Additional Nights</Label>
                                  <Input 
                                    type="number" 
                                    min="1"
                                    value={additionalNights}
                                    onChange={(e) => setAdditionalNights(parseInt(e.target.value) || 1)}
                                    className="mt-2"
                                  />
                                </div>
                                <div className="bg-blue-50 p-4 rounded-lg">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-gray-600">Current stay:</span>
                                    <span>{booking.nights} nights</span>
                                  </div>
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-gray-600">Additional nights:</span>
                                    <span>{additionalNights} nights</span>
                                  </div>
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-gray-600">Price per night:</span>
                                    <span>${booking.pricePerNight}</span>
                                  </div>
                                  <div className="border-t border-blue-200 pt-2 mt-2">
                                    <div className="flex items-center justify-between">
                                      <span>New total:</span>
                                      <span>${booking.totalPrice + (booking.pricePerNight * additionalNights)}</span>
                                    </div>
                                  </div>
                                </div>
                                <Button 
                                  onClick={() => handleExtendStay(booking)}
                                  className="w-full"
                                >
                                  Confirm Extension
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <X className="w-4 h-4 mr-2" />
                                Cancel
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Cancel Booking?</DialogTitle>
                                <DialogDescription>
                                  Are you sure you want to cancel this booking?
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg">
                                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                                  <div>
                                    <p className="text-amber-900">Cancellation Policy</p>
                                    <p className="text-amber-700 mt-1">
                                      Cancellations made 7+ days before check-in receive a full refund. 
                                      Cancellations within 7 days are subject to a 50% fee.
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <DialogTrigger asChild>
                                    <Button variant="outline" className="flex-1">
                                      Keep Booking
                                    </Button>
                                  </DialogTrigger>
                                  <Button 
                                    variant="destructive" 
                                    className="flex-1"
                                    onClick={() => handleCancelBooking(booking.id)}
                                  >
                                    Yes, Cancel
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </>
                      )}
                      
                      {booking.status === "pending" && (
                        <Badge variant="outline" className="text-yellow-700">
                          Awaiting Confirmation
                        </Badge>
                      )}
                      
                      {booking.status === "completed" && (
                        <Button variant="outline" size="sm">
                          Leave Review
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
