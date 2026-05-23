const STORAGE_KEY = 'demoGameCatalogData';
const gameCatalog = document.getElementById('catalog');
const gameForm = document.getElementById('gameForm');
const titleInput = document.getElementById('title');
const genreInput = document.getElementById('genre');
const developerInput = document.getElementById('developer');
const linkInput = document.getElementById('link');
const descriptionInput = document.getElementById('description');
const gameCountEl = document.getElementById('gameCount');
const playsCountEl = document.getElementById('playsCount');
const sessionPlaysEl = document.getElementById('sessionPlays');
const formMessage = document.getElementById('formMessage');
const cardTemplate = document.getElementById('gameCardTemplate');

const defaultGames = [
  {
    id: 'time-bender',
    title: 'Time Bender',
    genre: 'Puzzle Adventure',
    developer: 'Nova Labs',
    description: 'Experiment with time-based mechanics and solve demo puzzles to escape each level.',
    link: 'https://example.com/demo/time-bender',
    plays: 0,
    releaseDate: '2026-03-12T00:00:00.000Z'
  },
  {
    id: 'neon-rider',
    title: 'Neon Rider',
    genre: 'Arcade Racing',
    developer: 'Studio Glitch',
    description: 'Hop into a vibrant cyber racer demo and test reflexes through a glowing city track.',
    link: 'https://example.com/demo/neon-rider',
    plays: 0,
    releaseDate: '2026-04-05T00:00:00.000Z'
  },
  {
    id: 'cosmic-chef',
    title: 'Cosmic Chef',
    genre: 'Simulation',
    developer: 'PixelPantry',
    description: 'Cook alien recipes in this cute demo kitchen while balancing time, ingredients, and flavor.',
    link: 'https://example.com/demo/cosmic-chef',
    plays: 0,
    releaseDate: '2026-05-01T00:00:00.000Z'
  },
];

let games = loadGames();
let sessionPlays = loadSessionPlays();

// Remove the three default demo entries from the site data (requested)
const defaultsToRemove = ['time-bender', 'neon-rider', 'cosmic-chef'];
const before = games.length;
games = games.filter((g) => !defaultsToRemove.includes(g.id));
if (games.length !== before) {
  saveGames();
}

function loadGames() {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultGames));
    return [...defaultGames];
  }

  try {
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      throw new Error('Storage format invalid');
    }
    return parsed;
  } catch (error) {
    console.warn('Could not parse stored games:', error);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultGames));
    return [...defaultGames];
  }
}

function saveGames() {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
}

function createGameCard(game) {
  const clone = cardTemplate.content.cloneNode(true);
  const card = clone.querySelector('.game-card');
  card.querySelector('.game-title').textContent = game.title;
  card.querySelector('.game-meta').textContent = `${game.genre} · ${game.developer}`;
  card.querySelector('.game-description').textContent = game.description;
  const countElement = card.querySelector('.play-count strong');
  countElement.textContent = game.plays;
  const playButton = card.querySelector('.play-button');
  playButton.href = game.link;
  playButton.textContent = 'Play Demo';

  playButton.addEventListener('click', (event) => {
    event.preventDefault();
    recordPlay(game.id);
    window.open(game.link, '_blank', 'noopener');
  });

  const deleteBtn = card.querySelector('.delete-button');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', (evt) => {
      evt.preventDefault();
      if (!confirm(`Delete "${game.title}" from the catalog?`)) return;
      deleteGame(game.id);
    });
  }

  return clone;
}

function renderCatalog() {
  gameCatalog.innerHTML = '';
  games.forEach((game) => {
    gameCatalog.appendChild(createGameCard(game));
  });
  updateStats();
  renderMonthlyReleases();
}

function loadSessionPlays() {
  const storedValue = window.sessionStorage.getItem('demoGameCatalogSessionPlays');
  return Number(storedValue) || 0;
}

function saveSessionPlays() {
  window.sessionStorage.setItem('demoGameCatalogSessionPlays', String(sessionPlays));
}

function updateStats() {
  gameCountEl.textContent = games.length;
  const totalPlays = games.reduce((sum, game) => sum + Number(game.plays), 0);
  playsCountEl.textContent = totalPlays;
  sessionPlaysEl.textContent = sessionPlays;
}

function computeMonthlyReleases(months = 12) {
  const map = new Map();
  const now = new Date();
  // initialize last N months keys
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    map.set(key, { date: d, count: 0 });
  }

  games.forEach((g) => {
    if (!g.releaseDate) return;
    const d = new Date(g.releaseDate);
    if (isNaN(d)) return;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (map.has(key)) {
      map.get(key).count += 1;
    }
  });

  // return array ordered newest -> oldest
  return Array.from(map.entries()).map(([key, val]) => ({ key, date: val.date, count: val.count }));
}

function renderMonthlyReleases() {
  const container = document.getElementById('monthlyReleases');
  if (!container) return;
  container.innerHTML = '';
  const rows = computeMonthlyReleases(12);
  rows.forEach((r) => {
    const label = r.date.toLocaleString(undefined, { month: 'short', year: 'numeric' });
    const el = document.createElement('div');
    el.className = 'month-badge';
    el.innerHTML = `<div>${label}</div><div style="font-weight:600;margin-top:6px">${r.count} release${r.count !== 1 ? 's' : ''}</div>`;
    container.appendChild(el);
  });
}

function recordPlay(gameId) {
  const game = games.find((item) => item.id === gameId);
  if (!game) return;

  game.plays = Number(game.plays) + 1;
  sessionPlays += 1;
  saveGames();
  saveSessionPlays();
  renderCatalog();
}

function deleteGame(gameId) {
  const before = games.length;
  games = games.filter((g) => g.id !== gameId);
  if (games.length !== before) {
    saveGames();
    renderCatalog();
    setFormMessage('Game removed from catalog.', 'success');
  }
}

function generateId(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();
}

function setFormMessage(message, type = 'success') {
  formMessage.textContent = message;
  formMessage.className = `form-message ${type}`;
}

function validateUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function handleFormSubmit(event) {
  event.preventDefault();

  const title = titleInput.value.trim();
  const genre = genreInput.value.trim();
  const developer = developerInput.value.trim();
  const link = linkInput.value.trim();
  const description = descriptionInput.value.trim() || 'Demo submission with a playable preview link.';

  if (!title || !genre || !developer || !link) {
    setFormMessage('Please complete all required fields before submitting.', 'error');
    return;
  }

  if (!validateUrl(link)) {
    setFormMessage('Please enter a valid demo URL using http:// or https://.', 'error');
    return;
  }

  const duplicate = games.some((game) => game.title.toLowerCase() === title.toLowerCase() || game.link === link);
  if (duplicate) {
    setFormMessage('A demo with the same title or link already exists. Please check your submission.', 'error');
    return;
  }

  const newGame = {
    id: generateId(title),
    title,
    genre,
    developer,
    link,
    description,
    releaseDate: new Date().toISOString(),
    plays: 0,
  };

  games = [newGame, ...games];
  saveGames();
  renderCatalog();
  gameForm.reset();
  titleInput.focus();
  setFormMessage('Your demo game has been added to the catalog!', 'success');
}

gameForm.addEventListener('submit', handleFormSubmit);

renderCatalog();
