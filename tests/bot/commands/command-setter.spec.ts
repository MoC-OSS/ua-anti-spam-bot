import { CommandSetter } from '@bot/commands/command-setter';

vi.mock('@shared/config', () => ({
  environmentConfig: {},
}));

describe('CommandSetter', () => {
  let commandSetter: CommandSetter;
  const mockSetMyCommands = vi.fn().mockResolvedValue(true);
  const mockBot = { api: { setMyCommands: mockSetMyCommands } } as any;
  const startTime = new Date('2024-01-15T10:00:00.000Z');

  beforeEach(() => {
    vi.clearAllMocks();
    commandSetter = new CommandSetter(mockBot, startTime, true);
  });

  describe('buildStatus', () => {
    describe('positive cases', () => {
      it('should return online status when bot is active', () => {
        const status = commandSetter.buildStatus();

        expect(status).toContain('🟢 Онлайн');
      });

      it('should return offline status when bot is inactive', () => {
        commandSetter = new CommandSetter(mockBot, startTime, false);
        const status = commandSetter.buildStatus();

        expect(status).toContain('🔴 Офлайн');
      });

      it('should include the formatted start time', () => {
        const status = commandSetter.buildStatus();

        expect(typeof status).toBe('string');
        expect(status.length).toBeGreaterThan(10);
      });
    });
  });

  describe('updateCommands', () => {
    describe('positive cases', () => {
      it('should set bot commands and populate the commands array', async () => {
        await commandSetter.updateCommands();

        expect(mockSetMyCommands).toHaveBeenCalledTimes(1);
        expect(commandSetter.commands.length).toBeGreaterThan(0);
        expect(commandSetter.commands.some((cmd) => cmd.command === 'start')).toBe(true);
        expect(commandSetter.commands.some((cmd) => cmd.command === 'help')).toBe(true);
        expect(commandSetter.commands.some((cmd) => cmd.command === 'settings')).toBe(true);
      });

      it('should include status command with current bot status', async () => {
        await commandSetter.updateCommands();

        const statusCmd = commandSetter.commands.find((cmd) => cmd.command === 'status');

        expect(statusCmd).toBeDefined();
        expect(statusCmd?.description).toContain('🟢');
      });
    });

    describe('negative cases', () => {
      it('should not throw when setMyCommands fails', async () => {
        mockSetMyCommands.mockRejectedValueOnce(new Error('API error'));

        await expect(commandSetter.updateCommands()).resolves.not.toThrow();
      });
    });
  });

  describe('setActive', () => {
    describe('positive cases', () => {
      it('should update active status and call updateCommands', async () => {
        await commandSetter.setActive(false);

        expect(commandSetter.buildStatus()).toContain('🔴 Офлайн');
        expect(mockSetMyCommands).toHaveBeenCalled();
      });

      it('should set active to true and update commands', async () => {
        commandSetter = new CommandSetter(mockBot, startTime, false);
        await commandSetter.setActive(true);

        expect(commandSetter.buildStatus()).toContain('🟢 Онлайн');
        expect(mockSetMyCommands).toHaveBeenCalled();
      });
    });
  });
});
