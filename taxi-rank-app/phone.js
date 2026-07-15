const os = require("os");
const qrcode = require("qrcode-terminal");

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Find IPv4 and non-internal loopback address
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
}

const localIp = getLocalIp();
const port = 3000;
const url = `http://${localIp}:${port}`;

console.log("\n=== E-RANK MOBILE TESTING QR CODE ===");
console.log(`\nLocal Server URL: ${url}`);
console.log("Scan the QR code below with your phone camera to open the app on your mobile browser:\n");

qrcode.generate(url, { small: true });

console.log("======================================\n");
