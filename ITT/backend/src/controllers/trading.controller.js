const { 
  User, 
  Coin, 
  TradingWallet, 
  UserPortfolio, 
  BuyTransaction, 
  SellTransaction, 
  TradingTransfer, 
  TradingSetting, 
  sequelize 
} = require('../models');
const { generateReference } = require('../utils/helpers');

// Helper to check if trading is enabled globally
const isTradingEnabled = async () => {
  const setting = await TradingSetting.findOne({ where: { key: 'trading_enabled' } });
  return setting?.value === 'true';
};

// GET /api/trading/status
exports.getTradingStatus = async (req, res, next) => {
  try {
    const enabled = await isTradingEnabled();
    const [wallet] = await TradingWallet.findOrCreate({ 
      where: { userId: req.user.id },
      defaults: { balance: 0.00, totalInvested: 0.00 }
    });

    res.json({
      enabled,
      wallet: {
        balance: parseFloat(wallet.balance),
        totalInvested: parseFloat(wallet.totalInvested)
      }
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/trading/coins
exports.getCoins = async (req, res, next) => {
  try {
    const coins = await Coin.findAll({ where: { isActive: true } });
    res.json({ coins });
  } catch (err) {
    next(err);
  }
};

// GET /api/trading/wallet
exports.getWallet = async (req, res, next) => {
  try {
    const [wallet] = await TradingWallet.findOrCreate({ 
      where: { userId: req.user.id },
      defaults: { balance: 0.00, totalInvested: 0.00 }
    });
    res.json({ wallet });
  } catch (err) {
    next(err);
  }
};

// POST /api/trading/transfer/deposit
exports.transferDeposit = async (req, res, next) => {
  try {
    const enabled = await isTradingEnabled();
    if (!enabled) {
      return res.status(403).json({ error: 'Trading is currently unavailable. Please check back later.' });
    }

    const { amount } = req.body;
    const transferAmount = parseFloat(amount);

    if (!transferAmount || transferAmount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than zero' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const mainBalance = parseFloat(user.balance);
    if (mainBalance < transferAmount) {
      return res.status(400).json({ error: 'Insufficient main balance' });
    }

    const [wallet] = await TradingWallet.findOrCreate({ 
      where: { userId: user.id },
      defaults: { balance: 0.00, totalInvested: 0.00 }
    });

    await sequelize.transaction(async (t) => {
      await user.update({ balance: mainBalance - transferAmount }, { transaction: t });
      await wallet.update({ balance: parseFloat(wallet.balance) + transferAmount }, { transaction: t });
      await TradingTransfer.create({
        userId: user.id,
        amount: transferAmount,
        type: 'deposit',
        reference: generateReference('TDEP')
      }, { transaction: t });
    });

    res.json({
      msg: 'Funds deposited to trading wallet successfully',
      mainBalance: mainBalance - transferAmount,
      tradingBalance: parseFloat(wallet.balance) + transferAmount
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/trading/transfer/withdraw
exports.transferWithdraw = async (req, res, next) => {
  try {
    const enabled = await isTradingEnabled();
    if (!enabled) {
      return res.status(403).json({ error: 'Trading is currently unavailable. Please check back later.' });
    }

    const { amount } = req.body;
    const transferAmount = parseFloat(amount);

    if (!transferAmount || transferAmount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than zero' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const wallet = await TradingWallet.findOne({ where: { userId: user.id } });
    if (!wallet || parseFloat(wallet.balance) < transferAmount) {
      return res.status(400).json({ error: 'Insufficient trading wallet balance' });
    }

    await sequelize.transaction(async (t) => {
      await wallet.update({ balance: parseFloat(wallet.balance) - transferAmount }, { transaction: t });
      await user.update({ balance: parseFloat(user.balance) + transferAmount }, { transaction: t });
      await TradingTransfer.create({
        userId: user.id,
        amount: transferAmount,
        type: 'withdrawal',
        reference: generateReference('TWDR')
      }, { transaction: t });
    });

    res.json({
      msg: 'Funds withdrawn to main balance successfully',
      mainBalance: parseFloat(user.balance) + transferAmount,
      tradingBalance: parseFloat(wallet.balance) - transferAmount
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/trading/buy
exports.buyCoin = async (req, res, next) => {
  try {
    const enabled = await isTradingEnabled();
    if (!enabled) {
      return res.status(403).json({ error: 'Trading is currently unavailable. Please check back later.' });
    }

    const { coinId, amount } = req.body;
    const buyAmount = parseFloat(amount);

    if (!buyAmount || buyAmount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than zero' });
    }

    const coin = await Coin.findByPk(coinId);
    if (!coin || !coin.isActive) {
      return res.status(404).json({ error: 'Coin not found or inactive' });
    }
    if (coin.marketStatus !== 'open') {
      return res.status(400).json({ error: 'Market is closed for this coin' });
    }

    const wallet = await TradingWallet.findOne({ where: { userId: req.user.id } });
    if (!wallet || parseFloat(wallet.balance) < buyAmount) {
      return res.status(400).json({ error: 'Insufficient trading wallet balance' });
    }

    const coinPrice = parseFloat(coin.currentPrice);
    const quantity = buyAmount / coinPrice;

    await sequelize.transaction(async (t) => {
      // Deduct balance, add to total invested
      await wallet.update({ 
        balance: parseFloat(wallet.balance) - buyAmount,
        totalInvested: parseFloat(wallet.totalInvested) + buyAmount
      }, { transaction: t });

      // Update UserPortfolio
      const [portfolio, created] = await UserPortfolio.findOrCreate({
        where: { userId: req.user.id, coinId },
        defaults: { quantity: 0, averageBuyPrice: 0 },
        transaction: t
      });

      const currentQty = parseFloat(portfolio.quantity);
      const currentAvg = parseFloat(portfolio.averageBuyPrice);

      const newQty = currentQty + quantity;
      const newAvg = ((currentQty * currentAvg) + buyAmount) / newQty;

      await portfolio.update({
        quantity: newQty,
        averageBuyPrice: newAvg
      }, { transaction: t });

      // Create Buy transaction
      await BuyTransaction.create({
        userId: req.user.id,
        coinId,
        quantity,
        price: coinPrice,
        amount: buyAmount,
        reference: generateReference('TBUY')
      }, { transaction: t });
    });

    res.json({
      msg: `Successfully bought ${quantity.toFixed(6)} ${coin.symbol}`,
      quantity,
      price: coinPrice
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/trading/sell
exports.sellCoin = async (req, res, next) => {
  try {
    const enabled = await isTradingEnabled();
    if (!enabled) {
      return res.status(403).json({ error: 'Trading is currently unavailable. Please check back later.' });
    }

    const { coinId, quantity } = req.body;
    const sellQty = parseFloat(quantity);

    if (!sellQty || sellQty <= 0) {
      return res.status(400).json({ error: 'Quantity must be greater than zero' });
    }

    const coin = await Coin.findByPk(coinId);
    if (!coin || !coin.isActive) {
      return res.status(404).json({ error: 'Coin not found or inactive' });
    }
    if (coin.marketStatus !== 'open') {
      return res.status(400).json({ error: 'Market is closed for this coin' });
    }

    const portfolio = await UserPortfolio.findOne({
      where: { userId: req.user.id, coinId }
    });

    if (!portfolio || parseFloat(portfolio.quantity) < sellQty) {
      return res.status(400).json({ error: 'Insufficient coin holdings' });
    }

    const wallet = await TradingWallet.findOne({ where: { userId: req.user.id } });
    if (!wallet) return res.status(404).json({ error: 'Trading wallet not found' });

    const coinPrice = parseFloat(coin.currentPrice);
    const avgPrice = parseFloat(portfolio.averageBuyPrice);
    
    const proceeds = sellQty * coinPrice;
    const costBasis = sellQty * avgPrice;
    const profitLoss = proceeds - costBasis;

    await sequelize.transaction(async (t) => {
      // Add proceeds to trading wallet balance, deduct cost basis from total invested
      const newInvested = Math.max(0, parseFloat(wallet.totalInvested) - costBasis);
      await wallet.update({
        balance: parseFloat(wallet.balance) + proceeds,
        totalInvested: newInvested
      }, { transaction: t });

      // Update Portfolio
      const currentQty = parseFloat(portfolio.quantity);
      const remainingQty = currentQty - sellQty;

      if (remainingQty <= 0.00000001) {
        await portfolio.destroy({ transaction: t });
      } else {
        await portfolio.update({
          quantity: remainingQty
        }, { transaction: t });
      }

      // Create Sell Transaction
      await SellTransaction.create({
        userId: req.user.id,
        coinId,
        quantity: sellQty,
        price: coinPrice,
        amount: proceeds,
        profitLoss,
        reference: generateReference('TSEL')
      }, { transaction: t });
    });

    res.json({
      msg: `Successfully sold ${sellQty.toFixed(6)} ${coin.symbol}`,
      proceeds,
      profitLoss
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/trading/portfolio
exports.getPortfolio = async (req, res, next) => {
  try {
    const portfolios = await UserPortfolio.findAll({
      where: { userId: req.user.id },
      include: [{ model: Coin, as: 'coin' }]
    });

    let totalPortfolioValue = 0;
    let totalInvested = 0;

    const holdings = portfolios.map((p) => {
      const coin = p.coin;
      const qty = parseFloat(p.quantity);
      const avgPrice = parseFloat(p.averageBuyPrice);
      const currentPrice = coin ? parseFloat(coin.currentPrice) : 0;
      
      const value = qty * currentPrice;
      const cost = qty * avgPrice;
      const profitLoss = value - cost;
      const roi = avgPrice > 0 ? (profitLoss / cost) * 100 : 0;

      totalPortfolioValue += value;
      totalInvested += cost;

      return {
        id: p.id,
        coinId: p.coinId,
        name: coin ? coin.name : 'Unknown',
        symbol: coin ? coin.symbol : '?',
        icon: coin ? coin.icon : null,
        quantity: qty,
        averageBuyPrice: avgPrice,
        currentPrice,
        currentValue: value,
        profitLoss,
        roi
      };
    });

    const totalProfitLoss = totalPortfolioValue - totalInvested;
    const totalROI = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

    res.json({
      holdings,
      summary: {
        totalPortfolioValue,
        totalInvested,
        totalProfitLoss,
        totalROI
      }
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/trading/transactions
exports.getTransactions = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [buys, sells, transfers] = await Promise.all([
      BuyTransaction.findAll({
        where: { userId },
        include: [{ model: Coin, attributes: ['name', 'symbol', 'icon'] }],
        order: [['createdAt', 'DESC']]
      }),
      SellTransaction.findAll({
        where: { userId },
        include: [{ model: Coin, attributes: ['name', 'symbol', 'icon'] }],
        order: [['createdAt', 'DESC']]
      }),
      TradingTransfer.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']]
      })
    ]);

    // Map into unified transaction objects
    const buyMapped = buys.map((b) => ({
      id: `BUY-${b.id}`,
      type: 'buy',
      coin: b.Coin ? `${b.Coin.name} (${b.Coin.symbol})` : 'Crypto',
      amount: parseFloat(b.amount),
      quantity: parseFloat(b.quantity),
      price: parseFloat(b.price),
      status: 'completed',
      reference: b.reference,
      createdAt: b.createdAt
    }));

    const sellMapped = sells.map((s) => ({
      id: `SELL-${s.id}`,
      type: 'sell',
      coin: s.Coin ? `${s.Coin.name} (${s.Coin.symbol})` : 'Crypto',
      amount: parseFloat(s.amount),
      quantity: parseFloat(s.quantity),
      price: parseFloat(s.price),
      profitLoss: parseFloat(s.profitLoss),
      status: 'completed',
      reference: s.reference,
      createdAt: s.createdAt
    }));

    const transferMapped = transfers.map((t) => ({
      id: `XFER-${t.id}`,
      type: t.type === 'deposit' ? 'deposit' : 'withdrawal',
      coin: 'USDT',
      amount: parseFloat(t.amount),
      quantity: parseFloat(t.amount),
      price: 1.00,
      status: 'completed',
      reference: t.reference,
      createdAt: t.createdAt
    }));

    const combined = [...buyMapped, ...sellMapped, ...transferMapped].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.json({ transactions: combined });
  } catch (err) {
    next(err);
  }
};

// ── ADMIN CONTROLLER ACTIONS ──────────────────────────────────────────────────

// GET /api/admin/trading/coins
exports.adminGetCoins = async (req, res, next) => {
  try {
    const coins = await Coin.findAll({ order: [['id', 'ASC']] });
    res.json({ coins });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/trading/coins
exports.adminAddCoin = async (req, res, next) => {
  try {
    const { name, symbol, currentPrice, volatility, isActive, icon } = req.body;

    if (!name || !symbol || !currentPrice) {
      return res.status(400).json({ error: 'Name, symbol, and current price are required' });
    }

    const price = parseFloat(currentPrice);
    if (isNaN(price) || price <= 0) {
      return res.status(400).json({ error: 'Price must be a valid positive number' });
    }

    const coin = await Coin.create({
      name,
      symbol: symbol.toUpperCase(),
      currentPrice: price,
      volatility: volatility || 'medium',
      isActive: isActive !== false,
      icon: icon || null
    });

    res.status(201).json({ msg: 'Coin added successfully', coin });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Coin with this symbol already exists' });
    }
    next(err);
  }
};

// PUT /api/admin/trading/coins/:id
exports.adminEditCoin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, symbol, currentPrice, volatility, isActive, icon } = req.body;

    const coin = await Coin.findByPk(id);
    if (!coin) return res.status(404).json({ error: 'Coin not found' });

    const updates = {};
    if (name) updates.name = name;
    if (symbol) updates.symbol = symbol.toUpperCase();
    if (volatility) updates.volatility = volatility;
    if (isActive !== undefined) updates.isActive = isActive;
    if (icon !== undefined) updates.icon = icon;

    if (currentPrice !== undefined) {
      const price = parseFloat(currentPrice);
      if (isNaN(price) || price <= 0) {
        return res.status(400).json({ error: 'Price must be a valid positive number' });
      }
      updates.currentPrice = price;
    }

    await coin.update(updates);
    res.json({ msg: 'Coin updated successfully', coin });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Coin with this symbol already exists' });
    }
    next(err);
  }
};

// DELETE /api/admin/trading/coins/:id
exports.adminDeleteCoin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const coin = await Coin.findByPk(id);
    if (!coin) return res.status(404).json({ error: 'Coin not found' });

    await coin.destroy();
    res.json({ msg: 'Coin deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/trading/settings
exports.adminUpdateSettings = async (req, res, next) => {
  try {
    const { trading_enabled } = req.body;

    if (trading_enabled === undefined) {
      return res.status(400).json({ error: 'trading_enabled field is required' });
    }

    const [setting] = await TradingSetting.findOrCreate({
      where: { key: 'trading_enabled' },
      defaults: { value: 'true' }
    });

    await setting.update({ value: trading_enabled ? 'true' : 'false' });
    res.json({ msg: 'Trading settings updated successfully', enabled: trading_enabled });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/trading/coins/:id/control
exports.adminControlCoin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      priceUpdateType, // 'adjust' or 'manual'
      priceChangePercent, 
      isUp, 
      marketStatus, 
      volatility, 
      manualPrice 
    } = req.body;

    const coin = await Coin.findByPk(id);
    if (!coin) return res.status(404).json({ error: 'Coin not found' });

    const updates = {};
    if (marketStatus) updates.marketStatus = marketStatus;
    if (volatility) updates.volatility = volatility;

    let finalPrice = parseFloat(coin.currentPrice);

    if (priceUpdateType === 'manual') {
      const manual = parseFloat(manualPrice);
      if (isNaN(manual) || manual <= 0) {
        return res.status(400).json({ error: 'Manual price must be a valid positive number' });
      }
      finalPrice = manual;
      
      // Calculate implied percentage change
      const oldPrice = parseFloat(coin.currentPrice);
      const diff = finalPrice - oldPrice;
      updates.priceChangePercent = parseFloat(((diff / oldPrice) * 100).toFixed(2));
      updates.isUp = diff >= 0;
    } else if (priceUpdateType === 'adjust') {
      const pct = parseFloat(priceChangePercent);
      if (isNaN(pct) || pct < 0) {
        return res.status(400).json({ error: 'Price change percentage must be a valid positive number' });
      }
      
      const multiplier = pct / 100;
      if (isUp === true || isUp === 'true') {
        finalPrice = finalPrice * (1 + multiplier);
        updates.isUp = true;
      } else {
        finalPrice = finalPrice * (1 - multiplier);
        updates.isUp = false;
      }
      updates.priceChangePercent = pct;
    }

    updates.currentPrice = parseFloat(finalPrice.toFixed(8));
    await coin.update(updates);

    res.json({ msg: 'Coin market control applied successfully', coin });
  } catch (err) {
    next(err);
  }
};
