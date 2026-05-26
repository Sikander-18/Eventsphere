import { Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '../../services/api';

const ManageEvents = () => {
  const [events, setEvents] = useState([]);

  const load = () => api.get('/admin/events').then(({ data }) => setEvents(data));

  useEffect(() => {
    load();
  }, []);

  const toggle = async (id) => {
    await api.put(`/admin/events/${id}/feature`);
    load();
  };

  return (
    <section className="space-y-4">
      <h2 className="font-display text-4xl">Moderate Events</h2>
      {events.map((event) => (
        <div key={event._id} className="panel grid gap-3 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <span className="badge bg-signal">{event.status}</span>
            <h3 className="mt-2 font-display text-2xl">{event.title}</h3>
            <p className="font-semibold text-ink/70">{event.organiser?.name} · {event.category} · {event.isFeatured ? 'Featured' : 'Standard'}</p>
          </div>
          <button className="btn secondary" onClick={() => toggle(event._id)}>
            <Star size={17} /> {event.isFeatured ? 'Unfeature' : 'Feature'}
          </button>
        </div>
      ))}
    </section>
  );
};

export default ManageEvents;

