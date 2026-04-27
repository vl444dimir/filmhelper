import express from 'express';
import { getRandomMovie, getMovieReviews } from '../services/kinopoiskService.js';

const router = express.Router();

router.get('/random', async (req, res) => {
    try {
        const { genres = 'боевик', minRating = 0, region = 'any' } = req.query;
        if (!genres) return res.status(400).json({ error: 'Genres are required' });

        const movie = await getRandomMovie(genres, Number(minRating), region);
        if (!movie) return res.status(404).json({ error: 'Фильмы не найдены' });

        let reviews = null;
        if (movie.id) {
            reviews = await getMovieReviews(movie.id);
        }

        res.json({
            id: movie.id,
            title: movie.name || movie.alternativeName || 'Без названия',
            rating: movie.rating?.imdb || 0,
            overview: movie.description || movie.shortDescription || 'Описание отсутствует.',
            poster: movie.poster?.url || movie.poster?.previewUrl || null,
            release_date: movie.year ? movie.year.toString() : 'Дата неизвестна',
            genres: (movie.genres || []).map(g => g.name).join(', '),
            countries: (movie.countries || []).map(c => c.name).join(', '),
            reviews: reviews ? { pros: reviews.pros, cons: reviews.cons } : null
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
