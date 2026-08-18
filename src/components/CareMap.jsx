import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const SEARCH_RADIUS_M = 8000;
const FALLBACK = { lat: 4.156, lng: 9.2624 };

function haversineKm(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function RecenterMap({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function CareMap({ hidden }) {
  const [status, setStatus] = useState("idle");
  const [coords, setCoords] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [hospitalsStatus, setHospitalsStatus] = useState("idle");
  const startedRef = useRef(false);

  useEffect(() => {
    if (hidden || startedRef.current) return;
    startedRef.current = true;
    fetchHospitals(FALLBACK);
    requestLocation();
  }, [hidden]);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setStatus("error");
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(c);
        setStatus("granted");
        fetchHospitals(c);
      },
      (err) => {
        setStatus(err.code === err.PERMISSION_DENIED ? "denied" : "error");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  const fetchHospitals = async (c) => {
    setHospitalsStatus("loading");
    const query = `[out:json][timeout:25];(node["amenity"="hospital"](around:${SEARCH_RADIUS_M},${c.lat},${c.lng});way["amenity"="hospital"](around:${SEARCH_RADIUS_M},${c.lat},${c.lng});relation["amenity"="hospital"](around:${SEARCH_RADIUS_M},${c.lat},${c.lng}););out center;`;

    try {
      const res = await fetch(OVERPASS_URL, { method: "POST", body: query });
      if (!res.ok) throw new Error("Overpass request failed");
      const data = await res.json();

      const seen = new Set();
      const list = [];
      for (const el of data.elements || []) {
        const name = el.tags?.name;
        if (!name || seen.has(name)) continue;
        const lat = el.lat ?? el.center?.lat;
        const lng = el.lon ?? el.center?.lon;
        if (lat == null || lng == null) continue;
        seen.add(name);
        list.push({ id: el.id, name, lat, lng, distanceKm: haversineKm(c, { lat, lng }) });
      }
      list.sort((a, b) => a.distanceKm - b.distanceKm);
      setHospitals(list.slice(0, 10));
      setHospitalsStatus("success");
    } catch {
      setHospitalsStatus("error");
    }
  };

  const activeCoords = coords || FALLBACK;
  const center = [activeCoords.lat, activeCoords.lng];
  const zoom = coords ? 14 : 12;

  return (
    <main className={`care-panel ${hidden ? "hidden" : ""}`} id="care-panel">
      <div className="care">
        <h1>Care nearby</h1>
        <p className="lede">
          {status === "granted"
            ? "Hospitals near your current location."
            : "Hospitals and clinics, mapped for quick reference."}
        </p>

        {(status === "idle" || status === "locating") && (
          <div className="location-prompt">
            <p>
              {status === "locating"
                ? "Getting your location…"
                : "Share your location to see hospitals near you."}
            </p>
          </div>
        )}

        {status === "denied" && (
          <div className="location-prompt warn">
            <p>Location access was denied. Showing the default area instead.</p>
            <button className="location-btn" onClick={requestLocation}>
              Try again
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="location-prompt warn">
            <p>Couldn't get your location. Showing the default area instead.</p>
            <button className="location-btn" onClick={requestLocation}>
              Try again
            </button>
          </div>
        )}

        {status === "granted" && coords && (
          <p className="coords">
            Your coordinates: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
          </p>
        )}

        <div className="map">
          <MapContainer center={center} zoom={zoom} scrollWheelZoom={true}>
            <RecenterMap center={center} zoom={zoom} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {coords && (
              <CircleMarker
                center={[coords.lat, coords.lng]}
                radius={9}
                pathOptions={{ color: "#ffffff", weight: 2, fillColor: "#0ee9a7", fillOpacity: 1 }}
              >
                <Popup>You are here</Popup>
              </CircleMarker>
            )}
            {hospitals.map((h) => (
              <Marker key={h.id} position={[h.lat, h.lng]}>
                <Popup>
                  {h.name}
                  <br />
                  {h.distanceKm.toFixed(1)} km away
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {hospitalsStatus === "loading" && <p className="lede">Finding hospitals nearby…</p>}
        {hospitalsStatus === "error" && <p className="lede">Couldn't load a hospital list right now.</p>}

        {hospitalsStatus === "success" && (
          <ul className="hospital-list">
            {hospitals.length === 0 && <li>No hospitals found nearby.</li>}
            {hospitals.map((h) => (
              <li key={h.id}>
                <span>{h.name}</span>
                <span className="distance">{h.distanceKm.toFixed(1)} km</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
