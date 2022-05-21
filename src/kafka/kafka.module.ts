import { Module } from '@nestjs/common';
import { MailProducerService } from './mail.producer.service';
import { MailConsumerService } from './mail.consumer.service';
import { PrismaService } from 'src/prisma.service';

@Module({
  providers: [MailConsumerService, MailProducerService, PrismaService],
  exports: [MailConsumerService, MailProducerService],
})
export class KafkaModule {}
