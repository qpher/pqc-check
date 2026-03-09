"""Python crypto in a mixed project."""
from Crypto.PublicKey import RSA

# RSA key generation (HIGH)
key = RSA.generate(4096)
