// Minimal bootstrap for SW + global state
import { initServiceWorker } from './pwa.js';

export const SW_INIT_PROMISE=typeof window!=='undefined'?initServiceWorker():Promise.resolve(null);
