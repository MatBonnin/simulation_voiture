// js/trafficLight.js
export default class TrafficLight {
  constructor(phases) {
    // phases : tableau d'objets {color: 'green'|'yellow'|'red', duration: en ms}
    this.phases = phases;
    this.currentPhaseIndex = 0;
    this.elapsedTime = 0;
  }

  // Met à jour le feu en fonction du temps écoulé (deltaTime en ms)
  update(deltaTime) {
    this.elapsedTime += deltaTime;
    const currentPhase = this.phases[this.currentPhaseIndex];
    if (this.elapsedTime >= currentPhase.duration) {
      this.elapsedTime = 0;
      this.currentPhaseIndex =
        (this.currentPhaseIndex + 1) % this.phases.length;
    }
  }

  // Retourne la couleur actuelle du feu
  get currentColor() {
    return this.phases[this.currentPhaseIndex].color;
  }

  // Permet de réinitialiser le cycle si besoin
  reset() {
    this.currentPhaseIndex = 0;
    this.elapsedTime = 0;
  }
}
