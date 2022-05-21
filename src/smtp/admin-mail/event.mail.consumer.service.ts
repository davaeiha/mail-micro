import { Injectable, OnModuleInit } from '@nestjs/common';
import { MailConsumerService } from '../../kafka/mail.consumer.service';
import { MailService } from './mail.service';

@Injectable()
export class SmtpConsumerService implements OnModuleInit {
  constructor(
    private readonly consumerService: MailConsumerService,
    private readonly mailService: MailService,
  ) {}

  async onModuleInit() {
    await this.consumerService.consume(
      { topics: ['event_mail'] },
      {
        eachMessage: async ({ topic, partition, message }) => {
          const { directive, ...data } = JSON.parse(message.value.toString());

          console.log(JSON.parse(message.value.toString()));
          await this.mailService.sendMail(data.email, data.name);
        },
      },
    );
  }
}
