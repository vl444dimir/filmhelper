import express from 'express';

const router = express.Router();

router.post('/recommend', async (req, res) => {
    try {
        const { description } = req.body;
        if (!description) {
            return res.status(400).json({ error: 'Описание обязательно' });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'GEMINI_API_KEY не настроен' });
        }

        const prompt = `Ты помощник по подбору фильмов. Пользователь описывает, что хочет посмотреть. Верни 5 подходящих фильмов в виде массива JSON без какого-либо дополнительного текста и markdown-разметки.

Формат каждого объекта:
{
  "title": "Название фильма (оригинальное или русское)",
  "imdb": 7.5,
  "runtime": 120,
  "description": "Короткое описание на русском, 1-2 предложения"
}

Описание пользователя: ${description}`;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 1024
                    }
                })
            }
        );

        if (!response.ok) {
            const err = await response.text();
            console.error('Gemini API Error:', err);
            return res.status(502).json({ error: 'Ошибка Gemini API' });
        }

        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            return res.status(502).json({ error: 'Пустой ответ от Gemini' });
        }

        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            return res.status(502).json({ error: 'Не удалось распарсить ответ Gemini' });
        }

        const movies = JSON.parse(jsonMatch[0]);
        res.json({ movies });
    } catch (error) {
        console.error('Chatbot error:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

export default router;
