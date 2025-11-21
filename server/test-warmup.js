// Teste simples dos delays
console.log("🧪 TESTANDO DELAYS DO AQUECIMENTO...");

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function testDelays() {
    for (let i = 0; i < 3; i++) {
        console.log(`📤 Mensagem ${i + 1} enviada`);
        
        // Simula o delay de 30-60 minutos (vamos usar segundos para teste)
        const delayMinutes = Math.floor(Math.random() * 5) + 2; // 2-7 segundos para teste
        console.log(`⏰ Aguardando ${delayMinutes} segundos...`);
        
        await sleep(delayMinutes * 1000);
    }
    console.log("✅ TESTE CONCLUÍDO! Delays funcionando!");
}

testDelays();