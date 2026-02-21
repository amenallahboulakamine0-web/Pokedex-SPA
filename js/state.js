class State {
  constructor() {
    this.team = JSON.parse(localStorage.getItem('pokemon_team')) || [];
  }

  saveTeam() {
    localStorage.setItem('pokemon_team', JSON.stringify(this.team));
    this.notifyTeamChange();
  }

  addToTeam(pokemon) {
    if (this.team.length >= 6) {
      alert("Votre équipe est pleine ! (Max 6)");
      return false;
    }
    if (this.team.some(p => p.id === pokemon.id)) {
      alert(`${pokemon.name} est déjà dans votre équipe !`);
      return false;
    }
    
    // Store only essential data to save localStorage space
    this.team.push({
      id: pokemon.id,
      name: pokemon.name,
      image: pokemon.sprites.front_default
    });
    this.saveTeam();
    return true;
  }

  removeFromTeam(id) {
    this.team = this.team.filter(p => p.id !== id);
    this.saveTeam();
  }

  notifyTeamChange() {
    document.getElementById('team-count').textContent = this.team.length;
    // Dispatch a custom event so UI can react if needed
    window.dispatchEvent(new Event('teamUpdated'));
  }
}

export const state = new State();