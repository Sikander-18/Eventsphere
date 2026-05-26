import { Sparkles, Save, Trash2, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { API_URL } from '../../services/api';

const emptyForm = {
  title: '',
  description: '',
  category: 'Tech',
  startDate: '',
  endDate: '',
  venueName: '',
  address: '',
  city: '',
  lat: '0',
  lng: '0',
  isOnline: false,
  onlineLink: '',
  status: 'published',
  sessions: '[]',
  speakers: '[]',
  faqs: '[]'
};

const CreateEvent = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [bannerImage, setBannerImage] = useState(null);
  const [bullets, setBullets] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const token = localStorage.getItem('eventsphere_token');

  // Interactive Lists State
  const [sessionsList, setSessionsList] = useState([]);
  const [speakersList, setSpeakersList] = useState([]);
  const [faqsList, setFaqsList] = useState([]);

  // Builder Subform Inputs State
  const [sessionInput, setSessionInput] = useState({ title: '', speaker: '', startTime: '', endTime: '', duration: '', description: '' });
  const [speakerInput, setSpeakerInput] = useState({ name: '', bio: '', photo: '' });
  const [faqInput, setFaqInput] = useState({ question: '', answer: '' });

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/events/${id}`).then(({ data }) => {
      const initSessions = data.sessions || [];
      const initSpeakers = data.speakers || [];
      const initFaqs = data.faqs || [];

      setSessionsList(initSessions);
      setSpeakersList(initSpeakers);
      setFaqsList(initFaqs);

      setForm({
        ...emptyForm,
        title: data.title || '',
        description: data.description || '',
        category: data.category || 'Tech',
        startDate: data.startDate?.slice(0, 16) || '',
        endDate: data.endDate?.slice(0, 16) || '',
        venueName: data.venue?.name || '',
        address: data.venue?.address || '',
        city: data.venue?.city || '',
        lat: '0',
        lng: '0',
        isOnline: Boolean(data.venue?.isOnline),
        onlineLink: data.venue?.onlineLink || '',
        status: data.status || 'published',
        sessions: JSON.stringify(initSessions),
        speakers: JSON.stringify(initSpeakers),
        faqs: JSON.stringify(initFaqs)
      });
    });
  }, [id, isEdit]);

  // Automatically sync visual list arrays to background serialized strings
  useEffect(() => {
    setForm((current) => ({ ...current, sessions: JSON.stringify(sessionsList) }));
  }, [sessionsList]);

  useEffect(() => {
    setForm((current) => ({ ...current, speakers: JSON.stringify(speakersList) }));
  }, [speakersList]);

  useEffect(() => {
    setForm((current) => ({ ...current, faqs: JSON.stringify(faqsList) }));
  }, [faqsList]);

  // List Handlers
  const addSession = () => {
    if (!sessionInput.title) return;
    setSessionsList([...sessionsList, { ...sessionInput, duration: Number(sessionInput.duration) || 0 }]);
    setSessionInput({ title: '', speaker: '', startTime: '', endTime: '', duration: '', description: '' });
  };
  const removeSession = (index) => {
    setSessionsList(sessionsList.filter((_, idx) => idx !== index));
  };

  const addSpeaker = () => {
    if (!speakerInput.name) return;
    setSpeakersList([...speakersList, speakerInput]);
    setSpeakerInput({ name: '', bio: '', photo: '' });
  };
  const removeSpeaker = (index) => {
    setSpeakersList(speakersList.filter((_, idx) => idx !== index));
  };

  const addFaq = () => {
    if (!faqInput.question || !faqInput.answer) return;
    setFaqsList([...faqsList, faqInput]);
    setFaqInput({ question: '', answer: '' });
  };
  const removeFaq = (index) => {
    setFaqsList(faqsList.filter((_, idx) => idx !== index));
  };

  const generateDescription = async () => {
    setForm((current) => ({ ...current, description: '' }));
    setMessage('');
    try {
      const response = await fetch(`${API_URL}/api/ai/description`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ bullets })
      });
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split('\n\n');
        buffer = chunks.pop() || '';
        chunks.forEach((chunk) => {
          const line = chunk.replace(/^data:\s?/, '');
          if (!line || line === '[DONE]') return;
          setForm((current) => ({ ...current, description: current.description + line.replace(/\\n/g, '\n') }));
        });
      }
    } catch (error) {
      setMessage(error.message || 'AI generation failed');
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setMessage('');
    setSaving(true);
    try {
      const body = new FormData();
      Object.entries(form).forEach(([key, value]) => body.append(key, value));
      body.set('venue', JSON.stringify({
        name: form.venueName,
        address: form.address,
        city: form.city,
        lat: 0,
        lng: 0,
        isOnline: form.isOnline,
        onlineLink: form.onlineLink
      }));
      if (bannerImage) body.append('bannerImage', bannerImage);
      const { data } = isEdit
        ? await api.put(`/events/${id}`, body)
        : await api.post('/events', body);
      navigate(`/organiser/events/${data._id}/tickets`);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Could not save event');
      setSaving(false);
    }
  };

  return (
    <div className="page-shell">
      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="panel space-y-6 p-5">
          <h1 className="font-display text-5xl">{isEdit ? 'Edit Event' : 'Create Event'}</h1>
          
          {/* General Information */}
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-bold text-ink/70 block">Event Title</label>
              <input className="field" placeholder="e.g. Mumbai Developer Zonals" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
            </div>
            
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-bold text-ink/70 block">Category</label>
                <select className="field" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
                  {['Tech', 'Music', 'Business', 'Sports', 'Art', 'Education', 'Other'].map((category) => <option key={category}>{category}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-ink/70 block">Publish Status</label>
                <select className="field" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-ink/70 block">Start Date & Time</label>
                <input className="field" type="datetime-local" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} required />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-ink/70 block">End Date & Time</label>
                <input className="field" type="datetime-local" value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} required />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-bold text-ink/70 block">Detailed Description</label>
              <textarea className="field min-h-48" placeholder="Tell attendees all about the event itinerary, speakers, and reasons to join..." value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required />
            </div>
          </div>

          {/* Venue & Location */}
          <div className="pt-6 border-t-2 border-ink/10 space-y-4">
            <h2 className="font-display text-3xl">Venue & Location</h2>
            
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-bold text-ink/70 block">Venue Name</label>
                <input className="field" placeholder="e.g. Grand Plaza Arena" value={form.venueName} onChange={(event) => setForm({ ...form, venueName: event.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-ink/70 block">City</label>
                <input className="field" placeholder="e.g. Mumbai" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-sm font-bold text-ink/70 block">Address</label>
                <input className="field" placeholder="e.g. 123 Main St, Bandra West" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 items-end">
              <label className="flex items-center gap-2 border-2 border-ink bg-white p-3 font-bold cursor-pointer h-[50px]">
                <input type="checkbox" checked={form.isOnline} onChange={(event) => setForm({ ...form, isOnline: event.target.checked })} />
                Online event
              </label>
              
              <div className="space-y-1">
                <label className="text-sm font-bold text-ink/70 block">Online Link (Streaming URL)</label>
                <input className="field" placeholder="e.g. Zoom, YouTube URL" value={form.onlineLink} onChange={(event) => setForm({ ...form, onlineLink: event.target.value })} disabled={!form.isOnline} />
              </div>
            </div>
          </div>

          {/* Interactive Sessions Schedule Builder */}
          <div className="pt-6 border-t-2 border-ink/10 space-y-4">
            <h2 className="font-display text-3xl">Sessions & Program Schedule</h2>
            <p className="text-sm text-ink/65">Define the sessions, workshops, or breaks in your program.</p>
            
            {sessionsList.length > 0 && (
              <div className="space-y-2">
                {sessionsList.map((session, index) => (
                  <div key={index} className="border-2 border-ink bg-amber-50/50 p-3 flex justify-between items-start gap-4">
                    <div>
                      <strong className="text-lg block">{session.title}</strong>
                      <div className="text-xs font-bold text-ink/65 mt-0.5">
                        {session.speaker ? `Speaker: ${session.speaker} ` : ''} 
                        {session.startTime ? `| Time: ${session.startTime} - ${session.endTime} ` : ''}
                        {session.duration ? `| Duration: ${session.duration} mins` : ''}
                      </div>
                      {session.description && <p className="text-sm text-ink/75 mt-1.5">{session.description}</p>}
                    </div>
                    <button type="button" className="btn secondary px-2.5 py-1 text-xs font-bold flex items-center gap-1" onClick={() => removeSession(index)}>
                      <Trash2 size={13} /> Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="border-2 border-dashed border-ink/30 p-4 bg-ink/[0.02] space-y-3">
              <h3 className="font-bold text-lg">Add New Session</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <input className="field" placeholder="Session Title" value={sessionInput.title} onChange={(e) => setSessionInput({ ...sessionInput, title: e.target.value })} />
                <input className="field" placeholder="Speaker (e.g. Jane Doe)" value={sessionInput.speaker} onChange={(e) => setSessionInput({ ...sessionInput, speaker: e.target.value })} />
                <input className="field" placeholder="Start Time (e.g. 10:00 AM)" value={sessionInput.startTime} onChange={(e) => setSessionInput({ ...sessionInput, startTime: e.target.value })} />
                <input className="field" placeholder="End Time (e.g. 11:00 AM)" value={sessionInput.endTime} onChange={(e) => setSessionInput({ ...sessionInput, endTime: e.target.value })} />
                <input className="field sm:col-span-2" type="number" placeholder="Duration in minutes" value={sessionInput.duration} onChange={(e) => setSessionInput({ ...sessionInput, duration: e.target.value })} />
                <textarea className="field sm:col-span-2 min-h-20" placeholder="Quick description of the session topics..." value={sessionInput.description} onChange={(e) => setSessionInput({ ...sessionInput, description: e.target.value })} />
              </div>
              <button type="button" className="btn secondary w-full flex items-center justify-center gap-1.5 font-bold" onClick={addSession}>
                <Plus size={16} /> Add Session to Program
              </button>
            </div>
          </div>

          {/* Interactive Speakers Builder */}
          <div className="pt-6 border-t-2 border-ink/10 space-y-4">
            <h2 className="font-display text-3xl">Event Speakers</h2>
            <p className="text-sm text-ink/65">List the key experts or guest presenters participating in the event.</p>
            
            {speakersList.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2">
                {speakersList.map((speaker, index) => (
                  <div key={index} className="border-2 border-ink bg-blue-50/20 p-3 flex justify-between items-start gap-4">
                    <div>
                      <strong className="text-lg block">{speaker.name}</strong>
                      {speaker.bio && <p className="text-xs text-ink/75 mt-1">{speaker.bio}</p>}
                    </div>
                    <button type="button" className="btn secondary px-2.5 py-1 text-xs font-bold" onClick={() => removeSpeaker(index)}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="border-2 border-dashed border-ink/30 p-4 bg-ink/[0.02] space-y-3">
              <h3 className="font-bold text-lg">Add New Speaker</h3>
              <div className="grid gap-3">
                <input className="field" placeholder="Speaker Name" value={speakerInput.name} onChange={(e) => setSpeakerInput({ ...speakerInput, name: e.target.value })} />
                <textarea className="field min-h-20" placeholder="Speaker Bio..." value={speakerInput.bio} onChange={(e) => setSpeakerInput({ ...speakerInput, bio: e.target.value })} />
              </div>
              <button type="button" className="btn secondary w-full flex items-center justify-center gap-1.5 font-bold" onClick={addSpeaker}>
                <Plus size={16} /> Add Speaker to Event
              </button>
            </div>
          </div>

          {/* Interactive FAQs Builder */}
          <div className="pt-6 border-t-2 border-ink/10 space-y-4">
            <h2 className="font-display text-3xl">Frequently Asked Questions</h2>
            <p className="text-sm text-ink/65">Provide answers to standard questions like dress code, parking, and virtual logs.</p>
            
            {faqsList.length > 0 && (
              <div className="space-y-2">
                {faqsList.map((faq, index) => (
                  <div key={index} className="border-2 border-ink bg-green-50/10 p-3 flex justify-between items-start gap-4">
                    <div>
                      <strong className="text-sm block text-ink">Q: {faq.question}</strong>
                      <p className="text-xs text-ink/70 mt-1">A: {faq.answer}</p>
                    </div>
                    <button type="button" className="btn secondary px-2.5 py-1 text-xs font-bold" onClick={() => removeFaq(index)}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="border-2 border-dashed border-ink/30 p-4 bg-ink/[0.02] space-y-3">
              <h3 className="font-bold text-lg">Add FAQ Question</h3>
              <div className="grid gap-3">
                <input className="field" placeholder="Question (e.g. Is there free parking?)" value={faqInput.question} onChange={(e) => setFaqInput({ ...faqInput, question: e.target.value })} />
                <textarea className="field min-h-20" placeholder="Answer..." value={faqInput.answer} onChange={(e) => setFaqInput({ ...faqInput, answer: e.target.value })} />
              </div>
              <button type="button" className="btn secondary w-full flex items-center justify-center gap-1.5 font-bold" onClick={addFaq}>
                <Plus size={16} /> Add FAQ to List
              </button>
            </div>
          </div>
        </section>

        <aside className="panel h-fit space-y-4 p-5">
          <h2 className="font-display text-3xl">AI copywriter</h2>
          <textarea className="field min-h-36" placeholder="Bullet points for Groq" value={bullets} onChange={(event) => setBullets(event.target.value)} />
          <button type="button" className="btn w-full" onClick={generateDescription}><Sparkles size={18} /> Generate with AI</button>
          
          <div className="pt-2">
            <label className="text-sm font-bold text-ink/70 block mb-1">Event Banner Image</label>
            <input className="field" type="file" accept="image/*" onChange={(event) => setBannerImage(event.target.files?.[0])} />
          </div>
          
          <button className="btn dark w-full" type="submit" disabled={saving}>
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving event...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Save size={18} /> Save event
              </span>
            )}
          </button>
          {message && <p className="font-bold text-copper">{message}</p>}
        </aside>
      </form>
    </div>
  );
};

export default CreateEvent;
