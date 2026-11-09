import fs from 'fs';
import path from 'path';
import { TryoutPackage, UserAttempt, User, PackageVersion } from '../types.js';

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const PACKAGES_FILE = path.join(DATA_DIR, 'packages.json');
const ATTEMPTS_FILE = path.join(DATA_DIR, 'attempts.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

// Helper to read JSON file safely
function readJson<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) {
      writeJson(filePath, fallback);
      return fallback;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return fallback;
  }
}

// Helper to write JSON file safely (atomic write)
function writeJson<T>(filePath: string, data: T): void {
  const tempPath = `${filePath}.tmp.${Date.now()}`;
  try {
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempPath, filePath);
  } catch (err) {
    if (fs.existsSync(tempPath)) {
      try { fs.unlinkSync(tempPath); } catch {}
    }
    console.error(`Error writing to ${filePath}:`, err);
    throw err;
  }
}

// Initial Mock Users (Admin + Multiple Students for isolation testing)
const INITIAL_USERS: User[] = [
  {
    id: 'admin_1',
    name: 'Administrator BKN',
    email: 'admin@bkn.go.id',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80'
  },
  {
    id: 'user_1',
    name: 'Budi Santoso',
    email: 'budi.santoso@gmail.com',
    role: 'user',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80'
  },
  {
    id: 'user_2',
    name: 'Siti Rahmawati',
    email: 'siti.rahma@gmail.com',
    role: 'user',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80'
  },
  {
    id: 'user_3',
    name: 'Ahmad Fauzi',
    email: 'ahmad.fauzi@gmail.com',
    role: 'user',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80'
  }
];

export const db = {
  // Users
  getUsers(): User[] {
    return readJson<User[]>(USERS_FILE, INITIAL_USERS);
  },
  getUserById(id: string): User | undefined {
    return this.getUsers().find(u => u.id === id);
  },

  // Settings
  getSettings(): { geminiApiKey: string } {
    return readJson<{ geminiApiKey: string }>(SETTINGS_FILE, {
      geminiApiKey: process.env.GEMINI_API_KEY || ''
    });
  },
  saveSettings(settings: { geminiApiKey: string }): void {
    writeJson(SETTINGS_FILE, settings);
  },

  // Packages
  getPackages(): TryoutPackage[] {
    return readJson<TryoutPackage[]>(PACKAGES_FILE, []);
  },
  getPackageById(id: string): TryoutPackage | undefined {
    return this.getPackages().find(p => p.id === id);
  },
  getPackageByCode(code: string): TryoutPackage | undefined {
    return this.getPackages().find(p => p.code.toLowerCase() === code.toLowerCase());
  },
  savePackage(pkg: TryoutPackage): void {
    const packages = this.getPackages();
    const index = packages.findIndex(p => p.id === pkg.id);
    if (index >= 0) {
      packages[index] = { ...pkg, updatedAt: new Date().toISOString() };
    } else {
      packages.push({
        ...pkg,
        createdAt: pkg.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    writeJson(PACKAGES_FILE, packages);
  },
  deletePackage(id: string): boolean {
    const attempts = this.getAttempts().filter(a => a.packageId === id);
    if (attempts.length > 0) {
      throw new Error('Tidak dapat menghapus paket yang sudah memiliki riwayat pengerjaan oleh peserta.');
    }
    const packages = this.getPackages().filter(p => p.id !== id);
    writeJson(PACKAGES_FILE, packages);
    return true;
  },

  // Attempts
  getAttempts(): UserAttempt[] {
    return readJson<UserAttempt[]>(ATTEMPTS_FILE, []);
  },
  getAttemptById(id: string): UserAttempt | undefined {
    return this.getAttempts().find(a => a.id === id);
  },
  getUserAttempts(userId: string): UserAttempt[] {
    return this.getAttempts().filter(a => a.userId === userId);
  },
  getUserAttemptsForPackage(userId: string, packageId: string): UserAttempt[] {
    return this.getAttempts().filter(a => a.userId === userId && a.packageId === packageId);
  },
  saveAttempt(attempt: UserAttempt): void {
    const attempts = this.getAttempts();
    const index = attempts.findIndex(a => a.id === attempt.id);
    if (index >= 0) {
      attempts[index] = attempt;
    } else {
      attempts.push(attempt);
    }
    writeJson(ATTEMPTS_FILE, attempts);
  },

  // Immutability helper (Requirement 8)
  hasAttemptsForVersion(packageId: string, version: string): boolean {
    return this.getAttempts().some(
      a => a.packageId === packageId && a.packageVersion === version
    );
  },
  countAttemptsForVersion(packageId: string, version: string): number {
    return this.getAttempts().filter(
      a => a.packageId === packageId && a.packageVersion === version
    ).length;
  }
};
