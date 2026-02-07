import crypto from "node:crypto";

const ITERATIONS = 600_000; // OWASP 2024+ recommendation
const HASH_LENGTH = 32;
const SALT_LENGTH = 16;
const ALGORITHM = 'sha256';

async function promisifiedPbkdf2(password, salt) {
  if (!Buffer.isBuffer(salt)) {
    throw new Error('Salt must be a Buffer');
  }
  
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, ITERATIONS, HASH_LENGTH, ALGORITHM, (err, hash) => {
      if (err) return reject(err);
      resolve(hash.toString("hex"));
    });
  });
}

export async function hashPassword(password) {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }
  
  const salt = crypto.randomBytes(SALT_LENGTH);
  
  return {
    salt: salt.toString("hex"),
    hash: await promisifiedPbkdf2(password, salt),
  };
}

export async function verifyPassword(receivedPassword, hashedPassword, saltHex) {
  if (!receivedPassword || !hashedPassword || !saltHex) {
    throw new Error('Missing required parameters');
  }
  
  const salt = Buffer.from(saltHex, 'hex');
  const hash = await promisifiedPbkdf2(receivedPassword, salt);
  
  // Use constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(hash, 'hex'),
    Buffer.from(hashedPassword, 'hex')
  );
}


// received pass 12345
// stored pass hash 6dcb53e992e7b24180f82d3e28d685c72c99ea408d875652776b465b8737fa24
// stored salt da2ee978f5585005535d2669ff005028
// generated hash 1f3cfba4e68f9b750d9cdc706578f4f445526785edaa921d08a231c912c2c123
