# Movie Randomizer

A web app for discovering random movies by genre, region, and minimum IMDb rating using the Kinopoisk API. Includes a wheel spinner for choosing between your own options, and an AI chatbot powered by Groq for movie recommendations.

## Features

- **Movie Randomizer** — pick genres (multi-select), region, and minimum rating to get a random movie with poster, description, and review highlights (pros/cons via Tavily search + Groq)
- **Wheel of Fortune** — add your own options, spin to pick one, elimination mode available
- **Chat Bot** — describe your mood and get 5 movie recommendations via Groq (llama-3.3-70b)
- **Theme Switcher** — 5 color schemes (Night, Day, Lavender, Emerald, Sunset), persisted in localStorage
- **Responsive** — glassmorphism UI, works on mobile and desktop

## Stack

| Component | Technology |
|---|---|
| Backend | Node.js, Express |
| Frontend | HTML, CSS, JavaScript (vanilla) |
| Movies API | [Kinopoisk API](https://kinopoisk.dev/) |
| LLM | Groq (llama-3.3-70b-versatile) |
| Web Search | Tavily |
| Icons | Feather Icons |
| Styling | Glassmorphism, CSS custom properties |

## Getting Started

### 1. Clone

```bash
git clone https://github.com/username/filmrandomizer.git
cd filmrandomizer
```

### 2. Install

```bash
npm install
```

### 3. API Keys

You need three API keys:

- [Kinopoisk API](https://kinopoisk.dev/) — movie search
- [Groq](https://console.groq.com/keys) — AI recommendations & review analysis
- [Tavily](https://tavily.com/) — web search for reviews

### 4. Environment

Create a `.env` file in the project root:

```
PORT=3000
KINOPOISK_API_KEY=your_kinopoisk_key
GROQ_API_KEY=your_groq_key
TAVILY_API_KEY=your_tavily_key
```

### 5. Run

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

## Project Structure

```
filmrandomizer/
├── backend/
│   ├── routes/
│   │   ├── movieRoutes.js
│   │   └── chatbotRoutes.js
│   ├── services/
│   │   └── kinopoiskService.js
│   └── server.js
├── frontend/
│   ├── index.html
│   ├── script.js
│   ├── style.css
│   └── wheel.js
├── .env.example
├── package.json
└── README.md
```

## License

MIT
