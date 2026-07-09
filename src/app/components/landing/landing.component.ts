import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent implements OnInit, OnDestroy {

  readonly totalSlides = 7;
  readonly slideIndexes = [0, 1, 2, 3, 4, 5, 6];
  readonly slideDurationMs = 7000;

  currentIndex = 0;
  progressWidths: number[] = new Array(this.totalSlides).fill(0);

  private autoplayTimer?: ReturnType<typeof setTimeout>;
  private progressFrame?: number;
  private isPaused = false;
  private prefersReducedMotion = false;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.prefersReducedMotion = typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!this.prefersReducedMotion) {
      this.startAutoplay();
    }
  }

  ngOnDestroy(): void {
    this.clearTimers();
  }

  goTo(index: number): void {
    this.currentIndex = (index + this.totalSlides) % this.totalSlides;
    this.resetProgress();
    if (!this.prefersReducedMotion && !this.isPaused) {
      this.restartAutoplay();
    }
  }

  next(): void {
    this.goTo(this.currentIndex + 1);
  }

  previous(): void {
    this.goTo(this.currentIndex - 1);
  }

  onMouseEnter(): void {
    this.isPaused = true;
    this.clearTimers();
  }

  onMouseLeave(): void {
    this.isPaused = false;
    if (!this.prefersReducedMotion) {
      this.restartAutoplay();
    }
  }

  @HostListener('window:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowRight') {
      this.next();
    }
    if (event.key === 'ArrowLeft') {
      this.previous();
    }
  }

  criarConta(): void {
    this.router.navigate(['/login'], { queryParams: { modo: 'cadastro' } });
  }

  entrar(): void {
    this.router.navigate(['/login']);
  }

  private startAutoplay(): void {
    this.animateProgress();
    this.autoplayTimer = setTimeout(() => this.next(), this.slideDurationMs);
  }

  private restartAutoplay(): void {
    this.clearTimers();
    this.startAutoplay();
  }

  private resetProgress(): void {
    this.progressWidths = this.progressWidths.map((_, i) => (i < this.currentIndex ? 100 : 0));
  }

  private animateProgress(): void {
    this.resetProgress();
    const start = performance.now();

    const step = (timestamp: number) => {
      if (this.isPaused) {
        return;
      }
      const elapsed = timestamp - start;
      const pct = Math.min(100, (elapsed / this.slideDurationMs) * 100);
      this.progressWidths[this.currentIndex] = pct;

      if (pct < 100) {
        this.progressFrame = requestAnimationFrame(step);
      }
    };

    this.progressFrame = requestAnimationFrame(step);
  }

  private clearTimers(): void {
    if (this.autoplayTimer) {
      clearTimeout(this.autoplayTimer);
    }
    if (this.progressFrame) {
      cancelAnimationFrame(this.progressFrame);
    }
  }
}
