const { generateEntitySecret } = require("@circle-fin/developer-controlled-wallets");

const secret = generateEntitySecret();
console.log("32-byte Entity Secret (Keep this safe!):");
console.log(secret);
