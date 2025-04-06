import { useState } from "react";
import "./App.css";
import { checkSupplierRisk } from "./utils/checkSupplierRisk";

const OPENCAGE_API_KEY = "d9d4039b0b1b4b949a72159b39c3f6e0";
const MAPBOX_API_KEY = "pk.eyJ1IjoicmpheWFzcmVlIiwiYSI6ImNtOTUyaWd0dDBzdzIycnIwYWN6bGhnY3kifQ.ra8FahCLmvIsmnwBCePOdw";

function App() {
  const [activeTab, setActiveTab] = useState("congestion");
  const [port, setPort] = useState("");
  const [coords, setCoords] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [congestionStatus, setCongestionStatus] = useState(null);
  const [satelliteImageUrl, setSatelliteImageUrl] = useState(null);
  const [supplierName, setSupplierName] = useState("");
  const [supplierLocation, setSupplierLocation] = useState("");
  const [supplierLoading, setSupplierLoading] = useState(false);
  const [supplierRisk, setSupplierRisk] = useState(null);
  const [news, setNews] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [demandLoading, setDemandLoading] = useState(false);

  const handlePortCheck = async (e) => {
    e.preventDefault();
    setCoords(null);
    setError("");
    setCongestionStatus(null);
    setSatelliteImageUrl(null);
    setLoading(true);

    try {
      const res = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(
          port
        )}&key=${OPENCAGE_API_KEY}`
      );
      const data = await res.json();

      if (!data.results || data.results.length === 0) {
        setError("Port not found.");
        setLoading(false);
        return;
      }

      const { lat, lng } = data.results[0].geometry;
      setCoords({ lat, lng });

      const normalized = port.toLowerCase().trim();
      const status = congestionData[normalized];

      if (status) {
        if (status.status === "highly_congested") {
          setCongestionStatus({
            congested: true,
            severity: "high",
            reroute: status.reroute,
          });
        } else if (status.status === "congested") {
          setCongestionStatus({
            congested: true,
            severity: "moderate",
            reroute: status.reroute,
          });
        }
      } else {
        setCongestionStatus({
          congested: false,
          severity: "none",
          reroute: null,
        });
      }

      const mapboxImageUrl = `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${lng},${lat},12,0/600x400?access_token=${MAPBOX_API_KEY}`;
      setSatelliteImageUrl(mapboxImageUrl);
    } catch (err) {
      console.error(err);
      setError("Error fetching coordinates.");
    } finally {
      setLoading(false);
    }
  };

  const handleSupplierCheck = async (e) => {
    e.preventDefault();
    setSupplierLoading(true);
    setSupplierRisk(null);
    setNews([]);

    try {
      const result = await checkSupplierRisk(supplierName, supplierLocation);
      setSupplierRisk(result.risk);
      setNews(result.articles || []);
    } catch (err) {
      console.error("Supplier risk check failed:", err);
    } finally {
      setSupplierLoading(false);
    }
  };

 const axios = require('axios');

// Twitter API credentials
const BEARER_TOKEN = 'bcba328621754156998f315f45c365bf';

import axios from "axios";
import { HfInference } from "@huggingface/inference";

const hf = new HfInference("8sdghshdjw23rbndscnks");

const fetchTweets = async (query) => {
  const url = `https://api.twitter.com/2/tweets/search/recent?query=${query}&max_results=5`;

  try {
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${BEARER_TOKEN}`,
      },
    });

    const tweets = response.data.data;
    if (tweets) {
      console.log("Recent Tweets:");
      tweets.forEach(tweet => {
        console.log(`- ${tweet.text}`);
      });

      const trendLevel = determineTrendLevel(tweets.length);
      const trendingAreas = await extractTrendingAreas(tweets);

      console.log(`Trend Level: ${trendLevel}`);
      console.log(`Trending Areas: ${trendingAreas.join(", ")}`);
    } else {
      console.log("No tweets found for the query.");
    }
  } catch (error) {
    console.error("Error fetching tweets:", error);
  }
};

const determineTrendLevel = (tweetCount) => {
  if (tweetCount > 3) {
    return "High";
  } else if (tweetCount > 1) {
    return "Medium";
  } else {
    return "Low";
  }
};

const extractTrendingAreas = async (tweets) => {
  let areas = [];

  for (const tweet of tweets) {
    const text = tweet.text;
    const nerResults = await hf.tokenClassification({
      model: "dbmdz/bert-large-cased-finetuned-conll03-english",
      inputs: text,
    });

    const locations = nerResults[0].filter(entity => entity.entity === "LOC");

    locations.forEach(loc => {
      areas.push(loc.word);
    });
  }

  return [...new Set(areas)];
};



  return (
    <>
      <div className="topbar">
        <h1>🌍 Supply Chain Early Warning System</h1>
        <div className="tabs">
          <button className={activeTab === "congestion" ? "active" : ""} onClick={() => setActiveTab("congestion")}>Port Congestion</button>
          <button className={activeTab === "supplier" ? "active" : ""} onClick={() => setActiveTab("supplier")}>Supplier Failure</button>
          <button className={activeTab === "demand" ? "active" : ""} onClick={() => setActiveTab("demand")}>Demand Surge</button>
        </div>
      </div>

      <div className="app-container">
        <div className="main-card">
          {/* Port Congestion */}
          {activeTab === "congestion" && (
            <div className="tab-content">
              <form onSubmit={handlePortCheck} className="form">
                <input type="text" placeholder="Enter a port name (e.g., Port of Shanghai)" value={port} onChange={(e) => setPort(e.target.value)} required />
                <button type="submit" disabled={loading}>{loading ? "Checking..." : "Check Port"}</button>
              </form>

              {error && <p className="error">{error}</p>}

              {coords && (
                <div className="result-card">
                  <h2>📍 Location</h2>
                  <p>Latitude: {coords.lat}</p>
                  <p>Longitude: {coords.lng}</p>

                  <h3>🚦 Congestion Status</h3>
                  {congestionStatus?.severity === "high" && <p className="high">🔴 Highly Congested — Must Reroute</p>}
                  {congestionStatus?.severity === "moderate" && <p className="moderate">🟠 Congested — Consider Rerouting</p>}
                  {congestionStatus?.severity === "none" && <p className="normal">✅ Port looks good. No congestion detected.</p>}

                  {congestionStatus?.reroute && <p className="suggestion">🔄 Suggested reroute: <strong>{congestionStatus.reroute}</strong></p>}

                  {satelliteImageUrl && (
                    <div className="satellite">
                      <h3>🛰️ Satellite View (Mapbox)</h3>
                      <img src={satelliteImageUrl} alt="Satellite of port" />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Supplier Failure */}
          {activeTab === "supplier" && (
            <div className="tab-content">
              <form onSubmit={handleSupplierCheck} className="form">
                <input type="text" placeholder="Enter supplier name" value={supplierName} onChange={(e) => setSupplierName(e.target.value)} required />
                <input type="text" placeholder="Enter location" value={supplierLocation} onChange={(e) => setSupplierLocation(e.target.value)} required />
                <button type="submit" disabled={supplierLoading}>{supplierLoading ? "Checking..." : "Check Supplier"}</button>
              </form>

              {supplierRisk && (
                <div className="result-card">
                  <h3>📊 Risk Level: {supplierRisk}</h3>
                  {supplierRisk === "High" && <p className="high">🔴 High Risk of Disruption</p>}
                  {supplierRisk === "Medium" && <p className="moderate">🟠 Medium Risk — Monitor Closely</p>}
                  {supplierRisk === "Low" && <p className="normal">✅ Low Risk — Looks Stable</p>}
                </div>
              )}

              {news.length > 0 && (
                <div className="news-section">
                  <h3>📰 Recent News</h3>
                  <ul>
                    {news.map((article, idx) => (
                      <li key={idx}>
                        <a href={article.url} target="_blank" rel="noreferrer">{article.title}</a>
                        <p>🧠 Sentiment: {article.sentiment}</p>
                        {article.indicators?.length > 0 && <p>⚠️ Issues Detected: {article.indicators.join(", ")}</p>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Demand Surge */}
          {activeTab === "demand" && (
            <div className="tab-content">
              <h2>📈 Demand Surge Detection</h2>
              <button onClick={handleDemandSurge} disabled={demandLoading}>
                {demandLoading ? "Analyzing..." : "Detect Demand Surges"}
              </button>

              {trendingProducts.length > 0 && (
                <div className="result-card">
                  <h3>🔥 Trending Products</h3>
                  <ul>
                    {trendingProducts.map((item, idx) => (
                      <li key={idx}>
                        {item.name} — Demand Score: <strong>{item.score}</strong>{" "}
                        {item.score > 85 ? "📈 Surge Alert!" : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default App;
