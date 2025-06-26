const express = require('express');
const { prisma } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { checkActiveSubscription, checkPremiumFeature } = require('../middleware/subscription');
const { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subWeeks, subMonths, format } = require('date-fns');

const router = express.Router();
// Middleware - wszystkie endpointy wymagają autoryzacji
router.use(authenticateToken);

// GET /api/analytics/dashboard - główny dashboard analityczny
router.get('/dashboard', checkActiveSubscription, async (req, res) => {
  try {
    const userId = req.user.id;
    const { companyId, period = 'month' } = req.query;

    if (!companyId) {
      return res.status(400).json({ error: 'Company ID is required' });
    }

    // Sprawdź dostęp do firmy
    const worker = await prisma.worker.findFirst({
      where: {
        userId: userId,
        companyId: companyId,
        status: 'ACTIVE'
      }
    });

    if (!worker) {
      return res.status(403).json({ error: 'Access denied to this company' });
    }

    // Określ zakres dat na podstawie okresu
    const now = new Date();
    let startDate, endDate;

    switch (period) {
    case 'week':
      startDate = startOfWeek(now);
      endDate = endOfWeek(now);
      break;
    case 'month':
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
      break;
    case 'quarter':
      startDate = startOfMonth(subMonths(now, 2));
      endDate = endOfMonth(now);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31);
      break;
    default:
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
    }

    // Pobierz podstawowe statystyki
    const [
      projectsCount,
      activeProjectsCount,
      completedProjectsCount,
      tasksCount,
      completedTasksCount,
      overdueTasksCount,
      materialsCount,
      lowStockMaterials
    ] = await Promise.all([
      // Projekty
      prisma.project.count({
        where: { companyId, createdAt: { gte: startDate, lte: endDate } }
      }),
      prisma.project.count({
        where: { companyId, status: 'ACTIVE' }
      }),
      prisma.project.count({
        where: { companyId, status: 'COMPLETED', updatedAt: { gte: startDate, lte: endDate } }
      }),
      // Zadania
      prisma.task.count({
        where: {
          project: { companyId },
          createdAt: { gte: startDate, lte: endDate }
        }
      }),
      prisma.task.count({
        where: {
          project: { companyId },
          status: 'DONE',
          updatedAt: { gte: startDate, lte: endDate }
        }
      }),
      prisma.task.count({
        where: {
          project: { companyId },
          status: { in: ['TODO', 'IN_PROGRESS'] },
          dueDate: { lt: now }
        }
      }),
      // Materiały
      prisma.material.count({
        where: { companyId }
      }),
      prisma.material.count({
        where: {
          companyId,
          quantity: { lte: prisma.raw('COALESCE("minQuantity", 0)') }
        }
      })
    ]);

    // Oblicz wskaźniki wydajności
    const taskCompletionRate = tasksCount > 0 ? (completedTasksCount / tasksCount * 100) : 0;
    const projectCompletionRate = projectsCount > 0 ? (completedProjectsCount / projectsCount * 100) : 0;

    // Pobierz trendy projektów (ostatnie 7 okresów)
    const projectTrends = [];
    for (let i = 6; i >= 0; i--) {
      let periodStart, periodEnd, label;

      if (period === 'week') {
        periodStart = startOfWeek(subWeeks(now, i));
        periodEnd = endOfWeek(subWeeks(now, i));
        label = format(periodStart, 'dd.MM');
      } else if (period === 'month') {
        periodStart = startOfMonth(subMonths(now, i));
        periodEnd = endOfMonth(subMonths(now, i));
        label = format(periodStart, 'MM.yyyy');
      } else {
        periodStart = startOfDay(subDays(now, i));
        periodEnd = endOfDay(subDays(now, i));
        label = format(periodStart, 'dd.MM');
      }

      const [created, completed] = await Promise.all([
        prisma.project.count({
          where: { companyId, createdAt: { gte: periodStart, lte: periodEnd } }
        }),
        prisma.project.count({
          where: { companyId, status: 'COMPLETED', updatedAt: { gte: periodStart, lte: periodEnd } }
        })
      ]);

      projectTrends.push({
        period: label,
        created,
        completed
      });
    }

    // Pobierz trendy zadań
    const taskTrends = [];
    for (let i = 6; i >= 0; i--) {
      let periodStart, periodEnd, label;

      if (period === 'week') {
        periodStart = startOfWeek(subWeeks(now, i));
        periodEnd = endOfWeek(subWeeks(now, i));
        label = format(periodStart, 'dd.MM');
      } else {
        periodStart = startOfDay(subDays(now, i * (period === 'month' ? 4 : 1)));
        periodEnd = endOfDay(subDays(now, i * (period === 'month' ? 4 : 1)));
        label = format(periodStart, 'dd.MM');
      }

      const [created, completed] = await Promise.all([
        prisma.task.count({
          where: {
            project: { companyId },
            createdAt: { gte: periodStart, lte: periodEnd }
          }
        }),
        prisma.task.count({
          where: {
            project: { companyId },
            status: 'DONE',
            updatedAt: { gte: periodStart, lte: periodEnd }
          }
        })
      ]);

      taskTrends.push({
        period: label,
        created,
        completed
      });
    }

    // Analiza zespołu - top wykonawcy
    const topPerformers = await prisma.task.groupBy({
      by: ['assignedToId'],
      where: {
        project: { companyId },
        status: 'DONE',
        updatedAt: { gte: startDate, lte: endDate },
        assignedToId: { not: null }
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 5
    });

    // Pobierz dane użytkowników dla top wykonawców
    const performersWithUsers = await Promise.all(
      topPerformers.map(async (performer) => {
        const user = await prisma.user.findUnique({
          where: { id: performer.assignedToId },
          select: { id: true, firstName: true, lastName: true, email: true }
        });
        return {
          user,
          completedTasks: performer._count.id
        };
      })
    );

    // Analiza statusów projektów
    const projectStatusDistribution = await prisma.project.groupBy({
      by: ['status'],
      where: { companyId },
      _count: {
        id: true
      }
    });

    // Analiza priorytetów zadań
    const taskPriorityDistribution = await prisma.task.groupBy({
      by: ['priority'],
      where: {
        project: { companyId },
        status: { not: 'DONE' }
      },
      _count: {
        id: true
      }
    });

    const dashboardData = {
      period,
      dateRange: {
        start: startDate,
        end: endDate
      },
      overview: {
        projects: {
          total: projectsCount,
          active: activeProjectsCount,
          completed: completedProjectsCount,
          completionRate: Math.round(projectCompletionRate * 100) / 100
        },
        tasks: {
          total: tasksCount,
          completed: completedTasksCount,
          overdue: overdueTasksCount,
          completionRate: Math.round(taskCompletionRate * 100) / 100
        },
        materials: {
          total: materialsCount,
          lowStock: lowStockMaterials
        }
      },
      trends: {
        projects: projectTrends,
        tasks: taskTrends
      },
      team: {
        topPerformers: performersWithUsers
      },
      distributions: {
        projectStatus: projectStatusDistribution,
        taskPriority: taskPriorityDistribution
      }
    };

    res.json(dashboardData);

  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard analytics' });
  }
});

// GET /api/analytics/projects/:id/metrics - metryki konkretnego projektu
router.get('/projects/:id/metrics', checkActiveSubscription, async (req, res) => {
  try {
    const userId = req.user.id;
    const projectId = req.params.id;

    // Sprawdź dostęp do projektu
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        company: {
          workers: {
            some: {
              userId: userId,
              status: 'ACTIVE'
            }
          }
        }
      },
      include: {
        company: true,
        tasks: {
          include: {
            assignedTo: {
              select: { id: true, firstName: true, lastName: true }
            }
          }
        },
        materials: true
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found or access denied' });
    }

    // Oblicz metryki projektu
    const totalTasks = project.tasks.length;
    const completedTasks = project.tasks.filter(task => task.status === 'DONE').length;
    const inProgressTasks = project.tasks.filter(task => task.status === 'IN_PROGRESS').length;
    const overdueTasks = project.tasks.filter(task =>
      task.dueDate && task.dueDate < new Date() && task.status !== 'DONE'
    ).length;

    // Oblicz czas pracy
    const totalEstimatedHours = project.tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0);
    const totalActualHours = project.tasks.reduce((sum, task) => sum + (task.actualHours || 0), 0);

    // Analiza postępu w czasie
    const progressOverTime = [];
    const startDate = project.createdAt;
    const endDate = project.endDate || new Date();
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const interval = Math.max(1, Math.floor(daysDiff / 10)); // maksymalnie 10 punktów

    for (let i = 0; i <= daysDiff; i += interval) {
      const checkDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const completedByDate = project.tasks.filter(task =>
        task.status === 'DONE' && task.updatedAt <= checkDate
      ).length;

      progressOverTime.push({
        date: format(checkDate, 'dd.MM'),
        completed: completedByDate,
        total: totalTasks,
        percentage: totalTasks > 0 ? Math.round((completedByDate / totalTasks) * 100) : 0
      });
    }

    // Analiza zespołu
    const teamPerformance = {};
    project.tasks.forEach(task => {
      if (task.assignedTo) {
        const userId = task.assignedTo.id;
        if (!teamPerformance[userId]) {
          teamPerformance[userId] = {
            user: task.assignedTo,
            assigned: 0,
            completed: 0,
            inProgress: 0,
            estimatedHours: 0,
            actualHours: 0
          };
        }
        teamPerformance[userId].assigned++;
        if (task.status === 'DONE') teamPerformance[userId].completed++;
        if (task.status === 'IN_PROGRESS') teamPerformance[userId].inProgress++;
        teamPerformance[userId].estimatedHours += task.estimatedHours || 0;
        teamPerformance[userId].actualHours += task.actualHours || 0;
      }
    });

    // Analiza materiałów
    const materialsCost = project.materials.reduce((sum, material) =>
      sum + (material.quantity * (material.price || 0)), 0
    );

    const metrics = {
      project: {
        id: project.id,
        name: project.name,
        status: project.status,
        priority: project.priority,
        budget: project.budget,
        startDate: project.startDate,
        endDate: project.endDate,
        deadline: project.deadline
      },
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        inProgress: inProgressTasks,
        overdue: overdueTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      },
      time: {
        estimatedHours: totalEstimatedHours,
        actualHours: totalActualHours,
        efficiency: totalEstimatedHours > 0 ? Math.round((totalEstimatedHours / totalActualHours) * 100) : 0
      },
      costs: {
        budget: project.budget || 0,
        materialsCost: materialsCost,
        remaining: (project.budget || 0) - materialsCost
      },
      progress: {
        timeline: progressOverTime
      },
      team: Object.values(teamPerformance),
      materials: {
        total: project.materials.length,
        totalCost: materialsCost
      }
    };

    res.json(metrics);

  } catch (error) {
    console.error('Project metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch project metrics' });
  }
});

// GET /api/analytics/team-performance - wydajność zespołu
router.get('/team-performance', checkActiveSubscription, checkPremiumFeature('hasAdvancedReports'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { companyId, period = 'month' } = req.query;

    if (!companyId) {
      return res.status(400).json({ error: 'Company ID is required' });
    }

    // Sprawdź dostęp do firmy
    const worker = await prisma.worker.findFirst({
      where: {
        userId: userId,
        companyId: companyId,
        status: 'ACTIVE'
      }
    });

    if (!worker) {
      return res.status(403).json({ error: 'Access denied to this company' });
    }

    // Określ zakres dat
    const now = new Date();
    let startDate, endDate;

    switch (period) {
    case 'week':
      startDate = startOfWeek(now);
      endDate = endOfWeek(now);
      break;
    case 'month':
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
      break;
    case 'quarter':
      startDate = startOfMonth(subMonths(now, 2));
      endDate = endOfMonth(now);
      break;
    default:
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
    }

    // Pobierz wszystkich pracowników firmy
    const workers = await prisma.worker.findMany({
      where: {
        companyId: companyId,
        status: 'ACTIVE'
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });

    // Analiza wydajności każdego pracownika
    const teamPerformance = await Promise.all(
      workers.map(async (worker) => {
        const [
          assignedTasks,
          completedTasks,
          overdueTasks,
          totalEstimatedHours,
          totalActualHours
        ] = await Promise.all([
          prisma.task.count({
            where: {
              assignedToId: worker.userId,
              project: { companyId },
              createdAt: { gte: startDate, lte: endDate }
            }
          }),
          prisma.task.count({
            where: {
              assignedToId: worker.userId,
              project: { companyId },
              status: 'DONE',
              updatedAt: { gte: startDate, lte: endDate }
            }
          }),
          prisma.task.count({
            where: {
              assignedToId: worker.userId,
              project: { companyId },
              status: { in: ['TODO', 'IN_PROGRESS'] },
              dueDate: { lt: now }
            }
          }),
          prisma.task.aggregate({
            where: {
              assignedToId: worker.userId,
              project: { companyId },
              createdAt: { gte: startDate, lte: endDate }
            },
            _sum: { estimatedHours: true }
          }),
          prisma.task.aggregate({
            where: {
              assignedToId: worker.userId,
              project: { companyId },
              updatedAt: { gte: startDate, lte: endDate }
            },
            _sum: { actualHours: true }
          })
        ]);

        const completionRate = assignedTasks > 0 ? (completedTasks / assignedTasks * 100) : 0;
        const efficiency = totalEstimatedHours._sum?.estimatedHours && totalActualHours._sum?.actualHours
          ? (totalEstimatedHours._sum.estimatedHours / totalActualHours._sum.actualHours * 100)
          : 0;

        return {
          worker: worker.user,
          metrics: {
            assignedTasks,
            completedTasks,
            overdueTasks,
            completionRate: Math.round(completionRate * 100) / 100,
            estimatedHours: totalEstimatedHours._sum?.estimatedHours || 0,
            actualHours: totalActualHours._sum?.actualHours || 0,
            efficiency: Math.round(efficiency * 100) / 100
          }
        };
      })
    );

    // Sortuj według completion rate
    teamPerformance.sort((a, b) => b.metrics.completionRate - a.metrics.completionRate);

    // Oblicz średnie dla zespołu
    const teamAverages = {
      completionRate: teamPerformance.reduce((sum, member) => sum + member.metrics.completionRate, 0) / teamPerformance.length,
      efficiency: teamPerformance.reduce((sum, member) => sum + member.metrics.efficiency, 0) / teamPerformance.length,
      totalTasks: teamPerformance.reduce((sum, member) => sum + member.metrics.assignedTasks, 0),
      totalCompleted: teamPerformance.reduce((sum, member) => sum + member.metrics.completedTasks, 0),
      totalOverdue: teamPerformance.reduce((sum, member) => sum + member.metrics.overdueTasks, 0)
    };

    res.json({
      period,
      dateRange: {
        start: startDate,
        end: endDate
      },
      teamAverages: {
        completionRate: Math.round(teamAverages.completionRate * 100) / 100,
        efficiency: Math.round(teamAverages.efficiency * 100) / 100,
        totalTasks: teamAverages.totalTasks,
        totalCompleted: teamAverages.totalCompleted,
        totalOverdue: teamAverages.totalOverdue
      },
      members: teamPerformance
    });

  } catch (error) {
    console.error('Team performance error:', error);
    res.status(500).json({ error: 'Failed to fetch team performance' });
  }
});

// GET /api/analytics/cost-analysis - analiza kosztów
router.get('/cost-analysis', checkActiveSubscription, checkPremiumFeature('hasAdvancedReports'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { companyId, period = 'month' } = req.query;

    if (!companyId) {
      return res.status(400).json({ error: 'Company ID is required' });
    }

    // Sprawdź dostęp do firmy
    const worker = await prisma.worker.findFirst({
      where: {
        userId: userId,
        companyId: companyId,
        status: 'ACTIVE'
      }
    });

    if (!worker) {
      return res.status(403).json({ error: 'Access denied to this company' });
    }

    // Pobierz projekty z budżetami
    const projects = await prisma.project.findMany({
      where: { companyId },
      include: {
        materials: true,
        tasks: true
      }
    });

    // Analiza kosztów projektów
    const projectCosts = projects.map(project => {
      const materialsCost = project.materials.reduce((sum, material) =>
        sum + (material.quantity * (material.price || 0)), 0
      );

      const laborCost = project.tasks.reduce((sum, task) =>
        sum + ((task.actualHours || 0) * 50), 0 // założenie: 50 PLN/h
      );

      const totalCost = materialsCost + laborCost;
      const budget = project.budget || 0;
      const variance = budget - totalCost;
      const variancePercentage = budget > 0 ? (variance / budget * 100) : 0;

      return {
        project: {
          id: project.id,
          name: project.name,
          status: project.status
        },
        costs: {
          budget,
          materials: materialsCost,
          labor: laborCost,
          total: totalCost,
          variance,
          variancePercentage: Math.round(variancePercentage * 100) / 100
        }
      };
    });

    // Podsumowanie kosztów
    const totalBudget = projectCosts.reduce((sum, p) => sum + p.costs.budget, 0);
    const totalMaterialsCost = projectCosts.reduce((sum, p) => sum + p.costs.materials, 0);
    const totalLaborCost = projectCosts.reduce((sum, p) => sum + p.costs.labor, 0);
    const totalActualCost = totalMaterialsCost + totalLaborCost;
    const totalVariance = totalBudget - totalActualCost;

    // Analiza kosztów materiałów według kategorii
    const materialsByCategory = await prisma.material.groupBy({
      by: ['category'],
      where: { companyId },
      _sum: {
        quantity: true
      },
      _avg: {
        price: true
      }
    });

    const categoryAnalysis = await Promise.all(
      materialsByCategory.map(async (category) => {
        const materials = await prisma.material.findMany({
          where: { companyId, category: category.category }
        });

        const totalValue = materials.reduce((sum, material) =>
          sum + (material.quantity * (material.price || 0)), 0
        );

        return {
          category: category.category || 'Bez kategorii',
          quantity: category._sum.quantity || 0,
          averagePrice: category._avg.price || 0,
          totalValue,
          itemsCount: materials.length
        };
      })
    );

    res.json({
      period,
      summary: {
        totalBudget,
        totalActualCost,
        totalMaterialsCost,
        totalLaborCost,
        totalVariance,
        variancePercentage: totalBudget > 0 ? Math.round((totalVariance / totalBudget * 100) * 100) / 100 : 0
      },
      projects: projectCosts,
      materialCategories: categoryAnalysis
    });

  } catch (error) {
    console.error('Cost analysis error:', error);
    res.status(500).json({ error: 'Failed to fetch cost analysis' });
  }
});

// POST /api/analytics/save - zapisz dane analityczne
router.post('/save', checkActiveSubscription, async (req, res) => {
  try {
    const userId = req.user.id;
    const { companyId, type, data, period, startDate, endDate } = req.body;

    if (!companyId || !type || !data) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Sprawdź dostęp do firmy
    const worker = await prisma.worker.findFirst({
      where: {
        userId: userId,
        companyId: companyId,
        status: 'ACTIVE'
      }
    });

    if (!worker) {
      return res.status(403).json({ error: 'Access denied to this company' });
    }

    const analytics = await prisma.analytics.create({
      data: {
        userId,
        companyId,
        type,
        data,
        period: period || 'month',
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      }
    });

    res.status(201).json(analytics);

  } catch (error) {
    console.error('Save analytics error:', error);
    res.status(500).json({ error: 'Failed to save analytics data' });
  }
});

module.exports = router;
