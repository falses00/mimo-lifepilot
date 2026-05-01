import Fastify from 'fastify';
import cors from '@fastify/cors';
import { healthRoutes } from './routes/health.js';

const fastify = Fastify({ logger: true });

await fastify.register(cors, {
  origin: ['http://localhost:4321', 'http://localhost:3000'],
  methods: ['GET', 'POST'],
});

await fastify.register(healthRoutes);

const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '8787');
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 API running at http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
