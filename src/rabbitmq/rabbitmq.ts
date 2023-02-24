import type { Channel, Connection, ConsumeMessage } from 'amqplib';
import client from 'amqplib';

import { environmentConfig } from '../config';

const IMMEDIATELY_QUEUE_NAME = 'IMMEDIATELY_QUEUE';
const IMMEDIATELY_EXCHANGE_NAME = 'IMMEDIATELY_EXCHANGE';
const IMMEDIATELY_EXCHANGE_KEY = 'IMMEDIATELY_EXCHANGE';
const DELAYED_QUEUE_NAME = 'DELAYED_QUEUE';
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

      await this.channel.assertQueue(DELAYED_QUEUE_NAME, {
        durable: true,
        autoDelete: false,
        deadLetterExchange: IMMEDIATELY_EXCHANGE_NAME,
      });

      await this.channel.assertExchange(IMMEDIATELY_EXCHANGE_NAME, 'fanout');
      await this.channel.assertQueue(IMMEDIATELY_QUEUE_NAME, { durable: true, maxPriority: MAX_PRIORITY });
      await this.channel.bindQueue(IMMEDIATELY_QUEUE_NAME, IMMEDIATELY_EXCHANGE_NAME, IMMEDIATELY_EXCHANGE_KEY);
    } catch (error) {
      console.error('RabbitMQ connection error:', error);
    }
  }

  /**
   * Send message to channel
   * @param {string} message
   * @param {number)} expiration expiration time in ms
   * */
  produce(message: string, expiration?: number) {
    console.info(message, expiration, !!expiration);
    if (expiration) {
      this.channel?.sendToQueue(DELAYED_QUEUE_NAME, Buffer.from(message), { expiration });
    } else {
      this.channel?.publish(IMMEDIATELY_EXCHANGE_NAME, IMMEDIATELY_EXCHANGE_KEY, Buffer.from(message));
    }
  }

  /**
   * Subscribe to channel
   * @param {function} callback
   * */
  async consume(callback: (message: ConsumeMessage | null) => void) {
    await this.channel?.consume(IMMEDIATELY_QUEUE_NAME, callback, { noAck: false });
  }
}

export const rabbitMQClient = new RabbitMQClient();
