const NEWS_API_KEY = "bcba328621754156998f315f45c365bf";

const RISK_KEYWORDS = ["bankruptcy", "strike", "fire", "fraud", "lawsuit", "shutdown", "layoff"];

export async function checkSupplierRisk(supplierName, location) {
  try {
    const query = `${supplierName} ${location}`;
    const newsResponse = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&language=en&apiKey=${NEWS_API_KEY}`
    );
    const newsData = await newsResponse.json();

    if (!newsData.articles || newsData.articles.length === 0) {
      return { risk: "Unknown", articles: [], message: "No relevant news found." };
    }

    const analyzedArticles = [];

    for (let article of newsData.articles.slice(0, 5)) {
      const combinedText = `${article.title} ${article.description || ""}`.toLowerCase();
      const status = await analyzeSupplierStatus(combinedText);
      const indicators = RISK_KEYWORDS.filter((word) => combinedText.includes(word));

      analyzedArticles.push({
        title: article.title,
        url: article.url,
        status,
        indicators,
      });
    }

    // Determine overall risk from statuses
    const statuses = analyzedArticles.map((a) => a.status);
    let overallStatus = "stable";

    for (let s of statuses) {
      if (["bankruptcy", "shutdown"].includes(s)) {
        overallStatus = s;
        break; // critical status found, break early
      } else if (["strike", "layoff", "fire", "fraud"].includes(s)) {
        overallStatus = s;
      }
    }

    return {
      risk: overallStatus,
      articles: analyzedArticles,
    };
  } catch (error) {
    console.error("Supplier risk check failed:", error);
    return { risk: "Unknown", error: true };
  }
}


async function analyzeSupplierStatus(text) {
  const response = await fetch(
    "https://api-inference.huggingface.co/models/google/flan-t5-base",

    {
      method: "POST",
      headers: {
        Authorization: "Bearer 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",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: `Based on the following news, what is the current operational status of the supplier? Tesla Location : Berlin Reply with one keyword like "stable", "bankruptcy", "strike", "fire", "fraud", "shutdown", or "layoff".\n\n`,
        parameters: { max_new_tokens: 10 },
      }),
    }
  );

  const data = await response.json();
  console.log("Supplier Status Response:", data);

  if (!data || !Array.isArray(data) || !data[0]?.generated_text) return "unknown";

  const status = data[0].generated_text.toLowerCase();
  if (status.includes("bankruptcy")) return "bankruptcy";
  if (status.includes("strike")) return "strike";
  if (status.includes("fire")) return "fire";
  if (status.includes("fraud")) return "fraud";
  if (status.includes("shutdown")) return "shutdown";
  if (status.includes("layoff")) return "layoff";
  if (status.includes("stable")) return "stable";
  return "unknown";
}
