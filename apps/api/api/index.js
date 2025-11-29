const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');

let cachedApp;

async function bootstrap() {
  if (!cachedApp) {
    const app = await NestFactory.create(AppModule);
    
    // Enable CORS
    const allowedOrigins = process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
      : process.env.NODE_ENV === 'production'
      ? ['https://celhm-app.vercel.app']
      : ['http://localhost:3000', 'http://localhost:3001'];

    app.enableCors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
    });

    await app.init();
    cachedApp = app;
  }
  
  return cachedApp;
}

module.exports = async (req, res) => {
  const app = await bootstrap();
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp(req, res);
};

