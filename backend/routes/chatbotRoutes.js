import express from 'express';

const router = express.Router();

router.post('/recommend', async (req, res) => {
    try {
        const { description } = req.body;
        if (!description) {
            return res.status(400).json({ error: 'Описание обязательно' });
        }

        const groqKey = process.env.GROQ_API_KEY;
        if (!groqKey) {
            return res.status(500).json({ error: 'GROQ_API_KEY не настроен' });
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

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${groqKey}`
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                max_tokens: 1024
            })
        });

        if (!response.ok) {
            const err = await response.text();
            console.error('Groq API Error:', err);
            try {
                const parsed = JSON.parse(err);
                return res.status(502).json({ error: `Groq: ${parsed?.error?.message || err.slice(0, 200)}` });
            } catch {
                return res.status(502).json({ error: `Groq: ${err.slice(0, 200)}` });
            }
        }

        const data = await response.json();
        const text = data?.choices?.[0]?.message?.content;

        if (!text) {
            return res.status(502).json({ error: 'Пустой ответ от Groq' });
        }

        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            return res.status(502).json({ error: 'Не удалось распарсить ответ Groq' });
        }

        const movies = JSON.parse(jsonMatch[0]);
        res.json({ movies });
    } catch (error) {
        console.error('Chatbot error:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

export default router;
