import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../../main/ipc/router';

export const trpc = createTRPCReact<AppRouter>();
