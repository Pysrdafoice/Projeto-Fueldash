// src/app/core/models/vehicle.model.ts

export type TipoCombustivel =
  'flex' | 'gasolina' | 'etanol' | 'diesel' | 'hibrido' | 'eletrico';

export type CombustivelFlex = 'gasolina' | 'etanol';

export interface Vehicle {
  id:                    string;
  apelido:               string;
  marca:                 string;
  modelo:                string;
  ano:                   number;
  placa:                 string;
  combustivel:           TipoCombustivel;
  capacidadeTanque:      number;
  kmAtual:               number;
  kmUltimoAbastecimento: number;

  // ── Consumo padrão (gasolina, etanol puro, diesel) ──
  consumoMedio:          number;

  consumoMedioGasolina?: number;
  consumoMedioEtanol?:   number;
  combustivelAtual?:     CombustivelFlex;

  autonomiaEletrica?:    number; 
  consumoCombustivel?:   number;
}