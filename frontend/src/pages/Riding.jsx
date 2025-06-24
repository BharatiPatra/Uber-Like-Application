import React from "react";
import { Link, useLocation } from "react-router-dom"; // Added useLocation
import { useEffect, useContext } from "react";
import { SocketContext } from "../context/SocketContext";
import { useNavigate } from "react-router-dom";
import LiveTracking from "../components/LiveTracking";
import { loadRazorpay } from "../utils/loadRazorpay";
import axios from "axios";

const Riding = () => {
  const location = useLocation();
  const { ride } = location.state || {}; // Retrieve ride data
  const { socket } = useContext(SocketContext);
  const navigate = useNavigate();
  useEffect(() => {
    loadRazorpay("https://checkout.razorpay.com/v1/checkout.js");
  }, []);
  socket.on("ride-ended", () => {
    navigate("/home");
  });

  console.log(ride);

  const handlePayment = async () => {
    try {
      // 1. Call backend to create order
      const { data: order } = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/payments/create-order`,
        {
          amount: ride.fare,
        }
      );

      // 2. Configure Razorpay checkout options



      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID, // Replace with actual Razorpay key
        amount: order.amount,
        currency: order.currency,
        name: "Uber Clone",
        description: "Ride Payment",
        order_id: order.id,
        handler: async function (response) {
          alert(
            "Payment successful! Payment ID: " + response.razorpay_payment_id
          );

          // Optional: Call backend to verify payment
          await axios.post(`${import.meta.env.VITE_BASE_URL}/payments/verify`, {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
        },
        prefill: {
          name: "Test User",
          email: "test@example.com",
          contact: "9999999999",
        },
        theme: {
          color: "#3399cc",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Payment failed:", error);
      alert("Payment failed. Please try again.");
    }
    navigate("/home");
  };

  return (
    <div className="h-screen">
      <Link
        to="/home"
        className="fixed right-2 top-2 h-10 w-10 bg-white flex items-center justify-center rounded-full"
      >
        <i className="text-lg font-medium ri-home-5-line"></i>
      </Link>
      <div className="h-1/2">
        <LiveTracking />
      </div>
      <div className="h-1/2 p-4">
        <div className="flex items-center justify-between">
          <img
            className="h-12"
            src="https://swyft.pl/wp-content/uploads/2023/05/how-many-people-can-a-uberx-take.jpg"
            alt=""
          />
          <div className="text-right">
            <h2 className="text-lg font-medium capitalize">
              {ride?.captain.fullname.firstname}
            </h2>
            <h4 className="text-xl font-semibold -mt-1 -mb-1">
              {ride?.captain.vehicle.plate}
            </h4>
            <p className="text-sm text-gray-600">
              {ride?.captain.vehicle.vehicleType}
            </p>
          </div>
        </div>

        <div className="flex gap-2 justify-between flex-col items-center">
          <div className="w-full mt-5">
            <div className="flex items-center gap-5 p-3 border-b-2">
              <i className="text-lg ri-map-pin-2-fill"></i>
              <div>
                <h3 className="text-lg font-medium">562/11-A</h3>
                <p className="text-sm -mt-1 text-gray-600">
                  {ride?.destination}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-5 p-3">
              <i className="ri-currency-line"></i>
              <div>
                <h3 className="text-lg font-medium">₹{ride?.fare} </h3>
                <p className="text-sm -mt-1 text-gray-600">Cash</p>
              </div>
            </div>
          </div>
        </div>
        <button
          className="w-full mt-5 bg-green-600 text-white font-semibold p-2 rounded-lg"
          onClick={handlePayment}
        >
          Make a Payment
        </button>
      </div>
    </div>
  );
};

export default Riding;
