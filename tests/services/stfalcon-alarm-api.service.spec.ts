import { StfalconAlarmApiService } from '@services/stfalcon-alarm-api.service';

import type { StfalconRegionAlert } from '@app-types/stfalcon-alarm';

const BASE_URL = 'https://test.ukrainealarm.com';
const API_KEY = 'test-api-key';

const mockFetch = vi.fn();

vi.stubGlobal('fetch', mockFetch);

/**
 * Helper to create a mock fetch Response with a JSON body.
 * @param status
 * @param body
 */
function mockResponse(status: number, body: unknown = {}): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(JSON.stringify(body)),
    json: () => Promise.resolve(body),
  } as Response;
}

describe('StfalconAlarmApiService', () => {
  let service: StfalconAlarmApiService;

  beforeEach(() => {
    service = new StfalconAlarmApiService(API_KEY, BASE_URL);
    vi.clearAllMocks();
  });

  describe('registerWebhook', () => {
    describe('positive cases', () => {
      it('should POST to /api/v3/webhook with the correct URL and headers', async () => {
        mockFetch.mockResolvedValue(mockResponse(200));

        await service.registerWebhook('https://example.com/webhook/alarm');

        expect(mockFetch).toHaveBeenCalledWith(`${BASE_URL}/api/v3/webhook`, {
          method: 'POST',
          headers: { Authorization: API_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({ webHookUrl: 'https://example.com/webhook/alarm' }),
        });
      });
    });

    describe('negative cases', () => {
      it('should throw when the response is not ok', async () => {
        mockFetch.mockResolvedValue(mockResponse(400, 'Bad Request'));

        await expect(service.registerWebhook('https://example.com')).rejects.toThrow('400');
      });
    });
  });

  describe('updateWebhook', () => {
    describe('positive cases', () => {
      it('should PATCH /api/v3/webhook with the updated URL', async () => {
        mockFetch.mockResolvedValue(mockResponse(200));

        await service.updateWebhook('https://new.example.com/webhook/alarm');

        expect(mockFetch).toHaveBeenCalledWith(`${BASE_URL}/api/v3/webhook`, {
          method: 'PATCH',
          headers: { Authorization: API_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({ webHookUrl: 'https://new.example.com/webhook/alarm' }),
        });
      });
    });

    describe('negative cases', () => {
      it('should throw when the response is not ok', async () => {
        mockFetch.mockResolvedValue(mockResponse(500, 'Internal Server Error'));

        await expect(service.updateWebhook('https://example.com')).rejects.toThrow('500');
      });
    });
  });

  describe('deleteWebhook', () => {
    describe('positive cases', () => {
      it('should DELETE /api/v3/webhook', async () => {
        mockFetch.mockResolvedValue(mockResponse(200));

        await service.deleteWebhook();

        expect(mockFetch).toHaveBeenCalledWith(`${BASE_URL}/api/v3/webhook`, {
          method: 'DELETE',
          headers: { Authorization: API_KEY, 'Content-Type': 'application/json' },
        });
      });
    });

    describe('negative cases', () => {
      it('should throw when the response is not ok', async () => {
        mockFetch.mockResolvedValue(mockResponse(404, 'Not Found'));

        await expect(service.deleteWebhook()).rejects.toThrow('404');
      });
    });
  });

  describe('getAlerts', () => {
    describe('positive cases', () => {
      it('should GET /api/v3/alerts and return the parsed array', async () => {
        const alerts: StfalconRegionAlert[] = [
          {
            regionId: '4',
            regionName: 'Львівська область',
            regionType: 'State',
            lastUpdate: '2024-01-01T12:00:00Z',
            activeAlerts: [{ regionId: '4', regionType: 'State', type: 'AIR', lastUpdate: '2024-01-01T12:00:00Z' }],
          },
        ];

        mockFetch.mockResolvedValue(mockResponse(200, alerts));

        const result = await service.getAlerts();

        expect(mockFetch).toHaveBeenCalledWith(`${BASE_URL}/api/v3/alerts`, {
          method: 'GET',
          headers: { Authorization: API_KEY, 'Content-Type': 'application/json' },
        });

        expect(result).toEqual(alerts);
      });

      it('should return an empty array when no alerts are active', async () => {
        mockFetch.mockResolvedValue(mockResponse(200, []));

        const result = await service.getAlerts();

        expect(result).toEqual([]);
      });
    });

    describe('negative cases', () => {
      it('should throw when the response is not ok', async () => {
        mockFetch.mockResolvedValue(mockResponse(503, 'Service Unavailable'));

        await expect(service.getAlerts()).rejects.toThrow('503');
      });
    });
  });

  describe('getRegions', () => {
    describe('positive cases', () => {
      it('should GET /api/v3/regions and return the parsed array', async () => {
        const regions = [{ regionId: '4', regionName: 'Львівська область', regionType: 'State', regionChildIds: [] }];

        mockFetch.mockResolvedValue(mockResponse(200, regions));

        const result = await service.getRegions();

        expect(mockFetch).toHaveBeenCalledWith(`${BASE_URL}/api/v3/regions`, {
          method: 'GET',
          headers: { Authorization: API_KEY, 'Content-Type': 'application/json' },
        });

        expect(result).toEqual(regions);
      });
    });

    describe('negative cases', () => {
      it('should throw when the response is not ok', async () => {
        mockFetch.mockResolvedValue(mockResponse(401, 'Unauthorized'));

        await expect(service.getRegions()).rejects.toThrow('401');
      });
    });
  });
});
