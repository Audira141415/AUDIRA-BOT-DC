import { writeFileSync, readFileSync, existsSync, mkdirSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { proto, BufferJSON, initAuthCreds } = require('@whiskeysockets/baileys');


// AES-256-CBC Encryption helpers
function encrypt(text: string, secretKey: string): string {
  const key = crypto.createHash('sha256').update(secretKey).digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

function decrypt(encryptedText: string, secretKey: string): string {
  try {
    const key = crypto.createHash('sha256').update(secretKey).digest();
    const parts = encryptedText.split(':');
    const iv = Buffer.from(parts.shift()!, 'hex');
    const encrypted = parts.join(':');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    throw new Error('Decryption failed. Invalid encryption key or corrupted data.');
  }
}

export async function useEncryptedMultiFileAuthState(folder: string, secretKey?: string) {
  const writeData = (data: any, file: string) => {
    const jsonStr = JSON.stringify(data, BufferJSON.replacer);
    const payload = secretKey ? encrypt(jsonStr, secretKey) : jsonStr;
    writeFileSync(path.join(folder, file), payload, { encoding: 'utf-8' });
  };

  const readData = (file: string) => {
    try {
      const filePath = path.join(folder, file);
      if (!existsSync(filePath)) return null;
      const raw = readFileSync(filePath, { encoding: 'utf-8' });
      const decrypted = secretKey && raw.includes(':') ? decrypt(raw, secretKey) : raw;
      return JSON.parse(decrypted, BufferJSON.reviver);
    } catch (error) {
      return null;
    }
  };

  const removeData = (file: string) => {
    try {
      const filePath = path.join(folder, file);
      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }
    } catch {}
  };

  const folderInfo = path.resolve(folder);
  if (!existsSync(folderInfo)) {
    mkdirSync(folderInfo, { recursive: true });
  }

  const credsFile = 'creds.json';
  let creds = readData(credsFile);
  if (!creds) {
    creds = initAuthCreds();
    writeData(creds, credsFile);
  }

  return {
    state: {
      creds,
      keys: {
        get: async (type: string, ids: string[]) => {
          const data: { [id: string]: any } = {};
          await Promise.all(
            ids.map(async (id) => {
              let value = await readData(`${type}-${id}.json`);
              if (type === 'app-state-sync-key' && value) {
                value = proto.Message.AppStateSyncKeyData.fromObject(value);
              }
              data[id] = value;
            })
          );
          return data;
        },
        set: async (data: any) => {
          const tasks: Promise<void>[] = [];
          for (const category in data) {
            for (const id in data[category]) {
              const value = data[category][id];
              const file = `${category}-${id}.json`;
              if (value) {
                tasks.push(Promise.resolve(writeData(value, file)));
              } else {
                tasks.push(Promise.resolve(removeData(file)));
              }
            }
          }
          await Promise.all(tasks);
        },
      },
    },
    saveCreds: () => {
      return writeData(creds, credsFile);
    },
  };
}
