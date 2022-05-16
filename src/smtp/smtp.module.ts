import { Module } from '@nestjs/common';
import { SmtpService } from './smtp.service';
import { PrismaService } from '../prisma.service';
import { SmtpConsumerService } from './smtp.consumer.service';
import { KafkaModule } from 'src/kafka/kafka.module';

@Module({
  imports: [KafkaModule],
  providers: [SmtpService, PrismaService, SmtpConsumerService],
  controllers: [],
  exports: [SmtpService, SmtpConsumerService],
})
export class SmtpModule {}
