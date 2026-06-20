// vehicle.model.ts
export interface Vehicle {
  id: string;
  apelido: string;
  marca: string;
  modelo: string;
  ano: number;
  placa: string;
  combustivel: string;
  consumoMedio: number;
  kmAtual: number;
}