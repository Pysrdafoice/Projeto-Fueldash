import { Component, OnInit } from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { CommonModule } from '@angular/common';


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
    const success = this.authService.login({
      username: this.loginForm.value.username,
      password: this.loginForm.value.password,
    });

    if (success) {
      this.router.navigate(['/dashboard']); 
    } else {
      this.errorMessage = 'Usuário ou senha inválidos';
    }
  }
  
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
