import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule }                  from '@angular/common';
import { Router }                        from '@angular/router';
import { Subject }                       from 'rxjs';
import { takeUntil }                     from 'rxjs/operators';

import Chart from 'chart.js/auto';

import { VehicleService } from '../../auth/services/vehicle.service';
import { CostService }    from '../../auth/services/cost.service';
import { RouteService }   from '../../auth/services/route.service';
import { Vehicle }        from '../../core/models/vehicle_models';
import { FuelCost }       from '../../core/models/cost.model';
import { Route }          from '../../core/models/route.model';

@Component({
  selector: 'app-graficos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './graficos.component.html',
  styleUrls: ['./graficos.component.css']
})
export class GraficosComponent implements OnInit, OnDestroy {

  // ── Veículos ──
  vehicles:      Vehicle[] = [];
  activeVehicle: Vehicle | null = null;

  // ── Dados ──
  costs:  FuelCost[] = [];
  routes: Route[]    = [];

  // ── Métricas ──
  totalGasto:     number = 0;
  consumoMedio:   number = 0;
  autonomia:      number = 0;
  litrosNoTanque: number = 0;
  melhorPosto:    string = '';
  economiaR$:     number = 0;

  // ── Período ──
  periodoFiltro: '7d' | '1m' | '3m' | '6m' | '12m' = '3m';

  // ── Análise de rotas ──
  rotaMaisLonga:  Route | null = null;
  rotaMaisCurta:  Route | null = null;
  rotaMaisCara:   Route | null = null;
  rotaMaisBarata: Route | null = null;

  // ── Ranking de postos ──
  rankingPostos: { nome: string; media: number }[] = [];

  // ── Instâncias dos charts para destruir antes de recriar ──
  private charts: Chart[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private router:         Router,
    private vehicleService: VehicleService,
    private costService:    CostService,
    private routeService:   RouteService
  ) {}

  ngOnInit(): void {
    this.subscribeToVehicles();
  }

  ngOnDestroy(): void {
    this.destruirCharts();
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ────────────────────────────────────────
  // INSCRIÇÕES
  // ────────────────────────────────────────

  private subscribeToVehicles(): void {
    this.vehicleService.vehicles$
      .pipe(takeUntil(this.destroy$))
      .subscribe(list => {
        this.vehicles = list;
        if (!this.activeVehicle && list.length > 0) {
          const activeId = this.vehicleService.getActiveId();
          this.activeVehicle = list.find(v => v.id === activeId) || list[0];
        }
        this.atualizarDados();
      });
  }

  // ────────────────────────────────────────
  // SELETOR E PERÍODO
  // ────────────────────────────────────────

  selecionarVeiculo(vehicle: Vehicle): void {
    this.activeVehicle = vehicle;
    this.atualizarDados();
  }

  setPeriodo(filtro: '7d' | '1m' | '3m' | '6m' | '12m'): void {
  this.periodoFiltro = filtro;
  this.atualizarDados();
  }

  // ────────────────────────────────────────
  // ATUALIZAR DADOS E GRÁFICOS
  // ────────────────────────────────────────

  private atualizarDados(): void {
    if (!this.activeVehicle) return;

    const id       = this.activeVehicle.id;
    const corte    = this.getDataCorte();

    this.costs  = this.costService.getByVehicle(id)
      .filter(c => new Date(c.data) >= corte);

    this.routes = this.routeService.getByVehicle(id)
      .filter(r => new Date(r.data) >= corte);

    this.calcularMetricas();
    this.calcularRotas();
    this.calcularRankingPostos();

    // Aguarda o DOM renderizar antes de desenhar os charts
    setTimeout(() => this.renderizarCharts(), 50);
  }

  private getDataCorte(): Date {
  const d = new Date();
  switch (this.periodoFiltro) {
    case '7d': d.setDate(d.getDate() - 7);    break;
    case '1m': d.setMonth(d.getMonth() - 1);  break;
    case '3m': d.setMonth(d.getMonth() - 3);  break;
    case '6m': d.setMonth(d.getMonth() - 6);  break;
    case '12m': d.setFullYear(d.getFullYear() - 1); break;
  }
  return d;
}

  // ────────────────────────────────────────
  // MÉTRICAS
  // ────────────────────────────────────────

  private calcularMetricas(): void {
    if (!this.activeVehicle) return;

    const id = this.activeVehicle.id;

    this.totalGasto   = parseFloat(
      this.costs.reduce((s, c) => s + c.totalPago, 0).toFixed(2)
    );

    this.consumoMedio = this.activeVehicle.consumoMedio;

    const kmDesde      = this.activeVehicle.kmAtual -
                         this.activeVehicle.kmUltimoAbastecimento;
    const consumidos   = kmDesde / (this.consumoMedio || 1);
    this.litrosNoTanque = Math.max(
      0, parseFloat((this.activeVehicle.capacidadeTanque - consumidos).toFixed(1))
    );
    this.autonomia     = parseFloat(
      (this.litrosNoTanque * this.consumoMedio).toFixed(0)
    );

    const cheapest     = this.costService.getCheapestStation(id);
    this.melhorPosto   = cheapest || '--';

    const precoMedio   = this.costService.getAvgPricePerLiter(id);
    if (cheapest && this.costs.length > 0) {
      const precoMelhor = this.costs
        .filter(c => c.posto === cheapest)
        .reduce((s, c) => s + c.precoPorLitro, 0) /
        Math.max(1, this.costs.filter(c => c.posto === cheapest).length);
      const periodo = Number(this.periodoFiltro) || 1;
      const litrosMes   = this.costs.reduce((s, c) => s + c.litros, 0) / periodo;
      this.economiaR$   = parseFloat(
        Math.max(0, litrosMes * (precoMedio - precoMelhor)).toFixed(2)
      );
    }
  }

  // ────────────────────────────────────────
  // ROTAS
  // ────────────────────────────────────────

  private calcularRotas(): void {
    if (this.routes.length === 0) {
      this.rotaMaisLonga  = null;
      this.rotaMaisCurta  = null;
      this.rotaMaisCara   = null;
      this.rotaMaisBarata = null;
      return;
    }
    
    this.rotaMaisLonga  = this.routes.reduce((a, b) =>
      a.distanciaTotal > b.distanciaTotal ? a : b);
    this.rotaMaisCurta  = this.routes.reduce((a, b) =>
      a.distanciaTotal < b.distanciaTotal ? a : b);
    this.rotaMaisCara   = this.routes.reduce((a, b) =>
      a.custoEstimado > b.custoEstimado ? a : b);
    this.rotaMaisBarata = this.routes.reduce((a, b) =>
      a.custoEstimado < b.custoEstimado ? a : b);
  }

  // ────────────────────────────────────────
  // RANKING DE POSTOS
  // ────────────────────────────────────────

  private calcularRankingPostos(): void {
    const grouped: Record<string, number[]> = {};
    this.costs.forEach(c => {
      if (!grouped[c.posto]) grouped[c.posto] = [];
      grouped[c.posto].push(c.precoPorLitro);
    });
    this.rankingPostos = Object.entries(grouped)
      .map(([nome, precos]) => ({
        nome,
        media: parseFloat(
          (precos.reduce((a, b) => a + b, 0) / precos.length).toFixed(2)
        )
      }))
      .sort((a, b) => a.media - b.media);
  }

  // ────────────────────────────────────────
  // CHARTS
  // ────────────────────────────────────────

  private destruirCharts(): void {
    this.charts.forEach(c => c.destroy());
    this.charts = [];
  }

  private renderizarCharts(): void {
    this.destruirCharts();
    this.renderGastosChart();
    this.renderCombustiveisChart();
    this.renderPostosChart();
    this.renderRotasChart();
  }

  private renderGastosChart(): void {
    const canvas = document.getElementById('gastosChart') as HTMLCanvasElement;
    if (!canvas) return;

    const mesesMap: Record<string, number> = {};
    this.costs.forEach(c => {
      const [y, m] = c.data.split('-');
      const key = `${y}-${m}`;
      mesesMap[key] = (mesesMap[key] || 0) + c.totalPago;
    });

    const meses = ['Jan','Fev','Mar','Abr','Mai','Jun',
                   'Jul','Ago','Set','Out','Nov','Dez'];
    const labels = Object.keys(mesesMap).sort().map(k => {
      const [y, m] = k.split('-');
      return `${meses[parseInt(m) - 1]}/${y.slice(2)}`;
    });
    const data = Object.keys(mesesMap).sort()
      .map(k => parseFloat(mesesMap[k].toFixed(2)));

    const chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Gasto (R$)',
          data,
          backgroundColor: '#f97316',
          borderRadius: 4,
            maxBarThickness: 60

        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#7a7d8a', font: { size: 11 } },
               grid: { color: 'rgba(255,255,255,0.05)' } },
          y: { ticks: { color: '#7a7d8a', font: { size: 11 },
                        callback: v => 'R$' + v },
               grid: { color: 'rgba(255,255,255,0.05)' } }
        }
      }
    });
    this.charts.push(chart);
  }

  private renderCombustiveisChart(): void {
    const canvas = document.getElementById('combustiveisChart') as HTMLCanvasElement;
    if (!canvas) return;

    // Agrupa por tipo de combustível
    const grouped: Record<string, number> = {};
    this.costs.forEach(c => {
      const tipo = c.tipoCombustivel || 'Outro';
      grouped[tipo] = (grouped[tipo] || 0) + c.totalPago;
    });

    const labels = Object.keys(grouped);
    const data   = Object.values(grouped).map(v => parseFloat(v.toFixed(2)));
    const cores  = ['#f97316', '#22c55e', '#60a5fa', '#a78bfa'];

    if (labels.length === 0) return;

    const chart = new Chart(canvas, {
      type: 'pie',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: cores.slice(0, labels.length)
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#7a7d8a', font: { size: 11 }, padding: 12 }
          }
        }
      }
    });
    this.charts.push(chart);
  }

  private renderPostosChart(): void {
    const canvas = document.getElementById('postosChart') as HTMLCanvasElement;
    if (!canvas || this.rankingPostos.length === 0) return;

    const cores = this.rankingPostos.map((_, i) =>
      i === 0 ? '#22c55e' :
      i === this.rankingPostos.length - 1 && this.rankingPostos.length > 1
        ? '#ef4444' : '#f97316'
    );

    const chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: this.rankingPostos.map(p => p.nome),
        datasets: [{
          label: 'Preço médio/L (R$)',
          data:  this.rankingPostos.map(p => p.media),
          backgroundColor: cores,
          borderRadius: 4,
          maxBarThickness: 40
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#7a7d8a', font: { size: 11 },
                        callback: v => 'R$' + v },
               grid: { color: 'rgba(255,255,255,0.05)' } },
          y: { ticks: { color: '#7a7d8a', font: { size: 11 } },
               grid: { color: 'rgba(255,255,255,0.05)' } }
        }
      }
    });
    this.charts.push(chart);
  }

  private renderRotasChart(): void {
    const canvas = document.getElementById('rotasChart') as HTMLCanvasElement;
    if (!canvas || this.routes.length === 0) return;

    // Top 5 rotas por custo
    const top5 = [...this.routes]
      .sort((a, b) => b.custoEstimado - a.custoEstimado)
      .slice(0, 5);

    const chart = new Chart(canvas, {
      type: 'bar',
      data: {
      labels: top5.map(r => {
        const orig   = r.origem.split(',')[0].slice(0, 20);
        const dest   = r.destino.split(',')[0].slice(0, 20);
        return orig + ' → ' + dest;
      }),
        datasets: [{
          label: 'Custo estimado (R$)',
          data: top5.map(r => parseFloat(r.custoEstimado.toFixed(2))),
          backgroundColor: '#60a5fa',
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            ticks: {
              color: '#7a7d8a',
              font: { size: 10 },
              maxRotation: 45,
              autoSkip: false,
              callback: function(val, index) {
                const label = this.getLabelForValue(val as number);
                return label.length > 25 ? label.slice(0, 25) + '…' : label;
              }
            },
            grid: { color: 'rgba(255,255,255,0.05)' }
          },
          y: { ticks: { color: '#7a7d8a', font: { size: 11 },
                        callback: v => 'R$' + v },
               grid: { color: 'rgba(255,255,255,0.05)' } }
        }
      }
    });
    this.charts.push(chart);
  }

  // ────────────────────────────────────────
  // HELPERS
  // ────────────────────────────────────────

  voltar(): void {
    this.router.navigate(['/dashboard']);
  }
  
  getLabelPeriodo(): string {
  const map: Record<string, string> = {
    '7d':  'Últimos 7 dias',
    '1m':  'Último mês',
    '3m':  'Últimos 3 meses',
    '6m':  'Últimos 6 meses',
    '12m': 'Últimos 12 meses'
  };
  return map[this.periodoFiltro];
}

  arredondarKm(km: number): number {
  return Math.round(km);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  }

  formatTime(isoStr: string): string {
    if (!isoStr) return '';
    return new Date(isoStr).toLocaleTimeString('pt-BR', {
      hour: '2-digit', minute: '2-digit'
    });
  }
}