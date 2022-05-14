import { Module } from '@nestjs/common';
import { SmtpService } from './smtp.service';
import { PrismaService } from '../prisma.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
// import { SmtpConsumerService } from './smtp.consumer.service';
// import { MailConsumerService } from '../kafka/mail.consumer.service';
// import { MailProducerService } from '../kafka/mail.producer.service';
import { SmtpController } from './smtp.controller';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'SMTP_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'smtp',
            brokers: ['localhost:9092'],
          },
          consumer: {
            groupId: 'smtp-consumer',
          },
        },
      },
    ]),
  ],
  providers: [
    SmtpService,
    PrismaService,
    // SmtpConsumerService,
    // MailConsumerService,
    // MailProducerService,
  ],
  controllers: [SmtpController],
})
export class SmtpModule {}
