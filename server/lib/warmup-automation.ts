// server/lib/warmup-automation.ts - VERSÃO CORRIGIDA
import { getDb } from '../db';
import { chips, warmupHistory, warmupSettings } from '../../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { sendMessage } from '../whatsapp';

/**
 * Função para pausar entre mensagens
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Gera número aleatório entre min e max
 */
function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Inicia aquecimento de um chip
 */
export async function startWarmup(chipId: number): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    await db.update(chips)
    .set({
        warmupStatus: 'in_progress',
        warmupPhase: 1,
        warmupStartedAt: new Date(),
    })
    .where(eq(chips.id, chipId));

    console.log(`[Warmup] Started warmup for chip ${chipId}`);
}

/**
 * Para aquecimento de um chip
 */
export async function stopWarmup(chipId: number): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    await db.update(chips)
    .set({ warmupStatus: 'paused' })
    .where(eq(chips.id, chipId));

    console.log(`[Warmup] Stopped warmup for chip ${chipId}`);
}

/**
 * CORREÇÃO CRÍTICA: Processa envio de mensagens de aquecimento COM DELAYS
 */
export async function processWarmupMessages(chipId: number): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const chip = await db.select().from(chips).where(eq(chips.id, chipId)).limit(1);
    if (!chip[0]) throw new Error('Chip not found');

    const phase = chip[0].warmupPhase || 1;

    // Define quantas mensagens enviar baseado na fase
    let messagesToSend = 15; // Dia 1
    if (phase === 2) messagesToSend = 30;
    else if (phase >= 3 && phase <= 7) messagesToSend = 50;
    else if (phase >= 8) messagesToSend = 100;

    console.log(`[Warmup] Processing ${messagesToSend} messages for chip ${chipId} (phase ${phase})`);

    // ✅ CORREÇÃO: Envia com delays entre mensagens
    for (let i = 0; i < messagesToSend; i++) {
        const recipient = generateRandomNumber();
        const message = getWarmupMessage(phase);

        try {
            console.log(`[Warmup] Sending message ${i + 1}/${messagesToSend} to ${recipient}`);
            
            await sendMessage(chipId, recipient, message);

            // ✅ DELAY CRÍTICO ENTRE MENSAGENS (30-60 minutos)
            const delayMinutes = randomInt(30, 60); // 30-60 minutos
            const delayMs = delayMinutes * 60 * 1000; // Converter para milissegundos
            
            console.log(`[Warmup] ✅ Message ${i + 1} sent. Waiting ${delayMinutes} minutes...`);
            
            // Registra no histórico
            await db.insert(warmupHistory).values({
                chipId,
                recipientNumber: recipient,
                message,
                phase,
                sentAt: new Date(),
                success: true,
            });

            // Atualiza contador
            await db.update(chips)
                .set({ 
                    dailyMessageCount: (chip[0].dailyMessageCount || 0) + 1,
                    lastMessageSent: new Date()
                })
                .where(eq(chips.id, chipId));

            // ✅ AGUARDA O DELAY ANTES DA PRÓXIMA MENSAGEM
            if (i < messagesToSend - 1) { // Não espera após a última mensagem
                console.log(`[Warmup] ⏳ Waiting ${delayMinutes} minutes until next message...`);
                await sleep(delayMs);
            }

        } catch (error) {
            console.error(`[Warmup] Error sending message ${i + 1}:`, error);

            await db.insert(warmupHistory).values({
                chipId,
                recipientNumber: recipient,
                message,
                phase,
                sentAt: new Date(),
                success: false,
                errorMessage: (error as Error).message,
            });
            
            // Em caso de erro, espera um pouco antes de continuar
            await sleep(30000); // 30 segundos
        }
    }

    // Avança para próxima fase
    if (phase < 14) {
        await db.update(chips)
        .set({ warmupPhase: phase + 1 })
        .where(eq(chips.id, chipId));
        console.log(`[Warmup] Chip ${chipId} advanced to phase ${phase + 1}`);
    } else {
        await db.update(chips)
        .set({ warmupStatus: 'completed' })
        .where(eq(chips.id, chipId));
        console.log(`[Warmup] 🎉 Chip ${chipId} completed warmup!`);
    }
}

/**
 * Gera número aleatório para teste
 */
function generateRandomNumber(): string {
    const ddd = '11'; // São Paulo
    const prefix = '9';
    const number = Math.floor(10000000 + Math.random() * 90000000);
    return `55${ddd}${prefix}${number}`;
}

/**
 * Retorna mensagem de aquecimento baseada na fase
 */
function getWarmupMessage(phase: number): string {
    const messages = [
        'Olá! Como você está?',
        'Oi, tudo bem?',
        'Bom dia! Espero que esteja tudo bem.',
        'Boa tarde! Como vai?',
        'Oi! Tudo certo por aí?',
        'Olá! Espero que tenha um ótimo dia!',
        'Oi! Desejo tudo de bom para você!',
    ];
    return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Retorna progresso do aquecimento
 */
export async function getWarmupProgress(chipId: number) {
    const db = await getDb();
    if (!db) return null;

    const chip = await db.select().from(chips).where(eq(chips.id, chipId)).limit(1);
    if (!chip[0]) return null;

    const history = await db
        .select()
        .from(warmupHistory)
        .where(eq(warmupHistory.chipId, chipId));

    return {
        status: chip[0].warmupStatus,
        phase: chip[0].warmupPhase,
        startedAt: chip[0].warmupStartedAt,
        totalMessagesSent: history.filter(h => h.success).length,
        totalMessagesFailed: history.filter(h => !h.success).length,
    };
}

export async function getWarmupSettings(userId: number) {
    const db = await getDb();
    if (!db) return null;

    const settings = await db
        .select()
        .from(warmupSettings)
        .where(eq(warmupSettings.userId, userId))
        .limit(1);

    return settings[0] || {
        phase1Messages: 15,
        phase2Messages: 30,
        phase3Messages: 50,
        minInterval: 1800, // 30 min
        maxInterval: 3600, // 60 min
        enabled: true,
    };
}