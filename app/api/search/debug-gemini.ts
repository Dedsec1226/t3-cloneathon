// Debug utility for measuring Gemini streaming performance
export function measureTTFB() {
  const startTime = Date.now();
  
  return {
    logFirstByte: () => {
      const ttfb = Date.now() - startTime;
      console.log(`🚀 GEMINI TTFB: ${ttfb}ms`);
      return ttfb;
    },
    logChunk: (chunkNumber: number) => {
      const elapsed = Date.now() - startTime;
      console.log(`📦 GEMINI Chunk ${chunkNumber}: +${elapsed}ms`);
    }
  };
}

// Test Gemini streaming directly (for curl testing)
export async function testGeminiStreamingDirect() {
  const url = process.env.NODE_ENV === 'production' 
    ? 'https://your-domain.com/api/search'
    : 'http://localhost:3000/api/search';
    
  console.log('🧪 Test Gemini streaming with:');
  console.log(`curl -X POST ${url} \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -d '{"messages":[{"role":"user","content":"Hello, stream fast!"}],"model":"t3-gemini-2-5-flash"}' \\`);
  console.log(`  --http2 -N`);
} 