import { Module } from '@nestjs/common';
import { SmtpService } from './user-mail/smtp.service';
import { MailService } from './admin-mail/mail.service';
import { PrismaService } from '../prisma.service';
import { SmtpConsumerService } from './user-mail/smtp.consumer.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { MailerModule } from '@nestjs-modules/mailer';
import { KafkaModule } from 'src/kafka/kafka.module';
import { MailConsumerService } from 'src/kafka/mail.consumer.service';

@Module({
  imports: [
    KafkaModule,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        transport: {
          host: config.get('EMAIL_HOST'),
          secure: false,
          auth: {
            user: config.get('EMAIL_USER'),
            pass: config.get('EMAIL_PASSWORD'),
          },
        },
        defaults: {
          from: config.get('EMAIL_FROM'),
        },
        template: {
          dir: join(__dirname, './templates'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
      inject: [ConfigService],
    }),
    ConfigModule.forRoot(),
  ],
  providers: [
    SmtpService,
    PrismaService,
    SmtpConsumerService,
    MailConsumerService,
    MailService,
  ],
  controllers: [],
  exports: [SmtpService, SmtpConsumerService],
})
export class SmtpModule {}
