// /favicon-32.png (lot 7, 06/10/2026) : le Φ de public/favicon.svg en 32 × 32 (src/lib/icones.ts).
import type { APIRoute } from 'astro';
import { favicon32 } from '../lib/icones';

export const GET: APIRoute = async () => new Response(new Uint8Array(await favicon32()), { headers: { 'Content-Type': 'image/png' } });
