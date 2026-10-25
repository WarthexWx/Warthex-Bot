/**
 * Warthex-Bot v2 — limpo do zero
 * Entra no servidor Bedrock e fica parado (só olha de vez em quando).
 * Assim o Falix não desliga o server.
 */
require('dotenv').config();
const bedrock = require('bedrock-protocol');
const http = require('http');

// Configuração (vem do Render Environment ou do ficheiro .env)
const HOST = process.env.MC_HOST || 'obsidianorb.falix.pro';
const PORT = Number(process.env.MC_PORT || 21188);
const USERNAME = process.env.MC_USERNAME || 'WarthexBot_24h';
const OFFLINE = String(process.env.MC_OFFLINE || 'true').toLowerCase() !== 'false';
const VERSION = process.env.MC_VERSION || '1.21.130';
const HTTP_PORT = Number(process.env.PORT || 3000);

let client = null;
let online = false;
let yaw = 0;
let pos = { x: 0, y: 80, z: 0 };
let runtimeId = 1;

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

// Página pequena para o Render não matar o processo
http.createServer((req, res) => {
  if (req.url === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ online, host: HOST, port: PORT, username: USERNAME, version: VERSION }));
    return;
  }
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end(online ? 'ONLINE' : 'connecting');
}).listen(HTTP_PORT, () => log(`HTTP na porta ${HTTP_PORT}`));

function lookAround() {
  if (!client || !online) return;
  yaw = (yaw + 20) % 360;
  const yawRad = (yaw * Math.PI) / 180;
  try {
    client.queue('player_auth_input', {
      pitch: 0,
      yaw: yawRad,
      position: pos,
      move_vector: { x: 0, z: 0 },
      head_yaw: yawRad,
      input_data: {},
      input_mode: 'mouse',
      play_mode: 'normal',
      interaction_model: 'touch',
      tick: BigInt(0),
      delta: { x: 0, y: 0, z: 0 },
      analogue_move_vector: { x: 0, z: 0 }
    });
  } catch (_) {
    try {
      client.queue('move_player', {
        runtime_id: runtimeId,
        position: pos,
        pitch: 0,
        yaw: yaw,
        head_yaw: yaw,
        mode: 'rotation',
        on_ground: true,
        ridden_runtime_id: 0,
        tick: BigInt(0)
      });
    } catch (_) {}
  }
}

function connect() {
  log(`A ligar a ${HOST}:${PORT} como ${USERNAME} (versão ${VERSION})...`);

  try {
    client = bedrock.createClient({
      host: HOST,
      port: PORT,
      username: USERNAME,
      offline: OFFLINE,
      version: VERSION
    });
  } catch (err) {
    log(`Erro ao criar client: ${err.message}`);
    setTimeout(connect, 8000);
    return;
  }

  client.on('join', () => {
    online = true;
    log('CONECTADO — bot conta como jogador ativo');
  });

  client.on('spawn', () => {
    log('Spawn OK');
    online = true;
  });

  client.on('start_game', (pkt) => {
    try {
      if (pkt.runtime_entity_id != null) runtimeId = Number(pkt.runtime_entity_id);
      if (pkt.player_position) pos = { x: pkt.player_position.x, y: pkt.player_position.y, z: pkt.player_position.z };
    } catch (_) {}
  });

  client.on('move_player', (pkt) => {
    try {
      if (pkt.position) pos = { x: pkt.position.x, y: pkt.position.y, z: pkt.position.z };
      if (typeof pkt.runtime_id === 'number') runtimeId = pkt.runtime_id;
    } catch (_) {}
  });

  client.on('disconnect', (reason) => {
    online = false;
    log(`Desconectado: ${JSON.stringify(reason)}`);
    setTimeout(connect, 8000);
  });

  client.on('close', () => {
    if (online) {
      online = false;
      log('Conexão fechada — a reconectar...');
      setTimeout(connect, 8000);
    }
  });

  client.on('error', (err) => {
    log(`Erro: ${err.message || err}`);
  });
}

// Anti-AFK: só roda a cabeça a cada 25 segundos
setInterval(lookAround, 25000);

// Arranque
connect();
