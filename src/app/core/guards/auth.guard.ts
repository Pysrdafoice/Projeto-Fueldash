import { Injectable } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { inject } from '@angular/core';

/**
 * AuthGuard
 * Protege as rotas privadas (como dashboard)
 * Bloqueia acesso se o usuário não estiver autenticado
 *
 * Funciona como um "vigia" que valida se o usuário pode acessar uma rota
 * Antes de o Angular ativar o componente da rota
 *
 * Guard funcional (Angular 17+):
 * - Retorna CanActivateFn
 * - Usa 'inject()' para injetar dependências sem precisar de @Injectable
 */

export const authGuard: CanActivateFn = (route, state) => {
  // Injetar AuthService e Router usando 'inject()'
  const authService = inject(AuthService);
  const router = inject(Router);

  // Verificar se o usuário está autenticado
  if (authService.isLoggedIn()) {
    console.log('✅ Acesso permitido - Usuário autenticado');
    return true; // Permitir acesso
  }

  // Se não está autenticado, redirecionar para login
  console.warn('❌ Acesso negado - Redirecionando para /login');
  router.navigate(['/login']);
  return false; // Bloquear acesso
};
