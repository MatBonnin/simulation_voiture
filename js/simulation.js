// js/simulation.js

import Car from './car.js';
import TrafficLight from './trafficLight.js';

export default class Simulation {
  constructor(canvas, controls) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Récupération des contrôles
    this.controls = controls;
    // Paramètres réglables
    this.carInterval = parseInt(controls.carInterval.value); // en ms
    this.acceleration = parseInt(controls.acceleration.value); // px/s²
    this.maxSpeed = parseInt(controls.maxSpeed.value); // px/s

    // Listes des voitures sur chaque route
    this.carsHorizontal = [];
    this.carsVertical = [];

    // Randomisation du feu de départ : on choisit aléatoirement quelle route commence en vert
    const randomStart = Math.random() < 0.5;
    if (randomStart) {
      // Route horizontale démarre en vert, verticale en rouge
      this.trafficLightHorizontal = new TrafficLight([
        { color: 'green', duration: 6000 },
        { color: 'yellow', duration: 2000 },
        { color: 'red', duration: 6000 },
      ]);
      this.trafficLightVertical = new TrafficLight([
        { color: 'red', duration: 6000 },
        { color: 'yellow', duration: 2000 },
        { color: 'green', duration: 6000 },
      ]);
    } else {
      // Route horizontale démarre en rouge, verticale en vert
      this.trafficLightHorizontal = new TrafficLight([
        { color: 'red', duration: 6000 },
        { color: 'yellow', duration: 2000 },
        { color: 'green', duration: 6000 },
      ]);
      this.trafficLightVertical = new TrafficLight([
        { color: 'green', duration: 6000 },
        { color: 'yellow', duration: 2000 },
        { color: 'red', duration: 6000 },
      ]);
    }

    // Gestion des timers pour l'arrivée des voitures
    this.lastCarTimeHorizontal = 0;
    this.lastCarTimeVertical = 0;

    // État de la simulation
    this.isRunning = false;

    // Pour la boucle d'animation
    this.lastTimestamp = null;
  }

  // Démarrer la simulation
  start() {
    this.isRunning = true;
    this.lastTimestamp = performance.now();
    requestAnimationFrame(this.loop.bind(this));
  }

  // Arrêter la simulation
  stop() {
    this.isRunning = false;
  }

  // Boucle principale d'animation
  loop(timestamp) {
    if (!this.isRunning) return;

    // Calculer le temps écoulé avant de mettre à jour le timestamp
    const deltaMs = timestamp - this.lastTimestamp; // en ms
    const deltaTime = deltaMs / 1000; // en secondes

    // Mettre à jour les paramètres si l'utilisateur les modifie
    this.carInterval = parseInt(this.controls.carInterval.value);
    this.acceleration = parseInt(this.controls.acceleration.value);
    this.maxSpeed = parseInt(this.controls.maxSpeed.value);

    // Mettre à jour les feux avec le temps écoulé
    this.trafficLightHorizontal.update(deltaMs);
    this.trafficLightVertical.update(deltaMs);

    // Ajouter de nouvelles voitures aléatoirement depuis les bords
    this.spawnCars(timestamp);

    // Mettre à jour la position des voitures
    this.updateCars(deltaTime);

    // Dessiner toute la scène
    this.draw();

    // Mettre à jour le timestamp de la boucle
    this.lastTimestamp = timestamp;
    requestAnimationFrame(this.loop.bind(this));
  }

  // Fonction de création des voitures
  spawnCars(timestamp) {
    // Pour la route horizontale : les voitures apparaissent avec leur centre aligné sur la ligne horizontale
    const spawnX = -10; // point de départ sur l'axe X
    const spawnYHorizontal = this.canvas.height / 2; // aligné sur la ligne horizontale
    const safeMargin = 30; // marge pour considérer que le spawn est libre

    if (
      timestamp - this.lastCarTimeHorizontal >
      this.carInterval + Math.random() * 1000
    ) {
      const newCar = new Car(
        spawnX,
        spawnYHorizontal,
        { x: 1, y: 0 },
        this.acceleration,
        this.maxSpeed
      );
      if (this.carsHorizontal.length > 0) {
        const lastCar = this.carsHorizontal[this.carsHorizontal.length - 1];
        // Si la dernière voiture est déjà loin du point de spawn, la nouvelle apparaît depuis le bord
        if (lastCar.x > spawnX + safeMargin) {
          newCar.x = spawnX;
        } else {
          // Sinon, la voiture se place derrière la dernière voiture
          newCar.x = lastCar.x - lastCar.safeDistance - lastCar.size * 2;
        }
      }
      this.carsHorizontal.push(newCar);
      this.lastCarTimeHorizontal = timestamp;
    }

    // Pour la route verticale : les voitures apparaissent avec leur centre aligné sur la ligne verticale
    const spawnY = -10; // point de départ sur l'axe Y
    const spawnXVertical = this.canvas.width / 2; // aligné sur la ligne verticale
    if (
      timestamp - this.lastCarTimeVertical >
      this.carInterval + Math.random() * 1000
    ) {
      const newCar = new Car(
        spawnXVertical,
        spawnY,
        { x: 0, y: 1 },
        this.acceleration,
        this.maxSpeed
      );
      if (this.carsVertical.length > 0) {
        const lastCar = this.carsVertical[this.carsVertical.length - 1];
        if (lastCar.y > spawnY + safeMargin) {
          newCar.y = spawnY;
        } else {
          newCar.y = lastCar.y - lastCar.safeDistance - lastCar.size * 2;
        }
      }
      this.carsVertical.push(newCar);
      this.lastCarTimeVertical = timestamp;
    }
  }

  // Mise à jour de la position des voitures
  updateCars(deltaTime) {
    // Route horizontale
    for (let i = 0; i < this.carsHorizontal.length; i++) {
      const car = this.carsHorizontal[i];
      // Si le feu horizontal est rouge ou jaune et que la voiture approche de l'intersection, elle s'arrête
      if (
        (this.trafficLightHorizontal.currentColor === 'red' ||
          this.trafficLightHorizontal.currentColor === 'yellow') &&
        car.x + car.size >= this.canvas.width / 2 - 30 &&
        car.x + car.size <= this.canvas.width / 2 + 10
      ) {
        car.stop();
      } else {
        car.resume();
      }
      // Gestion de la file d'attente
      if (i > 0) {
        const prevCar = this.carsHorizontal[i - 1];
        if (prevCar.x - car.x < car.safeDistance + car.size * 2) {
          car.stop();
        }
      }
      car.update(deltaTime);
    }
    // Suppression des voitures ayant quitté le canvas (à droite)
    this.carsHorizontal = this.carsHorizontal.filter(
      (car) => car.x - car.size < this.canvas.width
    );

    // Route verticale
    for (let i = 0; i < this.carsVertical.length; i++) {
      const car = this.carsVertical[i];
      if (
        (this.trafficLightVertical.currentColor === 'red' ||
          this.trafficLightVertical.currentColor === 'yellow') &&
        car.y + car.size >= this.canvas.height / 2 - 30 &&
        car.y + car.size <= this.canvas.height / 2 + 10
      ) {
        car.stop();
      } else {
        car.resume();
      }
      if (i > 0) {
        const prevCar = this.carsVertical[i - 1];
        if (prevCar.y - car.y < car.safeDistance + car.size * 2) {
          car.stop();
        }
      }
      car.update(deltaTime);
    }
    // Suppression des voitures ayant quitté le canvas (en bas)
    this.carsVertical = this.carsVertical.filter(
      (car) => car.y - car.size < this.canvas.height
    );
  }

  // Dessin de l'ensemble de la scène
  draw() {
    // Effacer le canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Dessiner les routes (traits horizontaux et verticaux centrés)
    this.ctx.strokeStyle = 'gray';
    this.ctx.lineWidth = 4;
    // Route horizontale
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.canvas.height / 2);
    this.ctx.lineTo(this.canvas.width, this.canvas.height / 2);
    this.ctx.stroke();
    // Route verticale
    this.ctx.beginPath();
    this.ctx.moveTo(this.canvas.width / 2, 0);
    this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
    this.ctx.stroke();

    // Dessiner les voitures
    this.carsHorizontal.forEach((car) => car.draw(this.ctx));
    this.carsVertical.forEach((car) => car.draw(this.ctx));

    // Dessiner les feux près de l'intersection
    // Pour la route horizontale, on dessine le feu en orientation horizontale
    this.drawTrafficLight(
      this.ctx,
      this.canvas.width / 2 - 100,
      this.canvas.height / 2 - 40,
      this.trafficLightHorizontal.currentColor,
      'horizontal'
    );
    // Pour la route verticale, on laisse le dessin vertical classique
    this.drawTrafficLight(
      this.ctx,
      this.canvas.width / 2 + 20,
      this.canvas.height / 2 - 70,
      this.trafficLightVertical.currentColor
    );
  }

  /**
   * Dessine un feu tricolore.
   * @param {CanvasRenderingContext2D} ctx Le contexte de dessin.
   * @param {number} x La coordonnée x du coin supérieur gauche du boîtier.
   * @param {number} y La coordonnée y du coin supérieur gauche du boîtier.
   * @param {string} currentColor La couleur active ('red', 'yellow', 'green').
   * @param {string} [orientation="vertical"] Orientation du feu ("vertical" ou "horizontal").
   */
  drawTrafficLight(ctx, x, y, currentColor, orientation = 'vertical') {
    if (orientation === 'vertical') {
      // Boîtier vertical
      ctx.fillStyle = 'black';
      ctx.fillRect(x, y, 20, 60);

      const colors = ['red', 'yellow', 'green'];
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(x + 10, y + 10 + i * 20, 7, 0, Math.PI * 2);
        ctx.fillStyle = colors[i] === currentColor ? colors[i] : '#555';
        ctx.fill();
        ctx.strokeStyle = 'black';
        ctx.stroke();
      }
    } else if (orientation === 'horizontal') {
      // Boîtier horizontal
      ctx.fillStyle = 'black';
      ctx.fillRect(x, y, 60, 20);

      const colors = ['red', 'yellow', 'green'];
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        // Chaque cercle est espacé horizontalement
        ctx.arc(x + 10 + i * 20, y + 10, 7, 0, Math.PI * 2);
        ctx.fillStyle = colors[i] === currentColor ? colors[i] : '#555';
        ctx.fill();
        ctx.strokeStyle = 'black';
        ctx.stroke();
      }
    }
  }
}
