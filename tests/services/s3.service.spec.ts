import { S3Service } from '@services/s3.service';

const { mockSend } = vi.hoisted(() => ({
  mockSend: vi.fn(),
}));

vi.mock('@aws-sdk/client-s3', () => ({
  // eslint-disable-next-line func-names
  S3Client: vi.fn().mockImplementation(function () {
    return { send: mockSend };
  }),
  GetObjectCommand: vi.fn().mockImplementation(function mockGetObjectCommand(parameters: unknown) {
    return parameters;
  }),
}));

vi.mock('@shared/config', () => ({
  environmentConfig: {
    AWS_REGION: 'us-east-1',
    S3_BUCKET: 'test-bucket',
    S3_PATH: 'models/test/',
  },
}));

vi.mock('node:fs', () => ({
  default: {
    writeFileSync: vi.fn(),
  },
}));

describe('S3Service', () => {
  let service: S3Service;
  const fsFolderPath = new URL('file:///tmp/models/');

  beforeEach(() => {
    vi.clearAllMocks();
    service = new S3Service();
  });

  describe('downloadTensorFlowModel', () => {
    describe('positive cases', () => {
      it('should download all ML model files', async () => {
        const mockBody = { transformToString: vi.fn().mockResolvedValue('{"model": true}') };

        mockSend.mockResolvedValue({ Body: mockBody });

        await service.downloadTensorFlowModel(fsFolderPath);

        expect(mockSend).toHaveBeenCalledTimes(service.mlFiles.length);
      });

      it('should contain expected model files in mlFiles', () => {
        expect(service.mlFiles).toContain('model.json');
        expect(service.mlFiles).toContain('vocab.json');
        expect(service.mlFiles).toContain('group1-shard1of1.bin');
      });

      it('should handle empty Body gracefully', async () => {
        mockSend.mockResolvedValue({ Body: null });

        await expect(service.downloadTensorFlowModel(fsFolderPath)).resolves.not.toThrow();
      });
    });

    describe('negative cases', () => {
      it('should reject when S3 send fails', async () => {
        mockSend.mockRejectedValueOnce(new Error('S3 connection error'));

        await expect(service.downloadTensorFlowModel(fsFolderPath)).rejects.toThrow('S3 connection error');
      });
    });
  });
});
