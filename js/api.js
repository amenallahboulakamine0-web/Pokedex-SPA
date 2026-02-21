const BASE_URL = 'https://pokeapi.co/api/v2';
const cache = new Map();

export async function fetchAllPokemons(limit = 151) {
  const cacheKey = `all_${limit}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  try {
    const res = await fetch(`${BASE_URL}/pokemon?limit=${limit}`);
    const data = await res.json();
    cache.set(cacheKey, data.results);
    return data.results;
  } catch (error) {
    console.error("Failed to fetch pokemon list:", error);
    return [];
  }
}

export async function fetchPokemonDetails(identifier) {
  if (cache.has(identifier)) return cache.get(identifier);

  try {
    const res = await fetch(`${BASE_URL}/pokemon/${identifier}`);
    if (!res.ok) throw new Error('Pokemon not found');
    const data = await res.json();
    cache.set(identifier, data);
    cache.set(data.id.toString(), data); // Cache by ID and Name
    return data;
  } catch (error) {
    console.error(`Failed to fetch details for ${identifier}:`, error);
    return null;
  }
}

export async function fetchTypes() {
  if (cache.has('types')) return cache.get('types');
  try {
    const res = await fetch(`${BASE_URL}/type`);
    const data = await res.json();
    const types = data.results.map(t => t.name).filter(t => t !== 'unknown' && t !== 'shadow');
    cache.set('types', types);
    return types;
  } catch (error) {
    return [];
  }
}