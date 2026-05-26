import { Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';

const ManageTickets = () => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [form, setForm] = useState({ 
    name: 'General', 
    price: 0, 
    capacity: 50, 
    code: '', 
    percentOff: 10, 
    usageLimit: 20,
    earlyBirdExpiry: '',
    discountExpiry: ''
  });

  const load = () => api.get(`/events/${id}`).then(({ data }) => setEvent(data));

  useEffect(() => {
    load();
  }, [id]);

  const create = async (submitEvent) => {
    submitEvent.preventDefault();
    const discountCodes = form.code ? [{
      code: form.code,
      percentOff: Number(form.percentOff),
      usageLimit: Number(form.usageLimit),
      expiry: form.discountExpiry || undefined
    }] : [];
    await api.post(`/events/${id}/tickets`, {
      name: form.name,
      price: Number(form.price),
      capacity: Number(form.capacity),
      isFree: Number(form.price) === 0,
      earlyBirdExpiry: form.earlyBirdExpiry || undefined,
      discountCodes
    });
    setForm({ 
      name: '', 
      price: 0, 
      capacity: 50, 
      code: '', 
      percentOff: 10, 
      usageLimit: 20, 
      earlyBirdExpiry: '', 
      discountExpiry: '' 
    });
    load();
  };

  const remove = async (ticketId) => {
    await api.delete(`/tickets/${ticketId}`);
    load();
  };

  return (
    <div className="page-shell grid gap-6 lg:grid-cols-[360px_1fr]">
      <form onSubmit={create} className="panel h-fit space-y-4 p-5">
        <h1 className="font-display text-4xl">Ticket Tiers</h1>
        
        <div className="space-y-1">
          <label className="text-sm font-bold text-ink/75 block">Tier Name</label>
          <input className="field" placeholder="e.g. General Admission, VIP Pass" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-bold text-ink/75 block">Price (INR)</label>
          <input className="field" type="number" placeholder="Set to 0 for Free" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} required min="0" />
          <p className="text-[11px] font-semibold text-ink/50 mt-0.5">Enter 0 to mark this tier as a free admission.</p>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-bold text-ink/75 block">Total Capacity</label>
          <input className="field" type="number" placeholder="e.g. 50" value={form.capacity} onChange={(event) => setForm({ ...form, capacity: event.target.value })} required min="1" />
          <p className="text-[11px] font-semibold text-ink/50 mt-0.5">Maximum tickets available for purchase in this tier.</p>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-bold text-ink/75 block">Early Bird / Sales Expiry (Optional)</label>
          <input className="field" type="datetime-local" value={form.earlyBirdExpiry} onChange={(event) => setForm({ ...form, earlyBirdExpiry: event.target.value })} />
          <p className="text-[11px] font-semibold text-ink/50 mt-0.5">Ticket tier will expire and become unavailable after this date.</p>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-bold text-ink/75 block">Discount Code (Optional)</label>
          <input className="field" placeholder="e.g. EARLYBIRD20" value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} />
        </div>

        {form.code && (
          <div className="space-y-3 p-3 bg-ink/[0.02] border border-dashed border-ink/20 rounded">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-ink/70 block">Discount Rate (%)</label>
                <input className="field" type="number" placeholder="% off" value={form.percentOff} onChange={(event) => setForm({ ...form, percentOff: event.target.value })} min="1" max="100" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-ink/70 block">Usage Limit</label>
                <input className="field" type="number" placeholder="Max users" value={form.usageLimit} onChange={(event) => setForm({ ...form, usageLimit: event.target.value })} min="1" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-ink/70 block">Expiry Date (Optional)</label>
              <input className="field" type="datetime-local" value={form.discountExpiry} onChange={(event) => setForm({ ...form, discountExpiry: event.target.value })} />
            </div>
          </div>
        )}

        <button className="btn w-full font-bold">Add Ticket Type</button>
      </form>

      <section className="space-y-4">
        <h2 className="font-display text-4xl">{event?.title}</h2>
        {(event?.ticketTypes || []).map((ticket) => (
          <div key={ticket._id} className="panel flex flex-wrap items-center justify-between gap-3 p-5">
            <div>
              <span className="badge bg-signal">{ticket.isFree ? 'Free' : `₹${ticket.price}`}</span>
              <h3 className="mt-2 font-display text-2xl">{ticket.name}</h3>
              <p className="font-semibold text-ink/70">{ticket.sold}/{ticket.capacity} sold</p>
              {ticket.earlyBirdExpiry && (
                <p className="text-xs text-signal font-semibold mt-1">
                  Sales end: {new Date(ticket.earlyBirdExpiry).toLocaleString()}
                </p>
              )}
            </div>
            <button className="btn secondary px-3" onClick={() => remove(ticket._id)} title="Delete">
              <Trash2 size={18} />
            </button>
          </div>
        ))}
        {!(event?.ticketTypes || []).length && (
          <p className="border-2 border-dashed border-ink/20 p-8 text-center text-ink/50 font-bold bg-white">
            No ticket tiers created yet. Add your first tier on the left!
          </p>
        )}
      </section>
    </div>
  );
};

export default ManageTickets;
