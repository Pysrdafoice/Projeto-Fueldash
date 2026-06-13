import { Injectable } from '@angular/core';
import { LoginRequest } from '../../core/models/user.model';

/**
 * AuthService
 * Gerencia toda a lógica de autenticação da aplicação
 * Responsável por: login, logout, verificação de autenticação e recuperação de senha
 *
 * @Injectable({ providedIn: 'root' })
 * Isso significa que o service é fornecido a nível raiz (singleton)
 * Qualquer componente pode injetar este service sem precisar declarar em um módulo
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Chave para armazenar dados no localStorage
  private readonly STORAGE_KEY = 'fuel_dash_auth';

  // Credenciais de teste (admin/123)
  private readonly VALID_USERNAME = 'admin';
  private readonly VALID_PASSWORD = '1234';

  constructor() {}

  /**
   * Realiza o login do usuário
   * Valida as credenciais contra dados fixos (para teste)
   * Se válido, armazena os dados do usuário no localStorage
   *
   * @param request LoginRequest com username e password
   * @returns boolean - true se login bem-sucedido, false caso contrário
   */
  login(request: LoginRequest): boolean {
    // Validar credenciais
    if (
      request.username === this.VALID_USERNAME &&
      request.password === this.VALID_PASSWORD
    ) {
      // Criar objeto do usuário autenticado
      const userData = {
        username: request.username,
        email: 'admin@fueldash.com', // Email de teste
        password: request.password, // Armazenar password (apenas para teste)
      };

      // Salvar no localStorage
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(userData));
      console.log('✅ Login bem-sucedido para:', request.username);
      return true;
    }

    console.warn('❌ Credenciais inválidas');
    return false;
  }

  /**
   * Realiza o logout do usuário
   * Remove os dados do localStorage
   */
  logout(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('✅ Logout realizado');
  }

  /**
   * Verifica se o usuário está autenticado
   * @returns boolean - true se existe dados no localStorage, false caso contrário
   */
  isLoggedIn(): boolean {
    const data = localStorage.getItem(this.STORAGE_KEY);
    const isLogged = !!data; // Converte para boolean
    console.log(
      '🔍 Verificando autenticação:',
      isLogged ? 'Autenticado' : 'Não autenticado',
    );
    return isLogged;
  }

  /**
   * Obtém os dados do usuário autenticado do localStorage
   * @returns objeto com username, email, password ou null
   */
  getAuthenticatedUser() {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Simula o envio de código de recuperação para o email
   * Em um projeto real, isso faria uma requisição HTTP
   *
   * @param email Email do usuário
   * @returns boolean - sempre true (simulação)
   */
  sendResetCode(email: string): boolean {
    console.log(`📧 Enviando código de recuperação para: ${email}`);
    console.log(`🔐 Código de teste: 123`);
    return true;
  }

  /**
   * Verifica se o código fornecido é válido
   * Aceita "123" como código válido para testes
   *
   * @param code Código enviado para o email
   * @returns boolean - true se código é válido
   */
  verifyCode(code: string): boolean {
    const isValid = code === '1234';
    if (isValid) {
      console.log('✅ Código verificado com sucesso');
    } else {
      console.warn('❌ Código inválido. Use "1234" para teste');
    }
    return isValid;
  }

  /**
   * Simula a atualização da senha do usuário
   * Em um projeto real, isso faria uma requisição HTTP
   *
   * @param newPassword A nova senha
   * @returns boolean - sempre true (simulação)
   */
  resetPassword(newPassword: string): boolean {
    console.log('🔄 Atualizando senha...');
    console.log('✅ Senha resetada com sucesso');
    return true;
  }
}
