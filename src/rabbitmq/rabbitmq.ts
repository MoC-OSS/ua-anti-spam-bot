import type { Channel, Connection, ConsumeMessage } from 'amqplib';
import client from 'amqplib';

import { environmentConfig } from '../config';

const QUEUE_NAME = 'taskQueue';
const MAX_PRIORITY = 5;

export class RabbitMQClient {
  channel: Channel | undefined;

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
      await this.channel.assertQueue(QUEUE_NAME, { durable: true, maxPriority: MAX_PRIORITY });
    } catch (error) {
      console.error('RabbitMQ connection error:', error);
    }
  }

  /**
   * Send message to channel
   * @param {string} message
   * @param {number} priority
   * */
  produce(message: string, priority: number) {
    this.channel?.sendToQueue(QUEUE_NAME, Buffer.from(message), { priority });
  }

  /**
   * Subscribe to channel
   * @param {function} callback
   * */
  async consume(callback: (message: ConsumeMessage | null) => void) {
    await this.channel?.consume(QUEUE_NAME, callback, { noAck: false });
  }
}

export const rabbitMQClient = new RabbitMQClient();
