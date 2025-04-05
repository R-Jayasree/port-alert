import React, { useState } from "react";
import "./App.css";

const MAPBOX_API_KEY = "pk.eyJ1IjoiZGVtb3VzZXIiLCJhIjoiY2ttZ2o4bzJkMDNiaTJ2bXgyMmRvMmE0ciJ9.4wSD8T3CvU98Ers90HgY9Q";
const OPENCAGE_API_KEY = "4c8e43a81239456dba8f739a2c3e90b1"; 
const AISHUB_API_KEY = "demo";

const App = () => {
  const [portName, setPortName] = useState("");
  const [portCoords, setPortCoords] = useState(null);
  const [status, setStatus] = useState(null);
  const [shipCount, setShipCount] = useState(null);
  const [error, setError] = useState("");

  const getAISData = async (lat, lng) => {
    const radius = 50;
    const response = await fetch(
      `https://api.aishub.net/ws.php?username=demo&format=1&output=json&lat=${lat}&lon=${lng}&radius=${radius}&apikey=${AISHUB_API_KEY}`
    );
    const data = await response.json();
    return data.vessels?.length || 0;
  };

  const getSuggestedReroutes = async (lat, lng) => {
    const haversineDistance = (lat1, lon1, lat2, lon2) => {
      const toRad = (x) => (x * Math.PI) / 180;
      const R = 6371;
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };
  
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search.php?q=port&lat=${lat}&lon=${lng}&format=jsonv2`
      );
      const data = await response.json();
  
      const nearbyPorts = data
        .filter((place) => place.class === "place" || place.type.includes("harbour") || place.type.includes("port"))
        .map((port) => ({
          name: port.display_name,
          lat: parseFloat(port.lat),
          lng: parseFloat(port.lon),
          distance: haversineDistance(lat, lng, port.lat, port.lon),
        }))
        .filter((port) => port.distance > 100)
        .sort((a, b) => a.distance - b.distance);
  
      return nearbyPorts.slice(0, 2);
    } catch (error) {
      console.error("Error fetching reroute ports:", error);
      return [];
    }
  };
  

  const getMapboxImageUrl = () => {
    if (!portCoords) return null;
    const { lat, lng } = portCoords;
    return `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${lng},${lat},9,0/600x400?access_token=${MAPBOX_API_KEY}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setStatus(null);
    setPortCoords(null);
    setShipCount(null);

    if (!portName.trim()) {
      setError("Please enter a port name.");
      return;
    }

    try {
      const geoRes = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(
          portName
        )}&key=${OPENCAGE_API_KEY}`
      );
      const geoData = await geoRes.json();

      if (!geoData.results.length) {
        setError("Port not found.");
        return;
      }

      const { lat, lng } = geoData.results[0].geometry;
      setPortCoords({ lat, lng });

      let shipsNearby = 0;
      shipsNearby = await getAISData(lat, lng);
      setShipCount(shipsNearby);

      let congestionLevel = "normal";
      let message = "✅ Port looks good. No congestion detected.";

      if (shipsNearby > 80) {
        congestionLevel = "high";
        message = "🔴 Highly Congested — Must Reroute!";
      } else if (shipsNearby > 40) {
        congestionLevel = "moderate";
        message = "🟠 Congested — Consider Rerouting";
      }

      let reroutes = [];
      if (congestionLevel !== "normal") {
        reroutes = getSuggestedReroutes(lat, lng);
      }

      setStatus({ level: congestionLevel, message, reroutes });
    } catch (err) {
      setError("Something went wrong. Try again later.");
    }
  };

  return (
    <div className="app-container">
      <h1>📦 Supply Chain Early Warning System</h1>
      <form className="form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter Port Name (e.g. Port of Singapore)"
          value={portName}
          onChange={(e) => setPortName(e.target.value)}
        />
        <button type="submit">Check Congestion</button>
      </form>

      {error && <div className="error">{error}</div>}

      {status && (
        <div className="result-card">
          <h2>📍 {portName}</h2>
          <h3 className={status.level}>{status.message}</h3>
          <p>🚢 Ship Count: {shipCount}</p>

          {status.reroutes?.length > 0 && (
            <div className="reroute-section">
              <h4>🚢 Suggested Reroutes</h4>
              <ul>
                {status.reroutes.map((port, index) => (
                  <li key={index}>
                    {port.name} ({port.distance.toFixed(1)} km away)
                  </li>
                ))}
              </ul>
            </div>
          )}

          {portCoords && (
            <>
              <h4>🛰️ Satellite View</h4>
              <img
                className="satellite-img"
                src={getMapboxImageUrl()}
                alt="Satellite view"
              />
              <p className="coords">
                Lat: {portCoords.lat.toFixed(4)} | Lng: {portCoords.lng.toFixed(4)}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
