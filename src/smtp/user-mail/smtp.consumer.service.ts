import { Injectable, OnModuleInit } from '@nestjs/common';
import { MailConsumerService } from '../../kafka/mail.consumer.service';
import { SmtpService } from './smtp.service';

@Injectable()
export class SmtpConsumerService implements OnModuleInit {
  constructor(
    private readonly consumerService: MailConsumerService,
    private readonly smtpService: SmtpService,
  ) {}

  async onModuleInit() {
    await this.consumerService.consume(
      { topics: ['smtp_request'] },
      {
        eachMessage: async ({ topic, partition, message }) => {
          const { token, directive, send, ...data } = JSON.parse(
            message.value.toString(),
          );

          console.log(JSON.parse(message.value.toString()));
          await this.smtpService.createMail(token, data, send);
        },
      },
    );
  }
}
