// /apple-touch-icon.png (lot 7, 06/10/2026) : le Φ de public/favicon.svg sur fond blanc, 180 × 180 (src/lib/icones.ts).
import type { APIRoute } from 'astro';
import { appleTouchIcon } from '../lib/icones';

export const GET: APIRoute = async () => new Response(new Uint8Array(await appleTouchIcon()), { headers: { 'Content-Type': 'image/png' } });
