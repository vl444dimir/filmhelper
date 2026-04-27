import express from 'express';
import { getRandomMovie } from '../services/kinopoiskService.js';

const router = express.Router();

router.get('/random', async (req, res) => {
    try {
        const { genre, minRating = 0 } = req.query;
        if (!genre) return res.status(400).json({ error: 'Genre is required' });

        const movie = await getRandomMovie(genre, Number(minRating));
        if (!movie) return res.status(404).json({ error: 'Фильмы не найдены' });

        res.json({
            title: movie.name || movie.alternativeName || 'Без названия',
            rating: movie.rating?.imdb || 0,
            overview: movie.description || movie.shortDescription || 'Описание отсутствует.',
            poster: movie.poster?.url || movie.poster?.previewUrl || null,
            release_date: movie.year ? movie.year.toString() : 'Дата неизвестна'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
