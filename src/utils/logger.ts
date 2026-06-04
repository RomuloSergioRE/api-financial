import { AsyncLocalStorage } from 'async_hooks';
import crypto from 'crypto';

interface Store {
  requestId: string;
}

const asyncLocalStorage = new AsyncLocalStorage<Store>();

export function getRequestId(): string {
  const store = asyncLocalStorage.getStore();
  return store?.requestId || 'no-request-id';
}

export function runWithRequestId(requestId: string, fn: () => void): void {
  asyncLocalStorage.run({ requestId }, fn);
}

export function generateRequestId(): string {
  return crypto.randomUUID();
}

interface LogEntry {
  level: string;
  timestamp: string;
  requestId: string;
  message: string;
  error?: unknown;
  [key: string]: unknown;
}

function log(level: string, message: string, meta?: Record<string, unknown>): void {
  const entry: LogEntry = {
    level,
    timestamp: new Date().toISOString(),
    requestId: getRequestId(),
    message,
    ...meta,
  };
  const output = JSON.stringify(entry);
  switch (level) {
    case 'error':
      console.error(output);
      break;
    case 'warn':
      console.warn(output);
      break;
    default:
      console.log(output);
  }
}

export const logger = {
  error: (message: string, error?: unknown): void => {
    const isProd = process.env.NODE_ENV === 'production';
    const errorMeta = error instanceof Error
      ? { error: { message: error.message, ...(isProd ? {} : { stack: error.stack }) } }
      : error !== undefined
        ? { error }
        : undefined;
    log('error', message, errorMeta);
  },
  warn: (message: string, meta?: Record<string, unknown>): void => {
    log('warn', message, meta);
  },
  info: (message: string, meta?: Record<string, unknown>): void => {
    log('info', message, meta);
  },
};
