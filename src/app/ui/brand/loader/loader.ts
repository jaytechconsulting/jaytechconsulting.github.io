import { isBrowser } from '../../../core/platform';
import { Component, DestroyRef, inject, output, signal } from '@angular/core';

interface BootLine { cmd: string; out: string | null; }

const BOOT_LINES: BootLine[] = [
  { cmd: '$ init jaytech.system', out: null },
  { cmd: '> montando módulos de UI', out: 'ok' },
  { cmd: '> conectando servicios', out: 'ok' },
  { cmd: '> calibrando sensores', out: 'ok' },
  { cmd: '> desplegando dron', out: 'listo' },
];

@Component({
  selector: 'app-loader',
  templateUrl: './loader.html',
  styleUrl: './loader.css',
})
export class Loader {
  readonly completed = output<void>();
  readonly typed = signal('');
  readonly doneLines = signal<BootLine[]>([]);
  readonly currentLine = signal<BootLine | null>(BOOT_LINES[0]);
  readonly progress = signal(0);
  readonly finished = signal(false);

  private stopped = false;
  private readonly intervals: ReturnType<typeof setInterval>[] = [];
  private readonly timeouts: ReturnType<typeof setTimeout>[] = [];

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.stopped = true;
      this.intervals.forEach(clearInterval);
      this.timeouts.forEach(clearTimeout);
    });
    // The boot animation only plays in the browser; prerendering keeps its first frame.
    if (isBrowser) this.playOnce();
  }

  private async playOnce(): Promise<void> {
    const startedAt = performance.now();
    for (const line of BOOT_LINES) {
      if (this.stopped) return;
      this.currentLine.set(line);
      await this.typeLine(line.cmd);
      await this.wait(30);
      this.doneLines.update(lines => [...lines, line]);
      this.rampProgress(Math.round((this.doneLines().length / BOOT_LINES.length) * 100));
    }

    this.currentLine.set(null);
    await this.waitForProgress();
    const remaining = Math.max(0, 1000 - (performance.now() - startedAt));
    await this.wait(remaining);
    if (this.stopped) return;
    this.finished.set(true);
    await this.wait(140);
    if (!this.stopped) this.completed.emit();
  }

  private typeLine(full: string): Promise<void> {
    return new Promise(resolve => {
      this.typed.set('');
      let index = 0;
      const id = setInterval(() => {
        index += 1;
        this.typed.set(full.slice(0, index));
        if (index >= full.length) { clearInterval(id); resolve(); }
      }, 8);
      this.intervals.push(id);
    });
  }

  private rampProgress(target: number): void {
    const id = setInterval(() => {
      const current = this.progress();
      if (current >= target) { clearInterval(id); return; }
      this.progress.set(Math.min(target, current + 10));
    }, 8);
    this.intervals.push(id);
  }

  private waitForProgress(): Promise<void> {
    return new Promise(resolve => {
      const id = setInterval(() => {
        if (this.progress() >= 100) { clearInterval(id); resolve(); }
      }, 16);
      this.intervals.push(id);
    });
  }

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => {
      const id = setTimeout(resolve, ms);
      this.timeouts.push(id);
    });
  }
}
