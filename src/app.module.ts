import { Module } from '@nestjs/common';
import { SmtpModule } from './smtp/smtp.module';
import { PrismaService } from './prisma.service';
import { ImapModule } from './imap/imap.module';
import { KafkaModule } from './kafka/kafka.module';

@Module({
  imports: [SmtpModule, ImapModule, KafkaModule],
  controllers: [],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
