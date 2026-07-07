// src/app/components/routes/routes.component.ts

import {
  Component,
  OnInit,
  OnDestroy,
  NgZone,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { GoogleMapsModule } from '@angular/google-maps';

import { Route } from '../../core/models/route.model';
import { RouteService } from '../../auth/services/route.service';
import { VehicleService } from '../../auth/services/vehicle.service';
import { Vehicle } from '../../core/models/vehicle_models';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-routes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, GoogleMapsModule],
  templateUrl: './route.component.html',
  styleUrls: ['./route.component.css'],
})
export class RoutesComponent implements OnInit, OnDestroy {
  // ── Estado da tela ──
  viewMode: 'list' | 'form' = 'list';
  tipoRota: 'historico' | 'planejamento' = 'historico';
  tipoViagem: 'ida' | 'idavolta' = 'ida';
  filtroAtivo: 'todas' | 'historico' | 'planejamento' = 'todas';

  // ── Dados ──
  routes: Route[] = [];
  routesFiltradas: Route[] = [];
  activeVehicle: Vehicle | null = null;

  // ── Formulário ──
  routeForm!: FormGroup;

  // ── Google Maps ──
  apiLoaded = false;
  mapCenter = { lat: -12.9714, lng: -38.5014 }; // Salvador
  mapZoom = 12;
  mapOptions: google.maps.MapOptions = {
    disableDefaultUI: true,
    zoomControl: true,
    styles: [{ elementType: 'geometry', stylers: [{ color: '#1c2030' }] }],
  };
  directionsResults?: google.maps.DirectionsResult;

  // ── Estimativa ──
  estimativa: Partial<Route> = {};
  calculando = false;
  mapaVisivel = false;

  private destroy$ = new Subject<void>();
  private directionsService?: google.maps.DirectionsService;
  private readonly apiKey = environment.googleMapsApiKey;

  constructor(
    private fb: FormBuilder,
    private routeService: RouteService,
    private vehicleService: VehicleService,
    private ngZone: NgZone,
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.subscribeToVehicle();
    this.subscribeToRoutes();
    this.loadGoogleMapsApi();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ────────────────────────────────────────
  // CARREGAR GOOGLE MAPS API
  // ────────────────────────────────────────

  private loadGoogleMapsApi(): void {
    if (typeof google !== 'undefined') {
      this.apiLoaded = true;
      this.directionsService = new google.maps.DirectionsService();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${this.apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      this.ngZone.run(() => {
        this.apiLoaded = true;
        this.directionsService = new google.maps.DirectionsService();
      });
    };
    document.head.appendChild(script);
  }

  // ────────────────────────────────────────
  // INSCRIÇÕES
  // ────────────────────────────────────────

  private subscribeToVehicle(): void {
    this.vehicleService.activeId$
      .pipe(takeUntil(this.destroy$))
      .subscribe((id) => {
        if (id) {
          this.vehicleService.vehicles$
            .pipe(takeUntil(this.destroy$))
            .subscribe((list) => {
              this.activeVehicle = list.find((v) => v.id === id) || null;
              this.atualizarLista();
            });
        } else {
          this.activeVehicle = null;
          this.routes = [];
          this.routesFiltradas = [];
        }
      });
  }

  private subscribeToRoutes(): void {
    this.routeService.routes$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.atualizarLista());
  }

  private atualizarLista(): void {
    if (!this.activeVehicle) return;
    this.routes = this.routeService.getByVehicle(this.activeVehicle.id);
    this.aplicarFiltro();
  }

  // ────────────────────────────────────────
  // FORMULÁRIO
  // ────────────────────────────────────────

  private buildForm(): void {
    this.routeForm = this.fb.group({
      origem: ['', Validators.required],
      destino: ['', Validators.required],
      data: ['', Validators.required],
    });
  }

  // ────────────────────────────────────────
  // CALCULAR ROTA VIA GOOGLE MAPS
  // ────────────────────────────────────────

  calcularRota(): void {
    const { origem, destino } = this.routeForm.value;
    if (!origem || !destino || !this.directionsService || !this.activeVehicle)
      return;

    this.calculando = true;
    this.mapaVisivel = false;
    this.estimativa = {};

    this.directionsService.route(
      {
        origin: origem,
        destination: destino,
        travelMode: google.maps.TravelMode.DRIVING,
        drivingOptions: {
          departureTime: new Date(),
          trafficModel: google.maps.TrafficModel.BEST_GUESS,
        },
      },
      (result, status) => {
        this.ngZone.run(() => {
          this.calculando = false;

          if (status === google.maps.DirectionsStatus.OK && result) {
            this.directionsResults = result;
            this.mapaVisivel = true;

            const leg = result.routes[0].legs[0];
            const distanciaKm = (leg.distance?.value || 0) / 1000;
            const duracaoMinutos = Math.round(
              (leg.duration_in_traffic?.value || leg.duration?.value || 0) / 60,
            );

            this.estimativa = this.routeService.calcularEstimativa(
              this.activeVehicle!.id,
              distanciaKm,
              this.tipoViagem,
              duracaoMinutos,
            );

            (this.estimativa as any)['distanciaKm'] = distanciaKm;
          } else {
            alert('Não foi possível calcular a rota. Verifique os endereços.');
          }
        });
      },
    );
  }

  // ────────────────────────────────────────
  // TIPO DE ROTA E VIAGEM
  // ────────────────────────────────────────

  setTipoRota(tipo: 'historico' | 'planejamento'): void {
    this.tipoRota = tipo;
    this.estimativa = {};
    this.mapaVisivel = false;
  }

  setTipoViagem(tipo: 'ida' | 'idavolta'): void {
    this.tipoViagem = tipo;
    // Recalcula se já tem resultado
    if (
      this.mapaVisivel &&
      this.activeVehicle &&
      (this.estimativa as any)['distanciaKm']
    ) {
      this.estimativa = this.routeService.calcularEstimativa(
        this.activeVehicle.id,
        (this.estimativa as any)['distanciaKm'],
        tipo,
        this.estimativa.duracaoMinutos || 0,
      );
    }
  }

  // ────────────────────────────────────────
  // FILTRO DA LISTA
  // ────────────────────────────────────────

  setFiltro(filtro: 'todas' | 'historico' | 'planejamento'): void {
    this.filtroAtivo = filtro;
    this.aplicarFiltro();
  }

  private aplicarFiltro(): void {
    if (this.filtroAtivo === 'todas') {
      this.routesFiltradas = this.routes;
    } else {
      this.routesFiltradas = this.routes.filter(
        (r) => r.tipo === this.filtroAtivo,
      );
    }
  }

  // ────────────────────────────────────────
  // NAVEGAÇÃO
  // ────────────────────────────────────────

  openForm(): void {
    this.routeForm.reset();
    this.tipoRota = 'historico';
    this.tipoViagem = 'ida';
    this.estimativa = {};
    this.mapaVisivel = false;
    this.directionsResults = undefined;

    const hoje = new Date().toISOString().split('T')[0];
    this.routeForm.patchValue({ data: hoje });

    this.viewMode = 'form';
  }

  backToList(): void {
    this.viewMode = 'list';
    this.routeForm.reset();
    this.estimativa = {};
    this.mapaVisivel = false;
    this.directionsResults = undefined;
  }

  // ────────────────────────────────────────
  // SUBMIT
  // ────────────────────────────────────────

  onSubmit(): void {
    if (
      this.routeForm.invalid ||
      !this.activeVehicle ||
      !this.estimativa.distanciaTotal
    ) {
      alert('Calcule a rota antes de salvar.');
      return;
    }

    const { origem, destino, data } = this.routeForm.value;

    const novaRota: Route = {
      id: '',
      vehicleId: this.activeVehicle.id,
      tipo: this.tipoRota,
      tipoViagem: this.tipoViagem,
      origem,
      destino,
      data,
      distanciaKm: (this.estimativa as any)['distanciaKm'] || 0,
      distanciaTotal: this.estimativa.distanciaTotal || 0,
      duracaoMinutos: this.estimativa.duracaoMinutos || 0,
      litrosNecessarios: this.estimativa.litrosNecessarios || 0,
      custoEstimado: this.estimativa.custoEstimado || 0,
      consumoUsado: this.estimativa.consumoUsado || 0,
      precoLitroUsado: this.estimativa.precoLitroUsado || 0,
      litrosDisponiveis: this.estimativa.litrosDisponiveis || 0,
      tanqueSuficiente: this.estimativa.tanqueSuficiente ?? true,
      kmMaximoAtual: this.estimativa.kmMaximoAtual || 0,
      createdAt: '',
    };

    this.routeService.save(novaRota);
    this.backToList();
  }

  // ────────────────────────────────────────
  // DELETAR
  // ────────────────────────────────────────

  deleteRoute(id: string): void {
    if (!confirm('Excluir esta rota?')) return;
    this.routeService.delete(id);
  }

  // ────────────────────────────────────────
  // HELPERS PARA O TEMPLATE
  // ────────────────────────────────────────

  getError(campo: string): string {
    const control = this.routeForm.get(campo);
    if (!control || !control.touched || !control.errors) return '';
    if (control.errors['required']) return 'Campo obrigatório';
    return '';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  }

  formatDuracao(minutos: number): string {
    if (!minutos) return '--';
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    return h > 0 ? `${h}h ${m}min` : `${m}min`;
  }
}
