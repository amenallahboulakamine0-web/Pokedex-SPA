import { fetchAllPokemons, fetchTypes, fetchPokemonDetails } from './api.js';
import { renderSkeletons, renderPokemonGrid } from './ui.js';
import { state } from './state.js';
import { debounce } from './utils.js';

const appView = document.getElementById('app-view');
const searchInput = document.getElementById('searchInput');
const typeFilter = document.getElementById('typeFilter');
const themeToggle = document.getElementById('themeToggle');

let masterList = [];

async function init() {
  state.notifyTeamChange(); // Setup initial team count
  setupTheme();
  setupFilters();
  
  // Hash-based simple router
  window.addEventListener('hashchange', route);
  window.addEventListener('teamUpdated', () => {
    if(window.location.hash === '#team') route();
  });

  // Default route
  if (!window.location.hash) window.location.hash = '#home';
  else route();
}

async function route() {
  const hash = window.location.hash;
  updateNav(hash);

  if (hash === '#team') {
    renderTeamView();
  } else {
    await renderHomeView();
  }
}

function updateNav(hash) {
  document.getElementById('nav-home').classList.toggle('active', hash === '#home');
  document.getElementById('nav-team').classList.toggle('active', hash === '#team');
  
  // Hide search/filter on team page
  const searchControls = searchInput.parentElement;
  searchControls.style.display = hash === '#team' ? 'none' : 'flex';
}

async function renderHomeView() {
  appView.innerHTML = `<h2 class="mb-4 text-center">Pokédex</h2><div id="grid-container"></div>`;
  const gridContainer = document.getElementById('grid-container');
  
  if (masterList.length === 0) {
    renderSkeletons(gridContainer, 24);
    // Fetch top 151 for performance. Change to 898 for more.
    masterList = await fetchAllPokemons(151); 
  }
  
  applyFilters();
}

function renderTeamView() {
  appView.innerHTML = `<h2 class="mb-4 text-center">Mon Équipe</h2><div id="grid-container"></div>`;
  const gridContainer = document.getElementById('grid-container');
  
  if (state.team.length === 0) {
    gridContainer.innerHTML = `<div class="alert alert-info text-center">Votre équipe est vide. Allez dans le Pokédex pour ajouter des Pokémon !</div>`;
    return;
  }
  
  const teamNames = state.team.map(p => p.name);
  renderPokemonGrid(gridContainer, teamNames, true);
}

async function setupFilters() {
  // Load Types into select
  const types = await fetchTypes();
  types.forEach(type => {
    const opt = document.createElement('option');
    opt.value = type;
    opt.textContent = type;
    typeFilter.appendChild(opt);
  });

  // Attach events
  searchInput.addEventListener('input', debounce(applyFilters, 300));
  typeFilter.addEventListener('change', applyFilters);
}

async function applyFilters() {
  if (window.location.hash === '#team') return;
  
  const gridContainer = document.getElementById('grid-container');
  if(!gridContainer) return;

  const searchTerm = searchInput.value.toLowerCase().trim();
  const selectedType = typeFilter.value;

  renderSkeletons(gridContainer, 12);

  // Filter master list by search term first
  let filtered = masterList.filter(p => p.name.includes(searchTerm));

  // If a type is selected, we need to fetch details to check types
  // Optimization: limit the scope to prevent 151 simultaneous fetches
  if (selectedType) {
    const detailPromises = filtered.map(p => fetchPokemonDetails(p.name));
    const fullDetails = await Promise.all(detailPromises);
    filtered = fullDetails
      .filter(p => p && p.types.some(t => t.type.name === selectedType))
      .map(p => ({ name: p.name })); 
  }

  // Render the currently filtered items (limit to 24 for UI performance)
  const namesToRender = filtered.slice(0, 24).map(p => p.name);
  renderPokemonGrid(gridContainer, namesToRender, false);
}

function setupTheme() {
  const currentTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', currentTheme);
  updateThemeBtn(currentTheme);

  themeToggle.addEventListener('click', () => {
    const theme = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    updateThemeBtn(theme);
  });
}

function updateThemeBtn(theme) {
  themeToggle.textContent = theme === 'light' ? '🌙 Sombre' : '☀️ Clair';
  themeToggle.className = theme === 'light' ? 'btn btn-outline-dark btn-sm' : 'btn btn-outline-light btn-sm';
}

// Boot the app
init();