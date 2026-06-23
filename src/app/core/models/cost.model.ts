
export interface FuelCost {
  id: string;
  vehicleId: string;

  data: string;
  posto: string;
  precoPorLitro: number;
  litros: number;
  kmPercorrido: number;

  tipoViagem: 'ida' | 'idavolta';

  kmTotal: number;
  totalPago: number;
  custoKm: number;
  
  createdAt: string
} 