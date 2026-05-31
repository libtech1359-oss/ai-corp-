'use strict';

const fs   = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'data', 'shadow_book.json');

function load() {
  try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); }
  catch { return { trades: [] }; }
}

function save(book) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(book, null, 2), 'utf8');
}

/**
 * 仮想取引を記録する
 */
function record({ taskId, action, fund, amount_yen, reason, verdict }) {
  const book  = load();
  const date  = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
  const entry = {
    id:         `shadow-${date}-${String(book.trades.length + 1).padStart(3, '0')}`,
    taskId,
    date,
    action,
    fund,
    amount_yen,
    reason,
    verdict,
    recordedAt: new Date().toISOString(),
  };
  book.trades.push(entry);
  save(book);
  return entry;
}

/**
 * 直近 n 件を返す
 */
function list(n = 10) {
  return load().trades.slice(-n).reverse();
}

/**
 * 集計サマリーを返す
 */
function summary() {
  const { trades } = load();
  if (!trades.length) return null;

  const count = { buy: 0, sell: 0, hold: 0 };
  let totalBuy = 0;

  for (const t of trades) {
    count[t.action] = (count[t.action] || 0) + 1;
    if (t.action === 'buy') totalBuy += t.amount_yen;
  }

  return {
    total:    trades.length,
    buy:      count.buy  || 0,
    sell:     count.sell || 0,
    hold:     count.hold || 0,
    totalBuy,
    since:    trades[0]?.date,
  };
}

module.exports = { record, list, summary };
