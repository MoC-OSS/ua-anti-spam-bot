import type { ConsumeMessage } from 'amqplib';
import Bottleneck from 'bottleneck';

import { logsChat } from '../creator';
import { rabbitMQClient } from '../rabbitmq/rabbitmq';
import type { GrammyBot } from '../types';
import type { Task } from '../types/task';

import { generateRandomString } from './_mocks';

export class QueueService {
  api!: GrammyBot['api'];

  limiter!: Bottleneck;

  async init(api: GrammyBot['api']) {
    this.api = api;
    this.limiter = new Bottleneck({
      maxConcurrent: 1,
      minTime: 10_000,
    });
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    await rabbitMQClient.consume(this.handleMessage.bind(this));
  }

  async handleMessage(message: ConsumeMessage | null) {
    if (message && message.content) {
      try {
        await this.limiter.schedule(() => this.worker(message));
        rabbitMQClient.channel?.ack(message);
      } catch (error) {
        console.error('Queue handle message error:', error);
        rabbitMQClient.channel?.reject(message, false);
        rabbitMQClient.channel?.nack(message);
      }
    }
  }

  public worker(message: ConsumeMessage): Promise<unknown> {
    const task = JSON.parse(message.content.toString()) as Task;
    switch (task.method) {
      case 'sendMessage': {
        // eslint-disable-next-line camelcase
        const { chat_id, text } = task.payload;
        return this.api.sendMessage(chat_id, text);
      }
      default: {
        throw new Error('Unknown API method');
      }
    }
  }

  addTestTask() {
    const mockPayload: Task = {
      method: 'sendMessage',
      payload: {
        chat_id: logsChat.toString(),
        text: `Test message is: ${generateRandomString(3)}`,
      },
    };
    rabbitMQClient.produce(JSON.stringify(mockPayload));
  }
}

export const queueService = new QueueService();
