import { Send } from 'lucide-react';
import { useState } from 'react';
import api from '../services/api';

const ReviewForm = ({ eventId, onCreated }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [message, setMessage] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setMessage('');
    try {
      const { data } = await api.post('/reviews', { eventId, rating, comment });
      setComment('');
      onCreated?.(data);
      setMessage('Review saved');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Could not save review');
    }
  };

  return (
    <form onSubmit={submit} className="border-2 border-ink bg-white p-4">
      <div className="grid gap-3 sm:grid-cols-[120px_1fr_auto]">
        <select className="field" value={rating} onChange={(event) => setRating(Number(event.target.value))}>
          {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} stars</option>)}
        </select>
        <input className="field" value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Share your experience" />
        <button className="btn" type="submit"><Send size={17} /> Post</button>
      </div>
      {message && <p className="mt-2 text-sm font-bold text-copper">{message}</p>}
    </form>
  );
};

export default ReviewForm;

