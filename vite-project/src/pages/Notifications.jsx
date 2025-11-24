import { useState } from "react";
import { Bell, CheckCircle, Tag, Calendar, AlertCircle, X, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

export function Notifications() {
  const [notifications, setNotifications] = useState([
    {
      id: "1",
      type: "booking",
      title: "Booking Confirmed",
      message: "Your booking at Urban Nest Hostel has been confirmed for Dec 1-7, 2025",
      timestamp: "2025-11-20T10:30:00",
      read: false,
      icon: CheckCircle,
      iconColor: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      id: "2",
      type: "discount",
      title: "Flash Sale: 30% Off",
      message: "Limited time offer! Get 30% off on Nomad's Haven in Barcelona. Book before Nov 30!",
      timestamp: "2025-11-21T14:15:00",
      read: false,
      icon: Tag,
      iconColor: "text-purple-600",
      bgColor: "bg-purple-50",
      discount: "30%",
      hostel: "Nomad's Haven"
    },
    {
      id: "3",
      type: "discount",
      title: "Weekend Special",
      message: "Save 20% on weekend stays at Tropical Vibes Hostel in Bali",
      timestamp: "2025-11-22T09:00:00",
      read: false,
      icon: Tag,
      iconColor: "text-orange-600",
      bgColor: "bg-orange-50",
      discount: "20%",
      hostel: "Tropical Vibes Hostel"
    },
    {
      id: "4",
      type: "reminder",
      title: "Upcoming Check-in",
      message: "Reminder: Your check-in at Sunset Beach Hostel is in 3 days (Dec 15, 2025)",
      timestamp: "2025-11-23T08:00:00",
      read: true,
      icon: Calendar,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      id: "5",
      type: "booking",
      title: "Booking Pending",
      message: "Your booking request for Sunset Beach Hostel is awaiting confirmation",
      timestamp: "2025-11-18T16:45:00",
      read: true,
      icon: AlertCircle,
      iconColor: "text-yellow-600",
      bgColor: "bg-yellow-50"
    },
    {
      id: "6",
      type: "discount",
      title: "Early Bird Discount",
      message: "Book 2 months in advance and save 25% at The Modern Traveler",
      timestamp: "2025-11-19T11:30:00",
      read: true,
      icon: Tag,
      iconColor: "text-pink-600",
      bgColor: "bg-pink-50",
      discount: "25%",
      hostel: "The Modern Traveler"
    },
    {
      id: "7",
      type: "discount",
      title: "Black Friday Sale",
      message: "Exclusive 40% off on all hostels in Europe! Offer ends tonight.",
      timestamp: "2025-11-24T07:00:00",
      read: false,
      icon: Tag,
      iconColor: "text-red-600",
      bgColor: "bg-red-50",
      discount: "40%"
    }
  ]);

  const [filter, setFilter] = useState("all");

  const handleMarkAsRead = (notificationId) => {
    setNotifications(notifications.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    ));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const handleDelete = (notificationId) => {
    setNotifications(notifications.filter(n => n.id !== notificationId));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.read;
    return n.type === filter;
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const discountCount = notifications.filter(n => n.type === "discount" && !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2>Notifications</h2>
            {unreadCount > 0 && (
              <Badge className="bg-red-500 text-white">{unreadCount} New</Badge>
            )}
          </div>
          <p className="text-gray-600">Stay updated with your bookings and special offers</p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" onClick={handleMarkAllAsRead}>
              <Check className="w-4 h-4 mr-2" />
              Mark All Read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button variant="outline" onClick={handleClearAll}>
              Clear All
            </Button>
          )}
        </div>
      </div>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">
            All ({notifications.length})
          </TabsTrigger>
          <TabsTrigger value="unread">
            Unread ({unreadCount})
          </TabsTrigger>
          <TabsTrigger value="booking">
            Bookings
          </TabsTrigger>
          <TabsTrigger value="discount">
            Discounts {discountCount > 0 && `(${discountCount})`}
          </TabsTrigger>
          <TabsTrigger value="reminder">
            Reminders
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-6">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="mb-2 text-gray-600">No Notifications</h3>
              <p className="text-gray-500">
                You're all caught up! Check back later for updates.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {filteredNotifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    className={`bg-white rounded-xl shadow-md overflow-hidden ${
                      !notification.read ? 'ring-2 ring-blue-500' : ''
                    }`}
                  >
                    <div className="p-5">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 ${notification.bgColor} rounded-full flex items-center justify-center flex-shrink-0`}>
                          <notification.icon className={`w-6 h-6 ${notification.iconColor}`} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex items-center gap-2">
                              <h4 className="truncate">{notification.title}</h4>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />
                              )}
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {!notification.read && (
                                <button
                                  onClick={() => handleMarkAsRead(notification.id)}
                                  className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                                  title="Mark as read"
                                >
                                  <Check className="w-4 h-4 text-gray-600" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(notification.id)}
                                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                                title="Delete"
                              >
                                <X className="w-4 h-4 text-gray-600" />
                              </button>
                            </div>
                          </div>

                          <p className="text-gray-600 mb-3">
                            {notification.message}
                          </p>

                          {notification.discount && (
                            <div className="flex items-center gap-2 mb-3">
                              <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                                {notification.discount} OFF
                              </Badge>
                              {notification.hostel && (
                                <span className="text-gray-600">{notification.hostel}</span>
                              )}
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">
                              {formatTimestamp(notification.timestamp)}
                            </span>

                            {notification.type === "discount" && (
                              <Button size="sm" variant="outline">
                                View Offer
                              </Button>
                            )}
                            
                            {notification.type === "booking" && notification.title.includes("Confirmed") && (
                              <Button size="sm" variant="outline">
                                View Booking
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
