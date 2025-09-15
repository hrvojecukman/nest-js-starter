import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://192.168.100.4:3000',
      'http://192.168.100.4:3001', // In case you run frontend on different port
      'http://192.168.1.115:3002',
      // 'https://yourdomain.com',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-API-Key',
    ],
    credentials: true, 
  });

  // Global validation pipe with automatic type conversion
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  app.setGlobalPrefix('api/v1');

  // Bind to specific IP address for network access
  const host = '192.168.100.4';
  // const host = '192.168.1.115'
  const port = 3000;
  
  await app.listen(port, host);
  console.log(`🚀 Server running on http://${host}:${port}`);
  console.log(`🌐 Server accessible from network on ${host}:${port}`);
  console.log(`📱 API available at http://${host}:${port}/api/v1`);
}
bootstrap();
