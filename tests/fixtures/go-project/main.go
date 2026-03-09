package main

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/rsa"
	"crypto/ed25519"
	"crypto/ecdh"
)

func main() {
	// RSA (HIGH)
	rsaKey, _ := rsa.GenerateKey(rand.Reader, 2048)

	// ECDSA (MEDIUM)
	ecKey, _ := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)

	// Ed25519 (MEDIUM)
	_, edKey, _ := ed25519.GenerateKey(rand.Reader)

	// X25519 (HIGH)
	x25519Key, _ := ecdh.X25519().GenerateKey(rand.Reader)
}
