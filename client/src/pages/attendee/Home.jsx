import { Sparkles, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import EventCard from '../../components/EventCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const categories = ['', 'Tech', 'Music', 'Business', 'Sports', 'Art', 'Education', 'Other'];

const Home = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [filters, setFilters] = useState({ search: '', category: '', city: '', price: '' });
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    setLoading(true);
    const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value));
    const { data } = await api.get('/events', { params });
    setEvents(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents().catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    api.get('/ai/recommendations')
      .then(({ data }) => setRecommendations(data))
      .catch(() => setRecommendations([]));
  }, [user]);

  return (
    <div className="page-shell space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="border-2 border-ink bg-ink p-6 text-paper shadow-hard">
          <span className="badge bg-signal text-ink">Live event marketplace</span>
          <h1 className="mt-5 max-w-3xl font-display text-5xl leading-[0.95] sm:text-7xl">
            Discover, book, and check in without the spreadsheet storm.
          </h1>
        </div>
        <form
          className="panel grid content-start gap-3 p-5"
          onSubmit={(event) => {
            event.preventDefault();
            fetchEvents();
          }}
        >
          <div className="flex items-center gap-2 font-display text-2xl">
            <Search size={24} /> Find events
          </div>
          <input className="field" placeholder="Search title, topic, city" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
          <div className="grid gap-3 sm:grid-cols-3">
            <select className="field" value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value })}>
              {categories.map((category) => <option key={category || 'all'} value={category}>{category || 'All categories'}</option>)}
            </select>
            <input className="field" placeholder="City" value={filters.city} onChange={(event) => setFilters({ ...filters, city: event.target.value })} />
            <select className="field" value={filters.price} onChange={(event) => setFilters({ ...filters, price: event.target.value })}>
              <option value="">Any price</option>
              <option value="free">Free</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          <button className="btn" type="submit">Apply filters</button>
        </form>
      </section>

      {recommendations.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Sparkles size={22} />
            <h2 className="font-display text-3xl">AI picks for you</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {recommendations.map((event) => <EventCard key={event._id} event={event} />)}
          </div>
        </section>
      )}

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 className="font-display text-4xl">Upcoming events</h2>
          <span className="badge">{events.length} found</span>
        </div>
        {loading ? <LoadingSpinner /> : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => <EventCard key={event._id} event={event} />)}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;

