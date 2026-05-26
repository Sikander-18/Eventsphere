import { RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '../../services/api';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [reason, setReason] = useState('');

  const fetchOrders = () => api.get('/orders/my').then(({ data }) => setOrders(data));

  useEffect(() => {
    fetchOrders();
  }, []);

  const refund = async (id) => {
    await api.post(`/orders/${id}/refund`, { reason });
    setReason('');
    fetchOrders();
  };

  return (
    <div className="page-shell space-y-5">
      <h1 className="font-display text-5xl">Order History</h1>
      <input className="field max-w-xl" placeholder="Refund reason" value={reason} onChange={(event) => setReason(event.target.value)} />
      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order._id} className="panel grid gap-3 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <h2 className="font-display text-2xl">{order.event?.title}</h2>
              <p className="font-semibold text-ink/70">₹{order.total} · {order.paymentStatus} · refund: {order.refundStatus}</p>
              <p className="text-sm">{order.items.map((item) => `${item.quantity} ${item.name}`).join(', ')}</p>
            </div>
            <button className="btn secondary" disabled={order.refundStatus !== 'none'} onClick={() => refund(order._id)}>
              <RotateCcw size={17} /> Request refund
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderHistory;

