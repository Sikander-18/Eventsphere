import { CalendarPlus, ClipboardCheck, Download, IndianRupee, Ticket } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import api, { API_URL } from '../../services/api';

const Dashboard = () => {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({});
  const socket = useMemo(() => io(API_URL, { transports: ['websocket'] }), []);

  useEffect(() => {
    socket.on('registration:update', ({ eventId, stats: nextStats }) => {
      if (!eventId || !nextStats) return;
      setStats((current) => ({ ...current, [eventId]: nextStats }));
    });

    const load = async () => {
      const { data } = await api.get('/events/mine');
      setEvents(data);
      data.forEach((event) => socket.emit('join-event', event._id));
      const pairs = await Promise.all(data.map(async (event) => {
        try {
          const response = await api.get(`/events/${event._id}/dashboard`);
          return [event._id, response.data];
        } catch {
          return [event._id, {}];
        }
      }));
      setStats(Object.fromEntries(pairs));
    };
    load();

    return () => {
      socket.off('registration:update');
      socket.disconnect();
    };
  }, [socket]);

  const totals = Object.values(stats).reduce((acc, item) => ({
    revenue: acc.revenue + (item.revenue || 0),
    registrations: acc.registrations + (item.totalRegistrations || 0),
    checkedIn: acc.checkedIn + (item.checkedIn || 0)
  }), { revenue: 0, registrations: 0, checkedIn: 0 });

  return (
    <div className="page-shell space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-5xl">Organiser Dashboard</h1>
        <Link className="btn" to="/organiser/events/create"><CalendarPlus size={18} /> Create event</Link>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="panel p-5"><IndianRupee /><p className="mt-3 text-3xl font-black">₹{totals.revenue}</p><span className="font-bold">Revenue</span></div>
        <div className="panel p-5"><Ticket /><p className="mt-3 text-3xl font-black">{totals.registrations}</p><span className="font-bold">Registrations</span></div>
        <div className="panel p-5"><ClipboardCheck /><p className="mt-3 text-3xl font-black">{totals.checkedIn}</p><span className="font-bold">Checked in</span></div>
      </section>

      <section className="space-y-4">
        {events.map((event) => {
          const eventStats = stats[event._id] || {};
          return (
            <div key={event._id} className="panel grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <span className="badge bg-signal">{event.status}</span>
                <h2 className="mt-2 font-display text-3xl">{event.title}</h2>
                <p className="font-semibold text-ink/70">₹{eventStats.revenue || 0} · {eventStats.totalRegistrations || 0} registered · {eventStats.checkinPercent || 0}% checked in</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link className="btn secondary" to={`/organiser/events/${event._id}/edit`}>Edit</Link>
                <Link className="btn secondary" to={`/organiser/events/${event._id}/tickets`}>Tickets</Link>
                <Link className="btn secondary" to={`/organiser/events/${event._id}/checkin`}>Check-in</Link>
                <Link className="btn secondary" to={`/organiser/events/${event._id}/attendees`}><Download size={17} /> Attendees</Link>
                <Link className="btn secondary" to={`/organiser/events/${event._id}/schedule`}>Schedule</Link>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
};

export default Dashboard;
