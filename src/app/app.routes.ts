import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { ForgotPasswordComponent } from './auth/forgot-password/forgot-password.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { authGuard } from './core/guards/auth.guard';
import { LandingComponent } from './components/landing/landing.component';
import {GraficosComponent} from './components/graficos/graficos.component';
export const routes: Routes = [


  // Rotas públicas de autenticação
  { path: '', redirectTo: 'landing', pathMatch: 'full' },
  { path: 'landing', component: LandingComponent },
  
  { path: 'login', component: LoginComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },


  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard],
  },

   {
    path: 'graficos',
    component: GraficosComponent,
        canActivate: [authGuard],

  }
];
