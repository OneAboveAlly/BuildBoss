const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const { checkActiveSubscription, checkPremiumFeature } = require('../middleware/subscription');
const ExcelJS = require('exceljs');
const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const cron = require('node-cron');
const { format, _startOfMonth, _endOfMonth, _startOfWeek, _endOfWeek } = require('date-fns');

const router = express.Router();
const prisma = new PrismaClient();

// Middleware - wszystkie endpointy wymagają autoryzacji
router.use(authenticateToken);

// Upewnij się, że folder reports istnieje
const reportsDir = path.join(__dirname, '../generated/reports');
fs.mkdir(reportsDir, { recursive: true }).catch(console.error);

// GET /api/reports - lista raportów użytkownika
router.get('/', checkActiveSubscription, async (req, res) => {
  try {
    const userId = req.user.id;
    const { companyId, type, status } = req.query;

    const whereClause = { userId };
    if (companyId) whereClause.companyId = companyId;
    if (type) whereClause.type = type;
    if (status) whereClause.status = status;

    const reports = await prisma.report.findMany({
      where: whereClause,
      include: {
        company: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(reports);

  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// GET /api/reports/templates - szablony raportów
router.get('/templates', checkActiveSubscription, async (req, res) => {
  try {
    const templates = [
      {
        type: 'PROJECT_SUMMARY',
        name: 'Podsumowanie Projektu',
        description: 'Kompletny raport z postępu, zadań i kosztów projektu',
        fields: ['projectId'],
        formats: ['PDF', 'EXCEL']
      },
      {
        type: 'FINANCIAL_REPORT',
        name: 'Raport Finansowy',
        description: 'Analiza budżetów, kosztów i rentowności projektów',
        fields: ['companyId', 'period'],
        formats: ['PDF', 'EXCEL'],
        premium: true
      },
      {
        type: 'TEAM_PRODUCTIVITY',
        name: 'Produktywność Zespołu',
        description: 'Wydajność pracowników i analiza obciążenia',
        fields: ['companyId', 'period'],
        formats: ['PDF', 'EXCEL'],
        premium: true
      },
      {
        type: 'TASK_COMPLETION',
        name: 'Ukończenie Zadań',
        description: 'Statystyki wykonania zadań i terminowości',
        fields: ['companyId', 'projectId', 'period'],
        formats: ['PDF', 'EXCEL']
      },
      {
        type: 'MATERIAL_INVENTORY',
        name: 'Inwentarz Materiałów',
        description: 'Stan magazynowy i analiza kosztów materiałów',
        fields: ['companyId'],
        formats: ['PDF', 'EXCEL']
      },
      {
        type: 'TIME_TRACKING',
        name: 'Śledzenie Czasu',
        description: 'Raport przepracowanych godzin i efektywności',
        fields: ['companyId', 'period'],
        formats: ['PDF', 'EXCEL'],
        premium: true
      }
    ];

    res.json(templates);

  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ error: 'Failed to fetch report templates' });
  }
});

// POST /api/reports/generate - generowanie raportu
router.post('/generate', checkActiveSubscription, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, type, config, format = 'PDF' } = req.body;

    if (!name || !type || !config) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Sprawdź czy raport wymaga premium
    const premiumReports = ['FINANCIAL_REPORT', 'TEAM_PRODUCTIVITY', 'TIME_TRACKING'];
    if (premiumReports.includes(type)) {
      // Sprawdź dostęp do funkcji premium
      const subscription = await prisma.subscription.findUnique({
        where: { userId },
        include: { plan: true }
      });

      if (!subscription || !subscription.plan.features.hasAdvancedReports) {
        return res.status(403).json({
          error: 'Premium feature required',
          message: 'Ten raport jest dostępny tylko w planach premium'
        });
      }
    }

    // Sprawdź dostęp do firmy
    if (config.companyId) {
      const worker = await prisma.worker.findFirst({
        where: {
          userId: userId,
          companyId: config.companyId,
          status: 'ACTIVE'
        }
      });

      if (!worker) {
        return res.status(403).json({ error: 'Access denied to this company' });
      }
    }

    // Utwórz rekord raportu
    const report = await prisma.report.create({
      data: {
        name,
        type,
        config,
        fileFormat: format,
        status: 'GENERATING',
        userId,
        companyId: config.companyId
      }
    });

    // Generuj raport asynchronicznie
    generateReportAsync(report.id, type, config, format);

    res.status(202).json({
      reportId: report.id,
      status: 'GENERATING',
      message: 'Raport jest generowany. Sprawdź status za chwilę.'
    });

  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// GET /api/reports/:id - szczegóły raportu
router.get('/:id', checkActiveSubscription, async (req, res) => {
  try {
    const userId = req.user.id;
    const reportId = req.params.id;

    const report = await prisma.report.findFirst({
      where: {
        id: reportId,
        userId: userId
      },
      include: {
        company: {
          select: { id: true, name: true }
        }
      }
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json(report);

  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

// GET /api/reports/:id/download - pobieranie raportu
router.get('/:id/download', checkActiveSubscription, async (req, res) => {
  try {
    const userId = req.user.id;
    const reportId = req.params.id;

    const report = await prisma.report.findFirst({
      where: {
        id: reportId,
        userId: userId,
        status: 'COMPLETED'
      }
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found or not ready' });
    }

    if (!report.filePath) {
      return res.status(404).json({ error: 'Report file not found' });
    }

    const filePath = path.join(__dirname, '..', report.filePath);

    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ error: 'Report file not found on disk' });
    }

    const fileName = `${report.name}_${format(report.createdAt, 'yyyy-MM-dd')}.${report.fileFormat.toLowerCase()}`;

    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', getContentType(report.fileFormat));

    const fileBuffer = await fs.readFile(filePath);
    res.send(fileBuffer);

  } catch (error) {
    console.error('Download report error:', error);
    res.status(500).json({ error: 'Failed to download report' });
  }
});

// POST /api/reports/schedule - zaplanowanie automatycznego raportu
router.post('/schedule', checkActiveSubscription, checkPremiumFeature('hasAdvancedReports'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, type, config, format, schedule } = req.body;

    if (!name || !type || !config || !schedule) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Walidacja cron expression
    if (!cron.validate(schedule)) {
      return res.status(400).json({ error: 'Invalid cron schedule format' });
    }

    // Sprawdź dostęp do firmy
    if (config.companyId) {
      const worker = await prisma.worker.findFirst({
        where: {
          userId: userId,
          companyId: config.companyId,
          status: 'ACTIVE'
        }
      });

      if (!worker) {
        return res.status(403).json({ error: 'Access denied to this company' });
      }
    }

    const scheduledReport = await prisma.report.create({
      data: {
        name,
        type,
        config,
        fileFormat: format || 'PDF',
        isScheduled: true,
        schedule,
        status: 'SCHEDULED',
        userId,
        companyId: config.companyId
      }
    });

    // Zaplanuj zadanie cron
    scheduleReportGeneration(scheduledReport);

    res.status(201).json(scheduledReport);

  } catch (error) {
    console.error('Schedule report error:', error);
    res.status(500).json({ error: 'Failed to schedule report' });
  }
});

// DELETE /api/reports/:id - usunięcie raportu
router.delete('/:id', checkActiveSubscription, async (req, res) => {
  try {
    const userId = req.user.id;
    const reportId = req.params.id;

    const report = await prisma.report.findFirst({
      where: {
        id: reportId,
        userId: userId
      }
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Usuń plik z dysku jeśli istnieje
    if (report.filePath) {
      try {
        const filePath = path.join(__dirname, '..', report.filePath);
        await fs.unlink(filePath);
      } catch (error) {
        console.warn('Failed to delete report file:', error);
      }
    }

    await prisma.report.delete({
      where: { id: reportId }
    });

    res.json({ message: 'Report deleted successfully' });

  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({ error: 'Failed to delete report' });
  }
});

// Funkcje pomocnicze

async function generateReportAsync(reportId, type, config, format) {
  try {
    console.log(`Generating report ${reportId} of type ${type}`);

    // Pobierz dane dla raportu
    const reportData = await getReportData(type, config);

    // Generuj plik
    let filePath;
    if (format === 'EXCEL') {
      filePath = await generateExcelReport(reportId, type, reportData);
    } else {
      filePath = await generatePDFReport(reportId, type, reportData);
    }

    // Aktualizuj status raportu
    await prisma.report.update({
      where: { id: reportId },
      data: {
        status: 'COMPLETED',
        data: reportData,
        filePath: filePath,
        generatedAt: new Date()
      }
    });

    console.log(`Report ${reportId} generated successfully`);

  } catch (error) {
    console.error(`Failed to generate report ${reportId}:`, error);

    await prisma.report.update({
      where: { id: reportId },
      data: {
        status: 'FAILED'
      }
    });
  }
}

async function getReportData(type, config) {
  switch (type) {
  case 'PROJECT_SUMMARY':
    return await getProjectSummaryData(config);
  case 'FINANCIAL_REPORT':
    return await getFinancialReportData(config);
  case 'TEAM_PRODUCTIVITY':
    return await getTeamProductivityData(config);
  case 'TASK_COMPLETION':
    return await getTaskCompletionData(config);
  case 'MATERIAL_INVENTORY':
    return await getMaterialInventoryData(config);
  case 'TIME_TRACKING':
    return await getTimeTrackingData(config);
  default:
    throw new Error(`Unknown report type: ${type}`);
  }
}

async function getProjectSummaryData(config) {
  const project = await prisma.project.findUnique({
    where: { id: config.projectId },
    include: {
      company: true,
      tasks: {
        include: {
          assignedTo: {
            select: { firstName: true, lastName: true }
          }
        }
      },
      materials: true,
      createdBy: {
        select: { firstName: true, lastName: true }
      }
    }
  });

  if (!project) {
    throw new Error('Project not found');
  }

  const totalTasks = project.tasks.length;
  const completedTasks = project.tasks.filter(t => t.status === 'DONE').length;
  const materialsCost = project.materials.reduce((sum, m) => sum + (m.quantity * (m.price || 0)), 0);

  return {
    project,
    summary: {
      totalTasks,
      completedTasks,
      completionRate: totalTasks > 0 ? (completedTasks / totalTasks * 100) : 0,
      materialsCost,
      budgetUsage: project.budget > 0 ? (materialsCost / project.budget * 100) : 0
    }
  };
}

async function getFinancialReportData(config) {
  const projects = await prisma.project.findMany({
    where: { companyId: config.companyId },
    include: {
      materials: true,
      tasks: true
    }
  });

  const financialData = projects.map(project => {
    const materialsCost = project.materials.reduce((sum, m) => sum + (m.quantity * (m.price || 0)), 0);
    const laborCost = project.tasks.reduce((sum, t) => sum + ((t.actualHours || 0) * 50), 0);

    return {
      project: project.name,
      budget: project.budget || 0,
      materialsCost,
      laborCost,
      totalCost: materialsCost + laborCost,
      variance: (project.budget || 0) - (materialsCost + laborCost)
    };
  });

  return { projects: financialData };
}

async function generateExcelReport(reportId, type, data) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Raport');

  // Dodaj nagłówek
  worksheet.addRow([`Raport: ${type}`, '', '', format(new Date(), 'dd.MM.yyyy HH:mm')]);
  worksheet.addRow([]);

  // Dodaj dane w zależności od typu raportu
  switch (type) {
  case 'PROJECT_SUMMARY':
    if (data.project) {
      worksheet.addRow(['Projekt:', data.project.name]);
      worksheet.addRow(['Status:', data.project.status]);
      worksheet.addRow(['Budżet:', data.project.budget || 0]);
      worksheet.addRow(['Ukończenie:', `${data.summary.completionRate.toFixed(1)}%`]);
      worksheet.addRow([]);

      worksheet.addRow(['Zadania']);
      worksheet.addRow(['Tytuł', 'Status', 'Priorytet', 'Przypisany do']);

      data.project.tasks.forEach(task => {
        worksheet.addRow([
          task.title,
          task.status,
          task.priority,
          task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : 'Nieprzypisane'
        ]);
      });
    }
    break;

  case 'FINANCIAL_REPORT':
    if (data.projects) {
      worksheet.addRow(['Raport Finansowy']);
      worksheet.addRow(['Projekt', 'Budżet', 'Koszty Materiałów', 'Koszty Pracy', 'Całkowite Koszty', 'Odchylenie']);

      data.projects.forEach(project => {
        worksheet.addRow([
          project.project,
          project.budget,
          project.materialsCost,
          project.laborCost,
          project.totalCost,
          project.variance
        ]);
      });
    }
    break;

  case 'TEAM_PRODUCTIVITY':
    if (data.workers) {
      worksheet.addRow(['Produktywność Zespołu']);
      worksheet.addRow(['Pracownik', 'Stanowisko', 'Zadania Ogółem', 'Ukończone', 'Wskaźnik Ukończenia', 'Godziny', 'Efektywność']);

      data.workers.forEach(worker => {
        worksheet.addRow([
          worker.worker.name,
          worker.worker.position || 'Brak',
          worker.metrics.totalTasks,
          worker.metrics.completedTasks,
          `${worker.metrics.completionRate.toFixed(1)}%`,
          worker.metrics.totalHours,
          `${worker.metrics.efficiency.toFixed(1)}%`
        ]);
      });
    }
    break;

  case 'TASK_COMPLETION':
    if (data.tasks) {
      worksheet.addRow(['Ukończenie Zadań']);
      worksheet.addRow(['Podsumowanie']);
      worksheet.addRow(['Ogółem:', data.summary.total]);
      worksheet.addRow(['Ukończone:', data.summary.completed]);
      worksheet.addRow(['W trakcie:', data.summary.inProgress]);
      worksheet.addRow(['Do zrobienia:', data.summary.todo]);
      worksheet.addRow(['Przeterminowane:', data.summary.overdue]);
      worksheet.addRow([]);

      worksheet.addRow(['Szczegóły zadań']);
      worksheet.addRow(['Tytuł', 'Status', 'Priorytet', 'Projekt', 'Przypisany do']);

      data.tasks.forEach(task => {
        worksheet.addRow([
          task.title,
          task.status,
          task.priority,
          task.project.name,
          task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : 'Nieprzypisane'
        ]);
      });
    }
    break;

  case 'MATERIAL_INVENTORY':
    if (data.materials) {
      worksheet.addRow(['Inwentarz Materiałów']);
      worksheet.addRow(['Podsumowanie']);
      worksheet.addRow(['Ogółem materiałów:', data.summary.totalMaterials]);
      worksheet.addRow(['Wartość całkowita:', data.summary.totalValue]);
      worksheet.addRow(['Niski stan:', data.summary.lowStockCount]);
      worksheet.addRow([]);

      worksheet.addRow(['Szczegóły materiałów']);
      worksheet.addRow(['Nazwa', 'Kategoria', 'Ilość', 'Jednostka', 'Cena', 'Wartość', 'Lokalizacja']);

      data.materials.forEach(material => {
        worksheet.addRow([
          material.name,
          material.category || 'Brak',
          material.quantity,
          material.unit,
          material.price || 0,
          material.quantity * (material.price || 0),
          material.location || 'Brak'
        ]);
      });
    }
    break;

  case 'TIME_TRACKING':
    if (data.tasks) {
      worksheet.addRow(['Śledzenie Czasu']);
      worksheet.addRow(['Podsumowanie']);
      worksheet.addRow(['Zadania ogółem:', data.summary.totalTasks]);
      worksheet.addRow(['Szacowane godziny:', data.summary.totalEstimatedHours]);
      worksheet.addRow(['Rzeczywiste godziny:', data.summary.totalActualHours]);
      worksheet.addRow(['Odchylenie:', data.summary.timeVariance]);
      worksheet.addRow(['Efektywność:', `${data.summary.timeEfficiency.toFixed(1)}%`]);
      worksheet.addRow([]);

      worksheet.addRow(['Szczegóły zadań']);
      worksheet.addRow(['Zadanie', 'Projekt', 'Przypisany do', 'Szacowane', 'Rzeczywiste', 'Odchylenie', 'Efektywność']);

      data.tasks.forEach(task => {
        worksheet.addRow([
          task.title,
          task.project,
          task.assignedTo,
          task.estimatedHours,
          task.actualHours,
          task.variance,
          `${task.efficiency.toFixed(1)}%`
        ]);
      });
    }
    break;
  }

  const fileName = `report_${reportId}.xlsx`;
  const filePath = `generated/reports/${fileName}`;
  const fullPath = path.join(__dirname, '..', filePath);

  await workbook.xlsx.writeFile(fullPath);
  return filePath;
}

async function generatePDFReport(reportId, type, data) {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  // Generuj HTML dla raportu
  const html = generateReportHTML(type, data);

  await page.setContent(html);

  const fileName = `report_${reportId}.pdf`;
  const filePath = `generated/reports/${fileName}`;
  const fullPath = path.join(__dirname, '..', filePath);

  await page.pdf({
    path: fullPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '20mm',
      right: '20mm',
      bottom: '20mm',
      left: '20mm'
    }
  });

  await browser.close();
  return filePath;
}

function generateReportHTML(type, data) {
  const currentDate = format(new Date(), 'dd.MM.yyyy HH:mm');

  let content = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Raport ${type}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
        .section { margin-bottom: 25px; }
        .section h2 { color: #2563eb; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 15px; }
        .section h3 { color: #4b5563; margin-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f8fafc; font-weight: bold; }
        .summary { background-color: #f9fafb; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
        .summary-item { background: white; padding: 10px; border-radius: 3px; border-left: 4px solid #2563eb; }
        .metric-value { font-size: 1.2em; font-weight: bold; color: #2563eb; }
        .status-positive { color: #059669; }
        .status-negative { color: #dc2626; }
        .status-warning { color: #d97706; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Raport: ${getReportTypeName(type)}</h1>
        <p>Wygenerowano: ${currentDate}</p>
      </div>
  `;

  switch (type) {
  case 'PROJECT_SUMMARY':
    if (data.project) {
      content += `
          <div class="section">
            <h2>Informacje o projekcie</h2>
            <div class="summary">
              <div class="summary-grid">
                <div class="summary-item">
                  <strong>Nazwa:</strong><br>
                  <span class="metric-value">${data.project.name}</span>
                </div>
                <div class="summary-item">
                  <strong>Status:</strong><br>
                  <span class="metric-value">${data.project.status}</span>
                </div>
                <div class="summary-item">
                  <strong>Budżet:</strong><br>
                  <span class="metric-value">${data.project.budget || 0} PLN</span>
                </div>
                <div class="summary-item">
                  <strong>Ukończenie:</strong><br>
                  <span class="metric-value ${data.summary.completionRate >= 80 ? 'status-positive' : data.summary.completionRate >= 50 ? 'status-warning' : 'status-negative'}">${data.summary.completionRate.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="section">
            <h2>Zadania (${data.project.tasks.length})</h2>
            <table>
              <thead>
                <tr>
                  <th>Tytuł</th>
                  <th>Status</th>
                  <th>Priorytet</th>
                  <th>Przypisany do</th>
                  <th>Termin</th>
                </tr>
              </thead>
              <tbody>
        `;

      data.project.tasks.forEach(task => {
        content += `
            <tr>
              <td>${task.title}</td>
              <td><span class="${task.status === 'DONE' ? 'status-positive' : task.status === 'IN_PROGRESS' ? 'status-warning' : ''}">${task.status}</span></td>
              <td><span class="${task.priority === 'URGENT' ? 'status-negative' : task.priority === 'HIGH' ? 'status-warning' : ''}">${task.priority}</span></td>
              <td>${task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : 'Nieprzypisane'}</td>
              <td>${task.dueDate ? format(new Date(task.dueDate), 'dd.MM.yyyy') : 'Brak'}</td>
            </tr>
          `;
      });

      content += `
              </tbody>
            </table>
          </div>
        `;
    }
    break;

  case 'FINANCIAL_REPORT':
    if (data.projects) {
      const totalBudget = data.projects.reduce((sum, p) => sum + p.budget, 0);
      const totalCost = data.projects.reduce((sum, p) => sum + p.totalCost, 0);
      const totalVariance = totalBudget - totalCost;

      content += `
          <div class="section">
            <h2>Podsumowanie finansowe</h2>
            <div class="summary">
              <div class="summary-grid">
                <div class="summary-item">
                  <strong>Całkowity budżet:</strong><br>
                  <span class="metric-value">${totalBudget.toFixed(2)} PLN</span>
                </div>
                <div class="summary-item">
                  <strong>Całkowite koszty:</strong><br>
                  <span class="metric-value">${totalCost.toFixed(2)} PLN</span>
                </div>
                <div class="summary-item">
                  <strong>Odchylenie:</strong><br>
                  <span class="metric-value ${totalVariance >= 0 ? 'status-positive' : 'status-negative'}">${totalVariance.toFixed(2)} PLN</span>
                </div>
                <div class="summary-item">
                  <strong>Wykorzystanie budżetu:</strong><br>
                  <span class="metric-value">${totalBudget > 0 ? (totalCost / totalBudget * 100).toFixed(1) : 0}%</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="section">
            <h2>Szczegóły projektów</h2>
            <table>
              <thead>
                <tr>
                  <th>Projekt</th>
                  <th>Budżet</th>
                  <th>Koszty materiałów</th>
                  <th>Koszty pracy</th>
                  <th>Całkowite koszty</th>
                  <th>Odchylenie</th>
                </tr>
              </thead>
              <tbody>
        `;

      data.projects.forEach(project => {
        content += `
            <tr>
              <td>${project.project}</td>
              <td>${project.budget.toFixed(2)} PLN</td>
              <td>${project.materialsCost.toFixed(2)} PLN</td>
              <td>${project.laborCost.toFixed(2)} PLN</td>
              <td>${project.totalCost.toFixed(2)} PLN</td>
              <td><span class="${project.variance >= 0 ? 'status-positive' : 'status-negative'}">${project.variance.toFixed(2)} PLN</span></td>
            </tr>
          `;
      });

      content += `
              </tbody>
            </table>
          </div>
        `;
    }
    break;

  case 'TEAM_PRODUCTIVITY':
    if (data.workers && data.summary) {
      content += `
          <div class="section">
            <h2>Podsumowanie zespołu</h2>
            <div class="summary">
              <div class="summary-grid">
                <div class="summary-item">
                  <strong>Liczba pracowników:</strong><br>
                  <span class="metric-value">${data.summary.totalWorkers}</span>
                </div>
                <div class="summary-item">
                  <strong>Zadania ogółem:</strong><br>
                  <span class="metric-value">${data.summary.totalTasks}</span>
                </div>
                <div class="summary-item">
                  <strong>Ukończone zadania:</strong><br>
                  <span class="metric-value">${data.summary.completedTasks}</span>
                </div>
                <div class="summary-item">
                  <strong>Średnia produktywność:</strong><br>
                  <span class="metric-value">${data.summary.averageProductivity.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="section">
            <h2>Produktywność pracowników</h2>
            <table>
              <thead>
                <tr>
                  <th>Pracownik</th>
                  <th>Stanowisko</th>
                  <th>Zadania</th>
                  <th>Ukończone</th>
                  <th>Wskaźnik ukończenia</th>
                  <th>Godziny</th>
                  <th>Efektywność</th>
                </tr>
              </thead>
              <tbody>
        `;

      data.workers.forEach(worker => {
        content += `
            <tr>
              <td>${worker.worker.name}</td>
              <td>${worker.worker.position || 'Brak'}</td>
              <td>${worker.metrics.totalTasks}</td>
              <td>${worker.metrics.completedTasks}</td>
              <td><span class="${worker.metrics.completionRate >= 80 ? 'status-positive' : worker.metrics.completionRate >= 50 ? 'status-warning' : 'status-negative'}">${worker.metrics.completionRate.toFixed(1)}%</span></td>
              <td>${worker.metrics.totalHours.toFixed(1)}h</td>
              <td><span class="${worker.metrics.efficiency >= 100 ? 'status-positive' : worker.metrics.efficiency >= 80 ? 'status-warning' : 'status-negative'}">${worker.metrics.efficiency.toFixed(1)}%</span></td>
            </tr>
          `;
      });

      content += `
              </tbody>
            </table>
          </div>
        `;
    }
    break;

  case 'TASK_COMPLETION':
    if (data.tasks && data.summary) {
      content += `
          <div class="section">
            <h2>Podsumowanie zadań</h2>
            <div class="summary">
              <div class="summary-grid">
                <div class="summary-item">
                  <strong>Zadania ogółem:</strong><br>
                  <span class="metric-value">${data.summary.total}</span>
                </div>
                <div class="summary-item">
                  <strong>Ukończone:</strong><br>
                  <span class="metric-value status-positive">${data.summary.completed}</span>
                </div>
                <div class="summary-item">
                  <strong>W trakcie:</strong><br>
                  <span class="metric-value status-warning">${data.summary.inProgress}</span>
                </div>
                <div class="summary-item">
                  <strong>Przeterminowane:</strong><br>
                  <span class="metric-value status-negative">${data.summary.overdue}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="section">
            <h2>Lista zadań</h2>
            <table>
              <thead>
                <tr>
                  <th>Tytuł</th>
                  <th>Status</th>
                  <th>Priorytet</th>
                  <th>Projekt</th>
                  <th>Przypisany do</th>
                  <th>Termin</th>
                </tr>
              </thead>
              <tbody>
        `;

      data.tasks.forEach(task => {
        const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';
        content += `
            <tr>
              <td>${task.title}</td>
              <td><span class="${task.status === 'DONE' ? 'status-positive' : task.status === 'IN_PROGRESS' ? 'status-warning' : ''}">${task.status}</span></td>
              <td><span class="${task.priority === 'URGENT' ? 'status-negative' : task.priority === 'HIGH' ? 'status-warning' : ''}">${task.priority}</span></td>
              <td>${task.project.name}</td>
              <td>${task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : 'Nieprzypisane'}</td>
              <td><span class="${isOverdue ? 'status-negative' : ''}">${task.dueDate ? format(new Date(task.dueDate), 'dd.MM.yyyy') : 'Brak'}</span></td>
            </tr>
          `;
      });

      content += `
              </tbody>
            </table>
          </div>
        `;
    }
    break;

  case 'MATERIAL_INVENTORY':
    if (data.materials && data.summary) {
      content += `
          <div class="section">
            <h2>Podsumowanie inwentarza</h2>
            <div class="summary">
              <div class="summary-grid">
                <div class="summary-item">
                  <strong>Materiały ogółem:</strong><br>
                  <span class="metric-value">${data.summary.totalMaterials}</span>
                </div>
                <div class="summary-item">
                  <strong>Wartość całkowita:</strong><br>
                  <span class="metric-value">${data.summary.totalValue.toFixed(2)} PLN</span>
                </div>
                <div class="summary-item">
                  <strong>Niski stan:</strong><br>
                  <span class="metric-value status-negative">${data.summary.lowStockCount}</span>
                </div>
                <div class="summary-item">
                  <strong>Kategorie:</strong><br>
                  <span class="metric-value">${data.summary.categoriesCount}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="section">
            <h2>Lista materiałów</h2>
            <table>
              <thead>
                <tr>
                  <th>Nazwa</th>
                  <th>Kategoria</th>
                  <th>Ilość</th>
                  <th>Jednostka</th>
                  <th>Cena</th>
                  <th>Wartość</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
        `;

      data.materials.forEach(material => {
        const isLowStock = material.minQuantity && material.quantity <= material.minQuantity;
        const value = material.quantity * (material.price || 0);
        content += `
            <tr>
              <td>${material.name}</td>
              <td>${material.category || 'Brak'}</td>
              <td>${material.quantity}</td>
              <td>${material.unit}</td>
              <td>${(material.price || 0).toFixed(2)} PLN</td>
              <td>${value.toFixed(2)} PLN</td>
              <td><span class="${isLowStock ? 'status-negative' : 'status-positive'}">${isLowStock ? 'Niski stan' : 'OK'}</span></td>
            </tr>
          `;
      });

      content += `
              </tbody>
            </table>
          </div>
        `;
    }
    break;

  case 'TIME_TRACKING':
    if (data.tasks && data.summary) {
      content += `
          <div class="section">
            <h2>Podsumowanie czasu pracy</h2>
            <div class="summary">
              <div class="summary-grid">
                <div class="summary-item">
                  <strong>Zadania ogółem:</strong><br>
                  <span class="metric-value">${data.summary.totalTasks}</span>
                </div>
                <div class="summary-item">
                  <strong>Szacowane godziny:</strong><br>
                  <span class="metric-value">${data.summary.totalEstimatedHours.toFixed(1)}h</span>
                </div>
                <div class="summary-item">
                  <strong>Rzeczywiste godziny:</strong><br>
                  <span class="metric-value">${data.summary.totalActualHours.toFixed(1)}h</span>
                </div>
                <div class="summary-item">
                  <strong>Efektywność:</strong><br>
                  <span class="metric-value ${data.summary.timeEfficiency >= 100 ? 'status-positive' : data.summary.timeEfficiency >= 80 ? 'status-warning' : 'status-negative'}">${data.summary.timeEfficiency.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="section">
            <h2>Szczegóły zadań</h2>
            <table>
              <thead>
                <tr>
                  <th>Zadanie</th>
                  <th>Projekt</th>
                  <th>Przypisany do</th>
                  <th>Szacowane</th>
                  <th>Rzeczywiste</th>
                  <th>Odchylenie</th>
                  <th>Efektywność</th>
                </tr>
              </thead>
              <tbody>
        `;

      data.tasks.forEach(task => {
        content += `
            <tr>
              <td>${task.title}</td>
              <td>${task.project}</td>
              <td>${task.assignedTo}</td>
              <td>${task.estimatedHours.toFixed(1)}h</td>
              <td>${task.actualHours.toFixed(1)}h</td>
              <td><span class="${task.variance <= 0 ? 'status-positive' : 'status-negative'}">${task.variance > 0 ? '+' : ''}${task.variance.toFixed(1)}h</span></td>
              <td><span class="${task.efficiency >= 100 ? 'status-positive' : task.efficiency >= 80 ? 'status-warning' : 'status-negative'}">${task.efficiency.toFixed(1)}%</span></td>
            </tr>
          `;
      });

      content += `
              </tbody>
            </table>
          </div>
        `;
    }
    break;
  }

  content += `
    </body>
    </html>
  `;

  return content;
}

function getReportTypeName(type) {
  const names = {
    'PROJECT_SUMMARY': 'Podsumowanie Projektu',
    'FINANCIAL_REPORT': 'Raport Finansowy',
    'TEAM_PRODUCTIVITY': 'Produktywność Zespołu',
    'TASK_COMPLETION': 'Ukończenie Zadań',
    'MATERIAL_INVENTORY': 'Inwentarz Materiałów',
    'TIME_TRACKING': 'Śledzenie Czasu',
    'COST_BREAKDOWN': 'Podział Kosztów',
    'CUSTOM_REPORT': 'Raport Niestandardowy'
  };
  return names[type] || type;
}

function getContentType(format) {
  switch (format) {
  case 'PDF':
    return 'application/pdf';
  case 'EXCEL':
    return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  default:
    return 'application/octet-stream';
  }
}

function scheduleReportGeneration(report) {
  cron.schedule(report.schedule, async () => {
    console.log(`Generating scheduled report: ${report.id}`);

    try {
      const newReport = await prisma.report.create({
        data: {
          name: `${report.name} (${format(new Date(), 'dd.MM.yyyy')})`,
          type: report.type,
          config: report.config,
          fileFormat: report.fileFormat,
          status: 'GENERATING',
          userId: report.userId,
          companyId: report.companyId
        }
      });

      await generateReportAsync(newReport.id, report.type, report.config, report.fileFormat);

    } catch (error) {
      console.error('Scheduled report generation failed:', error);
    }
  });
}

// Implementacje funkcji pobierania danych dla różnych typów raportów

async function getTeamProductivityData(config) {
  const { companyId, period = 'monthly' } = config;

  // Pobierz pracowników firmy
  const workers = await prisma.worker.findMany({
    where: {
      companyId,
      status: 'ACTIVE'
    },
    include: {
      user: {
        select: { firstName: true, lastName: true, email: true }
      }
    }
  });

  // Pobierz zadania przypisane do pracowników
  const tasks = await prisma.task.findMany({
    where: {
      project: { companyId },
      assignedToId: { not: null }
    },
    include: {
      assignedTo: {
        select: { id: true, firstName: true, lastName: true }
      },
      project: {
        select: { name: true }
      }
    }
  });

  // Oblicz produktywność dla każdego pracownika
  const productivity = workers.map(worker => {
    const workerTasks = tasks.filter(task => task.assignedToId === worker.userId);
    const completedTasks = workerTasks.filter(task => task.status === 'DONE');
    const totalTasks = workerTasks.length;
    const totalHours = workerTasks.reduce((sum, task) => sum + (task.actualHours || 0), 0);
    const estimatedHours = workerTasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0);

    return {
      worker: {
        name: `${worker.user.firstName} ${worker.user.lastName}`,
        email: worker.user.email,
        position: worker.position
      },
      metrics: {
        totalTasks,
        completedTasks,
        completionRate: totalTasks > 0 ? (completedTasks / totalTasks * 100) : 0,
        totalHours,
        estimatedHours,
        efficiency: estimatedHours > 0 ? (estimatedHours / totalHours * 100) : 0,
        averageTaskTime: completedTasks.length > 0 ? totalHours / completedTasks.length : 0
      }
    };
  });

  return {
    period,
    companyId,
    workers: productivity,
    summary: {
      totalWorkers: workers.length,
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'DONE').length,
      totalHours: tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0),
      averageProductivity: productivity.reduce((sum, p) => sum + p.metrics.completionRate, 0) / productivity.length
    }
  };
}

async function getTaskCompletionData(config) {
  const { companyId, projectId, period = 'monthly' } = config;

  const whereClause = {
    project: { companyId }
  };

  if (projectId) {
    whereClause.projectId = projectId;
  }

  const tasks = await prisma.task.findMany({
    where: whereClause,
    include: {
      project: {
        select: { name: true }
      },
      assignedTo: {
        select: { firstName: true, lastName: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Grupuj zadania według statusu
  const statusGroups = {
    TODO: tasks.filter(t => t.status === 'TODO'),
    IN_PROGRESS: tasks.filter(t => t.status === 'IN_PROGRESS'),
    REVIEW: tasks.filter(t => t.status === 'REVIEW'),
    DONE: tasks.filter(t => t.status === 'DONE')
  };

  // Grupuj według priorytetu
  const priorityGroups = {
    LOW: tasks.filter(t => t.priority === 'LOW'),
    MEDIUM: tasks.filter(t => t.priority === 'MEDIUM'),
    HIGH: tasks.filter(t => t.priority === 'HIGH'),
    URGENT: tasks.filter(t => t.priority === 'URGENT')
  };

  // Zadania przeterminowane
  const overdueTasks = tasks.filter(task =>
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE'
  );

  return {
    period,
    companyId,
    projectId,
    tasks,
    summary: {
      total: tasks.length,
      completed: statusGroups.DONE.length,
      inProgress: statusGroups.IN_PROGRESS.length,
      todo: statusGroups.TODO.length,
      overdue: overdueTasks.length,
      completionRate: tasks.length > 0 ? (statusGroups.DONE.length / tasks.length * 100) : 0
    },
    statusBreakdown: Object.keys(statusGroups).map(status => ({
      status,
      count: statusGroups[status].length,
      percentage: tasks.length > 0 ? (statusGroups[status].length / tasks.length * 100) : 0
    })),
    priorityBreakdown: Object.keys(priorityGroups).map(priority => ({
      priority,
      count: priorityGroups[priority].length,
      percentage: tasks.length > 0 ? (priorityGroups[priority].length / tasks.length * 100) : 0
    }))
  };
}

async function getMaterialInventoryData(config) {
  const { companyId } = config;

  const materials = await prisma.material.findMany({
    where: { companyId },
    include: {
      project: {
        select: { name: true }
      },
      createdBy: {
        select: { firstName: true, lastName: true }
      }
    },
    orderBy: { name: 'asc' }
  });

  // Materiały o niskim stanie
  const lowStockMaterials = materials.filter(material =>
    material.minQuantity && material.quantity <= material.minQuantity
  );

  // Wartość całkowita inwentarza
  const totalValue = materials.reduce((sum, material) =>
    sum + (material.quantity * (material.price || 0)), 0
  );

  // Grupowanie według kategorii
  const categories = {};
  materials.forEach(material => {
    const category = material.category || 'Inne';
    if (!categories[category]) {
      categories[category] = {
        name: category,
        materials: [],
        totalQuantity: 0,
        totalValue: 0
      };
    }
    categories[category].materials.push(material);
    categories[category].totalQuantity += material.quantity;
    categories[category].totalValue += material.quantity * (material.price || 0);
  });

  return {
    companyId,
    materials,
    summary: {
      totalMaterials: materials.length,
      totalValue,
      lowStockCount: lowStockMaterials.length,
      categoriesCount: Object.keys(categories).length,
      averageValue: materials.length > 0 ? totalValue / materials.length : 0
    },
    lowStockMaterials,
    categories: Object.values(categories),
    topValueMaterials: materials
      .sort((a, b) => (b.quantity * (b.price || 0)) - (a.quantity * (a.price || 0)))
      .slice(0, 10)
  };
}

async function getTimeTrackingData(config) {
  const { companyId, period = 'monthly' } = config;

  // Pobierz zadania z czasem pracy
  const tasks = await prisma.task.findMany({
    where: {
      project: { companyId },
      OR: [
        { actualHours: { gt: 0 } },
        { estimatedHours: { gt: 0 } }
      ]
    },
    include: {
      project: {
        select: { name: true, budget: true }
      },
      assignedTo: {
        select: { firstName: true, lastName: true }
      }
    }
  });

  // Oblicz statystyki czasu
  const totalEstimatedHours = tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0);
  const totalActualHours = tasks.reduce((sum, task) => sum + (task.actualHours || 0), 0);
  const timeVariance = totalActualHours - totalEstimatedHours;
  const timeEfficiency = totalEstimatedHours > 0 ? (totalEstimatedHours / totalActualHours * 100) : 0;

  // Grupuj według projektów
  const projectStats = {};
  tasks.forEach(task => {
    const projectId = task.projectId;
    if (!projectStats[projectId]) {
      projectStats[projectId] = {
        project: task.project,
        tasks: [],
        estimatedHours: 0,
        actualHours: 0,
        efficiency: 0
      };
    }
    projectStats[projectId].tasks.push(task);
    projectStats[projectId].estimatedHours += task.estimatedHours || 0;
    projectStats[projectId].actualHours += task.actualHours || 0;
  });

  // Oblicz efektywność dla każdego projektu
  Object.values(projectStats).forEach(stat => {
    stat.efficiency = stat.estimatedHours > 0 ? (stat.estimatedHours / stat.actualHours * 100) : 0;
  });

  // Grupuj według pracowników
  const workerStats = {};
  tasks.forEach(task => {
    if (task.assignedTo) {
      const workerId = task.assignedToId;
      if (!workerStats[workerId]) {
        workerStats[workerId] = {
          worker: task.assignedTo,
          tasks: [],
          estimatedHours: 0,
          actualHours: 0,
          efficiency: 0
        };
      }
      workerStats[workerId].tasks.push(task);
      workerStats[workerId].estimatedHours += task.estimatedHours || 0;
      workerStats[workerId].actualHours += task.actualHours || 0;
    }
  });

  // Oblicz efektywność dla każdego pracownika
  Object.values(workerStats).forEach(stat => {
    stat.efficiency = stat.estimatedHours > 0 ? (stat.estimatedHours / stat.actualHours * 100) : 0;
  });

  return {
    period,
    companyId,
    summary: {
      totalTasks: tasks.length,
      totalEstimatedHours,
      totalActualHours,
      timeVariance,
      timeEfficiency,
      averageTaskTime: tasks.length > 0 ? totalActualHours / tasks.length : 0
    },
    projectStats: Object.values(projectStats),
    workerStats: Object.values(workerStats),
    tasks: tasks.map(task => ({
      id: task.id,
      title: task.title,
      project: task.project.name,
      assignedTo: task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : 'Nieprzypisane',
      estimatedHours: task.estimatedHours || 0,
      actualHours: task.actualHours || 0,
      variance: (task.actualHours || 0) - (task.estimatedHours || 0),
      efficiency: task.estimatedHours > 0 ? (task.estimatedHours / task.actualHours * 100) : 0
    }))
  };
}

module.exports = router;
