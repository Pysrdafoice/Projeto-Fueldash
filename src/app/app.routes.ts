import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { ForgotPasswordComponent } from './auth/forgot-password/forgot-password.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { authGuard } from './core/guards/auth.guard';

/**
 * Configuração de rotas da aplicação
 *
 * - '' → redirect para '/login' (rota padrão)
 * - 'login' → LoginComponent (pública)
 * - 'forgot-password' → ForgotPasswordComponent (pública)
 * - Rotas futuras do dashboard serão protegidas pelo authGuard
 *
 * AuthGuard funciona assim:
 * - Se usuário está autenticado (isLoggedIn() = true) → permite acesso
 * - Se não autenticado → redireciona para '/login'
 */
export const routes: Routes = [
  // Redirect padrão
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // Rotas públicas de autenticação
  { path: 'login', component: LoginComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  


  // Rotas protegidas (requerem autenticação via authGuard)
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard],
  },

  // Rotas futuras do dashboard (protegidas pelo AuthGuard)
  // { path: 'reports', component: ReportsComponent, canActivate: [authGuard] },

  // Rota 404 (catch-all, deve estar sempre por último)
  // { path: '**', redirectTo: 'login' }
];
