import { Injectable }      from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Vehicle }         from '../../core/models/vehicle_models';

@Injectable({ providedIn: 'root' })
export class VehicleService {

  private readonly STORAGE_KEY = 'fd_vehicles';
  private readonly ACTIVE_KEY  = 'fd_active_vehicle';

  private vehiclesSubject = new BehaviorSubject<Vehicle[]>(
    this.loadFromStorage()
  );

  private activeIdSubject = new BehaviorSubject<string | null>(
    localStorage.getItem(this.ACTIVE_KEY)
  );

  vehicles$ = this.vehiclesSubject.asObservable();
  activeId$ = this.activeIdSubject.asObservable();

  // ── Getter privado interno ──
  private get records(): Vehicle[] {
    return this.vehiclesSubject.getValue();
  }

  // ── Método público para outros serviços ──
  getAll(): Vehicle[] {
    return this.vehiclesSubject.getValue();
  }

  save(vehicle: Vehicle): void {
    vehicle.id = crypto.randomUUID();
    const updated = [...this.records, vehicle];
    this.persist(updated);
  }

  update(vehicle: Vehicle): void {
    const updated = this.records.map(v =>
      v.id === vehicle.id ? vehicle : v
    );
    this.persist(updated);
  }

  delete(id: string): void {
    const updated = this.records.filter(v => v.id !== id);
    this.persist(updated);

    if (this.getActiveId() === id) {
      this.setActive(null);
    }
  }

  updateKm(vehicleId: string, novoKm: number): void {
    const updated = this.records.map(v => {
      if (v.id === vehicleId) {
        return {
          ...v,
          kmAtual:               novoKm,
          kmUltimoAbastecimento: novoKm
        };
      }
      return v;
    });
    this.persist(updated);
  }

  getActiveId(): string | null {
    return localStorage.getItem(this.ACTIVE_KEY);
  }

  setActive(id: string | null): void {
    if (id) {
      localStorage.setItem(this.ACTIVE_KEY, id);
    } else {
      localStorage.removeItem(this.ACTIVE_KEY);
    }
    this.activeIdSubject.next(id);
  }

  private persist(list: Vehicle[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
    this.vehiclesSubject.next(list);
  }

  private loadFromStorage(): Vehicle[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }
}