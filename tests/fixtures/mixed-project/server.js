const crypto = require("crypto");

// RSA key generation (HIGH)
const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 4096,
});

// ECDH (HIGH)
const ecdh = crypto.createECDH("secp384r1");
