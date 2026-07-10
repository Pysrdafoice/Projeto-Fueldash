
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
  isPaused = false;
  userInteracted = false; // Segue a lógica do vídeo: interação cancela o timer

  private autoplayInterval?: ReturnType<typeof setInterval>;
  private prefersReducedMotion = false;

  constructor(private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.prefersReducedMotion = typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!this.prefersReducedMotion) {
      this.startAutoplay();
    }
  }

  ngOnDestroy(): void {
    this.stopAutoplay();
  }

  // --- Lógica de Navegação ---

  goTo(index: number): void {
    this.handleUserInteraction();
    this.currentIndex = (index + this.totalSlides) % this.totalSlides;
  }

  next(): void {
    this.handleUserInteraction();
    this.currentIndex = (this.currentIndex + 1) % this.totalSlides;
  }

  previous(): void {
    this.handleUserInteraction();
    this.currentIndex = (this.currentIndex - 1 + this.totalSlides) % this.totalSlides;
  }

  // --- Eventos de Mouse e Teclado ---

  onMouseEnter(): void {
    this.isPaused = true;
  }

  onMouseLeave(): void {
    this.isPaused = false;
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

  // --- Ações de Rota ---

  criarConta(): void {
    this.router.navigate(['/login'], { queryParams: { modo: 'cadastro' } });
  }

  entrar(): void {
    this.router.navigate(['/login']);
  }

  // --- Controle do Carrossel (Lógica do Vídeo) ---

  private startAutoplay(): void {
    this.autoplayInterval = setInterval(() => {
      if (!this.isPaused && !this.userInteracted) {
        this.currentIndex = (this.currentIndex + 1) % this.totalSlides;

        // Esta linha é a mágica: avisa o Angular para atualizar o HTML na mesma hora!
        this.cdr.detectChanges();
      }
    }, this.slideDurationMs);
  }

  private stopAutoplay(): void {
    if (this.autoplayInterval) {
      clearInterval(this.autoplayInterval);
    }
  }

  private handleUserInteraction(): void {
    this.userInteracted = true; // Marca que o usuário assumiu o controle
    this.stopAutoplay();        // Executa o clearInterval (como no vídeo)
  }
}
