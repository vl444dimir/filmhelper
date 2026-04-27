document.addEventListener('DOMContentLoaded', () => {
    feather.replace();

    // Theme switcher
    const themeBtn = document.getElementById('theme-btn');
    const themePopup = document.getElementById('theme-popup');
    const themeOptions = document.querySelectorAll('.theme-option');

    const savedTheme = localStorage.getItem('theme') || 'night';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeOptions.forEach(opt => {
        opt.classList.toggle('active', opt.dataset.theme === savedTheme);
    });

    themeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        themePopup.classList.toggle('hidden');
    });

    document.addEventListener('click', () => themePopup.classList.add('hidden'));

    themeOptions.forEach(opt => {
        opt.addEventListener('click', (e) => {
            e.stopPropagation();
            const theme = opt.dataset.theme;
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
            themeOptions.forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            themePopup.classList.add('hidden');
        });
    });

    // Tab switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
            if (btn.dataset.tab === 'wheel') {
                window.dispatchEvent(new Event('wheel-tab-shown'));
            }
        });
    });

    const genreSelect = document.getElementById('genre-select');
    const ratingInput = document.getElementById('rating-input');
    const searchBtn = document.getElementById('search-btn');
    
    const resultBox = document.getElementById('result-box');
    const loader = document.getElementById('loader');
    const errorBox = document.getElementById('error-message');

    const titleEl = document.getElementById('movie-title');
    const posterEl = document.getElementById('movie-poster');
    const ratingEl = document.getElementById('movie-rating');
    const dateEl = document.getElementById('movie-date');
    const overviewEl = document.getElementById('movie-overview');

    searchBtn.addEventListener('click', searchRandomMovie);

    async function searchRandomMovie() {
        const genreId = genreSelect.value;
        const minRating = ratingInput.value || 0;

        if (!genreId) {
            showError('Пожалуйста, выберите жанр.');
            return;
        }

        uiStateLoading();

        try {
            const response = await fetch(`/api/movies/random?genre=${genreId}&minRating=${minRating}`);
            
            if (!response.ok) {
                if (response.status === 404) throw new Error('Фильмы не найдены, попробуйте изменить параметры.');
                throw new Error('Ошибка сервера при поиске фильма.');
            }

            const movie = await response.json();
            showResult(movie);
        } catch (error) {
            showError(error.message);
        }
    }

    function uiStateLoading() {
        resultBox.classList.add('hidden');
        errorBox.classList.add('hidden');
        loader.classList.remove('hidden');
        searchBtn.disabled = true;
    }

    function showError(message) {
        loader.classList.add('hidden');
        searchBtn.disabled = false;
        errorBox.textContent = message;
        errorBox.classList.remove('hidden');
    }

    function showResult(movie) {
        loader.classList.add('hidden');
        searchBtn.disabled = false;
        
        titleEl.textContent = movie.title;
        ratingEl.innerHTML = `⭐ ${movie.rating.toFixed(1)}`;
        dateEl.textContent = movie.release_date || 'Дата неизвестна';
        overviewEl.textContent = movie.overview || 'Описание отсутствует.';
        
        if (movie.poster) {
            posterEl.src = movie.poster;
            posterEl.style.display = 'block';
        } else {
            posterEl.style.display = 'none';
        }

        resultBox.classList.remove('hidden');
    }
});
