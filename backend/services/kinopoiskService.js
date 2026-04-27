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

export const getRandomMovie = async (genre, minRating) => {
    const url = new URL(`${BASE_URL}/movie`);
    url.searchParams.append('limit', '1');
    url.searchParams.append('notNullFields', 'name');
    url.searchParams.append('notNullFields', 'poster.url');
    url.searchParams.append('genres.name', genre);
    url.searchParams.append('type', 'movie');
    url.searchParams.append('rating.imdb', `${minRating}-10`);
    url.searchParams.append('votes.imdb', '500-10000000'); 
    
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
