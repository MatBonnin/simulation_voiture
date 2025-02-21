// js/simulation.js

import Car from './car.js';

// Nouvelle classe pour gérer le cycle d'un feu d'intersection de manière complémentaire
class IntersectionLight {
  constructor() {
    // Cycle en 4 phases :
    // Phase 0 : sens horizontal -> vert, vertical -> rouge (6s)
    // Phase 1 : sens horizontal -> jaune, vertical -> rouge (2s)
    // Phase 2 : sens horizontal -> rouge, vertical -> vert (6s)
    // Phase 3 : sens horizontal -> rouge, vertical -> jaune (2s)
    this.phases = [
      { horizontal: 'green', vertical: 'red', duration: 6000 },
      { horizontal: 'yellow', vertical: 'red', duration: 2000 },
      { horizontal: 'red', vertical: 'green', duration: 6000 },
      { horizontal: 'red', vertical: 'yellow', duration: 2000 },
    ];
    this.currentPhaseIndex = 0;
    // Décalage initial aléatoire pour éviter que toutes les intersections ne soient synchronisées
    this.elapsedTime = Math.random() * this.phases[0].duration;
  }

  update(deltaMs) {
    this.elapsedTime += deltaMs;
    const currentPhase = this.phases[this.currentPhaseIndex];
    if (this.elapsedTime >= currentPhase.duration) {
      this.elapsedTime = 0;
      this.currentPhaseIndex =
        (this.currentPhaseIndex + 1) % this.phases.length;
    }
  }

  get horizontalColor() {
    return this.phases[this.currentPhaseIndex].horizontal;
  }

  get verticalColor() {
    return this.phases[this.currentPhaseIndex].vertical;
  }
}

export default class Simulation {
  constructor(canvas, controls) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Récupération des contrôles utilisateur
    this.controls = controls;
    this.carInterval = parseInt(controls.carInterval.value);
    this.acceleration = parseInt(controls.acceleration.value);
    this.maxSpeed = parseInt(controls.maxSpeed.value);

    // Configuration des routes : 4 routes horizontales et 4 routes verticales espacées de manière égale.
    this.horizontalCount = 4;
    this.verticalCount = 4;
    this.horizontalRoads = [];
    this.verticalRoads = [];

    // Calcul des positions des routes horizontales
    for (let i = 0; i < this.horizontalCount; i++) {
      const y = (this.canvas.height / (this.horizontalCount + 1)) * (i + 1);
      this.horizontalRoads.push({ y: y, cars: [], lastSpawnTime: 0 });
    }
    // Calcul des positions des routes verticales
    for (let j = 0; j < this.verticalCount; j++) {
      const x = (this.canvas.width / (this.verticalCount + 1)) * (j + 1);
      this.verticalRoads.push({ x: x, cars: [], lastSpawnTime: 0 });
    }

    // Création des intersections (16 au total) : chacune possède un IntersectionLight
    this.intersections = [];
    for (let i = 0; i < this.horizontalCount; i++) {
      for (let j = 0; j < this.verticalCount; j++) {
        this.intersections.push({
          x: this.verticalRoads[j].x,
          y: this.horizontalRoads[i].y,
          light: new IntersectionLight(),
        });
      }
    }

    this.isRunning = false;
    this.lastTimestamp = null;
  }

  start() {
    this.isRunning = true;
    this.lastTimestamp = performance.now();
    requestAnimationFrame(this.loop.bind(this));
  }

  stop() {
    this.isRunning = false;
  }

  loop(timestamp) {
    if (!this.isRunning) return;

    const deltaMs = timestamp - this.lastTimestamp;
    const deltaTime = deltaMs / 1000;

    // Mise à jour des paramètres (possibilité de réglages en direct)
    this.carInterval = parseInt(this.controls.carInterval.value);
    this.acceleration = parseInt(this.controls.acceleration.value);
    this.maxSpeed = parseInt(this.controls.maxSpeed.value);

    // Mise à jour de tous les feux d'intersection
    this.intersections.forEach((inter) => {
      inter.light.update(deltaMs);
    });

    // Génération des voitures sur chaque route
    this.spawnCars(timestamp);

    // Mise à jour de la position des voitures et gestion du comportement aux intersections
    this.updateCars(deltaTime);

    // Dessin de la scène
    this.draw();

    this.lastTimestamp = timestamp;
    requestAnimationFrame(this.loop.bind(this));
  }

  spawnCars(timestamp) {
    // Routes horizontales : les voitures apparaissent à gauche et se déplacent vers la droite.
    this.horizontalRoads.forEach((road) => {
      if (
        timestamp - road.lastSpawnTime >
        this.carInterval + Math.random() * 1000
      ) {
        // Chaque voiture apparaît depuis le bord (x = -10) sans tenir compte des voitures déjà présentes
        const newCar = new Car(
          -10,
          road.y,
          { x: 1, y: 0 },
          this.acceleration,
          this.maxSpeed
        );
        road.cars.push(newCar);
        road.lastSpawnTime = timestamp;
      }
    });

    // Routes verticales : les voitures apparaissent en haut et se déplacent vers le bas.
    this.verticalRoads.forEach((road) => {
      if (
        timestamp - road.lastSpawnTime >
        this.carInterval + Math.random() * 1000
      ) {
        // Chaque voiture apparaît depuis le bord (y = -10)
        const newCar = new Car(
          road.x,
          -10,
          { x: 0, y: 1 },
          this.acceleration,
          this.maxSpeed
        );
        road.cars.push(newCar);
        road.lastSpawnTime = timestamp;
      }
    });
  }

  updateCars(deltaTime) {
    // Mise à jour pour les routes horizontales
    this.horizontalRoads.forEach((road) => {
      road.cars.forEach((car, index) => {
        // Recherche de la prochaine intersection sur cette route (celle dont l'abscisse est supérieure à celle de la voiture)
        const intersectionsOnRoad = this.intersections.filter(
          (inter) => Math.abs(inter.y - road.y) < 1 && inter.x > car.x
        );
        let nextIntersection = null;
        if (intersectionsOnRoad.length > 0) {
          nextIntersection = intersectionsOnRoad.reduce((prev, curr) =>
            curr.x - car.x < prev.x - car.x ? curr : prev
          );
        }
        if (
          nextIntersection &&
          car.x + car.size >= nextIntersection.x - 30 &&
          car.x + car.size <= nextIntersection.x + 10
        ) {
          // Utilisation de la couleur du feu horizontal (complémentaire)
          if (
            nextIntersection.light.horizontalColor === 'red' ||
            nextIntersection.light.horizontalColor === 'yellow'
          ) {
            car.stop();
          } else {
            car.resume();
          }
        } else {
          car.resume();
        }

        // Gestion de la file d'attente
        if (index > 0) {
          const prevCar = road.cars[index - 1];
          if (prevCar.x - car.x < car.safeDistance + car.size * 2) {
            car.stop();
          }
        }
        car.update(deltaTime);
      });
      // Suppression des voitures ayant dépassé le bord droit du canvas
      road.cars = road.cars.filter(
        (car) => car.x - car.size < this.canvas.width
      );
    });

    // Mise à jour pour les routes verticales
    this.verticalRoads.forEach((road) => {
      road.cars.forEach((car, index) => {
        const intersectionsOnRoad = this.intersections.filter(
          (inter) => Math.abs(inter.x - road.x) < 1 && inter.y > car.y
        );
        let nextIntersection = null;
        if (intersectionsOnRoad.length > 0) {
          nextIntersection = intersectionsOnRoad.reduce((prev, curr) =>
            curr.y - car.y < prev.y - car.y ? curr : prev
          );
        }
        if (
          nextIntersection &&
          car.y + car.size >= nextIntersection.y - 30 &&
          car.y + car.size <= nextIntersection.y + 10
        ) {
          if (
            nextIntersection.light.verticalColor === 'red' ||
            nextIntersection.light.verticalColor === 'yellow'
          ) {
            car.stop();
          } else {
            car.resume();
          }
        } else {
          car.resume();
        }

        if (index > 0) {
          const prevCar = road.cars[index - 1];
          if (prevCar.y - car.y < car.safeDistance + car.size * 2) {
            car.stop();
          }
        }
        car.update(deltaTime);
      });
      road.cars = road.cars.filter(
        (car) => car.y - car.size < this.canvas.height
      );
    });
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Dessiner les routes horizontales
    this.ctx.strokeStyle = 'gray';
    this.ctx.lineWidth = 4;
    this.horizontalRoads.forEach((road) => {
      this.ctx.beginPath();
      this.ctx.moveTo(0, road.y);
      this.ctx.lineTo(this.canvas.width, road.y);
      this.ctx.stroke();
    });

    // Dessiner les routes verticales
    this.verticalRoads.forEach((road) => {
      this.ctx.beginPath();
      this.ctx.moveTo(road.x, 0);
      this.ctx.lineTo(road.x, this.canvas.height);
      this.ctx.stroke();
    });

    // Dessiner les voitures
    this.horizontalRoads.forEach((road) => {
      road.cars.forEach((car) => car.draw(this.ctx));
    });
    this.verticalRoads.forEach((road) => {
      road.cars.forEach((car) => car.draw(this.ctx));
    });

    // Dessiner les feux aux intersections avec une taille réduite
    this.intersections.forEach((inter) => {
      // Feu horizontal (affiché en orientation horizontale, plus petit)
      this.drawTrafficLight(
        this.ctx,
        inter.x - 50,
        inter.y + 10,
        inter.light.horizontalColor,
        'horizontal'
      );
      // Feu vertical (affiché en orientation verticale, plus petit)
      this.drawTrafficLight(
        this.ctx,
        inter.x - 20,
        inter.y - 60,
        inter.light.verticalColor,
        'vertical'
      );
    });
  }

  /**
   * Dessine un feu tricolore en fonction de l'orientation avec une taille réduite.
   * @param {CanvasRenderingContext2D} ctx - Contexte de dessin.
   * @param {number} x - Coordonnée x du coin supérieur gauche.
   * @param {number} y - Coordonnée y du coin supérieur gauche.
   * @param {string} currentColor - La couleur active ('red', 'yellow', 'green').
   * @param {string} [orientation="vertical"] - "vertical" ou "horizontal".
   */
  drawTrafficLight(ctx, x, y, currentColor, orientation = 'vertical') {
    if (orientation === 'vertical') {
      // Boîtier réduit : 15 x 40 pixels
      ctx.fillStyle = 'black';
      ctx.fillRect(x, y, 15, 40);
      const colors = ['red', 'yellow', 'green'];
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(x + 7.5, y + 8 + i * 12, 4, 0, Math.PI * 2);
        ctx.fillStyle = colors[i] === currentColor ? colors[i] : '#555';
        ctx.fill();
        ctx.strokeStyle = 'black';
        ctx.stroke();
      }
    } else if (orientation === 'horizontal') {
      // Boîtier réduit : 40 x 15 pixels
      ctx.fillStyle = 'black';
      ctx.fillRect(x, y, 40, 15);
      const colors = ['red', 'yellow', 'green'];
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(x + 8 + i * 12, y + 7.5, 4, 0, Math.PI * 2);
        ctx.fillStyle = colors[i] === currentColor ? colors[i] : '#555';
        ctx.fill();
        ctx.strokeStyle = 'black';
        ctx.stroke();
      }
    }
  }
}
