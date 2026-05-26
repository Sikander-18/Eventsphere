import { X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const QRModal = ({ ticket, onClose }) => {
  if (!ticket) return null;

  const qrValue = ticket.qrCodeData || JSON.stringify({
    ticketId: ticket._id,
    eventId: ticket.event,
    userId: ticket.user
  });

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/70 p-4">
      <div className="panel w-full max-w-md bg-paper p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-2xl">Ticket QR</h3>
          <button className="btn secondary px-3" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>
        <div className="mt-5 grid place-items-center border-2 border-ink bg-white p-6">
          {ticket.qrCodeImage ? (
            <img src={ticket.qrCodeImage} alt="Ticket QR code" className="h-64 w-64" />
          ) : (
            <QRCodeSVG value={qrValue} size={240} />
          )}
        </div>
        <p className="mt-4 break-all text-sm font-semibold text-ink/70">{ticket._id}</p>
      </div>
    </div>
  );
};

export default QRModal;

