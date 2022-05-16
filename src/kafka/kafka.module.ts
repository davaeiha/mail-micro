import { Module } from '@nestjs/common';
import { MailConsumerService } from './mail.consumer.service';
import { MailProducerService } from './mail.producer.service';
import { SmtpService } from '../smtp/smtp.service';
import { SmtpConsumerService } from '../smtp/smtp.consumer.service';
import { PrismaService } from 'src/prisma.service';

@Module({
  providers: [
    MailConsumerService,
    MailProducerService,
    SmtpConsumerService,
    SmtpService,
    PrismaService,
  ],
  exports: [MailConsumerService, MailProducerService],
})
export class KafkaModule {}
