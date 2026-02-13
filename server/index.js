import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import makeWASocket, {
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    Browsers,
    downloadMediaMessage
} from '@whiskeysockets/baileys';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import { Ollama } from 'ollama';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { Boom } from '@hapi/boom';

dotenv.config();

// Inicializar Firebase Admin
try {
    const serviceAccount = JSON.parse(readFileSync('./firebase-admin-key.json', 'utf8'));
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log('🔔 Firebase Admin inicializado correctamente');
} catch (error) {
    console.error('⚠️ Error inicializando Firebase Admin:', error.message);
}

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    allowEIO3: true,
    pingInterval: 10000,
    pingTimeout: 5000,
    transports: ['websocket', 'polling']
});

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

let botActive = true;
let aiInstructions = '';
let businessPlan = '';
let sock = null; // Instancia de Baileys
let pushTokens = new Set();

// ============================================
// 🛡️ FUNCIONES ANTI-BAN (Adaptadas a Baileys)
// ============================================

const randomDelay = (minSeconds, maxSeconds) => {
    const ms = Math.floor(Math.random() * (maxSeconds - minSeconds + 1) + minSeconds) * 1000;
    return new Promise(resolve => setTimeout(resolve, ms));
};

const simulateHumanBehavior = async (key, responseLength) => {
    try {
        await sock.readMessages([key]);
        const initialDelay = Math.random() * 1.5 + 0.5;
        await new Promise(resolve => setTimeout(resolve, initialDelay * 1000));
        await sock.sendPresenceUpdate('composing', key.remoteJid);
        const baseTypingTime = responseLength / 15;
        const typingTimeSeconds = Math.min(Math.max(baseTypingTime, 2), 7);
        await new Promise(resolve => setTimeout(resolve, typingTimeSeconds * 1000));
        await sock.sendPresenceUpdate('paused', key.remoteJid);
    } catch (e) {
        console.log('⚠️ Error en simulación humana:', e.message);
    }
};

// Rate Limiting & Queue
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW = 60000;
let messageTimestamps = [];

const isRateLimited = () => {
    const now = Date.now();
    messageTimestamps = messageTimestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW);
    if (messageTimestamps.length >= RATE_LIMIT_MAX) return true;
    messageTimestamps.push(now);
    return false;
};

let messageQueue = [];
let isProcessingQueue = false;

const addToQueue = (handler) => {
    messageQueue.push(handler);
    processQueue();
};

const processQueue = async () => {
    if (isProcessingQueue || messageQueue.length === 0) return;
    isProcessingQueue = true;
    while (messageQueue.length > 0) {
        const handler = messageQueue.shift();
        try { await handler(); } catch (e) { console.error('❌ Error en cola:', e.message); }
        await randomDelay(1, 2);
    }
    isProcessingQueue = false;
};

// ============================================
// 🛠️ CONEXIÓN BAILEYS
// ============================================

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
        version,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
        },
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: Browsers.macOS('Desktop'),
        syncFullHistory: false
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('🔔 NUEVO QR RECIBIDO');
            io.emit('whatsapp-qr', qr);
        }

        if (connection === 'close') {
            const statusCode = (lastDisconnect.error instanceof Boom)
                ? lastDisconnect.error.output.statusCode
                : null;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            console.log(`🔄 Conexión cerrada (Cód: ${statusCode}). Razón: ${lastDisconnect.error?.message}. Reconectando: ${shouldReconnect}`);
            io.emit('whatsapp-status', 'disconnected');
            if (shouldReconnect) {
                setTimeout(() => connectToWhatsApp(), 5000);
            }
        } else if (connection === 'open') {
            console.log('✅ WhatsApp Conectado y Listo');
            io.emit('whatsapp-status', 'ready');
            fetchAndEmitGroups();
        } else {
            console.log('⏳ Estado de conexión:', connection || 'esperando...');
        }
    });

    async function fetchAndEmitGroups() {
        try {
            const groups = await sock.groupFetchAllParticipating();
            const groupList = Object.values(groups).map(g => ({
                id: g.id,
                name: g.subject
            }));
            io.emit('groups-list', groupList);
        } catch (e) {
            console.error('Error obteniendo grupos:', e.message);
        }
    }

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        for (const m of messages) {
            if (!m.message || m.key.fromMe) continue;
            const jid = m.key.remoteJid;
            const messageBody = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || "";

            // Lógica para detectar imágenes
            let imageBase64 = null;
            if (m.message.imageMessage) {
                try {
                    console.log('🖼️ Descargando imagen para análisis...');
                    const buffer = await downloadMediaMessage(m, 'buffer', {});
                    imageBase64 = buffer.toString('base64');
                } catch (e) {
                    console.error('❌ Error descargando imagen:', e.message);
                }
            }

            if (jid.endsWith('@g.us')) {
                const { data: config } = await supabase.from('group_configs').select('*').eq('group_id', jid).maybeSingle();
                if (!config || !config.is_active) continue;
                m.customPrompt = config.custom_prompt;
                m.isGroup = true;
            } else if (!botActive && !m.message.imageMessage) { // Si el bot global está apagado, no procesar (a menos que sea imagen y quieras forzarlo, pero mejor respetar botActive)
                if (!botActive) continue;
            }

            if (isRateLimited()) continue;
            console.log(`📩 Mensaje de ${jid}: "${messageBody}" ${imageBase64 ? '(con imagen)' : ''}`);
            addToQueue(async () => { await processMessage(m, jid, messageBody, imageBase64); });
        }
    });
}

// ============================================
// 🤖 PROCESAMIENTO CON IA (CON ROTACIÓN DE LLAVES)
// ============================================

const ollamaKeys = [
    process.env.OLLAMA_API_KEY,
    "633035574708423183ccebb96e54ac41.q3fuiDDxkVjWXhn2egGfAg0a",
    "8c8db013aa214c1eaee7a13748b1d239.lPiLdPR45Vr9hujYX3CC7d6o"
].filter(k => k);

let keyStatus = ollamaKeys.map((key, index) => ({
    id: index,
    keyHash: key.substring(0, 8) + '...',
    used: 0,
    total: 200,
    status: 'idle',
    lastError: null
}));

function updateKeyStatus(index, status, isUsage = false) {
    if (!keyStatus[index]) return;
    keyStatus[index].status = status;
    if (isUsage) keyStatus[index].used = Math.min(keyStatus[index].used + 1, 200);
    io.emit('api-keys-status', keyStatus);
}

let currentKeyIndex = 0;

const processMessage = async (rawMessage, jid, messageBody, imageBase64 = null) => {
    try {
        const logContent = imageBase64 ? `[Imagen enviada] ${messageBody}` : messageBody;
        await supabase.from('chat_logs').insert([{ wa_id: jid, message: logContent, role: 'user' }]);

        const { data: history } = await supabase.from('chat_logs').select('role, message').eq('wa_id', jid).order('created_at', { ascending: false }).limit(2);

        const formattedHistory = (history || [])
            .reverse()
            .map(msg => ({
                role: msg.role === 'assistant' ? 'assistant' : 'user',
                content: msg.message
            }));

        let chatResponse = null;
        let attempts = 0;

        while (!chatResponse && attempts < ollamaKeys.length) {
            const currentKey = ollamaKeys[currentKeyIndex];
            const ollamaClient = new Ollama({
                host: process.env.OLLAMA_HOST,
                headers: { 'Authorization': `Bearer ${currentKey}` }
            });

            try {
                updateKeyStatus(currentKeyIndex, 'active');
                const systemPrompt = rawMessage.customPrompt
                    ? `Instrucciones específicas para este GRUPO: ${rawMessage.customPrompt}\nContexto del Negocio: ${businessPlan}`
                    : `Negocio: ${businessPlan}\nInstrucciones Generales: ${aiInstructions}\nUsa [INTERVENCION_NECESARIA] si el cliente solicita un humano.\n[Tags: [VENTA_DETECTADA], [NUEVO_LEAD], [INTERVENCION_NECESARIA]]`;

                const chatRequest = {
                    model: process.env.OLLAMA_MODEL || 'gemini-3-flash-preview',
                    messages: [{ role: 'system', content: systemPrompt }, ...formattedHistory]
                };

                // Si hay imagen, la añadimos al último mensaje del usuario
                if (imageBase64) {
                    const lastUserMsg = chatRequest.messages[chatRequest.messages.length - 1];
                    if (lastUserMsg && lastUserMsg.role === 'user') {
                        lastUserMsg.images = [imageBase64];
                        lastUserMsg.content = messageBody || "Analiza esta imagen por favor.";
                    }
                }

                chatResponse = await ollamaClient.chat(chatRequest);

                console.log(`🤖 IA respondió usando la llave #${currentKeyIndex + 1}`);
                updateKeyStatus(currentKeyIndex, 'idle', true);

            } catch (error) {
                console.error(`⚠️ Error con llave #${currentKeyIndex + 1}:`, error.message);
                updateKeyStatus(currentKeyIndex, 'error');
                keyStatus[currentKeyIndex].lastError = error.message;
                currentKeyIndex = (currentKeyIndex + 1) % ollamaKeys.length;
                attempts++;
                if (attempts >= ollamaKeys.length) throw new Error("❌ Todas las llaves API de Ollama están agotadas.");
            }
        }

        let aiResponse = chatResponse.message.content;
        const isSale = aiResponse.includes('[VENTA_DETECTADA]');
        const isNewLead = aiResponse.includes('[NUEVO_LEAD]');
        const needsIntervention = aiResponse.includes('[INTERVENCION_NECESARIA]');

        aiResponse = aiResponse.replace('[VENTA_DETECTADA]', '').replace('[NUEVO_LEAD]', '').replace('[INTERVENCION_NECESARIA]', '').trim();

        await simulateHumanBehavior(rawMessage.key, aiResponse.length);
        await sock.sendMessage(jid, { text: aiResponse });

        const customerName = rawMessage.pushName || 'Cliente';
        await supabase.from('chat_logs').insert([{ wa_id: jid, customer_name: customerName, message: aiResponse, role: 'assistant' }]);

        if (isSale || isNewLead || needsIntervention) {
            const status = isSale ? 'hot_lead' : (needsIntervention ? 'needs_intervention' : 'prospect');
            await supabase.from('leads').upsert([{ wa_id: jid, customer_name: customerName, status, last_interaction: new Date().toISOString() }]);
            io.emit('lead-alert', { name: customerName, status });
        }

        io.emit('new-interaction', { from: customerName, message: messageBody, response: aiResponse, isSale });
        sendPushNotification(`💬 ${customerName}`, messageBody);

    } catch (error) {
        console.error('❌ Error procesando mensaje:', error.message);
    }
};

// ============================================
// 🛠️ FUNCIONES DE APOYO
// ============================================

const sendPushNotification = async (title, body, data = {}) => {
    if (pushTokens.size === 0) return;
    try {
        await admin.messaging().sendEachForMulticast({ notification: { title, body }, data, tokens: Array.from(pushTokens) });
    } catch (e) { console.error('Push Error:', e.message); }
};

async function loadConfig() {
    try {
        const { data } = await supabase.from('bot_settings').select('key, value');
        if (data) {
            data.forEach(item => {
                if (item.key === 'is_active') botActive = item.value === 'true';
                if (item.key === 'ai_instructions') aiInstructions = item.value;
                if (item.key === 'business_plan') businessPlan = item.value;
            });
        }
    } catch (e) { console.error('Error cargando config:', e.message); }
}

// Mensajes Programados
setInterval(async () => {
    if (!sock) return;
    try {
        const { data } = await supabase.from('scheduled_messages').select('*').eq('status', 'pending');
        if (data) {
            for (const msg of data) {
                if (new Date(msg.schedule_at) <= new Date()) {
                    try {
                        const target = msg.to_number.includes('@') ? msg.to_number : `${msg.to_number}@s.whatsapp.net`;
                        if (msg.image_url) {
                            const url = msg.image_url.toLowerCase();
                            if (url.endsWith('.pdf')) {
                                await sock.sendMessage(target, {
                                    document: { url: msg.image_url },
                                    mimetype: 'application/pdf',
                                    fileName: msg.message || 'Documento.pdf',
                                    caption: msg.message
                                });
                            } else if (url.endsWith('.mp4') || url.endsWith('.mov') || url.endsWith('.avi')) {
                                await sock.sendMessage(target, {
                                    video: { url: msg.image_url },
                                    caption: msg.message
                                });
                            } else {
                                await sock.sendMessage(target, { image: { url: msg.image_url }, caption: msg.message });
                            }
                        } else {
                            await sock.sendMessage(target, { text: msg.message });
                        }
                        await supabase.from('scheduled_messages').update({ status: 'sent' }).eq('id', msg.id);
                        console.log(`✅ Mensaje programado enviado a ${msg.to_number}`);
                    } catch (e) {
                        await supabase.from('scheduled_messages').update({ status: 'failed' }).eq('id', msg.id);
                    }
                }
            }
        }
    } catch (e) { console.error('⚠️ Error en intervalo de programados:', e.message); }
}, 60000);

io.on('connection', (socket) => {
    socket.emit('bot-status-updated', botActive);
    socket.emit('api-keys-status', keyStatus);
    socket.emit('bot-settings', {
        instructions: aiInstructions,
        businessPlan: businessPlan
    });
    socket.on('register-push-token', (token) => pushTokens.add(token));
    socket.on('toggle-bot', async (active) => {
        botActive = active;
        await supabase.from('bot_settings').upsert({ key: 'is_active', value: active.toString() });
        io.emit('bot-status-updated', botActive);
    });
    socket.on('update-instructions', async (text) => {
        aiInstructions = text;
        await supabase.from('bot_settings').upsert({ key: 'ai_instructions', value: text });
        io.emit('bot-settings', { instructions: aiInstructions, businessPlan: businessPlan });
    });
    socket.on('update-business-plan', async (text) => {
        businessPlan = text;
        await supabase.from('bot_settings').upsert({ key: 'business_plan', value: text });
        io.emit('bot-settings', { instructions: aiInstructions, businessPlan: businessPlan });
    });
    socket.on('get-api-keys-status', () => { socket.emit('api-keys-status', keyStatus); });
    socket.on('get-groups', async () => {
        if (sock) {
            const groups = await sock.groupFetchAllParticipating();
            const groupList = Object.values(groups).map(g => ({ id: g.id, name: g.subject }));
            socket.emit('groups-list', groupList);
        }
    });

    socket.on('save-group-config', async (config) => {
        await supabase.from('group_configs').upsert([config]);
        console.log(`💾 Configuración guardada para grupo: ${config.group_name}`);
    });

    socket.on('get-group-settings', async () => {
        const { data } = await supabase.from('group_configs').select('*');
        socket.emit('group-settings-list', data || []);
    });
});

// ============================================
// 🛡️ MANEJO DE CIERRE Y ERRORES
// ============================================

const gracefulShutdown = async () => {
    console.log('\n🛑 Cerrando servidor de forma segura...');
    if (sock) {
        await sock.logout();
        await sock.end();
    }
    httpServer.close(() => {
        console.log('✅ Servidor HTTP cerrado');
        process.exit(0);
    });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

loadConfig().then(() => {
    connectToWhatsApp();
    httpServer.listen(PORT, '0.0.0.0', () => console.log(`🚀 Servidor Baileys en puerto ${PORT}`));
});
