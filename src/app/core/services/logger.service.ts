import { Injectable, inject } from '@angular/core';
import { APP_CONFIG, type LogLevel } from '../config/app-config';

const RANK: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40, off: 100 };

/**
 * Thin logging facade. Keeping console access behind an injectable means the
 * transport (console today, an APM sink tomorrow) can be swapped without
 * touching a single call site, and log volume is controlled per environment.
 */
@Injectable({ providedIn: 'root' })
export class LoggerService {
  private readonly threshold = RANK[inject(APP_CONFIG).logLevel];
  private context = 'RIMMS';

  /** Returns a lightweight child logger that tags entries with `context`. */
  forContext(context: string): LoggerService {
    const child: LoggerService = Object.create(this);
    child.context = context;
    return child;
  }

  debug(message: string, ...args: unknown[]): void {
    this.write('debug', message, args);
  }

  info(message: string, ...args: unknown[]): void {
    this.write('info', message, args);
  }

  warn(message: string, ...args: unknown[]): void {
    this.write('warn', message, args);
  }

  error(message: string, ...args: unknown[]): void {
    this.write('error', message, args);
  }

  private write(level: Exclude<LogLevel, 'off'>, message: string, args: unknown[]): void {
    if (RANK[level] < this.threshold) return;
    const prefix = `[${new Date().toISOString()}] [${level.toUpperCase()}] [${this.context}]`;
    const sink =
      level === 'debug'
        ? console.debug
        : level === 'info'
          ? console.info
          : level === 'warn'
            ? console.warn
            : console.error;
    sink(`${prefix} ${message}`, ...args);
  }
}
