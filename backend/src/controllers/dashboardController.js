const Client = require("../models/Client");
const Income = require("../models/Income");
const Expense = require("../models/Expense");
const Credential = require("../models/Credential");

const getDashboardData = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get ALL data first
    const [allIncomes, allExpenses, allClients] = await Promise.all([
      Income.find({ user: userId }),
      Expense.find({ user: userId }),
      Client.find({ user: userId })
    ]);

    // Calculate totals SIMPLY
    const totalIncome = allIncomes.reduce((sum, item) => sum + (item.amount || 0), 0);
    const totalExpenses = allExpenses.reduce((sum, item) => sum + (item.amount || 0), 0);
    const netProfit = totalIncome - totalExpenses;

    // Recent transactions
    const recentIncomes = allIncomes
      .sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at))
      .slice(0, 5)
      .map(item => ({
        description: item.title || "Income",
        amount: item.amount || 0,
        date: item.date,
        category: item.category || "Uncategorized"
      }));

    const recentExpenses = allExpenses
      .sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at))
      .slice(0, 5)
      .map(item => ({
        description: item.title || "Expense",
        amount: item.amount || 0,
        date: item.date,
        category: item.category || "Uncategorized"
      }));

    // Group by category
    const groupByCategory = (items) => {
      return items.reduce((acc, item) => {
        const cat = item.category || "Uncategorized";
        acc[cat] = (acc[cat] || 0) + (item.amount || 0);
        return acc;
      }, {});
    };

    const expenseByCategory = Object.entries(groupByCategory(allExpenses))
      .map(([_id, total]) => ({ _id, total }));
    
    const incomeByCategory = Object.entries(groupByCategory(allIncomes))
      .map(([_id, total]) => ({ _id, total }));

    // Simple monthly data (last 3 months)
    const getMonthData = (items, monthOffset) => {
      const date = new Date();
      date.setMonth(date.getMonth() - monthOffset);
      const year = date.getFullYear();
      const month = date.getMonth();
      
      return items
        .filter(item => {
          const itemDate = new Date(item.date || item.created_at);
          return itemDate.getFullYear() === year && itemDate.getMonth() === month;
        })
        .reduce((sum, item) => sum + (item.amount || 0), 0);
    };

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const monthlyTrends = [
      {
        name: `${monthNames[(currentMonth + 11) % 12]} ${currentMonth === 0 ? currentYear - 1 : currentYear}`,
        income: getMonthData(allIncomes, 2),
        expense: getMonthData(allExpenses, 2),
        profit: getMonthData(allIncomes, 2) - getMonthData(allExpenses, 2)
      },
      {
        name: `${monthNames[(currentMonth + 10) % 12]} ${currentMonth <= 1 ? currentYear - 1 : currentYear}`,
        income: getMonthData(allIncomes, 1),
        expense: getMonthData(allExpenses, 1),
        profit: getMonthData(allIncomes, 1) - getMonthData(allExpenses, 1)
      },
      {
        name: `${monthNames[currentMonth]} ${currentYear}`,
        income: getMonthData(allIncomes, 0),
        expense: getMonthData(allExpenses, 0),
        profit: getMonthData(allIncomes, 0) - getMonthData(allExpenses, 0)
      }
    ];

    // Upcoming renewals
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const upcomingRenewals = await Credential.find({
      user: userId,
      expiryDate: { $gte: today, $lte: thirtyDaysFromNow }
    })
    .sort({ expiryDate: 1 })
    .limit(5)
    .lean();

    // Send response
    res.json({
      summary: {
        totalClients: allClients.length,
        totalIncome,
        totalExpenses,
        netProfit,
        currentMonthIncome: getMonthData(allIncomes, 0),
        currentMonthExpense: getMonthData(allExpenses, 0),
        pendingIncome: 0,
        upcomingExpenses: 0
      },
      charts: {
        monthlyTrends,
        expenseByCategory,
        incomeByCategory
      },
      recent: {
        incomes: recentIncomes,
        expenses: recentExpenses
      },
      upcoming: {
        renewals: upcomingRenewals
      },
      stats: {
        totalIncomeRecords: allIncomes.length,
        totalExpenseRecords: allExpenses.length,
        renewalCount: upcomingRenewals.length,
        totalTransactions: allIncomes.length + allExpenses.length
      }
    });

  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ 
      success: false,
      message: "Dashboard error",
      error: error.message 
    });
  }
};

module.exports = { getDashboardData };