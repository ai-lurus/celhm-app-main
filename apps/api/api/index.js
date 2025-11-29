const { NestFactory } = require('@nestjs/core');
const { ValidationPipe } = require('@nestjs/common');
const { SwaggerModule, DocumentBuilder } = require('@nestjs/swagger');
const { AppModule } = require('../dist/app.module');

let cachedApp;

async function bootstrap() {
  if (!cachedApp) {
    const app = await NestFactory.create(AppModule);
    
    // Enable CORS
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
    // Use customSwaggerUI for Vercel serverless compatibility
    SwaggerModule.setup('docs', app, document, {
      customCssUrl: 'https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css',
      customJs: [
        'https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js',
        'https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js',
      ],
      customSiteTitle: 'CELHM API Documentation',
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

