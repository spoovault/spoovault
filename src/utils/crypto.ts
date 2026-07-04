import nacl from "tweetnacl";

/**
 * Base64 to Uint8Array
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Uint8Array to Base64
 */
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * String to Uint8Array
 */
export function stringToUint8Array(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

/**
 * Encrypt a plaintext message for a receiver using their base64-encoded X25519 public key.
 * Compatible with MetaMask's eth_decrypt (x25519-xsalsa20-poly1305).
 */
export function encryptWithPublicKey(message: string, receiverPubKeyBase64: string): string {
  const ephemeralKeypair = nacl.box.keyPair();
  const receiverPubKey = base64ToUint8Array(receiverPubKeyBase64);
  const messageBytes = stringToUint8Array(message);
  const nonce = nacl.randomBytes(nacl.box.nonceLength);

  const ciphertext = nacl.box(
    messageBytes,
    nonce,
    receiverPubKey,
    ephemeralKeypair.secretKey
  );

  const payload = {
    version: "x25519-xsalsa20-poly1305",
    nonce: uint8ArrayToBase64(nonce),
    ephemPublicKey: uint8ArrayToBase64(ephemeralKeypair.publicKey),
    ciphertext: uint8ArrayToBase64(ciphertext),
  };

  return JSON.stringify(payload);
}
