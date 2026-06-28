import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule }                  from '@angular/common';
import { ReactiveFormsModule, FormBuilder,
         FormGroup, Validators }         from '@angular/forms';
import { Subject }                       from 'rxjs';
import { takeUntil }                     from 'rxjs/operators';
import { Vehicle }        from '../../core/models/vehicle_models';
import { VehicleService } from '../../auth/services/vehicle.service';

@Component({
  selector: 'app-vehicles',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './vehicles.component.html',
  styleUrls: ['./vehicles.component.css']
})
export class VehiclesComponent implements OnInit, OnDestroy {

  // ── Estado da tela ──
  viewMode: 'list' | 'form' = 'list';
  editingId: string | null = null;

  // ── Dados ──
  vehicles: Vehicle[] = [];
  activeId: string | null = null;

  // ── Formulário ──
  vehicleForm!: FormGroup;

  // ── Controle de inscrições ──────────────────────────────
  // Subject usado para cancelar todos os subscribes quando
  // o componente for destruído — evita memory leak
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private vehicleService: VehicleService
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.subscribeToData(); // ← substitui o loadVehicles()
  }

  // ── Cancela todas as inscrições ao destruir o componente ──
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ────────────────────────────────────────
  // INSCRIÇÕES NOS OBSERVABLES
  // ────────────────────────────────────────

  private subscribeToData(): void {

    // Toda vez que a lista de veículos mudar, atualiza automaticamente
    this.vehicleService.vehicles$
      .pipe(takeUntil(this.destroy$)) // cancela quando componente destruído
      .subscribe(vehicles => {
        this.vehicles = vehicles;
        console.log('🚗 Lista de veículos atualizada:', vehicles.length);
      });

    // Toda vez que o veículo ativo mudar, atualiza automaticamente
    this.vehicleService.activeId$
      .pipe(takeUntil(this.destroy$))
      .subscribe(id => {
        this.activeId = id;
      });
  }

  // ────────────────────────────────────────
  // FORMULÁRIO
  // ────────────────────────────────────────

  private buildForm(): void {
  this.vehicleForm = this.fb.group({
    apelido:               ['', Validators.required],
    marca:                 ['', Validators.required],
    modelo:                ['', Validators.required],
    ano:                   ['', [Validators.required, Validators.min(1900)]],
    placa:                 ['', Validators.required],
    combustivel:           ['', Validators.required],
    consumoMedio:          ['', [Validators.required, Validators.min(0.1)]],
    kmAtual:               ['', [Validators.required, Validators.min(0)]],

    // ── Campos novos ──
    capacidadeTanque:      ['', [Validators.required, Validators.min(1)]],
    kmUltimoAbastecimento: [0]  // começa com 0, atualizado automaticamente pelo sistema
  });
}
  // ────────────────────────────────────────
  // NAVEGAÇÃO ENTRE TELAS
  // ────────────────────────────────────────

  openForm(vehicle?: Vehicle): void {
    this.vehicleForm.reset();
    if (vehicle) {
      this.editingId = vehicle.id;
      this.vehicleForm.patchValue(vehicle);
    } else {
      this.editingId = null;
    }
    this.viewMode = 'form';
  }

  backToList(): void {
    this.viewMode = 'list';
    this.editingId = null;
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

    // Não precisa mais chamar loadVehicles()!
    // O subscribe já atualiza a lista automaticamente
    this.backToList();
  }

  // ────────────────────────────────────────
  // AÇÕES DO CARD
  // ────────────────────────────────────────

  setActive(id: string): void {
    this.vehicleService.setActive(id);
    // Não precisa atualizar activeId manualmente!
    // O subscribe do activeId$ já faz isso
  }

  deleteVehicle(id: string): void {
    if (!confirm('Tem certeza que deseja excluir este veículo?')) return;
    this.vehicleService.delete(id);
    // Não precisa mais chamar loadVehicles()!
  }

  // ────────────────────────────────────────
  // HELPERS
  // ────────────────────────────────────────

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