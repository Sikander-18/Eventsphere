import { Star } from 'lucide-react';

const ReviewList = ({ reviews = [] }) => (
  <div className="space-y-3">
    {reviews.length === 0 && <p className="border border-ink bg-white p-4 font-semibold">No reviews yet.</p>}
    {reviews.map((review) => (
      <div key={review._id} className="border-2 border-ink bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <strong>{review.user?.name || 'Attendee'}</strong>
          <span className="badge bg-signal"><Star size={14} fill="currentColor" /> {review.rating}</span>
        </div>
        {review.comment && <p className="mt-2 text-ink/75">{review.comment}</p>}
      </div>
    ))}
  </div>
);

export default ReviewList;

