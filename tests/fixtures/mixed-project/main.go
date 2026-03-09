package main

import (
	"crypto/rsa"
	"crypto/rand"
)

func main() {
	// RSA (HIGH)
	key, _ := rsa.GenerateKey(rand.Reader, 2048)
	_ = key
}
