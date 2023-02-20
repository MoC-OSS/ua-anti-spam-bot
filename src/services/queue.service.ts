import type { ConsumeMessage } from 'amqplib';
import Bottleneck from 'bottleneck';
import type { MessageEntity } from 'typegram/message';

import { rabbitMQClient } from '../rabbitmq/rabbitmq';
import type { GrammyBot } from '../types';
import type { DeleteMessagePayload, SendMessagePayload, Task } from '../types/task';

import { generateRandomString } from './_mocks';
import { creatorId } from '../creator';

const LIMITER_OPTS = {
  maxConcurrent: 1,
  minTime: 30_000,
};

export class QueueService {
  api!: GrammyBot['api'];

  limiter!: Bottleneck;

  /**
   * Init bot api, scheduler and subscribe to queue
   * @param {GrammyBot['api']} api
   * */
  public async init(api: GrammyBot['api']) {
    this.api = api;
    this.limiter = new Bottleneck(LIMITER_OPTS);
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    await rabbitMQClient.consume(this.handleMessage.bind(this));
  }

  /**
   * For testing. Added 10 mock tasks to queue
   * */
  public addTestTask() {
    const sendTasks = Array.from({ length: 10 }, () => ({
      method: 'sendMessage',
      payload: {
        chat_id: creatorId,
        text: `Test message is: ${generateRandomString(3)}`,
      },
    }));
    sendTasks.forEach((task) => rabbitMQClient.produce(JSON.stringify(task), 0));
  }

  public sendMessage(chatId: string, text: string, other?: { entities: MessageEntity[] | undefined }) {
    const payload: Task = {
      method: 'sendMessage',
      payload: {
        chat_id: chatId,
        text,
        other,
      },
    };
    rabbitMQClient.produce(JSON.stringify(payload), 0);
  }

  public deleteMessage(chatId: string | number, messageId: number) {
    const payload: Task = {
      method: 'deleteMessage',
      payload: {
        chat_id: chatId,
        message_id: messageId,
      },
    };
    rabbitMQClient.produce(JSON.stringify(payload), 5);
  }

  private async handleMessage(message: ConsumeMessage | null) {
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

  private worker(message: ConsumeMessage): Promise<unknown> {
    const task = JSON.parse(message.content.toString()) as Task;
    switch (task.method) {
      case 'sendMessage': {
        // eslint-disable-next-line camelcase
        const { chat_id, text } = task.payload as SendMessagePayload;
        return this.api.sendMessage(chat_id, text);
      }
      case 'deleteMessage': {
        // eslint-disable-next-line camelcase
        const { chat_id, message_id } = task.payload as DeleteMessagePayload;
        return this.api.deleteMessage(chat_id, message_id);
      }
      default: {
        throw new Error('Unknown API method');
      }
    }
  }
}

export const queueService = new QueueService();
