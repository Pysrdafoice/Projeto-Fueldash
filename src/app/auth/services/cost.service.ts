// src/app/services/cost.service.ts

import { Injectable }      from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { FuelCost }        from '../../core/models/cost.model';

@Injectable({ providedIn: 'root' })
export class CostService {

  private readonly STORAGE_KEY = 'fd_costs';

  // ── Fonte de verdade ─────────────────────────────────────
  private costsSubject = new BehaviorSubject<FuelCost[]>(
    this.loadFromStorage()
  );

  // ── Observable público (somente leitura) ─────────────────
  costs$ = this.costsSubject.asObservable();

  // ────────────────────────────────────────────────────────
  // CRUD
  // ────────────────────────────────────────────────────────

  save(cost: FuelCost): void {
    const list = this.costsSubject.getValue();

    // Gera id e timestamp automaticamente
    cost.id        = Date.now().toString();
    cost.createdAt = new Date().toISOString();

    const updated = [cost, ...list]; // mais recente primeiro
    this.persist(updated);
  }

  delete(id: string): void {
    const updated = this.costsSubject.getValue()
      .filter(c => c.id !== id);
    this.persist(updated);
  }

  // ────────────────────────────────────────────────────────
  // FILTROS E CÁLCULOS
  // ────────────────────────────────────────────────────────

  // Retorna apenas os registros de um veículo específico
  getByVehicle(vehicleId: string): FuelCost[] {
    return this.costsSubject.getValue()
      .filter(c => c.vehicleId === vehicleId);
  }

  // Retorna os N registros mais recentes de um veículo
  getRecent(vehicleId: string, limit = 5): FuelCost[] {
    return this.getByVehicle(vehicleId).slice(0, limit);
  }

  // Retorna o posto com menor média de preço/litro
  getCheapestStation(vehicleId: string): string | null {
    const records = this.getByVehicle(vehicleId);
    if (records.length === 0) return null;

    // Agrupa por posto e calcula média do preço/litro
    const grouped: Record<string, number[]> = {};

    records.forEach(c => {
      if (!grouped[c.posto]) grouped[c.posto] = [];
      grouped[c.posto].push(c.precoPorLitro);
    });

    // Calcula a média de cada posto
    const medias = Object.entries(grouped).map(([posto, precos]) => ({
      posto,
      media: precos.reduce((a, b) => a + b, 0) / precos.length
    }));

    // Retorna o posto com menor média
    const cheapest = medias.reduce((prev, curr) =>
      curr.media < prev.media ? curr : prev
    );

    return cheapest.posto;
  }

  // Calcula o custo médio por km de um veículo
  getAvgCostPerKm(vehicleId: string): number {
    const records = this.getByVehicle(vehicleId);
    if (records.length === 0) return 0;

    const total = records.reduce((sum, c) => sum + c.custoKm, 0);
    return parseFloat((total / records.length).toFixed(2));
  }

  // Calcula o total gasto em combustível de um veículo
  getTotalSpent(vehicleId: string): number {
    return this.getByVehicle(vehicleId)
      .reduce((sum, c) => sum + c.totalPago, 0);
  }

  // ────────────────────────────────────────────────────────
  // HELPERS PRIVADOS
  // ────────────────────────────────────────────────────────

  private persist(list: FuelCost[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
    this.costsSubject.next(list);
  }

  private loadFromStorage(): FuelCost[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }
}