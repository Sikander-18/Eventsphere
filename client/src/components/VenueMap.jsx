import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow
});

const VenueMap = ({ venue }) => {
  if (!venue || venue.isOnline) {
    return <div className="badge bg-signal">Online Event</div>;
  }

  if (!venue.lat || !venue.lng) {
    return <div className="border-2 border-ink bg-white p-5 font-semibold">Venue map coordinates not available.</div>;
  }

  const center = [Number(venue.lat), Number(venue.lng)];

  return (
    <MapContainer center={center} zoom={13} scrollWheelZoom={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={center}>
        <Popup>
          <strong>{venue.name}</strong><br />
          {venue.address}
        </Popup>
      </Marker>
    </MapContainer>
  );
};

export default VenueMap;

