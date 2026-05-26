import { ArrowDown, ArrowUp, Sparkles, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import api from '../../services/api';

const blank = { title: '', speaker: '', duration: 30, description: '' };

const ScheduleBuilder = () => {
  const [sessions, setSessions] = useState([{ ...blank }]);
  const [message, setMessage] = useState('');

  const update = (index, patch) => {
    setSessions(sessions.map((session, itemIndex) => itemIndex === index ? { ...session, ...patch } : session));
  };

  const remove = (index) => {
    if (sessions.length === 1) {
      setSessions([{ ...blank }]);
      return;
    }
    setSessions(sessions.filter((_, itemIndex) => itemIndex !== index));
  };

  const move = (index, direction) => {
    const next = [...sessions];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setSessions(next);
  };

  const optimise = async () => {
    setMessage('');
    try {
      const { data } = await api.post('/ai/schedule', { sessions });
      setSessions(data);
    } catch (error) {
      setMessage(error.response?.data?.message || 'AI optimisation failed');
    }
  };

  return (
    <div className="page-shell space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-5xl">Schedule Builder</h1>
          <p className="text-sm font-semibold text-ink/60 mt-1">
            Build and order daily event programs. Let AI help you organize for maximum audience engagement.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn secondary font-bold" onClick={() => setSessions([...sessions, { ...blank }])}>
            <Plus size={18} /> Add Session
          </button>
          <button className="btn font-bold" onClick={optimise}>
            <Sparkles size={18} /> Optimise with AI
          </button>
        </div>
      </div>

      {message && <div className="panel p-4 font-bold text-copper">{message}</div>}

      {/* Grid Headers for Large Screens */}
      <div className="hidden lg:grid gap-3 px-4 py-2 font-bold text-sm text-ink/60 lg:grid-cols-[60px_2fr_2fr_120px_3fr_110px_50px]">
        <div>Order</div>
        <div>Session Title</div>
        <div>Speaker</div>
        <div>Duration (mins)</div>
        <div>Description</div>
        <div className="text-center">Reorder</div>
        <div className="text-center">Action</div>
      </div>

      <div className="space-y-4">
        {sessions.map((session, index) => (
          <div key={index} className="panel grid gap-4 p-5 bg-white lg:grid-cols-[60px_2fr_2fr_120px_3fr_110px_50px] lg:items-center">
            
            {/* Order badge */}
            <div className="flex items-center gap-2 lg:block">
              <span className="text-xs font-bold text-ink/50 lg:hidden">Sequence:</span>
              <span className="badge bg-signal">#{index + 1}</span>
            </div>

            {/* Title field */}
            <div className="space-y-1 lg:space-y-0">
              <label className="text-xs font-bold text-ink/75 block lg:hidden">Session Title</label>
              <input className="field" placeholder="e.g. Welcome Keynote" value={session.title} onChange={(event) => update(index, { title: event.target.value })} required />
            </div>

            {/* Speaker field */}
            <div className="space-y-1 lg:space-y-0">
              <label className="text-xs font-bold text-ink/75 block lg:hidden">Speaker Name</label>
              <input className="field" placeholder="e.g. Dr. John Doe" value={session.speaker} onChange={(event) => update(index, { speaker: event.target.value })} />
            </div>

            {/* Duration field */}
            <div className="space-y-1 lg:space-y-0">
              <label className="text-xs font-bold text-ink/75 block lg:hidden">Duration (Minutes)</label>
              <input className="field" type="number" placeholder="mins" value={session.duration} onChange={(event) => update(index, { duration: Number(event.target.value) })} min="5" required />
            </div>

            {/* Description field */}
            <div className="space-y-1 lg:space-y-0">
              <label className="text-xs font-bold text-ink/75 block lg:hidden">Session Description</label>
              <input className="field" placeholder="e.g. Opening remarks and platform introduction" value={session.description} onChange={(event) => update(index, { description: event.target.value })} />
            </div>

            {/* Reorder Buttons */}
            <div className="space-y-1 lg:space-y-0">
              <label className="text-xs font-bold text-ink/75 block lg:hidden mb-1">Reorder Sequence</label>
              <div className="flex gap-2 justify-start lg:justify-center">
                <button className="btn secondary px-2.5 py-1.5" disabled={index === 0} onClick={() => move(index, -1)} title="Move up"><ArrowUp size={16} /></button>
                <button className="btn secondary px-2.5 py-1.5" disabled={index === sessions.length - 1} onClick={() => move(index, 1)} title="Move down"><ArrowDown size={16} /></button>
              </div>
            </div>

            {/* Delete button */}
            <div className="flex justify-end lg:justify-center mt-2 lg:mt-0">
              <button className="btn secondary p-2.5 text-copper border-copper/30 hover:bg-copper/[0.05]" onClick={() => remove(index)} title="Delete session">
                <Trash2 size={16} />
              </button>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
};

export default ScheduleBuilder;
