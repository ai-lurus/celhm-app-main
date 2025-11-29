const { NestFactory } = require('@nestjs/core');
const { ValidationPipe } = require('@nestjs/common');
const { SwaggerModule, DocumentBuilder } = require('@nestjs/swagger');
const { AppModule } = require('../dist/app.module');

let cachedApp;

async function bootstrap() {
  if (!cachedApp) {
    const app = await NestFactory.create(AppModule);
    
    // Enable CORS
    // Detect production: Vercel sets VERCEL=1, or NODE_ENV=production
    // Default: if no CORS_ORIGINS is set, allow all vercel.app domains in production
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1' || !process.env.NODE_ENV;
    const hasExplicitCorsOrigins = process.env.CORS_ORIGINS && process.env.CORS_ORIGINS.trim() !== '';
    
    const allowedOrigins = hasExplicitCorsOrigins
      ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
      : isProduction
      ? [] // Empty means we'll use pattern matching for vercel.app
      : ['http://localhost:3000', 'http://localhost:3001'];

    // Log CORS configuration for debugging
    console.log('🔒 CORS Configuration:');
    console.log('  NODE_ENV:', process.env.NODE_ENV || 'not set');
    console.log('  VERCEL:', process.env.VERCEL || 'not set');
    console.log('  Is Production:', isProduction);
    console.log('  Has Explicit CORS_ORIGINS:', hasExplicitCorsOrigins);
    console.log('  Allowed Origins:', allowedOrigins.length > 0 ? allowedOrigins : 'Pattern matching (vercel.app)');
    console.log('  CORS_ORIGINS env:', process.env.CORS_ORIGINS || 'not set (using default: allow vercel.app)');

    app.enableCors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) {
          console.log('✅ CORS: Allowing request with no origin');
          return callback(null, true);
        }
        
        console.log(`🔍 CORS: Checking origin: ${origin}`);
        
        // If CORS_ORIGINS is explicitly set, use exact matching
        if (hasExplicitCorsOrigins) {
          if (allowedOrigins.includes(origin)) {
            console.log(`✅ CORS: Allowing origin (exact match): ${origin}`);
            callback(null, true);
          } else {
            console.log(`❌ CORS: Blocking origin: ${origin}`);
            console.log(`   Allowed origins: ${allowedOrigins.join(', ')}`);
            callback(new Error(`Not allowed by CORS. Origin: ${origin}`));
          }
        } else {
          // In production without explicit CORS_ORIGINS, allow any vercel.app subdomain
          if (isProduction) {
            if (origin.endsWith('.vercel.app') || origin === 'https://vercel.app') {
              console.log(`✅ CORS: Allowing origin (vercel.app pattern): ${origin}`);
              callback(null, true);
            } else {
              console.log(`❌ CORS: Blocking origin (not vercel.app): ${origin}`);
              callback(new Error(`Not allowed by CORS. Origin: ${origin}. Only vercel.app domains are allowed.`));
            }
          } else {
            // Development: use exact matching
            if (allowedOrigins.includes(origin)) {
              console.log(`✅ CORS: Allowing origin: ${origin}`);
              callback(null, true);
            } else {
              console.log(`❌ CORS: Blocking origin: ${origin}`);
              console.log(`   Allowed origins: ${allowedOrigins.join(', ')}`);
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
  // Log all incoming requests for debugging
  if (req.url.includes('/auth/login') && req.method === 'POST') {
    console.log('🚀 [VERCEL WRAPPER] Login request received:', {
      method: req.method,
      url: req.url,
      body: req.body ? { email: req.body.email, passwordLength: req.body.password?.length } : 'no body',
      headers: {
        'content-type': req.headers['content-type'],
        'origin': req.headers.origin,
      },
    });
  }
  
  const app = await bootstrap();
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp(req, res);
};

