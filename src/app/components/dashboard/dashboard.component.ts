import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { CommonModule } from '@angular/common';

/**
 * DashboardComponent
 * Tela principal após autenticação
 * Componente placeholder que será desenvolvido futuramente
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent {
  userData: any;

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {
    // Obter dados do usuário autenticado
    this.userData = this.authService.getAuthenticatedUser();
  }

  /**
   * Fazer logout
   */
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
