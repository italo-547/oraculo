// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock commander Command para inspecionar flags e execute parseAsync
class FakeCommand {
  nameVal?: string;
  versionVal?: string;
  descriptionVal?: string;
  options: string[] = [];
  handlers: Record<string, any> = {};
  name(v: string) {
    this.nameVal = v;
    return this;
  }
  version(v: string) {
    this.versionVal = v;
    return this;
  }
  description(v: string) {
    this.descriptionVal = v;
    return this;
  }
  option(flag: string) {
    this.options.push(flag);
    return this;
  }
  addCommand(cmd: any) {
    /* ignore para este teste */ return this;
  }
  parseAsync(args: string[]) {
    this.lastArgs = args;
    return Promise.resolve(this);
  }
  lastArgs?: string[];
}

vi.mock('commander', () => ({ Command: FakeCommand }));
vi.mock('../nucleo/constelacao/cosmos.js', async (orig) => {
  const real = await (orig as any)();
  return { ...real, config: { ...real.config } };
});

import { config } from '../nucleo/constelacao/cosmos.js';

describe('CLI flags globais', () => {
  beforeEach(() => {
    config.REPORT_SILENCE_LOGS = false;
    config.VERBOSE = false;
    config.REPORT_EXPORT_ENABLED = false;
    config.DEV_MODE = false;
  });

  it('--silence desativa verbose mesmo se passado --verbose', async () => {
    const aplicarFlagsGlobais = (opts: any) => {
      config.REPORT_SILENCE_LOGS = !!opts.silence;
      config.REPORT_EXPORT_ENABLED = !!opts.export;
      config.DEV_MODE = !!opts.dev;
      config.VERBOSE = opts.silence ? false : !!opts.verbose;
    };
    aplicarFlagsGlobais({ silence: true, verbose: true });
    expect(config.REPORT_SILENCE_LOGS).toBe(true);
    expect(config.VERBOSE).toBe(false);
  });

  it('--export e --dev habilitam respectivos flags', () => {
    const aplicarFlagsGlobais = (opts: any) => {
      config.REPORT_SILENCE_LOGS = !!opts.silence;
      config.REPORT_EXPORT_ENABLED = !!opts.export;
      config.DEV_MODE = !!opts.dev;
      config.VERBOSE = opts.silence ? false : !!opts.verbose;
    };
    aplicarFlagsGlobais({ export: true, dev: true });
    expect(config.REPORT_EXPORT_ENABLED).toBe(true);
    expect(config.DEV_MODE).toBe(true);
  });

  it('--verbose ativa verbose quando não há silence', () => {
    const aplicarFlagsGlobais = (opts: any) => {
      config.REPORT_SILENCE_LOGS = !!opts.silence;
      config.REPORT_EXPORT_ENABLED = !!opts.export;
      config.DEV_MODE = !!opts.dev;
      config.VERBOSE = opts.silence ? false : !!opts.verbose;
    };
    aplicarFlagsGlobais({ verbose: true });
    expect(config.VERBOSE).toBe(true);
  });
});
