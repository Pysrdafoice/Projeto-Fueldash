import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  ValidatorFn,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ForgotPasswordStep } from '../../core/models/user.model';
import { AuthService } from '../../auth/services/auth.service';

/**
 * Validator customizado para validar se as senhas coincidem
 * Retorna uma função ValidatorFn que compara 'password' e 'confirmPassword'
 *
 * @returns ValidatorFn - função que retorna erros de validação ou null
 */
export function passwordMatchValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    // O 'control' é o FormGroup que contém 'password' e 'confirmPassword'
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    // Se os campos não existem ou estão vazios, passar
    if (!password || !confirmPassword) {
      return null;
    }

    // Comparar os valores
    if (password.value !== confirmPassword.value) {
      // Retornar erro no FormGroup
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      // Se as senhas coincidem, remover o erro 'passwordMismatch' (mas manter outros erros)
      const errors = confirmPassword.errors;
      if (errors) {
        delete errors['passwordMismatch'];
        if (Object.keys(errors).length === 0) {
          confirmPassword.setErrors(null);
        } else {
          confirmPassword.setErrors(errors);
        }
      }
      return null;
    }
  };
}

/**
 * ForgotPasswordComponent
 * Componente de recuperação de senha com 4 steps:
 * 1. Email
 * 2. Verificação de código (4 inputs)
 * 3. Nova senha
 * 4. Sucesso
 */
@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css'],
})
export class ForgotPasswordComponent implements OnInit {
  // Enum para usar no template
  ForgotPasswordStep = ForgotPasswordStep;

  // Step atual
  currentStep: ForgotPasswordStep = ForgotPasswordStep.EMAIL;

  // Formulários para cada step
  emailForm!: FormGroup;
  codeForm!: FormGroup;
  newPasswordForm!: FormGroup;

  // Guardar o email para exibir no step 2
  emailSent = '';

  // Controlar loading
  isLoading = false;

  // Mensagens de erro
  errorMessage = '';

  // ViewChild para referências dos inputs do código
  @ViewChild('codeInput2') codeInput2?: ElementRef;
  @ViewChild('codeInput3') codeInput3?: ElementRef;
  @ViewChild('codeInput4') codeInput4?: ElementRef;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {}

  /**
   * Inicializa os três formulários
   */
  ngOnInit(): void {
    this.initEmailForm();
    this.initCodeForm();
    this.initNewPasswordForm();
  }

  /**
   * Inicializa formulário de email (Step 1)
   */
  private initEmailForm(): void {
    this.emailForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  /**
   * Inicializa formulário de código (Step 2)
   * 4 inputs separados: code1, code2, code3, code4
   */
  private initCodeForm(): void {
    this.codeForm = this.formBuilder.group({
      code1: ['', [Validators.required, Validators.maxLength(1)]],
      code2: ['', [Validators.required, Validators.maxLength(1)]],
      code3: ['', [Validators.required, Validators.maxLength(1)]],
      code4: ['', [Validators.required, Validators.maxLength(1)]],
    });
  }

  /**
   * Inicializa formulário de nova senha (Step 3)
   * Inclui validator customizado para validar senhas iguais
   */
  private initNewPasswordForm(): void {
    this.newPasswordForm = this.formBuilder.group(
      {
        password: ['', [Validators.required, Validators.minLength(4)]],
        confirmPassword: ['', [Validators.required, Validators.minLength(4)]],
      },
      { validators: passwordMatchValidator() },
    );
  }

  /**
   * Step 1 → 2: Envia email de recuperação
   */
  onSendEmail(): void {
    if (this.emailForm.invalid) {
      console.warn('⚠️ Email inválido');
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const email = this.emailForm.get('email')?.value;

    // Chamar service (retorna true sempre)
    const isSuccessful = this.authService.sendResetCode(email);

    if (isSuccessful) {
      this.emailSent = email;
      this.currentStep = ForgotPasswordStep.CODE;
      console.log('✅ Email enviado, avançando para Step 2');
    } else {
      this.errorMessage = 'Erro ao enviar email. Tente novamente.';
      console.error('❌ Erro ao enviar email');
    }

    this.isLoading = false;
  }

  /**
   * Step 2 → 3: Verifica o código de 4 dígitos
   */
  onVerifyCode(): void {
    if (this.codeForm.invalid) {
      console.warn('⚠️ Código incompleto');
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Concatenar os 4 dígitos
    const code =
      this.codeForm.get('code1')?.value +
      this.codeForm.get('code2')?.value +
      this.codeForm.get('code3')?.value +
      this.codeForm.get('code4')?.value;

    // Chamar service (aceita "1234")
    const isValid = this.authService.verifyCode(code);

    if (isValid) {
      this.currentStep = ForgotPasswordStep.NEW_PASSWORD;
      console.log('✅ Código verificado, avançando para Step 3');
    } else {
      this.errorMessage = 'Código inválido. Use "1234" para teste.';
      console.error('❌ Código inválido');
      // Limpar os inputs
      this.codeForm.reset();
    }

    this.isLoading = false;
  }

  /**
   * Step 3 → 4: Salva a nova senha
   */
  onSavePassword(): void {
    if (this.newPasswordForm.invalid) {
      console.warn('⚠️ Senhas inválidas ou não coincidem');
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const newPassword = this.newPasswordForm.get('password')?.value;

    // Chamar service (retorna true sempre)
    const isSuccessful = this.authService.resetPassword(newPassword);

    if (isSuccessful) {
      this.currentStep = ForgotPasswordStep.SUCCESS;
      console.log('✅ Senha atualizada, mostrando sucesso');
    } else {
      this.errorMessage = 'Erro ao atualizar senha. Tente novamente.';
      console.error('❌ Erro ao atualizar senha');
    }

    this.isLoading = false;
  }

  /**
   * Volta para a tela de login
   */
  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  /**
   * Auto-foco: ao digitar em um input do código, pula para o próximo
   * @param event KeyboardEvent
   * @param nextInputId ID do próximo input
   */
  focusNext(event: KeyboardEvent, nextInputId: string): void {
    const input = event.target as HTMLInputElement;

    // Se o usuário digitou algo e o campo está cheio
    if (input.value.length === 1) {
      // Focar no próximo input
      const nextInput = document.getElementById(
        nextInputId,
      ) as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
      }
    }

    // Se o usuário pressionar Delete ou Backspace
    if (event.key === 'Backspace' || event.key === 'Delete') {
      input.value = ''; // Limpar o input
    }
  }

  /**
   * Auto-foco reverso: ao pressionar backspace, volta para o input anterior
   * @param event KeyboardEvent
   * @param prevInputId ID do input anterior
   */
  focusPrev(event: KeyboardEvent, prevInputId: string): void {
    const input = event.target as HTMLInputElement;

    // Se o campo está vazio e pressionou backspace
    if (
      input.value === '' &&
      (event.key === 'Backspace' || event.key === 'Delete')
    ) {
      event.preventDefault();
      const prevInput = document.getElementById(
        prevInputId,
      ) as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();
        // Limpar o input anterior também
        prevInput.value = '';
      }
    }
  }

  /**
   * Getters para simplificar acesso aos form controls no template
   *
   * O '!' garante ao TypeScript que não será null
   */
  get email() {
    return this.emailForm.get('email')!;
  }

  get code1() {
    return this.codeForm.get('code1')!;
  }

  get code2() {
    return this.codeForm.get('code2')!;
  }

  get code3() {
    return this.codeForm.get('code3')!;
  }

  get code4() {
    return this.codeForm.get('code4')!;
  }

  get password() {
    return this.newPasswordForm.get('password')!;
  }

  get confirmPassword() {
    return this.newPasswordForm.get('confirmPassword')!;
  }
}
