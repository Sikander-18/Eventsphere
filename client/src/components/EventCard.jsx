import { Calendar, MapPin, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getImageUrl } from '../services/api';

const formatDate = (date) => new Date(date).toLocaleDateString(undefined, {
  day: '2-digit',
  month: 'short',
  year: 'numeric'
});

const EventCard = ({ event }) => {
  const pricing = event.pricing;
  const imageUrl = getImageUrl(event.bannerImage);
  
  const getPriceDisplay = () => {
    if (!pricing) return 'Tickets';
    if (pricing.free && pricing.paid) return 'Free/Paid';
    if (pricing.free) return 'Free';
    if (pricing.paid && pricing.min > 0) return 'Paid';
    return 'Tickets';
  };

  return (
    <article className="group border-2 border-ink bg-white shadow-soft transition hover:-translate-y-1 hover:shadow-hard">
      <Link to={`/events/${event._id}`}>
        <div className="relative aspect-[16/9] overflow-hidden border-b-2 border-ink bg-harbor">
          {imageUrl ? (
            <img src={imageUrl} alt={event.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
          ) : (
            <div className="grid h-full place-items-center bg-[linear-gradient(135deg,#0e7c7b_0%,#315a80_45%,#c9683f_100%)]">
              <span className="font-display text-5xl text-paper">{event.title?.slice(0, 1) || 'E'}</span>
            </div>
          )}
          {event.isFeatured && (
            <span className="badge absolute left-3 top-3 bg-signal">
              <Star size={14} fill="currentColor" /> Featured
            </span>
          )}
        </div>
        <div className="space-y-4 p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="badge bg-paper">{event.category}</span>
            <span className="font-bold text-copper">{getPriceDisplay()}</span>
          </div>
          <h3 className="font-display text-2xl leading-tight">{event.title}</h3>
          <div className="grid gap-2 text-sm font-semibold text-ink/75">
            <span className="flex items-center gap-2"><Calendar size={16} /> {formatDate(event.startDate)}</span>
            <span className="flex items-center gap-2"><MapPin size={16} /> {event.venue?.isOnline ? 'Online' : event.venue?.city || 'Venue TBA'}</span>
          </div>
        </div>
      </Link>
    </article>
  );
};

export default EventCard;

