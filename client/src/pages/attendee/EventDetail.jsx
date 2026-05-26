import { Heart, ShoppingCart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import LoadingSpinner from '../../components/LoadingSpinner';
import ReviewForm from '../../components/ReviewForm';
import ReviewList from '../../components/ReviewList';
import TicketTypeCard from '../../components/TicketTypeCard';
import VenueMap from '../../components/VenueMap';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import api from '../../services/api';

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [event, setEvent] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get(`/events/${id}`).then(({ data }) => setEvent(data));
  }, [id]);

  if (!event) return <LoadingSpinner label="Loading event" />;

  const addTicket = (ticketType, quantity) => {
    addToCart(event, ticketType, quantity);
    setMessage(`${quantity} ${ticketType.name} ticket(s) added`);
  };

  const addWishlist = async () => {
    if (!user) return navigate('/login');
    await api.post(`/wishlist/${event._id}`);
    setMessage('Saved to wishlist');
  };

  return (
    <div className="page-shell space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="overflow-hidden border-2 border-ink bg-white shadow-hard">
          <div className="aspect-[18/8] bg-denim">
            {event.bannerImage ? (
              <img src={event.bannerImage} alt={event.title} className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full place-items-center bg-[linear-gradient(135deg,#315a80,#0e7c7b,#c9683f)]">
                <span className="font-display text-8xl text-paper">{event.title.slice(0, 1)}</span>
              </div>
            )}
          </div>
          <div className="p-5 sm:p-7">
            <div className="flex flex-wrap gap-2">
              <span className="badge bg-signal">{event.category}</span>
              <span className="badge">{new Date(event.startDate).toLocaleString()}</span>
              <span className="badge">{event.venue?.isOnline ? 'Online' : event.venue?.city || 'Venue TBA'}</span>
            </div>
            <h1 className="mt-5 font-display text-5xl leading-none">{event.title}</h1>
            <p className="mt-5 whitespace-pre-line text-lg text-ink/75">{event.description}</p>
          </div>
        </div>

        <aside className="panel h-fit p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-3xl">Tickets</h2>
            <button className="btn secondary px-3" onClick={addWishlist} title="Wishlist">
              <Heart size={18} />
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {event.ticketTypes?.map((ticketType) => (
              <TicketTypeCard key={ticketType._id} ticketType={ticketType} onAdd={addTicket} />
            ))}
            {!event.ticketTypes?.length && <p className="font-semibold">Tickets are not configured yet.</p>}
          </div>
          {message && <p className="mt-4 font-bold text-copper">{message}</p>}
          <button className="btn mt-5 w-full" onClick={() => navigate('/checkout')}>
            <ShoppingCart size={18} /> Checkout
          </button>
        </aside>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="panel p-5">
          <h2 className="font-display text-3xl">Agenda</h2>
          <div className="mt-4 space-y-3">
            {(event.sessions || []).map((session, index) => (
              <div key={`${session.title}-${index}`} className="border-2 border-ink bg-white p-4">
                <strong>{session.startTime} {session.title}</strong>
                <p className="text-sm text-ink/70">{session.speaker} · {session.description}</p>
              </div>
            ))}
            {!event.sessions?.length && <p className="font-semibold">Agenda coming soon.</p>}
          </div>
        </div>
        <div className="panel p-5">
          <h2 className="font-display text-3xl">Venue</h2>
          <div className="mt-4"><VenueMap venue={event.venue} /></div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="panel p-5">
          <h2 className="font-display text-3xl">Speakers</h2>
          <div className="mt-4 grid gap-3">
            {(event.speakers || []).map((speaker, index) => (
              <div key={`${speaker.name}-${index}`} className="border-2 border-ink bg-white p-4">
                <strong>{speaker.name}</strong>
                <p className="text-ink/70">{speaker.bio}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="panel p-5">
          <h2 className="font-display text-3xl">FAQ</h2>
          <div className="mt-4 space-y-3">
            {(event.faqs || []).map((faq, index) => (
              <details key={`${faq.question}-${index}`} className="border-2 border-ink bg-white p-4">
                <summary className="cursor-pointer font-bold">{faq.question}</summary>
                <p className="mt-2 text-ink/70">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="panel p-5">
        <h2 className="font-display text-3xl">Reviews</h2>
        {user && <div className="mt-4"><ReviewForm eventId={event._id} onCreated={(review) => setEvent({ ...event, reviews: [review, ...(event.reviews || [])] })} /></div>}
        <div className="mt-4"><ReviewList reviews={event.reviews} /></div>
      </section>
    </div>
  );
};

export default EventDetail;

