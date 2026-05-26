import { Check, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '../../services/api';

const Refunds = () => {
  const [orders, setOrders] = useState([]);

  const load = () => api.get('/organiser/refunds').then(({ data }) => setOrders(data));

  useEffect(() => {
    load();
  }, []);

  const action = async (id, nextAction) => {
    await api.put(`/orders/${id}/refund`, { action: nextAction });
    load();
  };

  return (
    <div className="page-shell space-y-5">
      <h1 className="font-display text-5xl">Refund Requests</h1>
      {orders.map((order) => (
        <div key={order._id} className="panel grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <span className="badge bg-signal">₹{order.total}</span>
            <h2 className="mt-2 font-display text-2xl">{order.event?.title}</h2>
            <p className="font-semibold">{order.user?.name} · {order.user?.email}</p>
            <p className="text-ink/70">{order.refundReason || 'No reason supplied'}</p>
          </div>
          <div className="flex gap-2">
            <button className="btn" onClick={() => action(order._id, 'approve')}><Check size={17} /> Approve</button>
            <button className="btn secondary" onClick={() => action(order._id, 'reject')}><X size={17} /> Reject</button>
          </div>
        </div>
      ))}
      {!orders.length && <div className="panel p-6 font-bold">No pending refunds.</div>}
    </div>
  );
};

export default Refunds;

