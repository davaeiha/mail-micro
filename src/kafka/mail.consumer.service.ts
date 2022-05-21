import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import {
  Consumer,
  ConsumerRunConfig,
  ConsumerSubscribeTopics,
  Kafka,
} from 'kafkajs';

@Injectable()
export class MailConsumerService implements OnApplicationShutdown {
  private readonly kafka = new Kafka({
    brokers: ['127.0.0.1:9092'],
  });

  private readonly consumers: Consumer[] = [];

  async consume(topic: ConsumerSubscribeTopics, config: ConsumerRunConfig) {
    const consumer = this.kafka.consumer({ groupId: 'smtp_create_mail' });
    await consumer.connect();
    await consumer.subscribe(topic);
    await consumer.run(config);
    this.consumers.push(consumer);
  }

  async onApplicationShutdown() {
    for (const consumer of this.consumers) {
      await consumer.disconnect();
    }
  }
}
