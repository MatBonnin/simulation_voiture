// js/car.js
export default class Car {
  constructor(startX, startY, direction, acceleration, maxSpeed) {
    this.x = startX;
    this.y = startY;
    this.direction = direction; // objet { x, y } normalisé
    this.speed = 0;
    this.acceleration = acceleration; // px/s²
    this.maxSpeed = maxSpeed; // px/s
    this.size = 8; // rayon de la voiture
    this.isMoving = true;
    this.safeDistance = 15; // distance minimale avec la voiture précédente
  }

  // Mise à jour de la position selon deltaTime (en secondes)
  update(deltaTime) {
    if (this.isMoving && this.speed < this.maxSpeed) {
      this.speed += this.acceleration * deltaTime;
      if (this.speed > this.maxSpeed) this.speed = this.maxSpeed;
    }
    this.x += this.direction.x * this.speed * deltaTime;
    this.y += this.direction.y * this.speed * deltaTime;
  }

  stop() {
    this.isMoving = false;
    this.speed = 0;
  }

  resume() {
    this.isMoving = true;
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = 'blue';
    ctx.fill();
    ctx.strokeStyle = 'black';
    ctx.stroke();
  }
}
