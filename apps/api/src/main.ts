import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS with security
  const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
    : process.env.NODE_ENV === 'production'
    ? [] // Empty means we'll use pattern matching for vercel.app
    : ['http://localhost:3000', 'http://localhost:3001'];

  // Log CORS configuration for debugging
  if (process.env.NODE_ENV !== 'production') {
    console.log('🔒 CORS Configuration:');
    console.log('  Allowed Origins:', allowedOrigins.length > 0 ? allowedOrigins : 'Pattern matching (vercel.app)');
    console.log('  CORS_ORIGINS env:', process.env.CORS_ORIGINS || 'not set');
  }

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        if (process.env.NODE_ENV !== 'production') {
          console.log('✅ CORS: Allowing request with no origin');
        }
        return callback(null, true);
      }
      
      // If CORS_ORIGINS is explicitly set, use exact matching
      if (process.env.CORS_ORIGINS && allowedOrigins.length > 0) {
        if (allowedOrigins.includes(origin)) {
          if (process.env.NODE_ENV !== 'production') {
            console.log(`✅ CORS: Allowing origin (exact match): ${origin}`);
          }
          callback(null, true);
        } else {
          if (process.env.NODE_ENV !== 'production') {
            console.log(`❌ CORS: Blocking origin: ${origin}`);
            console.log(`   Allowed origins: ${allowedOrigins.join(', ')}`);
          }
          callback(new Error(`Not allowed by CORS. Origin: ${origin}`));
        }
      } else {
        // In production without explicit CORS_ORIGINS, allow any vercel.app subdomain
        if (process.env.NODE_ENV === 'production') {
          if (origin.endsWith('.vercel.app') || origin.endsWith('vercel.app')) {
            if (process.env.NODE_ENV !== 'production') {
              console.log(`✅ CORS: Allowing origin (vercel.app pattern): ${origin}`);
            }
            callback(null, true);
          } else {
            if (process.env.NODE_ENV !== 'production') {
              console.log(`❌ CORS: Blocking origin (not vercel.app): ${origin}`);
            }
            callback(new Error(`Not allowed by CORS. Origin: ${origin}`));
          }
        } else {
          // Development: use exact matching
          if (allowedOrigins.includes(origin)) {
            if (process.env.NODE_ENV !== 'production') {
              console.log(`✅ CORS: Allowing origin: ${origin}`);
            }
            callback(null, true);
          } else {
            if (process.env.NODE_ENV !== 'production') {
              console.log(`❌ CORS: Blocking origin: ${origin}`);
              console.log(`   Allowed origins: ${allowedOrigins.join(', ')}`);
            }
            callback(new Error(`Not allowed by CORS. Origin: ${origin}`));
          }
        }
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('CELHM API')
    .setDescription('SaaS Multi-tenant para inventario por sucursal y tickets de reparación')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.API_PORT || 3001;
  await app.listen(port);
  
  console.log(`🚀 API running on http://localhost:${port}`);
  console.log(`📚 Swagger docs available at http://localhost:${port}/docs`);
}

bootstrap();
