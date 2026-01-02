// frontend/src/components/RazorpayButton.jsx
import axios from 'axios';

export default function RazorpayButton() {
  const handlePayment = async () => {
    try {
      const { data } = await axios.post('https://sukoon-vzwh.onrender.com/api/payment/create-order', {}, {
        withCredentials: true
      });

      const options = {
        key: "rzp_test_XXXXXXXXXXXX", // or use import.meta.env.VITE_RAZORPAY_KEY
        amount: 99900,
        currency: "INR",
        name: "MoodAI",
        description: "1-to-1 Human Consultation",
        order_id: data.orderId,
        handler: async (response) => {
          const verify = await axios.post('https://sukoon-vzwh.onrender.com/api/payment/verify-payment', response, {
            withCredentials: true
          });
          alert(verify.data.message);
        },
        theme: { color: "#10b981" }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      alert("Payment failed. Try again."+err.message);
    }
  };

  return (
    <button
      onClick={handlePayment}
      className="mt-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:scale-105 transition"
    >
      Book 1-on-1 Consultation (₹999)
    </button>
  );
}