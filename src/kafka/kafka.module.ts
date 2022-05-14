import { Module } from '@nestjs/common';
import { MailConsumerService } from './mail.consumer.service';
import { MailProducerService } from './mail.producer.service';

@Module({
  providers: [MailConsumerService, MailProducerService],
  exports: [MailConsumerService, MailProducerService],
})
export class KafkaModule {}
