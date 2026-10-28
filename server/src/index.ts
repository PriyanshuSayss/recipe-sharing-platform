import { config } from './config/env';
import { connectDB } from './config/database';
import app from './app';

async function main() {
  await connectDB();

  const server = app.listen(config.PORT, () => {
    console.log(`🚀 Plateful API running on http://localhost:${config.PORT}`);
    console.log(`   Environment: ${config.NODE_ENV}`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      const { disconnectDB } = await import('./config/database');
      await disconnectDB();
      console.log('Server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch(err => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
