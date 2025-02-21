// js/main.js

import Simulation from './simulation.js';

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('simulationCanvas');
  const controls = {
    carInterval: document.getElementById('carInterval'),
    acceleration: document.getElementById('acceleration'),
    maxSpeed: document.getElementById('maxSpeed'),
  };

  const simulation = new Simulation(canvas, controls);

  // Bouton pour démarrer la simulation
  document.getElementById('startBtn').addEventListener('click', () => {
    simulation.start();
  });

  // Bouton pour arrêter la simulation
  document.getElementById('stopBtn').addEventListener('click', () => {
    simulation.stop();
  });
});
