import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject }                       from 'rxjs';
import { takeUntil }                     from 'rxjs/operators';
import { CommonModule }                  from '@angular/common';
import { Router }                        from '@angular/router';

import { VehicleService } from '../../auth/services/vehicle.service';
import { AuthService }    from '../../auth/services/auth.service';
import { Vehicle }        from '../../core/models/vehicle_models';
import { VehiclesComponent } from '../vehicles/vehicles.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule,  VehiclesComponent],
  templateUrl: 'dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit, OnDestroy {

  activePanel  = '';
  activeVehicle: Vehicle | null = null;
  userData: any = null;

  private destroy$ = new Subject<void>();

  constructor(
    private vehicleService: VehicleService,
    private authService: AuthService,  // ← injetado corretamente
    private router: Router
  ) {}

  ngOnInit(): void {
    // ── Carrega dados do usuário logado ──
    this.userData = this.authService.getAuthenticatedUser();

    // ── Escuta veículo ativo em tempo real ──
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  logout(): void {
    this.authService.logout();           // limpa o localStorage
    this.router.navigate(['/login']);    // redireciona para login
  }

openPanel(panel: string): void {

  if (this.activePanel === panel) {
    this.activePanel = '';
    return;
  }

  this.activePanel = panel;
}  closePanel(): void             { this.activePanel = '';    }
}