import { Component, OnInit } from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';

/**
 * LoginComponent
 * Formulário de login com validação reativa
 * Utiliza FormBuilder para criar um FormGroup com validadores
 *
 * Standalone: true
 * Não precisa ser declarado em um módulo (Angular 17+)
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  // Formulário reativo
  loginForm!: FormGroup;

  // Controlar visibilidade da senha
  showPassword = false;

  // Desabilitar botão durante submit
  isLoading = false;

  // Exibir erro de credenciais inválidas
  errorMessage = '';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {}

  /**
   * Inicializa o formulário com validators
   * Chamado automaticamente pelo Angular após o componente ser criado
   */
  ngOnInit(): void {
    this.loginForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(4)]],
      acceptTerms: [false, [Validators.requiredTrue]],
    });
  }

  /**
   * Alterna a visibilidade da senha entre text e password
   */
  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  /**
   * Submete o formulário
   * Chama authService.login(), trata erros e navega para o dashboard
   */
  onSubmit(): void {
    // Se o formulário for inválido, não fazer nada
    if (this.loginForm.invalid) {
      console.warn('⚠️ Formulário inválido');
      return;
    }

    // Ativar estado de loading
    this.isLoading = true;
    this.errorMessage = '';

    // Extrair valores do formulário
    const credentials = this.loginForm.value;

    // Tentar fazer login
    const isSuccessful = this.authService.login({
      username: credentials.username,
      password: credentials.password,
    });

    if (isSuccessful) {
      // Login bem-sucedido → navegar para dashboard
      console.log('✅ Navegando para dashboard...');
      this.router.navigate(['/dashboard']);
    } else {
      // Login falhou → exibir erro
      this.errorMessage = 'Usuário ou senha inválidos';
      console.error('❌ Erro de login:', this.errorMessage);
    }

    // Desativar estado de loading
    this.isLoading = false;
  }

  /**
   * Atalhos para acessar os FormControls no template
   * Simplifica a sintaxe no HTML
   *
   * O '!' garante ao TypeScript que não será null
   */
  get username() {
    return this.loginForm.get('username')!;
  }

  get password() {
    return this.loginForm.get('password')!;
  }

  get acceptTerms() {
    return this.loginForm.get('acceptTerms')!;
  }
}
