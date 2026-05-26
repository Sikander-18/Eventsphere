import { ShoppingBag } from 'lucide-react';

const TicketTypeCard = ({ ticketType, onAdd }) => {
  const remaining = Math.max(0, ticketType.capacity - ticketType.sold);
  const isExpired = ticketType.earlyBirdExpiry && new Date(ticketType.earlyBirdExpiry) < new Date();

  return (
    <div className={`border-2 border-ink p-4 bg-white ${isExpired ? 'opacity-65' : ''}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="font-display text-xl">{ticketType.name}</h4>
          <p className="text-sm font-semibold text-ink/65">
            {isExpired ? 'Sales ended' : `${remaining} seats left`}
          </p>
          {ticketType.earlyBirdExpiry && (
            <p className="text-[11px] font-semibold text-signal mt-1">
              Sales end: {new Date(ticketType.earlyBirdExpiry).toLocaleString()}
            </p>
          )}
        </div>
        <span className="badge bg-signal">
          {ticketType.isFree || ticketType.price === 0 ? 'Free' : `₹${ticketType.price}`}
        </span>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-sm font-bold text-ink/70">Admission pass</span>
        <button 
          className="btn" 
          disabled={!remaining || isExpired} 
          onClick={() => onAdd(ticketType)}
        >
          <ShoppingBag size={17} /> {isExpired ? 'Expired' : 'Select'}
        </button>
      </div>
    </div>
  );
};

export default TicketTypeCard;
