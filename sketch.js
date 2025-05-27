// === VARIABLES GLOBALES ===
let jugador;
let disparos = [];
let enemigos = [];
let disparosEnemigos = [];
let nivel = 1;
let vidas = 3;
let puntaje = 0;
let estado = 'inicio';
let topPuntajes = [];

// === RECURSOS ===
let imgFondo, imgJugador, imgEnemigo1, imgEnemigo2, imgEnemigo3;
let sonidoDisparo, musicaFondo;

// === PRELOAD === Carga imágenes y sonidos antes de comenzar el juego
function preload() {
  imgFondo = loadImage('assets/fondo.jpg');
  imgJugador = loadImage('assets/jugador.png');
  imgEnemigo1 = loadImage('assets/enemigo1.png');
  imgEnemigo2 = loadImage('assets/enemigo2.png');
  imgEnemigo3 = loadImage('assets/enemigo3.png');
  sonidoDisparo = loadSound('assets/disparo.mp3');
  musicaFondo = loadSound('assets/musica.mp3');
}

// === CONFIGURACIÓN ===
function setup() {
  createCanvas(600, 600);
  jugador = new Jugador();
  cargarPuntajes();

  //nivel = 3; // o 3
  //iniciarNivel(nivel);
  //estado = 'jugando';

  musicaFondo.setLoop(true);
  musicaFondo.setVolume(0.3);
  musicaFondo.play();
}

// === BUCLE PRINCIPAL ===
function draw() {
  background(imgFondo);

  if (estado === 'inicio') mostrarInicio();
  else if (estado === 'jugando') jugar();
  else if (estado === 'transicion') mostrarTransicion();
  else if (estado === 'gameover') mostrarGameOver();
  else if (estado === 'victoria') mostrarVictoria();

  if (estado === 'jugando') {
    if (keyIsDown(LEFT_ARROW)) jugador.mover(-1);
    if (keyIsDown(RIGHT_ARROW)) jugador.mover(1);
  }
}

// === CLASES ===

class Jugador {
  constructor() {
    this.x = width / 2;
    this.y = height - 60;
    this.ancho = 40;
    this.altura = 40;
    this.vel = 5; // Velocidad del jugador 
  }

  mostrar() {
    image(imgJugador, this.x, this.y, this.ancho, this.altura);
  }

  mover(dir) {
    this.x += dir * this.vel;
    this.x = constrain(this.x, 0, width - this.ancho);
  }

  disparar() {
    sonidoDisparo.play();
    disparos.push(new Disparo(this.x + this.ancho / 2 - 2, this.y));
  }
}

class Disparo {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vel = 7;
  }

  mover() {
    this.y -= this.vel;
  }

  mostrar() {
    fill(255);
    rect(this.x, this.y, 4, 10);
  }
}

class Enemigo {
  constructor(x, y, tipo = 1) {
    this.x = x;
    this.y = y;
    this.vida = tipo === 2 ? 3 : tipo === 3 ? 7 : 1; //vidas enemigos
    this.tipo = tipo;
    this.dir = 1;
  }

  mover() {
    if (nivel === 1) {
      this.y += 1;
    } else if (nivel === 2) {
      this.x += this.dir * 2;
      if (this.x <= 0 || this.x >= width - 30) this.dir *= -1;
      this.y += 0.5;
    } else {
      this.x += sin(frameCount * 0.05 + this.y) * 2;
      this.y += 1;
    }
  }

  mostrar() {
    let img = this.tipo === 1 ? imgEnemigo1 : this.tipo === 2 ? imgEnemigo2 : imgEnemigo3;
    image(img, this.x, this.y, 30, 20);
  }

  disparar() {
    if (nivel >= 2 && random(1) < 0.003 * nivel) {
      disparosEnemigos.push(new DisparoEnemigo(this.x + 15, this.y + 20));
    }
  }
}

class DisparoEnemigo {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vel = 4 + nivel;
  }

  mover() {
    this.y += this.vel;
  }

  mostrar() {
    fill('red');
    rect(this.x, this.y, 4, 10);
  }
}

// === FUNCIONES DE JUEGO ===

function jugar() {
  jugador.mostrar();

  for (let d of disparos) {
    d.mover();
    d.mostrar();
  }

  for (let e of enemigos) {
    e.mover();
    e.mostrar();
    e.disparar();

    if (e.y > height - 50) {
      perderVida();
      enemigos.splice(enemigos.indexOf(e), 1);
      break;
    }
  }

  for (let d of disparosEnemigos) {
    d.mover();
    d.mostrar();

    if (dist(d.x, d.y, jugador.x, jugador.y) < 20) {
      perderVida();
    }
  }

  for (let i = enemigos.length - 1; i >= 0; i--) {
    for (let j = disparos.length - 1; j >= 0; j--) {
      if (
        disparos[j].x > enemigos[i].x &&
        disparos[j].x < enemigos[i].x + 30 &&
        disparos[j].y > enemigos[i].y &&
        disparos[j].y < enemigos[i].y + 20
      ) {
        enemigos[i].vida--;
        if (enemigos[i].vida <= 0) {
          puntaje += enemigos[i].tipo === 1 ? 1 : enemigos[i].tipo === 2 ? 3 : 10;
          enemigos.splice(i, 1);
        }
        disparos.splice(j, 1);
        break;
      }
    }
  }

  disparos = disparos.filter(d => d.y > 0);
  disparosEnemigos = disparosEnemigos.filter(d => d.y < height);

  mostrarUI();

  if (enemigos.length === 0) {
    if (nivel === 3) {
      estado = 'victoria';
      guardarPuntaje(puntaje);
    } else {
      estado = 'transicion';
      setTimeout(() => {
        nivel++;
        iniciarNivel(nivel);
        estado = 'jugando';
      }, 2000);
    }
  }
}

function iniciarNivel(n) {
  enemigos = [];
  disparos = [];
  disparosEnemigos = [];

  if (n === 1) {
    for (let i = 0; i < 10; i++) {  //CANTIDAD DE ENEMIGOS
      enemigos.push(new Enemigo(50 + i * 50, 50, 1));
    }
  } else if (n === 2) {
    for (let i = 0; i < 8; i++) {   //CANTIDAD DE ENEMIGOS
      enemigos.push(new Enemigo(60 + i * 50, 50, 1));
    }
    enemigos.push(new Enemigo(width / 2 - 15, 100, 2));
  } else if (n === 3) {
    for (let i = 0; i < 10; i++) {  //CANTIDAD DE ENEMIGOS
      enemigos.push(new Enemigo(50 + i * 50, 50, 1));
    }
    enemigos.push(new Enemigo(150, 100, 2));
    enemigos.push(new Enemigo(350, 100, 2));
    enemigos.push(new Enemigo(width / 2 - 15, 150, 3));
  }
}

function perderVida() {
  vidas--;
  if (vidas <= 0) {
    estado = 'gameover';
    guardarPuntaje(puntaje);
  } else {
    jugador = new Jugador();
    disparos = [];
    disparosEnemigos = [];
  }
}

// === INTERFACES ===

function mostrarInicio() {
  fill(255);
  textAlign(CENTER);
  textSize(30);
  text("GALAGA - p5.js", width / 2, height / 2 - 60);
  textSize(18);
  text("Presiona ENTER para comenzar", width / 2, height / 2);
  text("Top 5 Puntajes:", width / 2, height / 2 + 50);
  for (let i = 0; i < topPuntajes.length; i++) {
    text(`${i + 1}. ${topPuntajes[i]} pts`, width / 2, height / 2 + 80 + i * 20);
  }
}

function mostrarTransicion() {
  fill(255);
  textAlign(CENTER);
  textSize(24);
  text("Nivel " + nivel, width / 2, height / 2);
}

function mostrarGameOver() {
  fill(255, 0, 0);
  textAlign(CENTER);
  textSize(32);
  text("¡GAME OVER!", width / 2, height / 2);
  textSize(18);
  text("Puntaje: " + puntaje, width / 2, height / 2 + 40);
  text("Presiona ENTER para reiniciar", width / 2, height / 2 + 70);
}

function mostrarVictoria() {
  fill(0, 255, 0);
  textAlign(CENTER);
  textSize(32);
  text("¡GANASTE!", width / 2, height / 2);
  textSize(18);
  text("Puntaje: " + puntaje, width / 2, height / 2 + 40);
  text("Presiona ENTER para reiniciar", width / 2, height / 2 + 70);
}

function mostrarUI() {
  fill(255);
  textSize(16);
  textAlign(LEFT);
  text("Vidas: " + vidas, 10, 20);
  text("Puntaje: " + puntaje, 10, 40);
  text("Nivel: " + nivel, 10, 60);
}

// === EVENTOS DE TECLADO ===

function keyPressed() {
  if (estado === 'inicio' || estado === 'gameover' || estado === 'victoria') {
    estado = 'jugando';
    nivel = 1;
    vidas = 3; //vidas
    puntaje = 0;
    jugador = new Jugador();
    iniciarNivel(nivel);
  } else if (key === ' ') {
    jugador.disparar();
  }
}

// === PUNTAJES ===

function cargarPuntajes() {
  topPuntajes = JSON.parse(localStorage.getItem('puntajes')) || [];
}

function guardarPuntaje(p) {
  topPuntajes.push(p);
  topPuntajes.sort((a, b) => b - a);
  topPuntajes = topPuntajes.slice(0, 5);
  localStorage.setItem('puntajes', JSON.stringify(topPuntajes));
}
