"""Sample Python file with quantum-vulnerable crypto."""
from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_OAEP
from cryptography.hazmat.primitives.asymmetric import rsa, ec, ed25519, x25519, dh

# RSA key generation (HIGH)
key = RSA.generate(2048)
private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)

# RSA encryption (HIGH)
cipher = PKCS1_OAEP.new(key)

# ECDSA (MEDIUM)
ec_key = ec.generate_private_key(ec.SECP256R1())

# Ed25519 (MEDIUM)
ed_key = ed25519.Ed25519PrivateKey.generate()

# X25519 key exchange (HIGH)
x_key = x25519.X25519PrivateKey.generate()

# DH (HIGH)
params = dh.generate_parameters(generator=2, key_size=2048)

# SHA-256 (LOW - quantum resistant)
import hashlib
h = hashlib.sha256(b"data")
