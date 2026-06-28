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

  // ── Injeta VehicleService ──
  constructor(private vehicleService: VehicleService) {}

  save(cost: FuelCost): void {
    const list = this.costsSubject.getValue();

    cost.id        = Date.now().toString();
    cost.createdAt = new Date().toISOString();

    const updated = [cost, ...list];
    this.persist(updated);

    // ── Atualiza hodômetro do veículo automaticamente ──
    const novoKm = cost.kmPercorrido > 0
      ? this.getKmAtualDoVeiculo(cost.vehicleId) + cost.kmTotal
      : 0;

    if (novoKm > 0) {
      this.vehicleService.updateKm(cost.vehicleId, novoKm);
    }
  }

  // Retorna o kmAtual atual do veículo para somar a distância
  private getKmAtualDoVeiculo(vehicleId: string): number {
    const vehicles = this.vehicleService['vehiclesSubject'].getValue();
    const vehicle  = vehicles.find(v => v.id === vehicleId);
    return vehicle ? vehicle.kmAtual : 0;
  }

  delete(id: string): void {
    const updated = this.costsSubject.getValue()
      .filter(c => c.id !== id);
    this.persist(updated);
  }

  getByVehicle(vehicleId: string): FuelCost[] {
    return this.costsSubject.getValue()
      .filter(c => c.vehicleId === vehicleId);
  }

  getRecent(vehicleId: string, limit = 5): FuelCost[] {
    return this.getByVehicle(vehicleId).slice(0, limit);
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

  private persist(list: FuelCost[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
    this.costsSubject.next(list);
  }

  private loadFromStorage(): FuelCost[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }
}