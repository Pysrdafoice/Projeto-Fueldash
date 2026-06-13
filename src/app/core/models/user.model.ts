/**
 * Interface do usuário autenticado
 * Representa as informações do usuário após login bem-sucedido
 */
export interface User {
  username: string;
  email: string;
  token: string;
}

/**
 * Payload enviado na requisição de login
 * Contém as credenciais do usuário
 */
export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * Enum para controlar os steps do forgot-password
 * Cada número representa uma etapa do fluxo de recuperação de senha
 */
export enum ForgotPasswordStep {
  EMAIL = 1,
  CODE = 2,
  NEW_PASSWORD = 3,
  SUCCESS = 4,
}
