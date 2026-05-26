import { ClipboardCheck, Radio } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import api, { API_URL } from '../../services/api';

const CheckIn = () => {
  const { id } = useParams();
  const [ticketId, setTicketId] = useState('');
  const [stats, setStats] = useState({ totalRegistered: 0, checkedIn: 0 });
  const [message, setMessage] = useState('');
  const socket = useMemo(() => io(API_URL, { transports: ['websocket'] }), []);

  useEffect(() => {
    api.get(`/checkin/${id}/stats`).then(({ data }) => setStats(data));
    socket.emit('join-event', id);
    socket.on('checkin:update', ({ stats: nextStats }) => setStats(nextStats));
    socket.on('registration:update', ({ checkinStats }) => {
      if (checkinStats) setStats(checkinStats);
    });
    return () => {
      socket.off('checkin:update');
      socket.off('registration:update');
      socket.disconnect();
    };
  }, [id, socket]);

  const submit = async (event) => {
    event.preventDefault();
    setMessage('');
    try {
      const { data } = await api.post('/checkin', { ticketId, eventId: id });
      setStats(data);
      setTicketId('');
      setMessage('Checked in');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Check-in failed');
    }
  };

  return (
    <div className="page-shell grid gap-6 lg:grid-cols-[1fr_380px]">
      <section className="border-2 border-ink bg-ink p-8 text-paper shadow-hard">
        <span className="badge bg-signal text-ink"><Radio size={14} /> Live check-in</span>
        <div className="mt-8 text-[clamp(4rem,18vw,12rem)] font-black leading-none">
          {stats.checkedIn}<span className="text-signal">/</span>{stats.totalRegistered}
        </div>
        <p className="mt-3 text-2xl font-bold">attendees checked in</p>
      </section>

      <form onSubmit={submit} className="panel h-fit space-y-4 p-5">
        <h1 className="font-display text-4xl">Manual QR Entry</h1>
        <input className="field" placeholder="Ticket ID or QR data" value={ticketId} onChange={(event) => setTicketId(event.target.value)} />
        <button className="btn w-full"><ClipboardCheck size={18} /> Check In</button>
        {message && <p className="font-bold text-copper">{message}</p>}
      </form>
    </div>
  );
};

export default CheckIn;
