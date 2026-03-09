import java.security.*;
import javax.crypto.*;

public class Crypto {
    public static void main(String[] args) throws Exception {
        // RSA Key Generation (HIGH)
        KeyPairGenerator rsaGen = KeyPairGenerator.getInstance("RSA");
        rsaGen.initialize(2048);
        KeyPair rsaKeyPair = rsaGen.generateKeyPair();

        // RSA Encryption (HIGH)
        Cipher cipher = Cipher.getInstance("RSA/ECB/PKCS1Padding");

        // RSA Signing (MEDIUM)
        Signature sig = Signature.getInstance("SHA256withRSA");

        // ECDSA (MEDIUM)
        KeyPairGenerator ecGen = KeyPairGenerator.getInstance("EC");

        // DH Key Exchange (HIGH)
        KeyAgreement ka = KeyAgreement.getInstance("DH");
    }
}
