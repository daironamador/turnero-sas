import { format } from 'date-fns';
import { Ticket, ServiceTypeLabels, CompanySettings } from '@/lib/types';
import { supabase } from '@/lib/supabase';

// Obtener la configuración de la empresa
const getCompanySettings = async (): Promise<CompanySettings | null> => {
  try {
    const { data, error } = await supabase
      .from('company_settings')
      .select('*')
      .limit(1)
      .single();
    
    if (error) {
      console.error('Error al obtener configuración de la empresa:', error);
      return null;
    }
    
    return data as CompanySettings;
  } catch (error) {
    console.error('Error al obtener configuración de la empresa:', error);
    return null;
  }
};

// Obtener mapa de salas/habitaciones
const getRoomsMap = async (): Promise<{[key: string]: string}> => {
  try {
    const { data, error } = await supabase
      .from('rooms')
      .select('id, name, number');
    
    if (error) {
      console.error('Error al obtener salas:', error);
      return {};
    }
    
    const roomsMap: {[key: string]: string} = {};
    data.forEach(room => {
      roomsMap[room.id] = `${room.number} - ${room.name}`;
    });
    
    return roomsMap;
  } catch (error) {
    console.error('Error al obtener salas:', error);
    return {};
  }
};

export const printTicket = async (ticket: Ticket) => {
  // Obtener la configuración de la empresa
  const companySettings = await getCompanySettings();
  
  // Crear una nueva ventana para imprimir
  const printWindow = window.open('', '', 'width=300,height=600');
  
  if (!printWindow) {
    alert('Por favor, permita ventanas emergentes para este sitio para imprimir tickets');
    return;
  }
  
  // Obtener fecha/hora actual
  const currentDate = format(new Date(), 'dd/MM/yyyy');
  const currentTime = format(new Date(), 'HH:mm:ss');
  
  // Crear contenido para impresión
  printWindow.document.write(`
    <html>
    <head>
      <title>Ticket #${ticket.ticketNumber}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          width: 80mm;
          margin: 0;
          padding: 5mm;
          text-align: center;
          font-size: 12px;
        }
        .header {
          margin-bottom: 10px;
          font-weight: bold;
        }
        .company-name {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .ticket-number {
          font-size: 24px;
          font-weight: bold;
          margin: 15px 0;
        }
        .service-type {
          font-size: 14px;
          margin-bottom: 15px;
        }
        .info {
          text-align: left;
          margin-bottom: 15px;
        }
        .footer {
          margin-top: 20px;
          font-size: 10px;
          border-top: 1px dashed #000;
          padding-top: 10px;
        }
        .vip-badge {
          display: inline-block;
          background-color: #FFD700;
          color: #000;
          padding: 3px 8px;
          border-radius: 10px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .logo {
          max-width: 100%;
          height: auto;
          margin-bottom: 10px;
        }
        .patient-name {
          font-size: 12px;
          margin-bottom: 10px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        ${companySettings?.logo ? `<img src="${companySettings.logo}" class="logo" alt="Logo">` : ''}
        <div class="company-name">${companySettings?.name || 'Centro Oftalmológico'}</div>
        <div>${companySettings?.address || ''}</div>
        <div>${companySettings?.phone || ''}</div>
      </div>
      
      <div>
        <div>Fecha: ${currentDate}</div>
        <div>Hora: ${currentTime}</div>
      </div>
      
      ${ticket.isVip ? '<div class="vip-badge">VIP</div>' : ''}
      
      <div class="ticket-number">#${ticket.ticketNumber}</div>
      <div class="service-type">${ServiceTypeLabels[ticket.serviceType]}</div>
      
      ${ticket.patientName ? `<div class="patient-name">Paciente: ${ticket.patientName}</div>` : ''}
      
      <div class="info">
        ${ticket.redirectedFrom ? `<div>Redirigido de: ${ServiceTypeLabels[ticket.redirectedFrom]}</div>` : ''}
      </div>
      
      <div class="footer">
        ${companySettings?.ticketFooter || 'Gracias por su preferencia'}
      </div>
    </body>
    </html>
  `);
  
  // Esperar un momento para que se cargue el contenido y luego imprimir
  setTimeout(() => {
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }, 500);
};

export const printReport = async (
  tickets: Ticket[], 
  startDate: Date, 
  endDate: Date
) => {
  // Obtener la configuración de la empresa
  const companySettings = await getCompanySettings();
  
  // Obtener mapa de salas
  const roomsMap = await getRoomsMap();
  
  // Crear una nueva ventana para imprimir
  const printWindow = window.open('', '', 'width=800,height=600');
  
  if (!printWindow) {
    alert('Por favor, permita ventanas emergentes para este sitio para imprimir reportes');
    return;
  }
  
  // Helper function to get room display name
  const getRoomDisplay = (counterNumber: string | null | undefined) => {
    if (!counterNumber) return '-';
    
    // Check if the counterNumber is a UUID (room id) or just a number
    if (counterNumber.includes('-')) {
      return roomsMap[counterNumber] || counterNumber;
    }
    
    return counterNumber;
  };
  
  // Calcular estadísticas
  const totalTickets = tickets.length;
  const completedTickets = tickets.filter(t => t.status === 'completed').length;
  const cancelledTickets = tickets.filter(t => t.status === 'cancelled').length;
  const redirectedTickets = tickets.filter(t => t.status === 'redirected').length;
  const waitingTickets = tickets.filter(t => t.status === 'waiting').length;
  const servingTickets = tickets.filter(t => t.status === 'serving').length;
  const vipTickets = tickets.filter(t => t.isVip).length;
  
  // Agrupar por tipo de servicio
  const serviceStats: Record<string, number> = {};
  tickets.forEach(ticket => {
    const serviceType = ticket.serviceType;
    if (!serviceStats[serviceType]) {
      serviceStats[serviceType] = 0;
    }
    serviceStats[serviceType]++;
  });
  
  // Crear contenido para impresión
  printWindow.document.write(`
    <html>
    <head>
      <title>Reporte de Tickets</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          font-size: 12px;
        }
        .header {
          margin-bottom: 20px;
          text-align: center;
        }
        .company-name {
          font-size: 18px;
          font-weight: bold;
        }
        .report-title {
          font-size: 16px;
          font-weight: bold;
          margin: 20px 0 15px 0;
          border-bottom: 1px solid #ccc;
          padding-bottom: 5px;
        }
        .date-range {
          margin-bottom: 20px;
          font-weight: bold;
        }
        .stats-container {
          display: flex;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }
        .stat-box {
          border: 1px solid #ccc;
          border-radius: 5px;
          padding: 10px;
          margin-right: 15px;
          margin-bottom: 15px;
          width: 150px;
          text-align: center;
        }
        .stat-value {
          font-size: 24px;
          font-weight: bold;
          margin: 5px 0;
        }
        .stat-label {
          color: #666;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #f2f2f2;
        }
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 10px;
          color: #666;
        }
        .logo {
          max-width: 200px;
          height: auto;
          margin-bottom: 10px;
        }
        @media print {
          body {
            margin: 0;
            padding: 15px;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        ${companySettings?.logo ? `<img src="${companySettings.logo}" class="logo" alt="Logo">` : ''}
        <div class="company-name">${companySettings?.name || 'Centro Oftalmológico'}</div>
        <div>${companySettings?.address || ''}</div>
      </div>
      
      <div class="report-title">Reporte de Tickets</div>
      
      <div class="date-range">
        Período: ${format(startDate, 'dd/MM/yyyy')} - ${format(endDate, 'dd/MM/yyyy')}
      </div>
      
      <div class="report-title">Resumen</div>
      
      <div class="stats-container">
        <div class="stat-box">
          <div class="stat-label">Total Tickets</div>
          <div class="stat-value">${totalTickets.toString()}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Completados</div>
          <div class="stat-value">${completedTickets.toString()}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Cancelados</div>
          <div class="stat-value">${cancelledTickets.toString()}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Redirigidos</div>
          <div class="stat-value">${redirectedTickets.toString()}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">En espera</div>
          <div class="stat-value">${waitingTickets.toString()}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">En atención</div>
          <div class="stat-value">${servingTickets.toString()}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">VIP</div>
          <div class="stat-value">${vipTickets.toString()}</div>
        </div>
      </div>
      
      <div class="report-title">Por Tipo de Servicio</div>
      
      <div class="stats-container">
        ${Object.entries(serviceStats).map(([serviceType, count]) => `
          <div class="stat-box">
            <div class="stat-label">${ServiceTypeLabels[serviceType as any] || serviceType}</div>
            <div class="stat-value">${count.toString()}</div>
          </div>
        `).join('')}
      </div>
      
      <div class="report-title">Detalles de Tickets</div>
      
      <table>
        <thead>
          <tr>
            <th>Número</th>
            <th>Servicio</th>
            <th>Estado</th>
            <th>VIP</th>
            <th>Paciente</th>
            <th>Fecha y Hora</th>
            <th>Tiempo Espera</th>
            <th>Sala</th>
          </tr>
        </thead>
        <tbody>
          ${tickets.map(ticket => {
            const waitTime = ticket.calledAt && ticket.createdAt 
              ? Math.round((ticket.calledAt.getTime() - ticket.createdAt.getTime()) / (1000 * 60))
              : '-';
            
            return `
              <tr>
                <td>${ticket.ticketNumber}</td>
                <td>${ServiceTypeLabels[ticket.serviceType]}</td>
                <td>${
                  ticket.status === 'waiting' ? 'En espera' :
                  ticket.status === 'serving' ? 'En atención' :
                  ticket.status === 'completed' ? 'Completado' :
                  ticket.status === 'cancelled' ? 'Cancelado' :
                  'Redirigido'
                }</td>
                <td>${ticket.isVip ? 'Sí' : 'No'}</td>
                <td>${ticket.patientName || '-'}</td>
                <td>${format(ticket.createdAt, 'dd/MM/yyyy HH:mm')}</td>
                <td>${typeof waitTime === 'number' ? `${waitTime.toString()} min` : waitTime}</td>
                <td>${getRoomDisplay(ticket.counterNumber ? ticket.counterNumber.toString() : null)}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
      
      <div class="footer">
        Reporte generado el ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}
      </div>
      
      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `);
  
  printWindow.document.close();
};
