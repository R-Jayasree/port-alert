const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/analyze", async (req, res) => {
  const { text } = req.body;

  const response = await fetch(
    "https://api-inference.huggingface.co/models/google/flan-t5-large",
    {
      method: "POST",
      headers: {
        Authorization: "", 
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: `Based on the following news, what is the current operational status of the supplier? Reply with one keyword like \"stable\", \"bankruptcy\", \"strike\", \"fire\", \"fraud\", \"shutdown\", or \"layoff\".\n\nNews: ${text}`,
        parameters: { max_new_tokens: 10 },
      }),
    }
  );

  const data = await response.json();
  res.json(data);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Proxy server running on port ${PORT}`));
