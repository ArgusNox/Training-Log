// Variables
let trainCount = 0;
let missedCount = 0;
let calendarEvents = JSON.parse(localStorage.getItem('calendarEvents')) || [];
let missedDays = JSON.parse(localStorage.getItem('missedDays')) || {}; // Días sin entrenar
let monthlySummary = {};
let firstTrainingDate = null;

const trainBtn = document.getElementById('trainBtn');
const noTrainBtn = document.getElementById('noTrainBtn');
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

  initializeFirstTrainingDate();
  autoMarkMissedDays(); // Marcar días previos automáticamente
  updateMonthlySummary();
});

// Inicializa la fecha del primer entrenamiento
function initializeFirstTrainingDate() {
  if (calendarEvents.length > 0) {
    firstTrainingDate = new Date(
      Math.min(...calendarEvents.map(event => new Date(event.start).getTime()))
    );
  } else {
    firstTrainingDate = null;
  }
}

// Actualiza el resumen mensual
function updateMonthlySummary() {
  monthlySummary = {};

  // Determinar el primer mes a partir de la primera fecha registrada
  const today = new Date();
  let startDate = firstTrainingDate
    ? new Date(firstTrainingDate.getFullYear(), firstTrainingDate.getMonth(), 1)
    : new Date(today.getFullYear(), today.getMonth(), 1);

  const summaryContainer = document.getElementById('monthlySummaryContainer');
  summaryContainer.innerHTML = '';

  // Iterar sobre todos los eventos registrados y agrupar por mes
  calendarEvents.forEach(event => {
    const eventDate = new Date(event.start);
    if (eventDate >= startDate) { // Solo incluir eventos desde el primer mes registrado en adelante
      const month = eventDate.toLocaleString('es', { month: 'long', year: 'numeric' });

      if (!monthlySummary[month]) {
        monthlySummary[month] = { trained: 0, missed: 0 };
      }
      monthlySummary[month].trained++;
    }
  });

  // Incluir los días marcados como "No Entrenado" en el resumen mensual
  Object.keys(missedDays).forEach(date => {
    const missedDate = new Date(date);
    if (missedDate >= startDate) { // Solo incluir días desde el primer mes registrado en adelante
      const month = missedDate.toLocaleString('es', { month: 'long', year: 'numeric' });

      if (!monthlySummary[month]) {
        monthlySummary[month] = { trained: 0, missed: 0 };
      }
      monthlySummary[month].missed++;
    }
  });

  // Generar las tarjetas de resumen mensual
  for (const [month, counts] of Object.entries(monthlySummary)) {
    const card = document.createElement('div');
    card.className = 'card text-white bg-info text-center';
    card.style.minWidth = '250px';

    card.innerHTML = `
      <div class="card-body">
        <h5 class="card-title">${month}</h5>
        <p class="card-text"><strong>Días Entrenados:</strong> ${counts.trained}</p>
        <p class="card-text"><strong>Días No Entrenados:</strong> ${counts.missed}</p>
      </div>
    `;
    summaryContainer.appendChild(card);
  }
}

// Guardar evento en el calendario
function saveToCalendar(date, time) {
  const id = Date.now().toString();
  const eventDate = new Date(`${date}T${time}:00`);
  const newEvent = {
    id,
    title: 'Entrenamiento',
    start: eventDate.toISOString() // Guarda la fecha en formato UTC
  };
  

  calendarEvents.push(newEvent);
  localStorage.setItem('calendarEvents', JSON.stringify(calendarEvents));
  calendar.addEvent(newEvent);

  if (!firstTrainingDate || new Date(date) < firstTrainingDate) {
    firstTrainingDate = new Date(date);
  }

  if (missedDays[date]) {
    delete missedDays[date];
    localStorage.setItem('missedDays', JSON.stringify(missedDays));

    const noTrainEvent = calendar.getEvents().find(event => event.startStr === date && event.title === 'No Entrenado');
    if (noTrainEvent) {
      noTrainEvent.remove();
    }
  }

  updateMonthlySummary();
}

// Marcar días sin entrenamiento automáticamente
function autoMarkMissedDays() {
  const today = new Date();
  const startDate = firstTrainingDate ? new Date(firstTrainingDate.getFullYear(), firstTrainingDate.getMonth(), 1) : new Date(today.getFullYear(), today.getMonth(), 1);

  for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
    const date = d.toISOString().split('T')[0];

    if (!calendarEvents.some(event => event.start.startsWith(date)) && !missedDays[date]) {
      missedDays[date] = true;
      localStorage.setItem('missedDays', JSON.stringify(missedDays));

      calendar.addEvent({
        title: 'No Entrenado',
        start: date,
        backgroundColor: '#f8d7da',
        borderColor: '#f5c6cb',
        textColor: '#721c24',
      });
    }
  }
}

// Evento para "Entrené Hoy"
trainBtn.addEventListener('click', () => {
  const today = new Date();
  const date = today.toISOString().split('T')[0];
  const time = today.toTimeString().split(' ')[0].substring(0, 5);

  saveToCalendar(date, time);
  alert('¡Entrenamiento registrado y añadido al calendario!');
});

// Evento para "No Entrené"
noTrainBtn.addEventListener('click', () => {
  const today = new Date().toISOString().split('T')[0];

  if (!missedDays[today]) {
    missedDays[today] = true;
    localStorage.setItem('missedDays', JSON.stringify(missedDays));

    calendar.addEvent({
      title: 'No Entrenado',
      start: today,
      backgroundColor: '#f8d7da',
      borderColor: '#f5c6cb',
      textColor: '#721c24',
    });

    alert('¡Día registrado como no entrenado!');
    updateMonthlySummary();
  } else {
    alert('Este día ya está registrado como no entrenado.');
  }
});