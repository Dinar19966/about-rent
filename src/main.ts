import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });
  await app.listen(3000);
  console.log('Server started on http://localhost:3000');
}
bootstrap();
