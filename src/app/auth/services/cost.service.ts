// src/app/services/cost.service.ts

import { Injectable }      from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { FuelCost }        from '../../core/models/cost.model';
import { VehicleService }  from './vehicle.service';

@Injectable({ providedIn: 'root' })
export class CostService {

  private readonly STORAGE_KEY = 'fd_costs';

  private costsSubject = new BehaviorSubject<FuelCost[]>(
    this.loadFromStorage()
  );

  costs$ = this.costsSubject.asObservable();

  constructor(private vehicleService: VehicleService) {}

  // ── Getter privado interno ──
  private get records(): FuelCost[] {
    return this.costsSubject.getValue();
  }

  // ── Método público para componentes e outros serviços ──
  getAll(): FuelCost[] {
    return this.costsSubject.getValue();
  }

  // ────────────────────────────────────────
  // CRUD
  // ────────────────────────────────────────

  save(cost: FuelCost): void {
    cost.id        = crypto.randomUUID();  // ← mais seguro que Date.now()
    cost.createdAt = new Date().toISOString();

    const updated = [cost, ...this.records];
    this.persist(updated);

    // Atualiza hodômetro do veículo automaticamente
    const kmAtualVeiculo = this.getKmAtualDoVeiculo(cost.vehicleId);
    const novoKm = kmAtualVeiculo + cost.kmTotal;

    if (novoKm > 0) {
      this.vehicleService.updateKm(cost.vehicleId, novoKm);
    }
  }

  delete(id: string): void {
    const updated = this.records.filter(c => c.id !== id);
    this.persist(updated);
  }

  // ────────────────────────────────────────
  // FILTROS E CÁLCULOS
  // ────────────────────────────────────────

  getByVehicle(vehicleId: string): FuelCost[] {
    return this.records.filter(c => c.vehicleId === vehicleId);
  }

  getRecent(vehicleId: string, limit = 5): FuelCost[] {
    return this.getByVehicle(vehicleId).slice(0, limit);
  }

  // Retorna lista de postos únicos usados por um veículo
  getPostosRecentes(vehicleId: string): string[] {
    return [...new Set(
      this.getByVehicle(vehicleId)
        .map(c => c.posto)
        .filter(Boolean)
    )];
  }

  getCheapestStation(vehicleId: string): string | null {
    const records = this.getByVehicle(vehicleId);
    if (records.length === 0) return null;

    const grouped: Record<string, number[]> = {};
    records.forEach(c => {
      if (!grouped[c.posto]) grouped[c.posto] = [];
      grouped[c.posto].push(c.precoPorLitro);
    });

    const medias = Object.entries(grouped).map(([posto, precos]) => ({
      posto,
      media: precos.reduce((a, b) => a + b, 0) / precos.length
    }));

    return medias.reduce((prev, curr) =>
      curr.media < prev.media ? curr : prev
    ).posto;
  }

  getAvgPricePerLiter(vehicleId: string): number {
    const records = this.getByVehicle(vehicleId);
    if (records.length === 0) return 0;
    const total = records.reduce((sum, c) => sum + c.precoPorLitro, 0);
    return parseFloat((total / records.length).toFixed(2));
  }

  getAvgCostPerKm(vehicleId: string): number {
    const records = this.getByVehicle(vehicleId);
    if (records.length === 0) return 0;
    const total = records.reduce((sum, c) => sum + c.custoKm, 0);
    return parseFloat((total / records.length).toFixed(2));
  }

  getTotalSpent(vehicleId: string): number {
    return this.getByVehicle(vehicleId)
      .reduce((sum, c) => sum + c.totalPago, 0);
  }

  // ────────────────────────────────────────
  // HELPERS PRIVADOS
  // ────────────────────────────────────────

  private getKmAtualDoVeiculo(vehicleId: string): number {
    const vehicle = this.vehicleService
      .getAll()  // ← método público, sem acesso a propriedade privada
      .find(v => v.id === vehicleId);
    return vehicle ? vehicle.kmAtual : 0;
  }

  private persist(list: FuelCost[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
    this.costsSubject.next(list);
  }

  private loadFromStorage(): FuelCost[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }
}