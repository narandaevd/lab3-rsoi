import { NestFactory } from '@nestjs/core';
import { MainHttpModule } from './main-http.module';
import { ArgumentsHost, BadRequestException, Catch, ExceptionFilter, HttpStatus, Logger, VersioningType } from '@nestjs/common';
import { AxiosError } from 'axios';
import { Response } from 'express';

const PORT = 8080

@Catch(Error)
class ProxyFilter implements ExceptionFilter {
  async catch(exception: Error, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    if (exception instanceof AxiosError) {
      res.status(exception.status).send(exception.response.data);
    }
    else 
      res.status((exception as any).status ?? 503).send({message: exception.message});
  }
}

async function bootstrap() {
  const app = await NestFactory.create(MainHttpModule);
  app.enableVersioning({
    type: VersioningType.URI,
    prefix: '',
    defaultVersion: 'api/v1',
  });
  const logger = new Logger('Main');
  app.useGlobalFilters(new ProxyFilter());
  await app.listen(PORT).then(() => logger.log(`Сервер слушает порт ${PORT}`));
}
bootstrap();
