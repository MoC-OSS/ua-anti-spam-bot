import { mockContextField } from './testing/mock-context-field';
import type { GrammyContext } from './types';

export const mockSession = mockContextField<GrammyContext, 'session'>('session');
export const mockChatSession = mockContextField<GrammyContext, 'chatSession'>('chatSession');
