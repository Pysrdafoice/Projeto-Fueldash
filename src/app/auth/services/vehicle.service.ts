import { Injectable }      from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Vehicle }         from '../../core/models/vehicle_models';

@Injectable({ providedIn: 'root' })
export class VehicleService {
  getAll(): Vehicle[] {
    throw new Error('Method not implemented.');
  }

  private readonly STORAGE_KEY = 'fd_vehicles';
  private readonly ACTIVE_KEY  = 'fd_active_vehicle';

  // ── Fontes de verdade (BehaviorSubject) ──────────────────
  // BehaviorSubject guarda o valor atual E emite para novos inscritos
  private vehiclesSubject = new BehaviorSubject<Vehicle[]>(
    this.loadFromStorage()   // valor inicial vem do localStorage
  );

  private activeIdSubject = new BehaviorSubject<string | null>(
    localStorage.getItem(this.ACTIVE_KEY)
  );

  // ── Observables públicos (somente leitura) ───────────────
  // Componentes se inscrevem nestes, nunca no Subject diretamente
  vehicles$  = this.vehiclesSubject.asObservable();
  activeId$  = this.activeIdSubject.asObservable();

  // ────────────────────────────────────────────────────────
  // CRUD
  // ────────────────────────────────────────────────────────

  save(vehicle: Vehicle): void {
    const list = this.vehiclesSubject.getValue(); // pega valor atual
    vehicle.id = Date.now().toString();
    const updated = [...list, vehicle];           // cria nova lista
    this.persist(updated);                        // salva e emite
  }

  update(vehicle: Vehicle): void {
    const updated = this.vehiclesSubject.getValue()
      .map(v => v.id === vehicle.id ? vehicle : v);
    this.persist(updated);
  }

  delete(id: string): void {
    const updated = this.vehiclesSubject.getValue()
      .filter(v => v.id !== id);
    this.persist(updated);

    // Se era o ativo, limpa
    if (this.activeIdSubject.getValue() === id) {
      this.setActive(null);
    }
  }

  // ────────────────────────────────────────────────────────
  // VEÍCULO ATIVO
  // ────────────────────────────────────────────────────────

  setActive(id: string | null): void {
    if (id) {
      localStorage.setItem(this.ACTIVE_KEY, id);
    } else {
      localStorage.removeItem(this.ACTIVE_KEY);
    }
    this.activeIdSubject.next(id); // emite o novo valor para todos inscritos
  }


  // Adicione esse método no VehicleService
// após o método setActive()

updateKm(vehicleId: string, novoKm: number): void {
  const list = this.vehiclesSubject.getValue().map(v => {
    if (v.id === vehicleId) {
      return {
        ...v,
        kmAtual:               novoKm,
        kmUltimoAbastecimento: novoKm  // salva o km do momento do abastecimento
      };
    }
    return v;
  });
  this.persist(list);
}

  // Salva no localStorage E emite o novo valor via BehaviorSubject
  private persist(list: Vehicle[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
    this.vehiclesSubject.next(list); // ← aqui acontece a mágica
  }

  // Lê do localStorage na inicialização do service
  private loadFromStorage(): Vehicle[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }
}