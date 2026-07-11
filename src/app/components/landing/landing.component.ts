import { Component, OnInit, OnDestroy, HostListener, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router }       from '@angular/router';

@Component({
  selector:    'app-landing',
  standalone:  true,
  imports:     [CommonModule],
  templateUrl: './landing.component.html',
  styleUrls:   ['./landing.component.css']
})
export class LandingComponent implements OnInit, OnDestroy {

  readonly totalSlides  = 7;
  readonly slideIndexes = [0,1,2,3,4,5,6];

  currentIndex      = 0;
  carouselTransform = 'translateX(0%)';
  progressWidths: number[] = new Array(this.totalSlides).fill(0);

  private intervalId?: ReturnType<typeof setInterval>;

  constructor(
    private router: Router,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.updateCarousel();
    this.startCarousel();
  }

  ngOnDestroy(): void {
    this.stopCarousel();
  }

  // ────────────────────────────────────────
  // NAVEGAÇÃO
  // ────────────────────────────────────────

  next(): void {
    this.currentIndex++;
    if (this.currentIndex >= this.totalSlides) this.currentIndex = 0;
    this.updateCarousel();
    this.resetTimer();
  }

  previous(): void {
    this.currentIndex--;
    if (this.currentIndex < 0) this.currentIndex = this.totalSlides - 1;
    this.updateCarousel();
    this.resetTimer();
  }

  goTo(index: number): void {
    this.currentIndex = index;
    this.updateCarousel();
    this.resetTimer();
  }

  // ────────────────────────────────────────
  // AUTOPLAY
  // ────────────────────────────────────────

  private resetTimer(): void {
  this.stopCarousel();
  this.ngZone.runOutsideAngular(() => {
    this.intervalId = setInterval(() => {
      this.ngZone.run(() => {
        this.currentIndex++;
        if (this.currentIndex >= this.totalSlides) this.currentIndex = 0;
        this.updateCarousel();
      });
    }, 7000);
  });
}

  private startCarousel(): void {
    this.resetTimer();
  }

  private stopCarousel(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  // ────────────────────────────────────────
  // ATUALIZA CARROSSEL
  // ────────────────────────────────────────

  private updateCarousel(): void {
    this.carouselTransform =
      `translateX(-${this.currentIndex * 100}%)`;

    this.progressWidths = this.progressWidths.map((_, i) => {
      if (i <= this.currentIndex) return 100;
      return 0;
    });
  }

  // ────────────────────────────────────────
  // MOUSE
  // ────────────────────────────────────────

  onMouseEnter(): void { this.stopCarousel(); }
  onMouseLeave(): void { this.resetTimer();   }

  // ────────────────────────────────────────
  // TECLADO
  // ────────────────────────────────────────

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'ArrowRight') this.next();
    if (event.key === 'ArrowLeft')  this.previous();
  }

  // ────────────────────────────────────────
  // BOTÕES
  // ────────────────────────────────────────

  criarConta(): void {
    this.router.navigate(['/login'], { queryParams: { modo: 'cadastro' } });
  }

  entrar(): void {
    this.router.navigate(['/login']);
  }
}