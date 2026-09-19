import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { environment } from '../../../environments/environment';
import { APP_CONFIG } from '../config/app-config';
import { LoggerService } from './logger.service';

describe('LoggerService', () => {
  afterEach(() => vi.restoreAllMocks());

  function configure(logLevel: 'debug' | 'info' | 'warn' | 'error' | 'off') {
    TestBed.configureTestingModule({
      providers: [{ provide: APP_CONFIG, useValue: { ...environment, logLevel } }],
    });
    return TestBed.inject(LoggerService);
  }

  beforeEach(() => {
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('writes messages at or above the configured level', () => {
    const logger = configure('warn');
    logger.debug('too quiet');
    logger.info('too quiet');
    logger.warn('audible');
    logger.error('audible');

    expect(console.debug).not.toHaveBeenCalled();
    expect(console.info).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledOnce();
    expect(console.error).toHaveBeenCalledOnce();
  });

  it('suppresses everything when the level is off', () => {
    const logger = configure('off');
    logger.error('never logged');
    expect(console.error).not.toHaveBeenCalled();
  });

  it('tags entries from a child logger with its own context', () => {
    const logger = configure('debug');
    logger.forContext('Cart').info('added item');

    expect(console.info).toHaveBeenCalledWith(expect.stringContaining('[Cart]'), ...[]);
  });
});
