import { Bot } from 'grammy';

import axios from 'axios';

import { getNsfwFilterComposer } from '@bot/composers/messages/nsfw-filter.composer';
import { i18n } from '@bot/i18n';
import { stateMiddleware } from '@bot/middleware/state.middleware';
import { selfDestructedReply } from '@bot/plugins/self-destructed.plugin';

import type { OutgoingRequests } from '@testing/outgoing-requests';
import { prepareBotForTesting } from '@testing/prepare';
import { mockChatSession } from '@testing/testing-main';
import { MessageMockUpdate } from '@testing/updates/message-super-group-mock.update';

import type { GrammyContext } from '@app-types/context';
import { ImageType } from '@app-types/image';
import type { NsfwTensorPositiveResult } from '@app-types/nsfw';

import { handleError } from '@utils/error-handler.util';

// ---------------------------------------------------------------------------
// Hoisted mocks (must be at the top level before any vi.mock calls)
// ---------------------------------------------------------------------------

const { mockPredictVideo, mockNsfwTensorService } = vi.hoisted(() => {
  const predictVideoFunction = vi.fn().mockResolvedValue({ isSpam: false, predictions: [] });

  return {
    mockPredictVideo: predictVideoFunction,
    mockNsfwTensorService: { predictVideo: predictVideoFunction },
  };
});

const { mockEnvironmentConfig } = vi.hoisted(() => ({
  mockEnvironmentConfig: {
    USE_SERVER: false,
    HOST: 'localhost',
    PORT: '3000',
    BOT_TOKEN: 'test-token',
    DEBUG: false,
  },
}));

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('axios');

vi.mock('@shared/config', () => ({
  environmentConfig: mockEnvironmentConfig,
}));

vi.mock('@bot/creator', () => ({
  logsChat: -1_001_111_111_111,
}));

vi.mock('@const/logs.const', () => ({
  LOGS_CHAT_THREAD_IDS: { PORN: 5 },
}));

vi.mock('@utils/error-handler.util', () => ({
  handleError: vi.fn(),
}));

vi.mock('@utils/util-instances.util', () => ({
  telegramUtility: {
    getLogsSaveMessageParts: vi.fn().mockResolvedValue({
      userMention: '@testuser',
      chatMention: 'Test Chat',
    }),
    getChatTitle: vi.fn().mockReturnValue('Test Chat'),
  },
}));

vi.mock('@utils/generic.util', () => ({
  getUserData: vi.fn().mockReturnValue({ writeUsername: '@testuser', userId: 12_345 }),
}));

vi.mock('@message', () => ({
  getDeleteNsfwMessage: vi.fn().mockReturnValue('nsfw-delete-message'),
  nsfwLogsStartMessage: '⚠️ NSFW detected',
}));

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const testBuffer = Buffer.from('fake-image-data');

/** Spam prediction result for isSpam=true branches */
const positiveResult: NsfwTensorPositiveResult = {
  isSpam: true,
  predictions: [],
  deletePrediction: { className: 'Porn', probability: 0.95 },
  deleteRank: 0.95,
};

/** PHOTO state – single file, no fileFrames → isThumbnail=true */
const testPhotoState = {
  type: ImageType.PHOTO,
  meta: { file_id: 'photo123', file_unique_id: 'unique_photo', width: 100, height: 100, file_size: 1000 },
  file: testBuffer,
};

/** ANIMATION state with file=null and no fileFrames → isThumbnail=true, file===null → next() */
const testNullFileState = {
  type: ImageType.ANIMATION,
  meta: { file_id: 'anim123', file_unique_id: 'unique_anim', width: 100, height: 100 },
  file: null,
  animation: { file_id: 'anim123', file_unique_id: 'unique_anim', width: 100, height: 100, duration: 2, mime_type: 'video/mp4' },
};

/** VIDEO state with fileFrames → hasFrames=true */
const testVideoStateWithFrames = {
  type: ImageType.VIDEO,
  meta: { file_id: 'video123', file_unique_id: 'unique_video', width: 100, height: 100 },
  file: testBuffer,
  video: { file_id: 'video123', file_unique_id: 'unique_video', width: 100, height: 100, duration: 5, mime_type: 'video/mp4' },
  fileFrames: [testBuffer, testBuffer],
};

/** STICKER state – single file, no fileFrames */
const testStickerState = {
  type: ImageType.STICKER,
  meta: {
    file_id: 'sticker123',
    file_unique_id: 'unique_sticker',
    width: 100,
    height: 100,
    is_animated: false,
    is_video: false,
    type: 'regular',
  },
  file: testBuffer,
};

/** VIDEO_STICKER state with fileFrames */
const testVideoStickerState = {
  type: ImageType.VIDEO_STICKER,
  meta: {
    file_id: 'vsticker123',
    file_unique_id: 'unique_vsticker',
    width: 100,
    height: 100,
    is_animated: false,
    is_video: true,
    type: 'regular',
  },
  thumb: { file_id: 'thumb123', file_unique_id: 'unique_thumb', width: 50, height: 50 },
  file: testBuffer,
  fileFrames: [testBuffer],
};

/** VIDEO_NOTE state – single file, no fileFrames */
const testVideoNoteState = {
  type: ImageType.VIDEO_NOTE,
  meta: { file_id: 'vidnote123', file_unique_id: 'unique_vn', width: 100, height: 100 },
  file: testBuffer,
  videoNote: { file_id: 'vidnote123', file_unique_id: 'unique_vn', length: 100, duration: 3 },
};

/** ANIMATION state with a file buffer – single file, no fileFrames */
const testAnimationState = {
  type: ImageType.ANIMATION,
  meta: { file_id: 'anim_buf', file_unique_id: 'unique_anim_buf', width: 100, height: 100 },
  file: testBuffer,
  animation: { file_id: 'anim_buf', file_unique_id: 'unique_anim_buf', width: 100, height: 100, duration: 2, mime_type: 'video/mp4' },
};

// ---------------------------------------------------------------------------
// Bot setup
// ---------------------------------------------------------------------------

let outgoingRequests: OutgoingRequests;
let photoState: unknown;

const bot = new Bot<GrammyContext>('mock');

const { chatSession, mockChatSessionMiddleware } = mockChatSession({
  chatSettings: {
    disableDeleteMessage: false,
  },
});

const { nsfwFilterComposer } = getNsfwFilterComposer({ nsfwTensorService: mockNsfwTensorService as any });

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('nsfwFilterComposer', () => {
  beforeAll(async () => {
    bot.use(i18n);
    bot.use(selfDestructedReply());
    bot.use(stateMiddleware);
    bot.use(mockChatSessionMiddleware);

    // Inject photo state before the composer so each test controls what photo is set
    bot.use(async (context, next) => {
      context.state.photo = photoState as any;

      return next();
    });

    bot.use(nsfwFilterComposer);

    outgoingRequests = await prepareBotForTesting<GrammyContext>(bot, {
      getChat: { invite_link: '' },
    });
  }, 5000);

  beforeEach(() => {
    outgoingRequests.clear();
    mockPredictVideo.mockClear();
    mockPredictVideo.mockResolvedValue({ isSpam: false, predictions: [] });
    vi.mocked(handleError).mockClear();
    vi.mocked(axios.post).mockClear();
    chatSession.chatSettings.disableDeleteMessage = false;
    mockEnvironmentConfig.USE_SERVER = false;
    photoState = undefined;
  });

  // -------------------------------------------------------------------------
  // Branch: photo state not set
  // -------------------------------------------------------------------------

  it('should call next() without any processing when photo state is undefined', async () => {
    const update = new MessageMockUpdate('test').build();

    await bot.handleUpdate(update);

    expect(outgoingRequests.length).toEqual(0);
    expect(mockPredictVideo).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Branch: isThumbnail && parsedPhoto.file === null → next()
  // -------------------------------------------------------------------------

  describe('thumbnail with null file', () => {
    beforeEach(() => {
      photoState = testNullFileState;
    });

    it('should call next() without prediction when parsedPhoto.file is null', async () => {
      const update = new MessageMockUpdate('test').build();

      await bot.handleUpdate(update);

      expect(outgoingRequests.length).toEqual(0);
      expect(mockPredictVideo).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Branch: imageBuffers.length === 0 → next()
  // -------------------------------------------------------------------------

  describe('empty image buffers', () => {
    beforeEach(() => {
      // hasFrames=true but fileFrames array is empty → imageBuffers.length === 0
      photoState = { ...testVideoStateWithFrames, fileFrames: [] };
    });

    it('should call next() without prediction when fileFrames is empty', async () => {
      const update = new MessageMockUpdate('test').build();

      await bot.handleUpdate(update);

      expect(outgoingRequests.length).toEqual(0);
      expect(mockPredictVideo).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Branch: USE_SERVER=false → nsfwTensorService.predictVideo
  // -------------------------------------------------------------------------

  describe('prediction via nsfwTensorService (USE_SERVER=false)', () => {
    beforeEach(() => {
      photoState = testPhotoState;
    });

    it('should call nsfwTensorService.predictVideo with the image buffer', async () => {
      const update = new MessageMockUpdate('test').build();

      await bot.handleUpdate(update);

      expect(mockPredictVideo).toHaveBeenCalledWith([testBuffer]);
    });

    it('should not trigger any API calls when isSpam is false', async () => {
      const update = new MessageMockUpdate('test').build();

      await bot.handleUpdate(update);

      expect(outgoingRequests.length).toEqual(0);
    });

    it('should deleteMessage, log photo, and reply when isSpam is true and disableDeleteMessage=false', async () => {
      mockPredictVideo.mockResolvedValueOnce(positiveResult);

      const update = new MessageMockUpdate('test').build();

      await bot.handleUpdate(update);

      const methods = outgoingRequests.getMethods();

      expect(methods).toContain('deleteMessage');
      expect(methods).toContain('sendPhoto'); // saveNsfwMessage: PHOTO type logs to logsChat
      // eslint-disable-next-line no-secrets/no-secrets
      expect(methods).toContain('sendMessage'); // replyWithSelfDestructedHTML notification
    });

    it('should deleteMessage and log but NOT reply when isSpam is true and disableDeleteMessage=true', async () => {
      chatSession.chatSettings.disableDeleteMessage = true;
      mockPredictVideo.mockResolvedValueOnce(positiveResult);

      const update = new MessageMockUpdate('test').build();

      await bot.handleUpdate(update);

      const methods = outgoingRequests.getMethods();

      expect(methods).toContain('deleteMessage');
      expect(methods).toContain('sendPhoto');
      expect(methods).not.toContain('sendMessage');
    });
  });

  // -------------------------------------------------------------------------
  // Branch: USE_SERVER=true → axios.post
  // -------------------------------------------------------------------------

  describe('prediction via axios (USE_SERVER=true)', () => {
    beforeEach(() => {
      photoState = testPhotoState;
      mockEnvironmentConfig.USE_SERVER = true;

      vi.mocked(axios.post).mockResolvedValue({
        data: { result: { isSpam: false, predictions: [] } },
      });
    });

    it('should call axios.post and NOT call nsfwTensorService when USE_SERVER is true', async () => {
      const update = new MessageMockUpdate('test').build();

      await bot.handleUpdate(update);

      expect(vi.mocked(axios.post)).toHaveBeenCalled();
      expect(mockPredictVideo).not.toHaveBeenCalled();
    });

    it('should delete when axios returns isSpam=true', async () => {
      vi.mocked(axios.post).mockResolvedValue({
        data: { result: positiveResult },
      });

      const update = new MessageMockUpdate('test').build();

      await bot.handleUpdate(update);

      expect(outgoingRequests.getMethods()).toContain('deleteMessage');
    });
  });

  // -------------------------------------------------------------------------
  // Branch: try/catch in prediction → handleError + fallback
  // -------------------------------------------------------------------------

  describe('prediction error handling', () => {
    beforeEach(() => {
      photoState = testPhotoState;
    });

    it('should call handleError and fall back to nsfwTensorService.predictVideo on prediction error', async () => {
      const testError = new Error('Service unavailable');

      // First call (inside try) throws; second call (fallback in catch) returns non-spam
      mockPredictVideo.mockRejectedValueOnce(testError);

      const update = new MessageMockUpdate('test').build();

      await bot.handleUpdate(update);

      expect(vi.mocked(handleError)).toHaveBeenCalledWith(testError, 'API_DOWN');
      // predictVideo should have been called twice: once in try (throws) and once as fallback
      expect(mockPredictVideo).toHaveBeenCalledTimes(2);
    });

    it('should still delete if fallback predictVideo returns isSpam=true', async () => {
      const testError = new Error('Server down');

      mockPredictVideo.mockRejectedValueOnce(testError);
      mockPredictVideo.mockResolvedValueOnce(positiveResult);

      const update = new MessageMockUpdate('test').build();

      await bot.handleUpdate(update);

      expect(vi.mocked(handleError)).toHaveBeenCalledWith(testError, 'API_DOWN');
      expect(outgoingRequests.getMethods()).toContain('deleteMessage');
    });
  });

  // -------------------------------------------------------------------------
  // Branch: hasFrames (parsedPhoto has fileFrames) → reason='frame'
  // -------------------------------------------------------------------------

  describe('photo with fileFrames (hasFrames=true)', () => {
    beforeEach(() => {
      photoState = testVideoStateWithFrames;
    });

    it('should pass fileFrames as image buffers to nsfwTensorService.predictVideo', async () => {
      const update = new MessageMockUpdate('test').build();

      await bot.handleUpdate(update);

      expect(mockPredictVideo).toHaveBeenCalledWith(testVideoStateWithFrames.fileFrames);
    });

    it('should set nsfwResult.reason to "frame" and call sendVideo for VIDEO type when spam', async () => {
      mockPredictVideo.mockResolvedValueOnce(positiveResult);

      const update = new MessageMockUpdate('test').build();

      await bot.handleUpdate(update);

      const methods = outgoingRequests.getMethods();

      expect(methods).toContain('deleteMessage');
      // saveNsfwMessage sends VIDEO type → sendVideo
      expect(methods).toContain('sendVideo');
    });
  });

  // -------------------------------------------------------------------------
  // Branch: !hasFrames (single file) → reason='preview'
  // -------------------------------------------------------------------------

  describe('photo without fileFrames (hasFrames=false)', () => {
    beforeEach(() => {
      photoState = testPhotoState;
    });

    it('should pass single file buffer to nsfwTensorService.predictVideo', async () => {
      const update = new MessageMockUpdate('test').build();

      await bot.handleUpdate(update);

      expect(mockPredictVideo).toHaveBeenCalledWith([testBuffer]);
    });

    it('should call sendPhoto in saveNsfwMessage (PHOTO type, reason="preview")', async () => {
      mockPredictVideo.mockResolvedValueOnce(positiveResult);

      const update = new MessageMockUpdate('test').build();

      await bot.handleUpdate(update);

      expect(outgoingRequests.getMethods()).toContain('sendPhoto');
    });
  });

  // -------------------------------------------------------------------------
  // Branch: saveNsfwMessage – image type handling
  // -------------------------------------------------------------------------

  describe('saveNsfwMessage image type handling', () => {
    beforeEach(() => {
      mockPredictVideo.mockResolvedValue(positiveResult);
    });

    it('PHOTO type → calls sendPhoto to logsChat', async () => {
      photoState = testPhotoState;

      await bot.handleUpdate(new MessageMockUpdate('test').build());

      expect(outgoingRequests.getMethods()).toContain('sendPhoto');
    });

    it('STICKER type → calls sendSticker + sendMessage to logsChat', async () => {
      photoState = testStickerState;

      await bot.handleUpdate(new MessageMockUpdate('test').build());

      const methods = outgoingRequests.getMethods();

      expect(methods).toContain('sendSticker');
      expect(methods).toContain('sendMessage');
    });

    it('VIDEO_STICKER type → calls sendSticker + sendMessage to logsChat', async () => {
      photoState = testVideoStickerState;

      await bot.handleUpdate(new MessageMockUpdate('test').build());

      const methods = outgoingRequests.getMethods();

      expect(methods).toContain('sendSticker');
      expect(methods).toContain('sendMessage');
    });

    it('VIDEO type (with frames) → calls sendVideo to logsChat', async () => {
      photoState = testVideoStateWithFrames;

      await bot.handleUpdate(new MessageMockUpdate('test').build());

      expect(outgoingRequests.getMethods()).toContain('sendVideo');
    });

    it('ANIMATION type → calls sendVideo to logsChat', async () => {
      photoState = testAnimationState;

      await bot.handleUpdate(new MessageMockUpdate('test').build());

      expect(outgoingRequests.getMethods()).toContain('sendVideo');
    });

    it('VIDEO_NOTE type → calls sendVideoNote + sendMessage to logsChat', async () => {
      photoState = testVideoNoteState;

      await bot.handleUpdate(new MessageMockUpdate('test').build());

      const methods = outgoingRequests.getMethods();

      expect(methods).toContain('sendVideoNote');
      expect(methods).toContain('sendMessage');
    });
  });
});
