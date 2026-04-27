import 'dotenv/config';

const KINOPOISK_API_KEY = process.env.KINOPOISK_API_KEY;
const BASE_URL = 'https://api.kinopoisk.dev/v1.4';

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

export const getMovieReviews = async (movieId) => {
    try {
        if (!movieId) {
            console.log('[Reviews] No movie ID provided');
            return null;
        }

        console.log('[Reviews] Fetching reviews for movieId:', movieId);

        const url = new URL(`${BASE_URL}/review`);
        url.searchParams.append('movieId', movieId);
        url.searchParams.append('limit', '10');
        url.searchParams.append('sortField', 'date');
        url.searchParams.append('sortType', '-1');

        const res = await fetch(url.toString(), fetchOptions);

        if (!res.ok) {
            console.log('[Reviews] API error:', res.status, await res.text());
            return null;
        }

        const data = await res.json();
        console.log('[Reviews] Found docs:', data.docs?.length || 0);
        console.log('[Reviews] First doc sample:', JSON.stringify(data.docs?.[0] || 'none').slice(0, 500));

        if (!data.docs || data.docs.length === 0) return null;

        const pros = [];
        const cons = [];

        data.docs.forEach((review, idx) => {
            const title = (review.title || review.author || '').replace(/<[^>]*>/g, '').trim();
            const desc = (review.description || '').replace(/<[^>]*>/g, '').trim();
            const text = title + ' ' + desc;
            if (!text.trim()) return;

            console.log(`[Reviews] Doc #${idx} type:`, review.type, 'text:', text.slice(0, 200));

            const words = text
                .toLowerCase()
                .split(/[,\s.?!;:()"–—/«»]+/)
                .map(w => w.replace(/[^а-яёa-z0-9]/g, '').trim())
                .filter(w => w.length > 1 && !/^\d+$/.test(w));

            const type = (review.type || '').toLowerCase();
            if (type === 'positive' || type === 'позитивный') {
                pros.push(...words);
            } else if (type === 'negative' || type === 'негативный') {
                cons.push(...words);
            } else {
                pros.push(...words.slice(0, 5));
                cons.push(...words.slice(0, 5));
            }
        });

        const result = {
            pros: [...new Set(pros)].slice(0, 20),
            cons: [...new Set(cons)].slice(0, 20)
        };

        console.log('[Reviews] Final result:', result);
        return result;
    } catch (err) {
        console.log('[Reviews] Error:', err.message);
        return null;
    }
};
