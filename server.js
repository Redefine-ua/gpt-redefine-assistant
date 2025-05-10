const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const OpenAI = require("openai");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 10000; // Render ждёт 10000

// 🔗 Подключение к Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// 🤖 Подключение к OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ✅ Главная страница
app.get("/", (req, res) => {
  res.send("✅ GPT-помощник запущен. Добавь /analyze/:uuid в адрес.");
});

// 📊 Анализ по UUID пациента
app.get("/analyze/:uuid", async (req, res) => {
  const uuid = req.params.uuid;

  try {
    const { data: metrics, error } = await supabase
      .from("report_metrics")
      .select("*")
      .eq("patient_id", uuid)
      .order("report_date", { ascending: true });

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

// 🚀 Запуск сервера
app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});
