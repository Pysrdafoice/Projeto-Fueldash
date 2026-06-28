// src/app/components/costs/costs.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule }                  from '@angular/common';
import { ReactiveFormsModule,
         FormBuilder, FormGroup,
         Validators }                   from '@angular/forms';
import { Subject }                       from 'rxjs';
import { takeUntil }                     from 'rxjs/operators';

import { FuelCost }       from '../../core/models/cost.model';
import { CostService }    from '../../auth/services/cost.service';
import { VehicleService } from '../../auth/services/vehicle.service';
import { Vehicle }        from '../../core/models/vehicle_models';

@Component({
  selector: 'app-costs',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './cost.component.html',
  styleUrls: ['./cost.component.css']
})
export class CostsComponent implements OnInit, OnDestroy {

  // ── Estado da tela ──
  viewMode: 'list' | 'form' = 'list';

  // ── Dados ──
  costs:           FuelCost[] = [];
  activeVehicle:   Vehicle | null = null;
  cheapestStation: string | null = null;
  postosRecentes:  string[] = [];  // ← propriedade da classe, não do método

  // ── Formulário ──
  costForm!:      FormGroup;
  tipoViagem:     'ida' | 'idavolta' = 'ida';

  // ── Preview calculado em tempo real ──
  previewKmTotal:  number = 0;
  previewTotal:    number = 0;
  previewCustoKm:  number = 0;

  // ── Controle de inscrições ──
  private destroy$ = new Subject<void>();

  constructor(
    private fb:             FormBuilder,
    private costService:    CostService,
    private vehicleService: VehicleService
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.subscribeToVehicle();
    this.subscribeToCosts();
    this.listenToFormChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ────────────────────────────────────────
  // INSCRIÇÕES
  // ────────────────────────────────────────

  private subscribeToVehicle(): void {
    this.vehicleService.activeId$
      .pipe(takeUntil(this.destroy$))
      .subscribe(id => {
        if (id) {
          this.vehicleService.vehicles$
            .pipe(takeUntil(this.destroy$))
            .subscribe(list => {
              this.activeVehicle = list.find(v => v.id === id) || null;
              this.atualizarDados();
            });
        } else {
          this.activeVehicle = null;
          this.costs          = [];
          this.postosRecentes = [];
          this.cheapestStation = null;
        }
      });
  }

  private subscribeToCosts(): void {
    this.costService.costs$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.atualizarDados());
  }

  // Centraliza atualização de custos, posto mais barato e postos recentes
  private atualizarDados(): void {
    if (!this.activeVehicle) return;

    const id = this.activeVehicle.id;

    this.costs           = this.costService.getByVehicle(id);
    this.cheapestStation = this.costService.getCheapestStation(id);
    this.postosRecentes  = this.costService.getPostosRecentes(id); // ← método público
  }

  // ────────────────────────────────────────
  // FORMULÁRIO
  // ────────────────────────────────────────

  private buildForm(): void {
    this.costForm = this.fb.group({
      data:            ['', Validators.required],
      posto:           ['', Validators.required],
      tipoCombustivel: ['', Validators.required],
      precoPorLitro:   ['', [Validators.required, Validators.min(0.01)]],
      litros:          ['', [Validators.required, Validators.min(0.1)]],
      kmPercorrido:    ['', [Validators.required, Validators.min(1)]]
    });
  }

  private listenToFormChanges(): void {
    this.costForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.calcularPreview());
  }

  private calcularPreview(): void {
    const { precoPorLitro, litros, kmPercorrido } = this.costForm.value;

    const preco = parseFloat(precoPorLitro) || 0;
    const lts   = parseFloat(litros)        || 0;
    const km    = parseFloat(kmPercorrido)  || 0;

    this.previewKmTotal = this.tipoViagem === 'idavolta' ? km * 2 : km;
    this.previewTotal   = parseFloat((preco * lts).toFixed(2));
    this.previewCustoKm = this.previewKmTotal > 0
      ? parseFloat((this.previewTotal / this.previewKmTotal).toFixed(2))
      : 0;
  }

  // ────────────────────────────────────────
  // TIPO DE VIAGEM
  // ────────────────────────────────────────

  setTipoViagem(tipo: 'ida' | 'idavolta'): void {
    this.tipoViagem = tipo;
    this.calcularPreview();
  }

  // ────────────────────────────────────────
  // NAVEGAÇÃO
  // ────────────────────────────────────────

  openForm(): void {
    this.costForm.reset();
    this.tipoViagem     = 'ida';
    this.previewKmTotal = 0;
    this.previewTotal   = 0;
    this.previewCustoKm = 0;

    // Preenche data com hoje automaticamente
    const hoje = new Date().toISOString().split('T')[0];
    this.costForm.patchValue({ data: hoje });

    this.viewMode = 'form';
  }

  backToList(): void {
    this.viewMode = 'list';
    this.costForm.reset();
  }

  // ────────────────────────────────────────
  // SUBMIT
  // ────────────────────────────────────────

  onSubmit(): void {
    if (this.costForm.invalid) {
      this.costForm.markAllAsTouched();
      return;
    }

    if (!this.activeVehicle) {
      alert('Cadastre e ative um veículo antes de registrar um custo.');
      return;
    }

    const { data, posto, tipoCombustivel,
            precoPorLitro, litros, kmPercorrido } = this.costForm.value;

    const novoCusto: FuelCost = {
      id:              '',
      vehicleId:       this.activeVehicle.id,
      data,
      posto,
      tipoCombustivel,
      precoPorLitro:   parseFloat(precoPorLitro),
      litros:          parseFloat(litros),
      kmPercorrido:    parseFloat(kmPercorrido),
      tipoViagem:      this.tipoViagem,
      kmTotal:         this.previewKmTotal,
      totalPago:       this.previewTotal,
      custoKm:         this.previewCustoKm,
      createdAt:       ''
    };

    this.costService.save(novoCusto);
    this.backToList();
  }

  // ────────────────────────────────────────
  // DELETAR
  // ────────────────────────────────────────

  deleteCost(id: string): void {
    if (!confirm('Excluir este registro?')) return;
    this.costService.delete(id);
  }

  // ────────────────────────────────────────
  // HELPERS
  // ────────────────────────────────────────

  getError(campo: string): string {
    const control = this.costForm.get(campo);
    if (!control || !control.touched || !control.errors) return '';
    if (control.errors['required']) return 'Campo obrigatório';
    if (control.errors['min'])      return 'Valor inválido';
    return '';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  }
}