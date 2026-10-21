// ===== LÓGICA DO JOGO (JavaScript puro) =====
const cv = document.getElementById('c');
const ctx = cv.getContext('2d');
const LARGURA = 420, ALTURA = 560;

// Estado geral: 'inicio' | 'jogando' | 'pausa' | 'fim'
let estado = 'inicio';
let pontos, vidas, nivel, objetos, nave, tempoSpawn, invencivel, ultimo;

// Após o nível 20 (ou seja, a partir do 21) os asteroides também vêm na diagonal
const NIVEL_DIAGONAL = 21;
// Após o nível 30, cada nível sorteia se os asteroides vêm de frente ou na diagonal
const NIVEL_ALTERNAR = 30;
let modoNivel = 'frente'; // 'frente' | 'diagonal' (usado só após o nível 30)
let avisoDiagonal = false; // controla se o alerta já foi mostrado nesta partida

// ----- Sons (Web Audio API, sem arquivos externos) -----
let audio = null;

// O navegador só libera o áudio após uma ação do jogador (tecla ou clique)
function iniciarAudio() {
  try {
    if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === 'suspended') audio.resume();
  } catch (e) { audio = null; }
}

// Toca uma nota: frequência, atraso, duração, tipo de onda, volume e frequência final (opcional)
function nota(freq, atraso, dur, tipo, vol, freqFinal) {
  if (!audio) return;
  const t = audio.currentTime + atraso;
  const osc = audio.createOscillator();
  const ganho = audio.createGain();
  osc.type = tipo;
  osc.frequency.setValueAtTime(freq, t);
  if (freqFinal) osc.frequency.exponentialRampToValueAtTime(freqFinal, t + dur);
  ganho.gain.setValueAtTime(vol, t);
  ganho.gain.exponentialRampToValueAtTime(0.001, t + dur); // some suavemente
  osc.connect(ganho);
  ganho.connect(audio.destination);
  osc.start(t);
  osc.stop(t + dur);
}

// Efeitos do jogo
function tocarSom(nome) {
  if (nome === 'estrela') {            // coletar estrela: blip agudo
    nota(880, 0, 0.12, 'sine', 0.2, 1320);
  } else if (nome === 'dano') {        // perder vida: tom grave descendente
    nota(220, 0, 0.4, 'sawtooth', 0.2, 70);
  } else if (nome === 'nivel') {       // avançar de nível: três notas subindo
    nota(523, 0, 0.14, 'triangle', 0.25);
    nota(659, 0.12, 0.14, 'triangle', 0.25);
    nota(784, 0.24, 0.25, 'triangle', 0.25);
  } else if (nome === 'fim') {         // perder o jogo: quatro notas descendo
    // Começa um pouco depois para não encobrir o som de dano da última vida
    nota(392, 0.35, 0.22, 'triangle', 0.25);
    nota(330, 0.55, 0.22, 'triangle', 0.25);
    nota(262, 0.75, 0.22, 'triangle', 0.25);
    nota(196, 0.95, 0.6, 'triangle', 0.25, 150);
  }
}
let recorde = 0;
const teclas = {};

// Recupera o recorde salvo no navegador (se disponível)
try { recorde = +localStorage.getItem('ce_recorde') || 0; } catch (e) {}

// Zera tudo para começar uma nova partida
function iniciar() {
  pontos = 0; vidas = 3; nivel = 1;
  objetos = []; tempoSpawn = 0; invencivel = 0;
  avisoDiagonal = false;
  modoNivel = 'frente';
  iniciarAudio();
  nave = { x: LARGURA / 2, y: ALTURA - 50, w: 36 };
  estado = 'jogando';
  document.getElementById('tela').classList.add('oculto');
  ultimo = performance.now();
  requestAnimationFrame(loop);
}

// Mostra a tela sobreposta com título, texto e botão
function mostrarTela(titulo, html, rotuloBotao) {
  document.getElementById('titulo').textContent = titulo;
  document.getElementById('texto').innerHTML = html;
  document.getElementById('botao').textContent = rotuloBotao;
  document.getElementById('tela').classList.remove('oculto');
}

// Alterna entre pausa e jogo
function alternarPausa() {
  if (estado === 'jogando') {
    estado = 'pausa';
    mostrarTela('Pausado', '<p>Pressione P para continuar.</p>', 'Continuar');
  } else if (estado === 'pausa') {
    estado = 'jogando';
    document.getElementById('tela').classList.add('oculto');
    ultimo = performance.now();
    requestAnimationFrame(loop);
  }
}

// Ação do botão e da tecla F1: iniciar, reiniciar ou continuar
function acaoPrincipal() {
  iniciarAudio();
  if (estado === 'pausa') alternarPausa();
  else if (estado === 'alerta') fecharAlerta();
  else if (estado !== 'jogando') iniciar();
}

// Botão "Entendi!": fecha o alerta e retoma o jogo de onde parou
function fecharAlerta() {
  estado = 'jogando';
  document.getElementById('tela').classList.add('oculto');
  ultimo = performance.now();
  requestAnimationFrame(loop);
}

// ----- Entrada: teclado e toque -----
addEventListener('keydown', (e) => {
  if (e.key === 'F1') { e.preventDefault(); acaoPrincipal(); return; } // F1 inicia/reinicia
  if (e.key === 'p' || e.key === 'P') { alternarPausa(); return; }     // P pausa
  teclas[e.key.toLowerCase()] = true;
});
addEventListener('keyup', (e) => { teclas[e.key.toLowerCase()] = false; });
document.getElementById('botao').addEventListener('click', acaoPrincipal);

// Arrastar o dedo/mouse sobre o jogo move a nave (celular)
cv.addEventListener('pointermove', (e) => {
  if (estado !== 'jogando') return;
  const r = cv.getBoundingClientRect();
  nave.x = (e.clientX - r.left) * (LARGURA / r.width);
});

// ----- Criação de objetos que caem -----
function criarObjeto() {
  const ehEstrela = Math.random() < 0.6; // 60% estrelas, 40% asteroides
  const o = {
    tipo: ehEstrela ? 'estrela' : 'asteroide',
    r: ehEstrela ? 12 : 16 + Math.random() * 8,
    x: 20 + Math.random() * (LARGURA - 40),
    y: -30,
    vx: 0, // velocidade horizontal (0 = queda reta)
    // Dificuldade crescente: a velocidade aumenta com o nível (limitada para continuar jogável)
    vy: 110 + Math.min(nivel, 12) * 30 + Math.random() * 60,
  };
  // Níveis 21 a 30: metade dos asteroides vem na diagonal.
  // Após o nível 30: o modo sorteado para o nível vale para todos os asteroides.
  const diagonal = nivel > NIVEL_ALTERNAR ? modoNivel === 'diagonal' : Math.random() < 0.5;
  if (!ehEstrela && nivel >= NIVEL_DIAGONAL && diagonal) {
    const paraDireita = Math.random() < 0.5;
    o.vx = (paraDireita ? 1 : -1) * (70 + Math.random() * 90);
    // Nasce do lado oposto à direção, para atravessar a tela
    o.x = paraDireita
      ? 20 + Math.random() * (LARGURA * 0.5)
      : LARGURA * 0.5 + Math.random() * (LARGURA * 0.5 - 20);
  }
  objetos.push(o);
}

// ----- Atualização a cada quadro (dt = segundos desde o último quadro) -----
function atualizar(dt) {
  // Movimento da nave (setas ou A/D)
  const vel = 320;
  if (teclas['arrowleft'] || teclas['a']) nave.x -= vel * dt;
  if (teclas['arrowright'] || teclas['d']) nave.x += vel * dt;
  nave.x = Math.max(nave.w / 2, Math.min(LARGURA - nave.w / 2, nave.x));

  // Dificuldade crescente: o intervalo entre objetos diminui com o nível
  tempoSpawn -= dt;
  if (tempoSpawn <= 0) {
    criarObjeto();
    tempoSpawn = Math.max(0.25, 0.9 - nivel * 0.07);
  }
  if (invencivel > 0) invencivel -= dt;

  for (const o of objetos) {
    o.y += o.vy * dt;
    o.x += o.vx * dt; // movimento lateral (só os asteroides diagonais)
    // Colisão simples: distância entre o centro do objeto e o da nave
    const d = Math.hypot(o.x - nave.x, o.y - nave.y);
    if (!o.fim && d < o.r + nave.w / 2 - 4) {
      o.fim = true;
      if (o.tipo === 'estrela') {
        pontos += 10;
        const nivelAnterior = nivel;
        nivel = 1 + Math.floor(pontos / 50); // sobe de nível a cada 50 pontos
        tocarSom(nivel > nivelAnterior ? 'nivel' : 'estrela');
        // A cada novo nível após o 30, sorteia de novo: diagonal ou de frente
        if (nivel > nivelAnterior && nivel > NIVEL_ALTERNAR) {
          modoNivel = Math.random() < 0.5 ? 'diagonal' : 'frente';
        }
        // Ao chegar no nível das diagonais, pausa e avisa o jogador (uma vez por partida)
        if (nivel >= NIVEL_DIAGONAL && !avisoDiagonal) {
          avisoDiagonal = true;
          estado = 'alerta';
          mostrarTela('Atenção!',
            `<p>A partir do nível ${NIVEL_DIAGONAL}, os asteroides também vêm na <b>diagonal</b>.</p>` +
            '<p>O jogo está pausado até você continuar.</p>',
            'Entendi!');
        }
      } else if (invencivel <= 0) {
        vidas--;
        tocarSom('dano');
        invencivel = 1; // 1 segundo de proteção após ser atingido
        if (vidas <= 0) terminar();
      }
    }
    if (o.y > ALTURA + 40 || o.x < -40 || o.x > LARGURA + 40) o.fim = true; // saiu da tela
  }
  objetos = objetos.filter((o) => !o.fim);
}

// Fim de jogo: salva recorde e mostra a tela de resultado
function terminar() {
  estado = 'fim';
  tocarSom('fim');
  if (pontos > recorde) {
    recorde = pontos;
    try { localStorage.setItem('ce_recorde', recorde); } catch (e) {}
  }
  mostrarTela('Fim de jogo',
    `<p>Pontuação: <b>${pontos}</b></p><p>Nível alcançado: ${nivel}</p><p>Recorde: ${recorde}</p>`,
    'Jogar de novo (F1)');
}

// ----- Desenho -----
function desenharEstrela(x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const raio = i % 2 === 0 ? r : r / 2.2;
    const ang = -Math.PI / 2 + (i * Math.PI) / 5;
    ctx.lineTo(x + Math.cos(ang) * raio, y + Math.sin(ang) * raio);
  }
  ctx.closePath();
  ctx.fillStyle = '#ffd84d';
  ctx.fill();
}

// Desenha a nave (asas, fuselagem, cabine e chama do motor) centrada em (x, y)
function desenharNave(x, y) {
  ctx.save();
  ctx.translate(x, y);

  // Chama do motor: o tamanho tremula a cada quadro
  const chama = 10 + Math.random() * 8;
  ctx.beginPath();
  ctx.moveTo(-6, 20); ctx.lineTo(0, 20 + chama); ctx.lineTo(6, 20);
  ctx.closePath();
  ctx.fillStyle = '#ff9d2e';
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-3, 20); ctx.lineTo(0, 20 + chama * 0.55); ctx.lineTo(3, 20);
  ctx.closePath();
  ctx.fillStyle = '#fff3a0';
  ctx.fill();

  // Asas (esquerda e direita, espelhadas)
  ctx.fillStyle = '#d0453a';
  for (const lado of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(lado * 8, -4);
    ctx.lineTo(lado * 25, 20);
    ctx.lineTo(lado * 22, 27);
    ctx.lineTo(lado * 8, 19);
    ctx.closePath();
    ctx.fill();
    // Ponta da asa mais escura
    ctx.fillStyle = '#8f2a22';
    ctx.beginPath();
    ctx.moveTo(lado * 20, 14);
    ctx.lineTo(lado * 25, 20);
    ctx.lineTo(lado * 22, 27);
    ctx.lineTo(lado * 18, 22);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#d0453a';
  }

  // Fuselagem com degradê metálico
  const metal = ctx.createLinearGradient(-10, 0, 10, 0);
  metal.addColorStop(0, '#8ea3b8');
  metal.addColorStop(0.5, '#eef4fa');
  metal.addColorStop(1, '#8ea3b8');
  ctx.beginPath();
  ctx.moveTo(0, -30);
  ctx.quadraticCurveTo(11, -12, 9, 14);
  ctx.lineTo(5, 21);
  ctx.lineTo(-5, 21);
  ctx.lineTo(-9, 14);
  ctx.quadraticCurveTo(-11, -12, 0, -30);
  ctx.closePath();
  ctx.fillStyle = metal;
  ctx.fill();

  // Bocal do motor
  ctx.fillStyle = '#3a4254';
  ctx.fillRect(-6, 18, 12, 4);

  // Cabine de vidro
  ctx.beginPath();
  ctx.ellipse(0, -9, 4.5, 8, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#35b8e6';
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(-1.5, -12, 1.5, 3, 0, 0, Math.PI * 2); // reflexo
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.fill();

  ctx.restore();
}

function desenhar() {
  // Fundo
  ctx.fillStyle = '#0b1020';
  ctx.fillRect(0, 0, LARGURA, ALTURA);

  // Objetos
  for (const o of objetos) {
    if (o.tipo === 'estrela') {
      desenharEstrela(o.x, o.y, o.r);
    } else {
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
      ctx.fillStyle = o.vx ? '#b5707e' : '#7b8194'; // diagonais ficam avermelhados
      ctx.fill();
      ctx.beginPath(); // cratera decorativa
      ctx.arc(o.x - o.r / 3, o.y - o.r / 4, o.r / 4, 0, Math.PI * 2);
      ctx.fillStyle = '#5a6074';
      ctx.fill();
    }
  }

  // Nave (pisca enquanto está invencível)
  if (invencivel <= 0 || Math.floor(invencivel * 10) % 2 === 0) {
    desenharNave(nave.x, nave.y);
  }

  // Placar visível durante toda a partida
  ctx.fillStyle = '#eef2ff';
  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Pontos: ' + pontos, 14, 28);
  ctx.textAlign = 'center';
  ctx.fillText('Nível ' + nivel, LARGURA / 2, 28);
  ctx.textAlign = 'right';
  ctx.fillText('Vidas: ' + '♥'.repeat(Math.max(vidas, 0)), LARGURA - 14, 28);

  // Após o nível 30, mostra qual modo de asteroides vale no nível atual
  if (nivel > NIVEL_ALTERNAR) {
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillStyle = '#ffb3c0';
    ctx.textAlign = 'center';
    ctx.fillText(modoNivel === 'diagonal' ? 'Asteroides: diagonal' : 'Asteroides: de frente', LARGURA / 2, 50);
  }
}

// ----- Laço principal -----
function loop(agora) {
  if (estado !== 'jogando') return;
  const dt = Math.min((agora - ultimo) / 1000, 0.05); // limita saltos grandes
  ultimo = agora;
  atualizar(dt);
  if (estado === 'jogando') { desenhar(); requestAnimationFrame(loop); }
  else desenhar();
}

// ----- Tela inicial -----
nave = { x: LARGURA / 2, y: ALTURA - 50, w: 36 };
pontos = 0; vidas = 3; nivel = 1; objetos = [];
desenhar();
mostrarTela('Coletor Estelar',
  '<p>Colete as <b>estrelas</b> e desvie dos <b>asteroides</b>.</p>' +
  '<p>Mover: ← → ou A / D (no celular, arraste o dedo)</p>' +
  '<p>Pausar: P &nbsp;|&nbsp; Iniciar: F1 ou botão</p>',
  'Jogar (F1)');
