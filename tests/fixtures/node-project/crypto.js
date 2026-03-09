const crypto = require("crypto");
const jwt = require("jsonwebtoken");

// RSA key generation (HIGH)
const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048,
});

// RSA encryption (HIGH)
const encrypted = crypto.publicEncrypt(publicKey, Buffer.from("secret"));

// DH key exchange (HIGH)
const dh = crypto.createDiffieHellman(2048);

// ECDH (HIGH)
const ecdh = crypto.createECDH("prime256v1");

// JWT RS256 (MEDIUM)
const token = jwt.sign(payload, privateKey, { algorithm: "RS256" });
