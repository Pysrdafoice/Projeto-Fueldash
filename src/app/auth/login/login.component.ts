import { Component, OnInit }              from '@angular/core';
import { CommonModule }                   from '@angular/common';
import { FormsModule, ReactiveFormsModule,
         FormBuilder, FormGroup,
         Validators }                     from '@angular/forms';
import { Router, RouterLink }             from '@angular/router';
import { AuthService }                    from '../services/auth.service';

@Component({
  selector:    'app-login',
  standalone:  true,
  imports:     [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls:   ['./login.component.css']
})
export class LoginComponent implements OnInit {

  // ── Estado da tela ──
  isSignUp = false;

  // ── Login ──
  loginForm!:   FormGroup;
  showPassword  = false;
  isLoading     = false;
  errorMessage  = '';

  // ── Cadastro ──
  signupEmail    = '';
  signupUsername = '';
  signupPassword = '';
  showSignupPassword = false;
  signupErro    = '';
  signupSucesso = false;

  constructor(
    private fb:          FormBuilder,
    private authService: AuthService,
    private router:      Router
  ) {}

  ngOnInit(): void {
    this.buildForm();
  }

  // ────────────────────────────────────────
  // FORMULÁRIO DE LOGIN
  // ────────────────────────────────────────

  private buildForm(): void {
    this.loginForm = this.fb.group({
      username:    ['', [Validators.required, Validators.minLength(3)]],
      password:    ['', [Validators.required, Validators.minLength(4)]],
      acceptTerms: [false, Validators.requiredTrue],
      acceptLgpd:  [false, Validators.requiredTrue]
    });
  }

  get username()    { return this.loginForm.get('username')!;    }
  get password()    { return this.loginForm.get('password')!;    }
  get acceptTerms() { return this.loginForm.get('acceptTerms')!; }
  get acceptLgpd()  { return this.loginForm.get('acceptLgpd')!;  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading    = true;
    this.errorMessage = '';

    const sucesso = this.authService.login({
      username: this.loginForm.value.username,
      password: this.loginForm.value.password
    });

    this.isLoading = false;

    if (sucesso) {
      this.router.navigate(['/dashboard']);
    } else {
      this.errorMessage = 'Usuário ou senha inválidos.';
    }
  }

  // ────────────────────────────────────────
  // FORMULÁRIO DE CADASTRO
  // ────────────────────────────────────────

  onSignUp(): void {
    this.signupErro    = '';
    this.signupSucesso = false;

    if (!this.signupEmail || !this.signupUsername || !this.signupPassword) {
      this.signupErro = 'Preencha todos os campos.';
      return;
    }

    if (this.signupPassword.length < 6) {
      this.signupErro = 'A senha deve ter no mínimo 6 caracteres.';
      return;
    }

    const sucesso = this.authService.register(
      this.signupUsername,
      this.signupEmail,
      this.signupPassword
    );

    if (sucesso) {
      this.signupSucesso = true;
      this.signupEmail    = '';
      this.signupUsername = '';
      this.signupPassword = '';
      // Volta para login após 2 segundos
      setTimeout(() => {
        this.toggleMode();
        this.signupSucesso = false;
      }, 2000);
    } else {
      this.signupErro = 'Nome de usuário já existe. Escolha outro.';
    }
  }

  // ────────────────────────────────────────
  // TOGGLE ENTRE LOGIN E CADASTRO
  // ────────────────────────────────────────

  toggleMode(): void {
    this.isSignUp     = !this.isSignUp;
    this.errorMessage = '';
    this.signupErro   = '';
    this.signupSucesso = false;
    this.loginForm.reset();
  }
}