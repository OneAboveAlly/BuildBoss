#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧹 Czyszczenie cache...');

// Usuń cache Vite
const viteCacheDir = path.join(__dirname, '..', 'node_modules', '.vite');
if (fs.existsSync(viteCacheDir)) {
  console.log('Usuwanie cache Vite...');
  fs.rmSync(viteCacheDir, { recursive: true, force: true });
}

// Usuń cache TypeScript
const tsCacheDir = path.join(__dirname, '..', 'node_modules', '.cache');
if (fs.existsSync(tsCacheDir)) {
  console.log('Usuwanie cache TypeScript...');
  fs.rmSync(tsCacheDir, { recursive: true, force: true });
}

// Usuń dist
const distDir = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distDir)) {
  console.log('Usuwanie dist...');
  fs.rmSync(distDir, { recursive: true, force: true });
}

console.log('✅ Cache wyczyszczony!');
console.log('');
console.log('📝 Instrukcje dla użytkownika:');
console.log('1. Zatrzymaj serwer dev (Ctrl+C)');
console.log('2. Uruchom ponownie: npm run dev');
console.log('3. W przeglądarce: Ctrl+Shift+R (hard refresh)');
console.log('4. Lub: DevTools → Application → Clear Storage → Clear site data'); 