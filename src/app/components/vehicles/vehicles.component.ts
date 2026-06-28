import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule }                  from '@angular/common';
import { ReactiveFormsModule, FormBuilder,
         FormGroup, Validators }         from '@angular/forms';
import { Subject }                       from 'rxjs';
import { takeUntil }                     from 'rxjs/operators';
import { Vehicle, TipoCombustivel }        from '../../core/models/vehicle_models';
import { VehicleService } from '../../auth/services/vehicle.service';
// src/app/components/vehicles/vehicles.component.ts


@Component({
  selector: 'app-vehicles',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './vehicles.component.html',
  styleUrls: ['./vehicles.component.css']
})
export class VehiclesComponent implements OnInit, OnDestroy {

  viewMode:  'list' | 'form' = 'list';
  editingId: string | null = null;
  vehicles:  Vehicle[] = [];
  activeId:  string | null = null;

  vehicleForm!: FormGroup;

  // Controla quais campos extras mostrar
  isFlex:    boolean = false;
  isHibrido: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb:             FormBuilder,
    private vehicleService: VehicleService
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.subscribeToData();
    this.listenToCombustivel();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ────────────────────────────────────────
  // INSCRIÇÕES
  // ────────────────────────────────────────

  private subscribeToData(): void {
    this.vehicleService.vehicles$
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.vehicles = v);

    this.vehicleService.activeId$
      .pipe(takeUntil(this.destroy$))
      .subscribe(id => this.activeId = id);
  }

  // Escuta mudança no campo combustível para mostrar/ocultar campos extras
  private listenToCombustivel(): void {
    this.vehicleForm.get('combustivel')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((valor: TipoCombustivel) => {
        this.isFlex    = valor === 'flex';
        this.isHibrido = valor === 'hibrido';
        this.ajustarValidators(valor);
      });
  }

  // Adiciona ou remove validators conforme o tipo de combustível
  private ajustarValidators(tipo: TipoCombustivel): void {
    const campos = [
      'consumoMedioGasolina',
      'consumoMedioEtanol',
      'autonomiaEletrica',
      'consumoCombustivel'
    ];

    // Remove todos os validators extras primeiro
    campos.forEach(campo => {
      this.vehicleForm.get(campo)?.clearValidators();
      this.vehicleForm.get(campo)?.updateValueAndValidity();
    });

    // Adiciona os validators corretos
    if (tipo === 'flex') {
      this.vehicleForm.get('consumoMedioGasolina')
        ?.setValidators([Validators.required, Validators.min(0.1)]);
      this.vehicleForm.get('consumoMedioEtanol')
        ?.setValidators([Validators.required, Validators.min(0.1)]);
      this.vehicleForm.get('consumoMedioGasolina')?.updateValueAndValidity();
      this.vehicleForm.get('consumoMedioEtanol')?.updateValueAndValidity();
    }

    if (tipo === 'hibrido') {
      this.vehicleForm.get('autonomiaEletrica')
        ?.setValidators([Validators.required, Validators.min(1)]);
      this.vehicleForm.get('consumoCombustivel')
        ?.setValidators([Validators.required, Validators.min(0.1)]);
      this.vehicleForm.get('autonomiaEletrica')?.updateValueAndValidity();
      this.vehicleForm.get('consumoCombustivel')?.updateValueAndValidity();
    }
  }

  // ────────────────────────────────────────
  // FORMULÁRIO
  // ────────────────────────────────────────

  private buildForm(): void {
    this.vehicleForm = this.fb.group({
      // Campos base
      apelido:               ['', Validators.required],
      marca:                 ['', Validators.required],
      modelo:                ['', Validators.required],
      ano:                   ['', [Validators.required, Validators.min(1900)]],
      placa:                 ['', Validators.required],
      combustivel:           ['', Validators.required],
      consumoMedio:          ['', [Validators.required, Validators.min(0.1)]],
      capacidadeTanque:      ['', [Validators.required, Validators.min(1)]],
      kmAtual:               ['', [Validators.required, Validators.min(0)]],
      kmUltimoAbastecimento: [0],

      // Campos Flex (opcionais por padrão)
      consumoMedioGasolina:  [null],
      consumoMedioEtanol:    [null],
      combustivelAtual:      [null],

      // Campos Híbrido (opcionais por padrão)
      autonomiaEletrica:     [null],
      consumoCombustivel:    [null],
    });
  }

  // ────────────────────────────────────────
  // NAVEGAÇÃO
  // ────────────────────────────────────────

  openForm(vehicle?: Vehicle): void {
    this.vehicleForm.reset();
    this.isFlex    = false;
    this.isHibrido = false;

    if (vehicle) {
      this.editingId = vehicle.id;
      this.vehicleForm.patchValue(vehicle);
      this.isFlex    = vehicle.combustivel === 'flex';
      this.isHibrido = vehicle.combustivel === 'hibrido';
    } else {
      this.editingId = null;
    }

    this.viewMode = 'form';
  }

  backToList(): void {
    this.viewMode  = 'list';
    this.editingId = null;
    this.isFlex    = false;
    this.isHibrido = false;
    this.vehicleForm.reset();
  }

  // ────────────────────────────────────────
  // SUBMIT
  // ────────────────────────────────────────

  onSubmit(): void {
    if (this.vehicleForm.invalid) {
      this.vehicleForm.markAllAsTouched();
      return;
    }

    const formValue = this.vehicleForm.value;

    if (this.editingId) {
      this.vehicleService.update({ ...formValue, id: this.editingId });
    } else {
      this.vehicleService.save({ ...formValue, id: '' });
    }

    this.backToList();
  }

  // ────────────────────────────────────────
  // AÇÕES DO CARD
  // ────────────────────────────────────────

  setActive(id: string): void {
    this.vehicleService.setActive(id);
  }

  deleteVehicle(id: string): void {
    if (!confirm('Tem certeza que deseja excluir este veículo?')) return;
    this.vehicleService.delete(id);
  }

  isActive(id: string): boolean {
    return this.activeId === id;
  }

  getError(campo: string): string {
    const control = this.vehicleForm.get(campo);
    if (!control || !control.touched || !control.errors) return '';
    if (control.errors['required']) return 'Campo obrigatório';
    if (control.errors['min'])      return 'Valor inválido';
    return '';
  }
}