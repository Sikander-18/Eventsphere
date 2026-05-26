import { QrCode } from 'lucide-react';
import { useEffect, useState } from 'react';
import QRModal from '../../components/QRModal';
import api from '../../services/api';

const MyTickets = () => {
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api.get('/orders/my').then(({ data }) => setOrders(data));
  }, []);

  const tickets = orders.flatMap((order) => (order.tickets || []).map((ticket) => ({ ...ticket, eventInfo: order.event })));

  return (
    <div className="page-shell space-y-5">
      <h1 className="font-display text-5xl">My Tickets</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tickets.map((ticket) => (
          <div key={ticket._id} className="panel p-5">
            <span className="badge bg-signal">{ticket.ticketTypeName}</span>
            <h2 className="mt-3 font-display text-2xl">{ticket.eventInfo?.title}</h2>
            <p className="font-semibold text-ink/70">{new Date(ticket.eventInfo?.startDate).toLocaleString()}</p>
            <p className="mt-2 text-sm font-bold">{ticket.checkedIn ? 'Checked in' : 'Not checked in'}</p>
            <button className="btn mt-4 w-full" onClick={() => setSelected(ticket)}>
              <QrCode size={18} /> Show QR
            </button>
          </div>
        ))}
      </div>
      {!tickets.length && <div className="panel p-6 font-bold">No tickets yet.</div>}
      <QRModal ticket={selected} onClose={() => setSelected(null)} />
    </div>
  );
};

export default MyTickets;

