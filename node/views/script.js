// Datos de ejemplo
const labels = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo'];
const data = [12, 19, 3, 5, 2];

// Bar Chart
const barCtx = document.getElementById('barChart').getContext('2d');
const barChart = new Chart(barCtx, {
    type: 'bar',
    data: {
        labels: labels,
        datasets: [{
            label: 'Ventas',
            data: data,
            backgroundColor: '#4CAF50'
        }]
    },
    options: {
        responsive: true,
        plugins: {
            legend: { display: true }
        }
    }
});

// Line Chart
const lineCtx = document.getElementById('lineChart').getContext('2d');
const lineChart = new Chart(lineCtx, {
    type: 'line',
    data: {
        labels: labels,
        datasets: [{
            label: 'Ingresos',
            data: data.map(x => x*10),
            borderColor: '#FF5733',
            backgroundColor: 'rgba(255,87,51,0.2)',
            fill: true
        }]
    },
    options: {
        responsive: true,
        plugins: {
            legend: { display: true }
        }
    }
});
