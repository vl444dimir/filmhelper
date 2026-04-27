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

    // Chatbot
    const chatInput = document.getElementById('chat-input');
    const chatSendBtn = document.getElementById('chat-send-btn');
    const chatLoader = document.getElementById('chat-loader');
    const chatError = document.getElementById('chat-error');
    const chatResults = document.getElementById('chat-results');

    chatSendBtn.addEventListener('click', askChatbot);
    chatInput.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            askChatbot();
        }
    });

    async function askChatbot() {
        const description = chatInput.value.trim();
        if (!description) return;

        chatSendBtn.disabled = true;
        chatLoader.classList.remove('hidden');
        chatError.classList.add('hidden');
        chatResults.classList.add('hidden');

        try {
            const res = await fetch('/api/chatbot/recommend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Ошибка сервера');
            }

            const data = await res.json();
            showChatResults(data.movies);
        } catch (err) {
            chatError.textContent = err.message;
            chatError.classList.remove('hidden');
        } finally {
            chatSendBtn.disabled = false;
            chatLoader.classList.add('hidden');
        }
    }

    function showChatResults(movies) {
        chatResults.innerHTML = '';
        chatResults.classList.remove('hidden');

        movies.forEach((movie, i) => {
            const card = document.createElement('div');
            card.className = 'chat-card';
            card.style.animationDelay = `${i * 0.08}s`;

            const top = document.createElement('div');
            top.className = 'chat-card-top';

            const title = document.createElement('div');
            title.className = 'chat-card-title';
            title.textContent = movie.title;

            const meta = document.createElement('div');
            meta.className = 'chat-card-meta';

            if (movie.imdb) {
                const imdb = document.createElement('span');
                imdb.className = 'chat-card-imdb';
                imdb.innerHTML = `<i data-feather="star"></i> ${movie.imdb.toFixed(1)}`;
                meta.appendChild(imdb);
            }

            if (movie.runtime) {
                const rt = document.createElement('span');
                rt.className = 'chat-card-runtime';
                rt.innerHTML = `<i data-feather="clock"></i> ${movie.runtime} мин`;
                meta.appendChild(rt);
            }

            top.appendChild(title);
            top.appendChild(meta);

            const desc = document.createElement('div');
            desc.className = 'chat-card-desc';
            desc.textContent = movie.description;

            card.appendChild(top);
            card.appendChild(desc);
            chatResults.appendChild(card);
        });

        feather.replace();
    }

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
        ratingEl.innerHTML = `<i data-feather="star"></i> ${movie.rating.toFixed(1)}`;
        dateEl.textContent = movie.release_date || 'Дата неизвестна';
        overviewEl.textContent = movie.overview || 'Описание отсутствует.';
        
        if (movie.poster) {
            posterEl.src = movie.poster;
            posterEl.style.display = 'block';
        } else {
            posterEl.style.display = 'none';
        }

        resultBox.classList.remove('hidden');
        feather.replace();
    }
});
