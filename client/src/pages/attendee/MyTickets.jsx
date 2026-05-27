import { QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useState } from 'react';
import QRModal from '../../components/QRModal';
import LoadingSpinner from '../../components/LoadingSpinner';
import api, { getImageUrl } from '../../services/api';

const MyTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [message, setMessage] = useState('');

  const loadTickets = () => api.get('/tickets/my').then(({ data }) => setTickets(data)).finally(() => setLoading(false));

  useEffect(() => {
    setLoading(true);
    loadTickets();
  }, []);

  const cancelTicket = async (ticket) => {
    if (!ticket.order) return;
    if (ticket.checkedIn) return;

    const reason = ticket.order.total > 0
      ? window.prompt('Please enter a reason for refund request:', '')
      : undefined;

    if (ticket.order.total > 0 && reason === null) return;

    try {
      setProcessing(ticket._id);
      await api.post(`/orders/${ticket.order._id}/refund`, { reason });
      setMessage(ticket.order.total > 0
        ? 'Refund request submitted. The organiser will review it.'
        : 'Registration canceled successfully.');
      loadTickets();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to cancel registration.');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading your tickets" />;
  }

  return (
    <div className="page-shell space-y-5">
      <h1 className="font-display text-5xl">My Tickets</h1>
      {message && <div className="panel border-l-4 border-copper bg-paper p-4 text-copper font-semibold">{message}</div>}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tickets.map((ticket) => (
          <div key={ticket._id} className="panel p-5">
            <span className="badge bg-signal">{ticket.ticketTypeName}</span>
            <h2 className="mt-3 font-display text-2xl">{ticket.event?.title}</h2>
            <p className="font-semibold text-ink/70">{new Date(ticket.event?.startDate).toLocaleString()}</p>
            <p className="mt-2 text-sm font-bold">{ticket.checkedIn ? 'Checked in' : 'Not checked in'}</p>
            {ticket.order?.refundStatus !== 'none' && (
              <p className="mt-2 text-xs font-semibold text-copper">Refund status: {ticket.order.refundStatus}</p>
            )}
            <div className="mt-4 grid place-items-center border-2 border-ink bg-white p-3">
              {getImageUrl(ticket.qrCodeImage) ? (
                <img src={getImageUrl(ticket.qrCodeImage)} alt="Ticket QR code" className="h-28 w-28" />
              ) : (
                <QRCodeSVG value={ticket.qrCodeData || ticket._id} size={112} />
              )}
            </div>
            <div className="mt-4 space-y-2">
              <button className="btn w-full" onClick={() => setSelected(ticket)}>
                <QrCode size={18} /> Show QR
              </button>
              {!ticket.checkedIn && ticket.order?.refundStatus === 'none' && (
                <button
                  className="btn secondary w-full"
                  disabled={processing === ticket._id}
                  onClick={() => cancelTicket(ticket)}
                >
                  {ticket.order?.total > 0 ? 'Request refund' : 'Cancel registration'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      {!tickets.length && <div className="panel p-6 font-bold">No tickets yet.</div>}
      <QRModal ticket={selected} onClose={() => setSelected(null)} />
    </div>
  );
};

export default MyTickets;
