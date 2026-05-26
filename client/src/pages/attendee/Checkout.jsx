import { CreditCard, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import api from '../../services/api';

const loadRazorpay = () => new Promise((resolve) => {
  if (window.Razorpay) return resolve(true);
  const script = document.createElement('script');
  script.src = 'https://checkout.razorpay.com/v1/checkout.js';
  script.onload = () => resolve(true);
  script.onerror = () => resolve(false);
  document.body.appendChild(script);
});

const Checkout = () => {
  const { items, subtotal, updateQuantity, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [discountCode, setDiscountCode] = useState('');
  const [message, setMessage] = useState('');
  const [processing, setProcessing] = useState(false);
  const [successTickets, setSuccessTickets] = useState(null);

  const pay = async () => {
    if (!items.length) return;
    setProcessing(true);
    setMessage('');
    try {
      const payload = {
        eventId: items[0].eventId,
        items: items.map((item) => ({ ticketTypeId: item.ticketTypeId, quantity: item.quantity })),
        discountCode: discountCode || undefined
      };
      const { data } = await api.post('/orders', payload);

      if (data.freeCheckout) {
        clearCart();
        setSuccessTickets(data.tickets);
        return;
      }

      if (data.mockPayment) {
        const verifyRes = await api.post('/orders/verify', {
          razorpayOrderId: data.razorpayOrderId,
          razorpayPaymentId: `mock_payment_${Date.now()}`,
          razorpaySignature: 'mock'
        });
        clearCart();
        setSuccessTickets(verifyRes.data.tickets);
        return;
      }

      const ready = await loadRazorpay();
      if (!ready || !window.Razorpay) throw new Error('Razorpay checkout could not load');

      const checkout = new window.Razorpay({
        key: data.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency,
        order_id: data.razorpayOrderId,
        name: 'EventSphere',
        description: items[0].eventTitle,
        handler: async (response) => {
          const verifyRes = await api.post('/orders/verify', response);
          clearCart();
          setSuccessTickets(verifyRes.data.tickets);
        }
      });
      checkout.open();
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || 'Checkout failed');
    } finally {
      setProcessing(false);
    }
  };

  if (successTickets) {
    return (
      <div className="page-shell max-w-2xl mx-auto space-y-6 text-center py-8">
        <div className="panel p-8 space-y-6">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-signal border-2 border-ink shadow-hard">
            <span className="text-3xl font-bold">✓</span>
          </div>
          <h1 className="font-display text-5xl">Booking Confirmed!</h1>
          <p className="font-semibold text-ink/70">
            Thank you! Your tickets have been successfully generated and confirmed.
          </p>
          
          <div className="space-y-4 text-left border-t-2 border-ink pt-6">
            <h3 className="font-display text-2xl">Your QR Tickets</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {successTickets.map((ticket, index) => (
                <div key={ticket._id || index} className="border-2 border-ink p-4 bg-white flex flex-col items-center">
                  <span className="badge bg-signal text-xs">{ticket.ticketTypeName}</span>
                  <div className="mt-3 border-2 border-ink p-3 bg-white">
                    {ticket.qrCodeImage ? (
                      <img src={ticket.qrCodeImage} alt="Ticket QR" className="h-44 w-44" />
                    ) : (
                      <div className="h-44 w-44 grid place-items-center font-bold">QR Loading...</div>
                    )}
                  </div>
                  <p className="mt-2 text-xs font-mono font-bold text-ink/50 truncate w-full text-center">
                    ID: {ticket._id}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <button className="btn w-full mt-6" onClick={() => navigate('/my-tickets')}>
            Go to My Tickets
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell grid gap-6 lg:grid-cols-[1fr_360px]">
      <section className="panel p-5">
        <h1 className="font-display text-4xl">Checkout</h1>
        <div className="mt-5 space-y-3">
          {items.map((item) => (
            <div key={item.ticketTypeId} className="grid gap-3 border-2 border-ink bg-white p-4 sm:grid-cols-[1fr_120px_120px_auto] sm:items-center">
              <div>
                <strong>{item.name}</strong>
                <p className="text-sm font-semibold text-ink/65">{item.eventTitle}</p>
              </div>
              <span className="font-bold">₹{item.price}</span>
              <input className="field" type="number" min="1" value={item.quantity} onChange={(event) => updateQuantity(item.ticketTypeId, Number(event.target.value))} />
              <button className="btn secondary px-3" onClick={() => removeFromCart(item.ticketTypeId)} title="Remove">
                <Trash2 size={17} />
              </button>
            </div>
          ))}
          {!items.length && <p className="border-2 border-ink bg-white p-4 font-semibold">Your cart is empty.</p>}
        </div>
      </section>

      <aside className="panel h-fit p-5">
        <h2 className="font-display text-3xl">Order</h2>
        <div className="mt-4 space-y-3">
          <input className="field" placeholder="Discount code" value={discountCode} onChange={(event) => setDiscountCode(event.target.value)} />
          <div className="flex justify-between border-y-2 border-ink py-3 text-xl font-bold">
            <span>Subtotal</span>
            <span>₹{subtotal}</span>
          </div>
          
          {!user ? (
            <div className="space-y-2">
              <p className="font-bold text-copper text-xs">You must be logged in as an Attendee to purchase tickets.</p>
              <button className="btn w-full font-bold" onClick={() => navigate('/login', { state: { from: { pathname: '/checkout' } } })}>
                Login / Register to Pay
              </button>
            </div>
          ) : user.role !== 'attendee' ? (
            <div className="space-y-2">
              <p className="font-bold text-copper text-xs">
                Organisers and Admins cannot purchase tickets. Please log in as an Attendee.
              </p>
              <button className="btn w-full font-bold text-sm" onClick={() => navigate('/login', { state: { from: { pathname: '/checkout' } } })}>
                Log in with another Account
              </button>
            </div>
          ) : (
            <button className="btn w-full font-bold" disabled={!items.length || processing} onClick={pay}>
              <CreditCard size={18} /> {processing ? 'Processing...' : subtotal === 0 ? 'Confirm Free Tickets' : 'Pay Now'}
            </button>
          )}
          {message && <p className="font-bold text-copper">{message}</p>}
        </div>
      </aside>
    </div>
  );
};

export default Checkout;

