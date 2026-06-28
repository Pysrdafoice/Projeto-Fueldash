import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule }                  from '@angular/common';
import { Subject }                       from 'rxjs';
import { takeUntil }                     from 'rxjs/operators';
import { Router }                        from '@angular/router';

import { VehicleService } from '../../auth/services/vehicle.service';
import { CostService }    from '../../auth/services/cost.service';
import { AuthService }    from '../../auth/services/auth.service';
import { Vehicle }        from '../../core/models/vehicle_models';
import { VehiclesComponent } from '../vehicles/vehicles.component';
import { CostsComponent }    from '../cost/cost.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, VehiclesComponent, CostsComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {

  // ── Painel lateral ──
  activePanel = '';

  // ── Dados do usuário ──
  userData: any = null;
  activeVehicle: Vehicle | null = null;

  // ── Status do sistema ──
  hasVehicle  = false;
  hasCost     = false;
  hasRoute    = false; // reservado para quando Rotas for implementado

  private destroy$ = new Subject<void>();

  constructor(
    private vehicleService: VehicleService,
    private costService:    CostService,
    private authService:    AuthService,
    private router:         Router
  ) {}

  ngOnInit(): void {
    this.userData = this.authService.getAuthenticatedUser();
    this.subscribeToVehicles();
    this.subscribeToCosts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ────────────────────────────────────────
  // INSCRIÇÕES
  // ────────────────────────────────────────

  private subscribeToVehicles(): void {
    this.vehicleService.vehicles$
      .pipe(takeUntil(this.destroy$))
      .subscribe(list => {
        this.hasVehicle = list.length > 0;
      });

    this.vehicleService.activeId$
      .pipe(takeUntil(this.destroy$))
      .subscribe(id => {
        if (id) {
          this.vehicleService.vehicles$
            .pipe(takeUntil(this.destroy$))
            .subscribe(list => {
              this.activeVehicle = list.find(v => v.id === id) || null;
            });
        } else {
          this.activeVehicle = null;
        }
      });
  }

  private subscribeToCosts(): void {
    this.costService.costs$
      .pipe(takeUntil(this.destroy$))
      .subscribe(costs => {
        // Verifica se existe pelo menos um custo do veículo ativo
        if (this.activeVehicle) {
          this.hasCost = costs.some(
            c => c.vehicleId === this.activeVehicle!.id
          );
        } else {
          this.hasCost = costs.length > 0;
        }
      });
  }

  // ────────────────────────────────────────
  // GETTERS DE STATUS — usados no template
  // ────────────────────────────────────────

  get statusSummary(): string {
    if (this.hasVehicle && this.hasCost && this.hasRoute) {
      return 'Dashboard completo disponível';
    }
    if (this.hasVehicle || this.hasCost) {
      return 'Dashboard parcial disponível';
    }
    return 'Nenhum dado preenchido';
  }

  get statusClass(): string {
    return (this.hasVehicle && this.hasCost && this.hasRoute)
      ? 'complete'
      : 'partial';
  }

  get alertMessage(): string {
    if (!this.hasVehicle) {
      return 'Nenhum veículo cadastrado. Cadastre um veículo para iniciar o uso do sistema.';
    }
    if (!this.hasCost) {
      return 'Nenhum abastecimento registrado. Registre pelo menos um abastecimento para gerar estatísticas.';
    }
    if (!this.hasRoute) {
      return 'Nenhuma rota cadastrada. Cadastre uma rota para habilitar análises completas.';
    }
    return '';
  }

  // ────────────────────────────────────────
  // AÇÕES
  // ────────────────────────────────────────

  openPanel(panel: string): void { this.activePanel = panel; }
  closePanel(): void             { this.activePanel = '';    }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}