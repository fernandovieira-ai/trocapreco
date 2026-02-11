const os = require('os');
const fs = require('fs');
const { execSync } = require('child_process');

// Detecta o IP local da maquina
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const localIP = getLocalIP();
const envContent = `// Arquivo gerado automaticamente pelo start-mobile.js - NAO COMMITAR
export const environment = {
  production: false,
  endPoint: "/drfPriceSwap",
  endPointSocket: "http://${localIP}:3000",
};
`;

// Gera o environment.local.ts com o IP correto
fs.writeFileSync('./src/environments/environment.local.ts', envContent);

console.log('');
console.log('===========================================');
console.log('  MODO REDE - Teste no Celular');
console.log('===========================================');
console.log(`  IP da maquina: ${localIP}`);
console.log(`  Frontend: http://${localIP}:4200`);
console.log(`  Backend:  http://${localIP}:3000`);
console.log('');
console.log('  Abra no celular (mesma rede WiFi):');
console.log(`  http://${localIP}:4200`);
console.log('===========================================');
console.log('');

// Inicia o Angular com a configuracao local
try {
  execSync(
    'ng serve --host 0.0.0.0 --proxy-config proxy.conf.js --disable-host-check --configuration local',
    { stdio: 'inherit' }
  );
} catch (e) {
  // processo encerrado pelo usuario
}
