// src/app/services/route.service.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Route } from '../../core/models/route.model';
import { Vehicle } from '../../core/models/vehicle_models';
import { VehicleService } from './vehicle.service';
import { CostService } from './cost.service';

@Injectable({ providedIn: 'root' })
export class RouteService {
  private readonly STORAGE_KEY = 'fd_routes';

  private routesSubject = new BehaviorSubject<Route[]>(this.loadFromStorage());

  routes$ = this.routesSubject.asObservable();

  constructor(
    private vehicleService: VehicleService,
    private costService: CostService,
  ) {}

  // ── Getter privado interno ──
  private get records(): Route[] {
    return this.routesSubject.getValue();
  }

  // ── Método público ──
  getAll(): Route[] {
    return this.routesSubject.getValue();
  }

  // ────────────────────────────────────────
  // CRUD
  // ────────────────────────────────────────

  save(route: Route): void {
    route.id = crypto.randomUUID();
    route.createdAt = new Date().toISOString();
    this.persist([route, ...this.records]);
  }

  delete(id: string): void {
    this.persist(this.records.filter((r) => r.id !== id));
  }

  // ────────────────────────────────────────
  // FILTROS
  // ────────────────────────────────────────

  getByVehicle(vehicleId: string): Route[] {
    return this.records.filter((r) => r.vehicleId === vehicleId);
  }

  getByTipo(vehicleId: string, tipo: 'historico' | 'planejamento'): Route[] {
    return this.getByVehicle(vehicleId).filter((r) => r.tipo === tipo);
  }

  // ────────────────────────────────────────
  // CÁLCULOS — usados pelo componente
  // ────────────────────────────────────────

  private getConsumoEfetivo(vehicle: Vehicle): number {
    if (vehicle.combustivel === 'flex') {
      if (vehicle.combustivelAtual === 'gasolina') {
        return vehicle.consumoMedioGasolina ?? vehicle.consumoMedio;
      }
      if (vehicle.combustivelAtual === 'etanol') {
        return vehicle.consumoMedioEtanol ?? vehicle.consumoMedio;
      }
      return vehicle.consumoMedioGasolina ?? vehicle.consumoMedio;
    }

    if (vehicle.combustivel === 'hibrido') {
      return vehicle.consumoCombustivel ?? vehicle.consumoMedio;
    }

    return vehicle.consumoMedio;
  }

  // Calcula litros disponíveis no tanque com base no histórico
  calcularLitrosDisponiveis(vehicleId: string): number {
    const vehicle = this.vehicleService
      .getAll()
      .find((v) => v.id === vehicleId);
    if (!vehicle) return 0;

    const kmDesdeAbastecimento =
      vehicle.kmAtual - vehicle.kmUltimoAbastecimento;

    const consumo = this.getConsumoEfetivo(vehicle) || 1;
    const litrosConsumidos = kmDesdeAbastecimento / consumo;
    const litrosDisponiveis = vehicle.capacidadeTanque - litrosConsumidos;

    return Math.max(0, parseFloat(litrosDisponiveis.toFixed(2)));
  }

  // Calcula o km máximo com o tanque atual
  calcularKmMaximo(vehicleId: string): number {
    const vehicle = this.vehicleService
      .getAll()
      .find((v) => v.id === vehicleId);
    if (!vehicle) return 0;

    const litros = this.calcularLitrosDisponiveis(vehicleId);
    const consumo = this.getConsumoEfetivo(vehicle) || 1;
    return parseFloat((litros * consumo).toFixed(1));
  }

  // Verifica se o tanque é suficiente para a viagem
  verificarTanque(vehicleId: string, litrosNecessarios: number): boolean {
    const litrosDisponiveis = this.calcularLitrosDisponiveis(vehicleId);
    return litrosDisponiveis >= litrosNecessarios;
  }

  // Monta o objeto de estimativa completo
  calcularEstimativa(
    vehicleId: string,
    distanciaKm: number,
    tipoViagem: 'ida' | 'idavolta',
    duracaoMinutos: number,
  ): Partial<Route> {
    const vehicle = this.vehicleService
      .getAll()
      .find((v) => v.id === vehicleId);
    if (!vehicle) return {};

    const distanciaTotal =
      tipoViagem === 'idavolta' ? distanciaKm * 2 : distanciaKm;

    const consumoUsado = this.getConsumoEfetivo(vehicle);
    const precoLitroUsado =
      this.costService.getAvgPricePerLiter(vehicleId) || 0;

    const litrosNecessarios = parseFloat(
      (distanciaTotal / consumoUsado).toFixed(2),
    );
    const custoEstimado = parseFloat(
      (litrosNecessarios * precoLitroUsado).toFixed(2),
    );
    const litrosDisponiveis = this.calcularLitrosDisponiveis(vehicleId);
    const tanqueSuficiente = litrosDisponiveis >= litrosNecessarios;
    const kmMaximoAtual = this.calcularKmMaximo(vehicleId);

    return {
      distanciaTotal,
      duracaoMinutos,
      consumoUsado,
      precoLitroUsado,
      litrosNecessarios,
      custoEstimado,
      litrosDisponiveis,
      tanqueSuficiente,
      kmMaximoAtual,
    };
  }

  // ────────────────────────────────────────
  // HELPERS PRIVADOS
  // ────────────────────────────────────────

  private persist(list: Route[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
    this.routesSubject.next(list);
  }

  private loadFromStorage(): Route[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }
}
