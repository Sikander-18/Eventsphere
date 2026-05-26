import { Minus, Plus, ShoppingBag } from 'lucide-react';
import { useState } from 'react';

const TicketTypeCard = ({ ticketType, onAdd }) => {
  const [quantity, setQuantity] = useState(1);
  const remaining = Math.max(0, ticketType.capacity - ticketType.sold);

  return (
    <div className="border-2 border-ink bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="font-display text-xl">{ticketType.name}</h4>
          <p className="text-sm font-semibold text-ink/65">{remaining} seats left</p>
        </div>
        <span className="badge bg-signal">{ticketType.isFree || ticketType.price === 0 ? 'Free' : `₹${ticketType.price}`}</span>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex items-center border border-ink">
          <button className="grid h-10 w-10 place-items-center bg-paper" onClick={() => setQuantity(Math.max(1, quantity - 1))} title="Decrease">
            <Minus size={16} />
          </button>
          <span className="grid h-10 w-12 place-items-center border-x border-ink bg-white font-bold">{quantity}</span>
          <button className="grid h-10 w-10 place-items-center bg-paper" onClick={() => setQuantity(Math.min(remaining || 1, quantity + 1))} title="Increase">
            <Plus size={16} />
          </button>
        </div>
        <button className="btn" disabled={!remaining} onClick={() => onAdd(ticketType, quantity)}>
          <ShoppingBag size={17} /> Add
        </button>
      </div>
    </div>
  );
};

export default TicketTypeCard;

