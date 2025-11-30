import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { BarChart, Download, Calendar, User } from 'lucide-react';
import './BookingAnalytics.css'; 

// Component to handle the analytics logic and UI
export function BookingAnalytics() {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [monthlyData, setMonthlyData] = useState({});
    const [rawBookings, setRawBookings] = useState([]); // NEW: Store raw booking data for CSV
    
    // Helper to map month number to name
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    // 1. Fetch and Process Booking Data
    useEffect(() => {
        const fetchAnalytics = async () => {
            if (!currentUser || !currentUser.uid) return;

            setLoading(true);
            try {
                // Fetch ALL bookings belonging to the current owner, regardless of status
                const qBookings = query(
                    collection(db, 'bookings'),
                    where('ownerId', '==', currentUser.uid)
                );
                const snapshot = await getDocs(qBookings);
                const allBookings = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));

                // Process data for chart visualization (monthly aggregation)
                const dataByMonth = {};

                allBookings.forEach(booking => {
                    const date = new Date(booking.bookingDate);
                    const month = date.getMonth();
                    const year = date.getFullYear();
                    const key = `${year}-${monthNames[month]}`;
                    
                    // UPDATED: Use the same confirmed revenue calculation logic as OwnerDashboard
                    const price = booking.status === 'confirmed' 
                        ? parseFloat(booking.totalPrice || booking.price) || 0 
                        : 0;
                    
                    const guests = parseInt(booking.guests) || 1;
                    
                    if (!dataByMonth[key]) {
                        dataByMonth[key] = { bookings: 0, revenue: 0, guests: 0 };
                    }

                    dataByMonth[key].bookings += 1;
                    dataByMonth[key].revenue += price;
                    dataByMonth[key].guests += guests;
                });
                
                setMonthlyData(dataByMonth);
                setRawBookings(allBookings); // Set raw data for export

            } catch (error) {
                console.error("Error fetching analytics data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [currentUser]);


    // 2. CSV Export Logic (Exports detailed rows)
    const exportCSV = () => {
        if (rawBookings.length === 0) {
            alert("No data available to export.");
            return;
        }

        const headers = [
            "Booking ID", 
            "Hostel Name", 
            "User Email", 
            "Check-in Date", 
            "Check-out Date", 
            "Total Price", 
            "Guests", 
            "Status", 
            "Discount (%)",
            "Booking Date"
        ];
        
        const rows = rawBookings.map(booking => 
            [
                booking.id,
                `"${booking.hostelName}"`, // Encapsulate strings with quotes
                booking.userEmail,
                booking.checkIn,
                booking.checkOut,
                // UPDATED: Use the same price field logic
                (booking.totalPrice || booking.price || 0).toFixed(2),
                booking.guests || 1,
                booking.status || 'pending',
                booking.discountApplied || 0,
                booking.bookingDate
            ].join(',')
        );

        const csvString = [
            headers.join(','),
            ...rows
        ].join('\n');

        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `hostel_bookings_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return <div className="analytics-loading">Loading Analytics...</div>;

    const sortedMonths = Object.keys(monthlyData).sort();
    const maxRevenue = Math.max(...Object.values(monthlyData).map(d => d.revenue), 1); 

    return (
        <div className="analytics-container">
            <div className="analytics-header">
                <h3>Monthly Performance Overview</h3>
                {rawBookings.length > 0 && (
                    <button onClick={exportCSV} className="export-button">
                        <Download size={16} /> Export {rawBookings.length} Bookings (CSV)
                    </button>
                )}
            </div>
            
            {sortedMonths.length === 0 ? (
                <div className="analytics-empty">
                    <BarChart size={48} />
                    <p>No confirmed bookings yet to generate analytics.</p>
                </div>
            ) : (
                <div className="chart-wrapper">
                    <div className="chart-legend">
                        <div className="legend-item revenue-legend">Confirmed Revenue</div>
                        <div className="legend-item booking-legend">Total Bookings</div>
                    </div>
                    
                    <div className="chart-bars">
                        {sortedMonths.map(month => {
                            const data = monthlyData[month];
                            const heightPercent = (data.revenue / maxRevenue) * 100;
                            
                            return (
                                <div key={month} className="bar-group">
                                    <div className="bar" style={{ height: `${Math.max(5, heightPercent)}%` }}>
                                        <span className="bar-value">${data.revenue.toFixed(0)}</span>
                                    </div>
                                    <div className="bar-label">
                                        <Calendar size={14} /> {month}
                                    </div>
                                    <div className="bar-bookings">
                                        <User size={14} /> {data.bookings} Bookings
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}