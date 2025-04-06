const NEWS_API_KEY = "bcba328621754156998f315f45c365bf";

async function analyzeSupplierStatus(text) {
  const response = await fetch("http://localhost:5000/api/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  const data = await response.json();

  if (!data || !Array.isArray(data) || !data[0]?.generated_text) return "unknown";

  const status = data[0].generated_text.toLowerCase();
  if (status.includes("bankruptcy")) return "High";
  if (status.includes("strike")) return "High";
  if (status.includes("shutdown")) return "High";
  if (status.includes("layoff")) return "Medium";
  if (status.includes("fraud")) return "High";
  if (status.includes("fire")) return "Medium";
  if (status.includes("stable")) return "Low";

  return "unknown";
}

export async function checkSupplierRisk(name, location) {
  const query = `${name} ${location}`;
  const res = await fetch(`https://newsapi.org/v2/everything?q=${query}&language=en&apiKey=${NEWS_API_KEY}`);
  const data = await res.json();

  const articles = data.articles?.slice(0, 5) || [];

  const analyzedArticles = await Promise.all(
    articles.map(async (article) => {
      const sentiment = await analyzeSupplierStatus(article.title + ". " + article.description);
      const indicators = [];
      if (sentiment.toLowerCase().includes("bankruptcy")) indicators.push("bankruptcy");
      if (sentiment.toLowerCase().includes("strike")) indicators.push("strike");
      if (sentiment.toLowerCase().includes("fraud")) indicators.push("fraud");
      if (sentiment.toLowerCase().includes("layoff")) indicators.push("layoff");

      return {
        title: article.title,
        url: article.url,
        sentiment,
        indicators,
      };
    })
  );

  let risk = "Low";
  if (analyzedArticles.some((a) => a.sentiment === "High")) risk = "High";
  else if (analyzedArticles.some((a) => a.sentiment === "Medium")) risk = "Medium";

  return { risk, articles: analyzedArticles };
}
