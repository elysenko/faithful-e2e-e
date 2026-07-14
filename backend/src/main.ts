import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { swaggerOptions, swaggerTitle, swaggerDescription } from './common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';

export async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  const configService = app.get(ConfigService);
  // Disable helmet's default Content-Security-Policy: the SPA is served from
  // this same origin and the platform injects external telemetry scripts
  // (Colossus loader, Cloudflare insights) plus inline bootstrap scripts that a
  // strict `script-src 'self'` policy would block. All other helmet protections
  // (X-Frame-Options, HSTS, etc.) remain enabled.
  app.use(helmet({ contentSecurityPolicy: false }));
  app.enableCors({
    origin: configService.get<string>('FRONTEND_URL', 'http://localhost:4200'),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    })
  );

  // Swagger Configuration --------------------------------
  // swaggerOptions, swaggerTitle, swaggerDescription variables are customized and defined in common/swagger/swagger.config.ts
  const config = new DocumentBuilder()
    .setTitle(swaggerTitle)
    .setDescription(swaggerDescription)
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api', app, document, swaggerOptions);

  // End Swagger Configurations --------------------------------

  const port = process.env.PORT ?? 8080;
  await app.listen(port);
  Logger.log(`App running on Port ${port}`);
}
bootstrap();
