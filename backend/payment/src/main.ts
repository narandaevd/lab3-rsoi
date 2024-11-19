import { NestFactory } from '@nestjs/core';
import { MainHttpModule } from './main-http.module';
import { Logger, VersioningType } from '@nestjs/common';

const PORT = 8060

async function bootstrap() {
  const app = await NestFactory.create(MainHttpModule);
  app.enableVersioning({
    type: VersioningType.URI,
    prefix: '',
    defaultVersion: 'api/v1',
  });
  const logger = new Logger('Main');
  await app.listen(PORT).then(() => logger.log(`Сервер слушает порт ${PORT}`));
}
bootstrap();
