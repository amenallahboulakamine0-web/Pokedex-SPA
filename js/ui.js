import { fetchPokemonDetails } from './api.js';
import { state } from './state.js';
import { capitalize } from './utils.js';

let statsModalInstance = null;

export function renderSkeletons(container, count = 12) {
  container.innerHTML = Array(count).fill(0).map(() => `
    <div class="col-6 col-md-4 col-lg-3">
      <div class="poke-card p-3 text-center skeleton">
        <div class="skeleton skeleton-img"></div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-btn"></div>
      </div>
    </div>
  `).join('');
}

export async function renderPokemonGrid(container, pokemonNames, isTeamView = false) {
  container.innerHTML = '';
  if (pokemonNames.length === 0) {
    container.innerHTML = `<h4 class="text-center w-100 mt-5">Aucun Pokémon trouvé.</h4>`;
    return;
  }

  // Fetch details concurrently for performance
  const detailsPromises = pokemonNames.map(name => fetchPokemonDetails(name));
  const pokemons = await Promise.all(detailsPromises);

  const row = document.createElement('div');
  row.className = 'row g-4';

  pokemons.forEach(p => {
    if (!p) return;
    const col = document.createElement('div');
    col.className = 'col-6 col-md-4 col-lg-3';
    
    const actionBtn = isTeamView 
      ? `<button class="btn btn-sm btn-danger mt-2 remove-btn" data-id="${p.id}">Retirer</button>`
      : `<button class="btn btn-sm btn-primary mt-2 add-btn" data-name="${p.name}">Ajouter</button>`;

    col.innerHTML = `
      <div class="poke-card p-3 text-center d-flex flex-column h-100">
        <div class="view-stats" data-name="${p.name}">
          <img src="${p.sprites.front_default || ''}" alt="${p.name}" class="poke-img mb-2" loading="lazy">
          <h6 class="text-capitalize fw-bold">${p.name}</h6>
          <div class="mb-2">
            ${p.types.map(t => `<span class="type-badge bg-secondary text-white">${t.type.name}</span>`).join('')}
          </div>
        </div>
        <div class="mt-auto">
          ${actionBtn}
        </div>
      </div>
    `;
    row.appendChild(col);
  });

  container.appendChild(row);
  attachCardEvents(container, isTeamView);
}

function attachCardEvents(container, isTeamView) {
  // Modal triggers
  container.querySelectorAll('.view-stats').forEach(el => {
    el.addEventListener('click', () => openStatsModal(el.dataset.name));
  });

  // Add/Remove buttons
  if (isTeamView) {
    container.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        state.removeFromTeam(parseInt(e.target.dataset.id));
        // Re-render team view immediately
        window.dispatchEvent(new Event('hashchange')); 
      });
    });
  } else {
    container.querySelectorAll('.add-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const pokemon = await fetchPokemonDetails(e.target.dataset.name);
        state.addToTeam(pokemon);
      });
    });
  }
}

export async function openStatsModal(name) {
  if (!statsModalInstance) {
    statsModalInstance = new bootstrap.Modal(document.getElementById('statsModal'));
  }
  
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');
  
  modalTitle.textContent = "Chargement...";
  modalBody.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"></div></div>';
  statsModalInstance.show();

  const p = await fetchPokemonDetails(name);
  if (!p) {
    modalBody.innerHTML = '<p class="text-danger">Erreur de chargement.</p>';
    return;
  }

  modalTitle.textContent = capitalize(p.name);
  
  const statsHtml = p.stats.map(s => `
    <div class="d-flex justify-content-between mb-1" style="font-size: 0.85rem;">
      <span class="text-uppercase">${s.stat.name}</span>
      <span class="fw-bold">${s.base_stat}</span>
    </div>
    <div class="progress mb-2" style="height: 6px;">
      <div class="progress-bar bg-success" style="width: ${(s.base_stat / 255) * 100}%"></div>
    </div>
  `).join('');

  modalBody.innerHTML = `
    <div class="text-center mb-3">
      <img src="${p.sprites.other['official-artwork'].front_default || p.sprites.front_default}" width="150" alt="${p.name}">
    </div>
    <div class="d-flex justify-content-center mb-3">
       ${p.types.map(t => `<span class="type-badge bg-dark text-white">${t.type.name}</span>`).join('')}
    </div>
    <div class="d-flex justify-content-around mb-3 text-center border-top border-bottom py-2">
      <div><small class="text-muted d-block">Taille</small><b>${p.height / 10} m</b></div>
      <div><small class="text-muted d-block">Poids</small><b>${p.weight / 10} kg</b></div>
    </div>
    <h6 class="fw-bold mt-3">Statistiques</h6>
    ${statsHtml}
  `;
}