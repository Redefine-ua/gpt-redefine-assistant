const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const OpenAI = require("openai");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

// Подключение к Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Подключение к OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Главная страница
app.get("/", (req, res) => {
  res.send("✅ GPT-помощник запущен. Добавь /analyze/:uuid в адрес.");
});

// Анализ пациента по UUID
app.get("/analyze/:uuid", async (req, res) => {
  const uuid = req.params.uuid;

  try {
    const { data: metrics, error } = await supabase
      .from("report_metrics")
      .select("*")
      .eq("patient_id", uuid)
      .order("date", { ascending: true });

    if (error || !metrics) throw new Error("Ошибка при получении данных");

    const prompt = `
На основе следующих данных сформируй отчет о динамике восстановления пациента за последнюю неделю. Раздели его на блоки: психологический, диетологический, телесный, поведенческий. Затем сделай общий вывод и рекомендации.

МЕТРИКИ:
${JSON.stringify(metrics, null, 2)}
    `;

    const chat = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
    });

    res.send(chat.choices[0].message.content);
  } catch (error) {
    res.status(500).send("❌ Ошибка при анализе данных: " + error.message);
  }
});

app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});
