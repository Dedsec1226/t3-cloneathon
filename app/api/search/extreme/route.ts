import { NextRequest } from 'next/server';

// Use Edge Runtime for fastest streaming performance
export const runtime = 'edge';

// Import the complex route handler
import { POST as complexPost } from '../route-complex';

export async function POST(request: NextRequest) {
  // Direct route to complex handler for extreme mode
  return await complexPost(request);
}

export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 