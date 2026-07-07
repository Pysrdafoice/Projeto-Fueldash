
export type TipoRota     = 'historico' | 'planejamento';
export type TipoViagem   = 'ida' | 'idavolta';

export interface Route {
  id:                 string;
  vehicleId:          string;
  tipo:               TipoRota;
  tipoViagem:         TipoViagem;
  origem:             string;
  destino:            string;
  data:               string;

  // ── Retornados pelo Google Maps ──
  distanciaKm:        number;   // distância da ida em km
  distanciaTotal:     number;   // ida × 2 se idavolta
  duracaoMinutos:     number;   // duração estimada em minutos

  // ── Calculados pelo sistema ──
  litrosNecessarios:  number;   // distanciaTotal ÷ consumoUsado
  custoEstimado:      number;   // litrosNecessarios × precoLitroUsado
  consumoUsado:       number;   // consumo do veículo no momento
  precoLitroUsado:    number;   // preço médio dos abastecimentos

  // ── Análise do tanque ──
  litrosDisponiveis:  number;   // estimativa do tanque atual
  tanqueSuficiente:   boolean;  // se tem combustível para a viagem
  kmMaximoAtual:      number;   // até onde chega com tanque atual

  // ── Controle ──
  createdAt:          string;
}