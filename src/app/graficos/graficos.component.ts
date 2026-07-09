import { Component, OnInit } from '@angular/core';

import Chart from 'chart.js/auto';

@Component({

selector:'app-graficos',

standalone:true,

templateUrl:'./graficos.component.html',

styleUrls:['./graficos.component.css']

})

export class DashboardComponent implements OnInit{

totalSpent=850;

avgConsumption=12.4;

autonomy=438;

lastFuel='Ontem';

bestStation='Shell';

saving=34;

ngOnInit(){

this.loadExpensesChart();

this.loadConsumptionChart();

this.loadFuelChart();

this.loadStationChart();

this.loadRoutesChart();

}

loadExpensesChart(){

new Chart('expensesChart',{

type:'line',

data:{

labels:['Jan','Fev','Mar','Abr','Mai'],

datasets:[{

label:'R$',

data:[350,480,420,510,430]

}]

}

});

}

loadConsumptionChart(){

new Chart('consumptionChart',{

type:'bar',

data:{

labels:['Cidade','Estrada'],

datasets:[{

label:'km/L',

data:[11.2,15.4]

}]

}

});

}

loadFuelChart(){

new Chart('fuelChart',{

type:'pie',

data:{

labels:['Gasolina','Etanol'],

datasets:[{

data:[70,30]

}]

}

});

}

loadStationChart(){

new Chart('stationChart',{

type:'bar',

data:{

labels:['Shell','Ipiranga','Petrobras'],

datasets:[{

label:'Abastecimentos',

data:[18,12,7]

}]

}

});

}

loadRoutesChart(){

new Chart('routeChart',{

type:'bar',

data:{

labels:['Salvador','Feira','Cruz das Almas'],

datasets:[{

label:'Km',

data:[120,95,180]

}]

}

});

}

}
