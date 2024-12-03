// Variables
let trainCount = 0;
let missedCount = 0;
let calendarEvents = JSON.parse(localStorage.getItem('calendarEvents')) || [];
let missedDays = JSON.parse(localStorage.getItem('missedDays')) || {}; // Días sin entrenar
let monthlySummary = {};

const trainBtn = document.getElementById('trainBtn');
const noTrainBtn = document.getElementById('noTrainBtn');
const trainCountEl = document.getElementById('trainCount');
const missedCountEl = document.getElementById('missedCount');
const monthlySummaryEl = document.getElementById('monthlySummary');
let calendar;

// Inicializa FullCalendar
document.addEventListener('DOMContentLoaded', () => {
  const calendarEl = document.getElementById('calendar');
  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    locale: 'es',
    editable: true,
    events: calendarEvents,
    eventClick: (info) => {
        const confirmDelete = confirm(`¿Eliminar el entrenamiento del ${info.event.start.toLocaleDateString()}?`);
        if (confirmDelete) {
            const eventId = info.event.extendedProps?.id || info.event.id;
            info.event.remove();
    
            // Eliminar el evento del array de eventos
            calendarEvents = calendarEvents.filter(event => event.id !== eventId);
    
            // Actualizar el almacenamiento local
            localStorage.setItem('calendarEvents', JSON.stringify(calendarEvents));
    
            // Actualizar el resumen mensual después de eliminar
            updateMonthlySummary();
        }
    }    
  });
  calendar.render();

  updateMonthlySummary();
});

// Actualiza el resumen mensual
function updateMonthlySummary() {
  monthlySummary = {};

  calendarEvents.forEach(event => {
    const month = new Date(event.start).toLocaleString('es', { month: 'long', year: 'numeric' });
    monthlySummary[month] = (monthlySummary[month] || 0) + 1;
  });

  monthlySummaryEl.innerHTML = '';
  for (const [month, count] of Object.entries(monthlySummary)) {
    const li = document.createElement('li');
    li.className = 'list-group-item';
    li.textContent = `${month}: ${count} días entrenados`;
    monthlySummaryEl.appendChild(li);
  }
}

// Guardar evento en el calendario
function saveToCalendar(date, time) {
  const id = Date.now().toString();
  const newEvent = {
    id,
    title: 'Entrenamiento',
    start: `${date}T${time}`
  };

  calendarEvents.push(newEvent);
  localStorage.setItem('calendarEvents', JSON.stringify(calendarEvents));
  calendar.addEvent(newEvent);
  updateMonthlySummary();

  if (missedDays[date]) {
    delete missedDays[date]; // Si estaba como no entrenado, se corrige
    localStorage.setItem('missedDays', JSON.stringify(missedDays));
  }
}

// Registra "No Entrené" automáticamente para días pasados
function autoMarkMissedDays() {
  const today = new Date().toISOString().split('T')[0];

  for (let d = new Date('2024-01-01'); d <= new Date(); d.setDate(d.getDate() + 1)) {
    const date = d.toISOString().split('T')[0];
    if (!calendarEvents.some(event => event.start.startsWith(date)) && date < today && !missedDays[date]) {
      missedDays[date] = true;
    }
  }
  localStorage.setItem('missedDays', JSON.stringify(missedDays));
}

function updateMonthlySummary() {
    monthlySummary = {};
  
    // Filtrar eventos para meses actuales o futuros
    const currentDate = new Date();
    calendarEvents.forEach(event => {
      const eventDate = new Date(event.start);
      if (eventDate >= currentDate) {
        const month = eventDate.toLocaleString('es', { month: 'long', year: 'numeric' });
        monthlySummary[month] = (monthlySummary[month] || { trained: 0, missed: 0 });
        monthlySummary[month].trained++;
      }
    });
  
    // Renderizar el resumen
    const summaryContainer = document.getElementById('monthlySummaryContainer');
    summaryContainer.innerHTML = '';
  
    for (const [month, counts] of Object.entries(monthlySummary)) {
      const card = document.createElement('div');
      card.className = 'card text-white bg-info text-center';
      card.style.minWidth = '250px'; // Ancho mínimo para cada tarjeta
  
      card.innerHTML = `
        <div class="card-body">
          <h5 class="card-title">${month}</h5>
          <p class="card-text"><strong>Días Entrenados:</strong> ${counts.trained}</p>
          <p class="card-text"><strong>Días No Entrenados:</strong> ${counts.missed || 0}</p>
        </div>
      `;
      summaryContainer.appendChild(card);
    }
  }
  
  // Guardar evento en el calendario
  function saveToCalendar(date, time) {
    const id = Date.now().toString();
    const newEvent = {
      id,
      title: 'Entrenamiento',
      start: `${date}T${time}`
    };
  
    const eventDate = new Date(date);
    const currentDate = new Date();
  
    calendarEvents.push(newEvent);
    localStorage.setItem('calendarEvents', JSON.stringify(calendarEvents));
    calendar.addEvent(newEvent);
  
    // Si el evento es de un mes que aún no existe, agregarlo al resumen
    if (eventDate >= currentDate) {
      const month = eventDate.toLocaleString('es', { month: 'long', year: 'numeric' });
      monthlySummary[month] = (monthlySummary[month] || { trained: 0, missed: 0 });
      monthlySummary[month].trained++;
    }
  
    updateMonthlySummary();
  
    // Si el mes estaba marcado como "no entrenado" previamente, eliminar ese conteo
    if (missedDays[date]) {
      delete missedDays[date];
      localStorage.setItem('missedDays', JSON.stringify(missedDays));
    }
  }
  
// Al iniciar
autoMarkMissedDays();
updateMonthlySummary();
