import { FastifyInstance } from 'fastify';

const startTime = Date.now();

export async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/api/health', async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '0.1.0',
      uptime: Math.floor((Date.now() - startTime) / 1000),
      meta: {
        durationMs: Date.now() - startTime,
        mode: 'local',
      },
    };
  });
}
