import type { Channel, Connection, ConsumeMessage } from 'amqplib';
import client from 'amqplib';

import { environmentConfig } from '../config';

export class RabbitMQClient {
  channel: Channel | undefined;

  QUEUE_NAME = 'taskQueue';

  /**
   * Starts the connection
   * */
  async connect() {
    try {
      const connection: Connection = await client.connect(
        `amqp://${environmentConfig.RABBITMQ_USER}:${environmentConfig.RABBITMQ_PASS}@localhost:5672`,
      );
      this.channel = await connection.createChannel();
      await this.channel.prefetch(1);
      await this.channel.assertQueue(this.QUEUE_NAME, { durable: true });
    } catch (error) {
      console.error('RabbitMQ connection error:', error);
    }
  }

  /**
   * Send message to channel
   * @param {string} message
   * */
  produce(message: string) {
    this.channel?.sendToQueue(this.QUEUE_NAME, Buffer.from(message));
  }

  /**
   * Subscribe to channel
   * @param {function} callback
   * */
  async consume(callback: (message: ConsumeMessage | null) => void) {
    await this.channel?.consume(this.QUEUE_NAME, callback, { noAck: false });
  }
}

export const rabbitMQClient = new RabbitMQClient();
