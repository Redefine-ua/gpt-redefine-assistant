const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const OpenAI = require("openai");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 10000;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.get("/", (req, res) => {
  res.send("✅ GPT-помощник запущен. Добавь /analyze/:uuid в адрес.");
});

app.get("/analyze/:uuid", async (req, res) => {
  const uuid = req.params.uuid;
  console.log("📥 Получен UUID:", uuid);

  try {
    const { data: metrics, error } = await supabase
      .from("report_metrics")
      .select("*")
      .eq("patient_id", uuid.toString()); // 👈 без .order

    console.log("📊 METRICS:", metrics);

    if (error || !metrics || metrics.length === 0) {
      throw new Error("Данные не найдены или ошибка Supabase");
    }

    const prompt = `
На основе следующих данных сформируй отчет о динамике восстановления пациента за последнюю неделю. Раздели его на блоки: психологический, диетологический, телесный, поведенческий. Затем сделай общий вывод и рекомендации.

МЕТРИКИ:
${JSON.stringify(metrics, null, 2)}
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
    });

    res.send(response.choices[0].message.content);
  } catch (err) {
    res.status(500).send("❌ Ошибка при анализе данных: " + err.message);
  }
});

app.listen(port, () => {
  console.log(`✅ Сервер запущен на http://localhost:${port}`);
});
