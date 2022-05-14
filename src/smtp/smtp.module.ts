import { Module } from '@nestjs/common';
import { SmtpService } from './smtp.service';
import { PrismaService } from '../prisma.service';

import { SmtpConsumerService } from './smtp.consumer.service';
import { MailConsumerService } from '../kafka/mail.consumer.service';
import { MailProducerService } from '../kafka/mail.producer.service';

@Module({
  providers: [
    SmtpService,
    PrismaService,
    SmtpConsumerService,
    MailConsumerService,
    MailProducerService,
  ],
  controllers: [],
})
export class SmtpModule {}
