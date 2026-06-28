// src/app/core/models/vehicle.model.ts

export interface Vehicle {
  id:                    string;
  apelido:               string;
  marca:                 string;
  modelo:                string;
  ano:                   number;
  placa:                 string;
  combustivel:           string;
  consumoMedio:          number;  // km/L
  kmAtual:               number;  // hodômetro atual — atualizado a cada abastecimento

  // ── Campos novos ──
  capacidadeTanque:      number;  // litros totais do tanque — ex: 50
  kmUltimoAbastecimento: number;  // km no momento do último abastecimento
}