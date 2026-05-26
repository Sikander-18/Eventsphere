import { ClipboardCheck, Radio, Camera, CheckCircle, AlertCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Html5QrcodeScanner } from 'html5-qrcode';
import api, { API_URL } from '../../services/api';

const CheckIn = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' or 'manual'
  const [ticketId, setTicketId] = useState('');
  const [stats, setStats] = useState({ totalRegistered: 0, checkedIn: 0 });
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(null); // true, false, null
  const [cooldown, setCooldown] = useState(false);
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

  // Camera QR scanner integration
  useEffect(() => {
    if (activeTab !== 'camera') return;

    let scanner = null;
    
    // Tiny delay to ensure DOM element is mounted
    const timer = setTimeout(() => {
      try {
        scanner = new Html5QrcodeScanner('qr-reader', {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          showTorchButtonIfSupported: true
        });

        const onScanSuccess = async (decodedText) => {
          if (cooldown) return;
          setCooldown(true);
          setMessage('');
          setIsSuccess(null);

          // Extract ID from full QR JSON payload or regex match
          let parsedId = decodedText;
          try {
            const parsed = JSON.parse(decodedText);
            parsedId = parsed.ticketId || parsed._id || decodedText;
          } catch {
            const match = decodedText.match(/[a-f0-9]{24}/i);
            if (match) parsedId = match[0];
          }

          try {
            const { data } = await api.post('/checkin', { ticketId: parsedId, eventId: id });
            setStats(data);
            setIsSuccess(true);
            setMessage('Checked in successfully!');
          } catch (error) {
            setIsSuccess(false);
            setMessage(error.response?.data?.message || 'Check-in failed');
          } finally {
            // Success/error message display duration before resetting
            setTimeout(() => {
              setCooldown(false);
              setIsSuccess(null);
              setMessage('');
            }, 3000);
          }
        };

        scanner.render(onScanSuccess, () => {
          // Frame mismatches can be ignored
        });
      } catch (err) {
        console.error('Html5QrcodeScanner failed to start:', err);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (scanner) {
        scanner.clear().catch((e) => console.warn('Html5QrcodeScanner clear failed:', e));
      }
    };
  }, [activeTab, id, cooldown]);

  const submit = async (event) => {
    event.preventDefault();
    setMessage('');
    setIsSuccess(null);
    try {
      const { data } = await api.post('/checkin', { ticketId, eventId: id });
      setStats(data);
      setTicketId('');
      setIsSuccess(true);
      setMessage('Checked in successfully!');
    } catch (error) {
      setIsSuccess(false);
      setMessage(error.response?.data?.message || 'Check-in failed');
    }
  };

  return (
    <div className="page-shell grid gap-6 lg:grid-cols-[1fr_380px]">
      <section className="border-2 border-ink bg-ink p-8 text-paper shadow-hard flex flex-col justify-between">
        <div>
          <span className="badge bg-signal text-ink"><Radio size={14} className="animate-pulse text-red-600" /> Live check-in</span>
          <div className="mt-8 text-[clamp(4rem,18vw,12rem)] font-black leading-none">
            {stats.checkedIn}<span className="text-signal">/</span>{stats.totalRegistered}
          </div>
          <p className="mt-3 text-2xl font-bold">attendees checked in</p>
        </div>
        
        {/* Real-time scanning visual alert overlay */}
        {activeTab === 'camera' && cooldown && (
          <div className={`mt-6 border-2 p-4 flex items-center gap-3 transition-all ${
            isSuccess === true ? 'bg-signal/20 border-signal text-signal animate-pulse' : 
            isSuccess === false ? 'bg-copper/20 border-copper text-copper' : 'bg-white/10 border-white text-white'
          }`}>
            {isSuccess === true && <CheckCircle size={24} />}
            {isSuccess === false && <AlertCircle size={24} />}
            <span className="font-bold text-lg">{message || 'Processing QR code...'}</span>
          </div>
        )}
      </section>

      <div className="panel h-fit space-y-4 p-5">
        {/* Switcher Tab Headers */}
        <div className="flex border-b-2 border-ink">
          <button 
            type="button"
            className={`flex-1 py-3 font-bold text-center border-r-2 border-ink flex items-center justify-center gap-2 transition-all ${
              activeTab === 'camera' ? 'bg-signal text-ink' : 'bg-transparent text-ink/60 hover:bg-ink/5'
            }`}
            onClick={() => {
              setActiveTab('camera');
              setMessage('');
              setIsSuccess(null);
            }}
          >
            <Camera size={18} /> Camera Scan
          </button>
          <button 
            type="button"
            className={`flex-1 py-3 font-bold text-center flex items-center justify-center gap-2 transition-all ${
              activeTab === 'manual' ? 'bg-signal text-ink' : 'bg-transparent text-ink/60 hover:bg-ink/5'
            }`}
            onClick={() => {
              setActiveTab('manual');
              setMessage('');
              setIsSuccess(null);
            }}
          >
            <ClipboardCheck size={18} /> Manual Entry
          </button>
        </div>

        {/* Tab content 1: Camera Scan */}
        {activeTab === 'camera' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <h2 className="font-display text-3xl">Scan Ticket QR</h2>
              <p className="text-sm text-ink/65">
                Place the attendee's ticket QR code inside the camera view below to verify and check them in instantly.
              </p>
            </div>
            
            <div className="relative">
              <div id="qr-reader" style={{ width: '100%' }} />
              {cooldown && (
                <div className="absolute inset-0 bg-ink/70 flex flex-col items-center justify-center text-paper border-2 border-ink">
                  {isSuccess === true ? (
                    <div className="text-center space-y-2 animate-bounce">
                      <span className="inline-block p-3 rounded-full bg-signal text-ink font-bold text-3xl">✓</span>
                      <p className="font-bold text-xl text-signal">Access Granted!</p>
                    </div>
                  ) : isSuccess === false ? (
                    <div className="text-center space-y-2">
                      <span className="inline-block p-3 rounded-full bg-copper text-paper font-bold text-3xl">✕</span>
                      <p className="font-bold text-xl text-copper">Failed</p>
                      <p className="text-sm text-paper/85 px-4">{message}</p>
                    </div>
                  ) : (
                    <p className="font-bold text-xl animate-pulse">Verifying Ticket...</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab content 2: Manual Entry */}
        {activeTab === 'manual' && (
          <form onSubmit={submit} className="space-y-4">
            <h2 className="font-display text-3xl">Manual QR Entry</h2>
            <p className="text-sm text-ink/65">
              Enter the unique 24-character Ticket ID or paste the raw QR data block to manual check-in.
            </p>
            <input 
              className="field font-mono" 
              placeholder="e.g. 6a1607ad5db9db232f9a2ae9" 
              value={ticketId} 
              onChange={(event) => setTicketId(event.target.value)} 
              required
            />
            <button className="btn w-full font-bold">
              <ClipboardCheck size={18} /> Check In Attendee
            </button>
            {message && (
              <div className={`p-3 border-2 font-bold ${
                isSuccess === true ? 'bg-signal/15 border-signal text-ink' : 'bg-copper/15 border-copper text-copper'
              }`}>
                {message}
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export default CheckIn;
