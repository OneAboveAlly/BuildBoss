const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();
const prisma = new PrismaClient();

// Helper function to get user data summary
const getUserDataSummary = async (userId) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        companies: {
          include: {
            company: true
          }
        },
        createdCompanies: true,
        assignedTasks: true,
        createdTasks: true,
        projects: true,
        createdProjects: true,
        materials: true,
        createdMaterials: true,
        sentMessages: true,
        receivedMessages: true,
        jobOffers: true,
        jobApplications: true,
        workRequests: true,
        subscriptions: true,
        payments: true,
        notifications: true
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return {
      personalData: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
        isEmailConfirmed: user.isEmailConfirmed,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLoginAt: user.lastLoginAt
      },
      companies: {
        owned: user.createdCompanies.length,
        memberOf: user.companies.length,
        details: user.companies.map(w => ({
          companyId: w.company.id,
          companyName: w.company.name,
          role: w.role,
          status: w.status,
          joinedAt: w.createdAt
        }))
      },
      projects: {
        created: user.createdProjects.length,
        assigned: user.projects.length
      },
      tasks: {
        created: user.createdTasks.length,
        assigned: user.assignedTasks.length
      },
      materials: {
        created: user.createdMaterials.length,
        total: user.materials.length
      },
      communication: {
        messagesSent: user.sentMessages.length,
        messagesReceived: user.receivedMessages.length
      },
      jobMarket: {
        jobOffersCreated: user.jobOffers.length,
        jobApplications: user.jobApplications.length,
        workRequestsCreated: user.workRequests.length
      },
      financial: {
        subscriptions: user.subscriptions.length,
        payments: user.payments.length
      },
      notifications: user.notifications.length
    };
  } catch (error) {
    console.error('Error getting user data summary:', error);
    throw error;
  }
};

// GET /api/gdpr/data-summary - Get summary of user's data
router.get('/data-summary', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const summary = await getUserDataSummary(userId);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error getting data summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving data summary',
      error: error.message
    });
  }
});

// POST /api/gdpr/export-data - Export all user data
router.post('/export-data', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { format = 'json' } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        companies: {
          include: {
            company: true
          }
        },
        createdCompanies: true,
        assignedTasks: true,
        createdTasks: true,
        projects: true,
        createdProjects: true,
        materials: true,
        createdMaterials: true,
        sentMessages: true,
        receivedMessages: true,
        jobOffers: true,
        jobApplications: true,
        workRequests: true,
        subscriptions: true,
        payments: true,
        notifications: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Remove sensitive data
    delete user.password;
    delete user.confirmationToken;
    delete user.googleId;

    const exportData = {
      exportDate: new Date().toISOString(),
      userId: user.id,
      userData: user,
      dataProcessingInfo: {
        legalBasis: 'Art. 6 ust. 1 lit. b RODO - wykonanie umowy',
        dataController: {
          name: '[NAZWA FIRMY]',
          address: '[ADRES FIRMY]',
          email: 'privacy@siteboss.pl'
        },
        retentionPeriod: 'Zgodnie z Polityką Prywatności',
        rights: [
          'Prawo dostępu do danych',
          'Prawo do sprostowania danych',
          'Prawo do usunięcia danych',
          'Prawo do ograniczenia przetwarzania',
          'Prawo do przenoszenia danych',
          'Prawo sprzeciwu'
        ]
      }
    };

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="siteboss-data-export-${userId}-${Date.now()}.json"`);
      res.json(exportData);
    } else {
      res.status(400).json({
        success: false,
        message: 'Unsupported export format. Currently supported: json'
      });
    }
  } catch (error) {
    console.error('Error exporting user data:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting user data',
      error: error.message
    });
  }
});

// POST /api/gdpr/delete-account - Delete user account and all data
router.post('/delete-account', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { confirmation } = req.body;

    // Require explicit confirmation
    if (confirmation !== 'DELETE_MY_ACCOUNT') {
      return res.status(400).json({
        success: false,
        message: 'Account deletion requires explicit confirmation. Please provide confirmation: "DELETE_MY_ACCOUNT"'
      });
    }

    // Start transaction to delete all user data
    const result = await prisma.$transaction(async (tx) => {
      // 1. Delete notifications
      await tx.notification.deleteMany({
        where: { userId }
      });

      // 2. Delete job applications
      await tx.jobApplication.deleteMany({
        where: { userId }
      });

      // 3. Delete job offers
      await tx.jobOffer.deleteMany({
        where: { userId }
      });

      // 4. Delete work requests
      await tx.workRequest.deleteMany({
        where: { userId }
      });

      // 5. Delete messages (sent and received)
      await tx.message.deleteMany({
        where: {
          OR: [
            { senderId: userId },
            { receiverId: userId }
          ]
        }
      });

      // 6. Delete payments
      await tx.payment.deleteMany({
        where: { userId }
      });

      // 7. Delete subscriptions
      await tx.subscription.deleteMany({
        where: { userId }
      });

      // 8. Update tasks (remove assignments)
      await tx.task.updateMany({
        where: { assignedToId: userId },
        data: { assignedToId: null }
      });

      // Delete tasks created by user (if no other dependencies)
      await tx.task.deleteMany({
        where: {
          createdById: userId,
          assignedToId: null
        }
      });

      // 9. Delete materials created by user
      await tx.material.deleteMany({
        where: { createdById: userId }
      });

      // 10. Remove user from companies
      await tx.worker.deleteMany({
        where: { userId }
      });

      // 11. Handle companies created by user
      const userCompanies = await tx.company.findMany({
        where: { createdById: userId },
        include: {
          workers: true
        }
      });

      for (const company of userCompanies) {
        if (company.workers.length <= 1) {
          // Delete company if user is the only member
          await tx.company.delete({
            where: { id: company.id }
          });
        } else {
          // Transfer ownership to another admin
          const otherAdmin = company.workers.find(w => w.userId !== userId && w.role === 'ADMIN');
          if (otherAdmin) {
            await tx.company.update({
              where: { id: company.id },
              data: { createdById: otherAdmin.userId }
            });
          }
        }
      }

      // 12. Finally, delete the user
      await tx.user.delete({
        where: { id: userId }
      });

      return { success: true, deletedUserId: userId };
    });

    res.json({
      success: true,
      message: 'Account and all associated data have been permanently deleted',
      data: result
    });
  } catch (error) {
    console.error('Error deleting user account:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user account',
      error: error.message
    });
  }
});

// GET /api/gdpr/rights - Get information about user rights under GDPR
router.get('/rights', (req, res) => {
  res.json({
    success: true,
    data: {
      rights: [
        {
          name: 'Prawo dostępu',
          article: 'Art. 15 RODO',
          description: 'Prawo do uzyskania informacji o przetwarzaniu danych i kopii danych',
          howToExercise: 'Panel użytkownika → Ustawienia → Moje dane lub e-mail: privacy@siteboss.pl'
        },
        {
          name: 'Prawo do sprostowania',
          article: 'Art. 16 RODO',
          description: 'Prawo do sprostowania nieprawidłowych lub uzupełnienia niekompletnych danych',
          howToExercise: 'Panel użytkownika → Edycja profilu lub e-mail: privacy@siteboss.pl'
        },
        {
          name: 'Prawo do usunięcia',
          article: 'Art. 17 RODO',
          description: 'Prawo do usunięcia danych osobowych ("prawo do bycia zapomnianym")',
          howToExercise: 'Panel użytkownika → Ustawienia → Usuń konto lub e-mail: privacy@siteboss.pl'
        },
        {
          name: 'Prawo do ograniczenia przetwarzania',
          article: 'Art. 18 RODO',
          description: 'Prawo do ograniczenia przetwarzania danych do przechowywania',
          howToExercise: 'E-mail: privacy@siteboss.pl'
        },
        {
          name: 'Prawo do przenoszenia danych',
          article: 'Art. 20 RODO',
          description: 'Prawo do otrzymania danych w formacie ustrukturyzowanym',
          howToExercise: 'Panel użytkownika → Eksport danych lub e-mail: privacy@siteboss.pl'
        },
        {
          name: 'Prawo sprzeciwu',
          article: 'Art. 21 RODO',
          description: 'Prawo do sprzeciwu wobec przetwarzania na podstawie prawnie uzasadnionego interesu',
          howToExercise: 'E-mail: privacy@siteboss.pl'
        }
      ],
      contact: {
        dataController: {
          name: '[NAZWA FIRMY]',
          address: '[ADRES FIRMY]',
          email: 'privacy@siteboss.pl',
          phone: '[NUMER TELEFONU]'
        },
        dpo: {
          email: 'dpo@siteboss.pl'
        },
        supervisoryAuthority: {
          name: 'Urząd Ochrony Danych Osobowych',
          address: 'ul. Stawki 2, 00-193 Warszawa',
          phone: '22 531 03 00',
          email: 'kancelaria@uodo.gov.pl',
          website: 'https://uodo.gov.pl'
        }
      }
    }
  });
});

// GET /api/gdpr/processing-info - Get information about data processing
router.get('/processing-info', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const summary = await getUserDataSummary(userId);

    res.json({
      success: true,
      data: {
        userId,
        processingInfo: {
          legalBases: [
            {
              basis: 'Art. 6 ust. 1 lit. b RODO',
              description: 'Wykonanie umowy o świadczenie usług',
              dataTypes: ['Dane konta', 'Dane projektowe', 'Dane komunikacji'],
              purpose: 'Świadczenie usług platformy SiteBoss'
            },
            {
              basis: 'Art. 6 ust. 1 lit. c RODO',
              description: 'Wypełnienie obowiązku prawnego',
              dataTypes: ['Dane do faktur', 'Historia płatności'],
              purpose: 'Księgowość i rozliczenia podatkowe'
            },
            {
              basis: 'Art. 6 ust. 1 lit. f RODO',
              description: 'Prawnie uzasadniony interes',
              dataTypes: ['Logi systemowe', 'Dane analityczne'],
              purpose: 'Bezpieczeństwo i rozwój platformy'
            },
            {
              basis: 'Art. 6 ust. 1 lit. a RODO',
              description: 'Zgoda',
              dataTypes: ['Dane marketingowe', 'Cookies'],
              purpose: 'Marketing i personalizacja'
            }
          ],
          dataCategories: summary,
          retentionPeriods: {
            activeAccount: 'Przez cały okres korzystania z usługi',
            inactiveAccount: '3 lata od ostatniego logowania',
            deletedAccount: '30 dni (możliwość przywrócenia)',
            financialDocuments: '5 lat od końca roku podatkowego',
            systemLogs: '12 miesięcy',
            analyticsData: '24 miesiące (zanonimizowane)',
            marketingData: 'Do cofnięcia zgody'
          },
          recipients: [
            'Stripe Inc. (przetwarzanie płatności)',
            'Google Cloud Platform (hosting)',
            'SendGrid Inc. (wysyłka e-maili)',
            'Sentry.io (monitoring błędów)',
            'Członkowie zespołów projektowych',
            'Organy publiczne (na podstawie przepisów prawa)'
          ],
          internationalTransfers: {
            countries: ['USA'],
            safeguards: ['Standard Contractual Clauses', 'Szyfrowanie danych', 'Kontrola dostępu']
          }
        }
      }
    });
  } catch (error) {
    console.error('Error getting processing info:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving processing information',
      error: error.message
    });
  }
});

module.exports = router;
