import { useState } from "react";
import "./App.css";

const OPENCAGE_API_KEY = "d9d4039b0b1b4b949a72159b39c3f6e0"; 

function App() {
  const [port, setPort] = useState("");
  const [coords, setCoords] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCoords(null);
    setError("");
    setLoading(true);

    try {
      const geoRes = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(
          port
        )}&key=${OPENCAGE_API_KEY}`
      );
      const geoData = await geoRes.json();

      if (!geoData.results || geoData.results.length === 0) {
        setError("Port not found. Please check the spelling.");
        setLoading(false);
        return;
      }

      const { lat, lng } = geoData.results[0].geometry;
      setCoords({ lat, lng });
    } catch (err) {
      console.error(err);
      setError("Error fetching coordinates.");
    } finally {
      setLoading(false);
    }
  };

  const getMarineTrafficIframeUrl = () => {
    const zoom = 10;
    return `https://www.marinetraffic.com/en/ais/home/centerx:${coords.lng},centery:${coords.lat},zoom:${zoom}`;
  };

  return (
    <div className="app-container">
      <h1>🚢 Real-Time Port Congestion Checker</h1>

      <form onSubmit={handleSubmit} className="form">
        <input
          type="text"
          placeholder="Enter a port name (e.g., Port of Shanghai)"
          value={port}
          onChange={(e) => setPort(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Loading..." : "Check"}
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      {coords && (
        <div className="result-card">
          <h2>📍 Coordinates</h2>
          <p>Latitude: {coords.lat}</p>
          <p>Longitude: {coords.lng}</p>

          <h3>🛰️ Live Ship Traffic</h3>
          <iframe
            title="Live Marine Traffic Map"
            src={getMarineTrafficIframeUrl()}
            width="100%"
            height="500"
            style={{ border: "2px solid #ccc", borderRadius: "12px" }}
            loading="lazy"
          ></iframe>

          <p style={{ marginTop: "1rem", color: "#e67e22" }}>
            ⚠️ Check if ships are clustering → possible congestion. Suggest rerouting if density is high.
          </p>
        </div>
      )}
    </div>
  );
}

export default App;
