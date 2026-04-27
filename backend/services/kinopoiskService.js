import 'dotenv/config';

const KINOPOISK_API_KEY = process.env.KINOPOISK_API_KEY;
const BASE_URL = 'https://api.kinopoisk.dev/v1.4';
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

const fetchOptions = {
    method: 'GET',
    headers: {
        accept: 'application/json',
        'X-API-KEY': KINOPOISK_API_KEY
    }
};

const REGIONS = {
    usa: ['США'],
    europe: ['Великобритания', 'Франция', 'Германия', 'Италия', 'Испания', 'Нидерланды', 'Польша', 'Швеция', 'Норвегия', 'Дания', 'Финляндия', 'Бельгия', 'Австрия', 'Швейцария', 'Ирландия', 'Чехия', 'Португалия', 'Греция', 'Венгрия', 'Румыния'],
    asia: ['Япония', 'Китай', 'Южная Корея', 'Индия', 'Таиланд', 'Вьетнам', 'Тайвань', 'Гонконг', 'Сингапур', 'Филиппины', 'Индонезия', 'Малайзия'],
    russia: ['Россия', 'СССР'],
    other: ['Австралия', 'Канада', 'Мексика', 'Бразилия', 'Аргентина', 'Новая Зеландия', 'ЮАР', 'Израиль', 'Турция', 'Иран']
};

export const getRandomMovie = async (genres, minRating, region) => {
    const url = new URL(`${BASE_URL}/movie`);
    url.searchParams.append('limit', '1');
    url.searchParams.append('notNullFields', 'name');
    url.searchParams.append('notNullFields', 'poster.url');
    url.searchParams.append('type', 'movie');
    url.searchParams.append('rating.imdb', `${minRating}-10`);
    url.searchParams.append('votes.imdb', '500-10000000');

    const genreList = genres.split(',').map(g => g.trim()).filter(Boolean);
    genreList.forEach(g => url.searchParams.append('genres.name', g));

    if (region && region !== 'any' && REGIONS[region]) {
        REGIONS[region].forEach(c => url.searchParams.append('countries.name', c));
    }

    const initialRes = await fetch(url.toString(), fetchOptions);
    if (!initialRes.ok) {
        console.error('Kinopoisk API Error:', await initialRes.text());
        return null;
    }
    const initialData = await initialRes.json();

    if (!initialData.docs || initialData.docs.length === 0) {
        return null;
    }

    const maxPage = Math.min(initialData.pages, 250);
    const randomPage = Math.floor(Math.random() * maxPage) + 1;

    url.searchParams.append('page', randomPage.toString());
    const pageRes = await fetch(url.toString(), fetchOptions);
    const pageData = await pageRes.json();

    if (!pageData.docs || pageData.docs.length === 0) {
        return null;
    }

    return pageData.docs[0];
};

export const getMovieReviews = async (movieTitle) => {
    try {
        if (!movieTitle) return null;

        console.log('[Reviews] Searching Tavily for:', movieTitle);

        const tavilyRes = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                api_key: TAVILY_API_KEY,
                query: `"${movieTitle}" рецензия отзывы critique`,
                search_depth: 'advanced',
                max_results: 8
            })
        });

        if (!tavilyRes.ok) {
            console.log('[Reviews] Tavily error:', await tavilyRes.text());
            return null;
        }

        const tavilyData = await tavilyRes.json();
        const snippets = (tavilyData.results || []).map(r => r.content).filter(Boolean);

        if (snippets.length === 0) {
            console.log('[Reviews] No Tavily results');
            return null;
        }

        console.log('[Reviews] Tavily snippets count:', snippets.length);

        if (!GROQ_API_KEY) return null;

        const prompt = `На основе рецензий выдели, какие конкретные аспекты фильма хвалят, а какие ругают. Не просто эмоции, а именно про что говорят (сюжет, игра актёров, визуал, музыка, юмор, темп, концовка и т.д.). Верни ТОЛЬКО JSON без объяснений:
{
  "pros": ["сюжет захватывающий", "игра актёров", "красивый визуал", ...],
  "cons": ["затянутый темп", "слабый сценарий", ...]
}
Не больше 10 коротких фраз в каждом списке. Фразы на русском, 1-4 слова.

Фрагменты:
${snippets.map((s, i) => `[${i + 1}] ${s.slice(0, 1000)}`).join('\n\n')}`;

        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.3,
                max_tokens: 500
            })
        });

        if (!groqRes.ok) {
            console.log('[Reviews] Groq error:', await groqRes.text());
            return null;
        }

        const groqData = await groqRes.json();
        const text = groqData?.choices?.[0]?.message?.content || '';

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.log('[Reviews] No JSON in Groq response:', text.slice(0, 300));
            return null;
        }

        const result = JSON.parse(jsonMatch[0]);
        console.log('[Reviews] Groq result:', result);
        return {
            pros: (result.pros || []).slice(0, 20),
            cons: (result.cons || []).slice(0, 20)
        };

    } catch (err) {
        console.log('[Reviews] Error:', err.message);
        return null;
    }
};
