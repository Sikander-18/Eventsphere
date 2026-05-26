import { Heart } from 'lucide-react';
import { useEffect, useState } from 'react';
import EventCard from '../../components/EventCard';
import api from '../../services/api';

const Wishlist = () => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    api.get('/wishlist').then(({ data }) => setEvents(data));
  }, []);

  return (
    <div className="page-shell space-y-5">
      <div className="flex items-center gap-2">
        <Heart size={28} />
        <h1 className="font-display text-5xl">Wishlist</h1>
      </div>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => <EventCard key={event._id} event={event} />)}
      </div>
      {!events.length && <div className="panel p-6 font-bold">No saved events yet.</div>}
    </div>
  );
};

export default Wishlist;

