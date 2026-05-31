'use strict';

const { ask }                  = require('../lib/ollama');
const { writeLog, writeError } = require('../core/logger');

const SYSTEM = `
あなたはAI投資法人「AI Capital」のトレーダーです。
監査部が承認した分析レポートを受け取り、仮想売買提案を1件生成してください。

【制約】
- これは実注文ではなく仮想トレードの記録用です
- action は "buy" / "sell" / "hold" のいずれか
- fund は分析で言及された銘柄名（不明な場合は "未指定"）
- amount_yen は 0〜500000 の整数（hold の場合は 0）
- reason は1文（50字以内）

【出力形式】
以下のJSONのみ出力してください。説明不要。

{
  "action": "buy",
  "fund": "銘柄名",
  "amount_yen": 100000,
  "reason": "理由"
}
`.trim();

/**
 * audit 承認済みタスクから仮想売買提案を生成する
 * @param {object} task  taskStore.get() の結果
 * @returns {Promise<{action, fund, amount_yen, reason}|null>}
 */
async function recommend(task) {
  writeLog('trader', `仮想売買提案生成 [${task.id}]`);

  const sections = [];
  if (task.market?.content)  sections.push(`【市場】\n${task.market.content}`);
  if (task.risk?.content)    sections.push(`【リスク】\n${task.risk.content}`);
  if (task.audit?.content)   sections.push(`【監査】判定: ${task.audit.verdict}\n${task.audit.content}`);

  try {
    const raw = await ask(SYSTEM, sections.join('\n\n'), { temperature: 0.3, num_predict: 200 });

    // JSON 部分を抽出
    const match = raw.match(/\{[\s\S]*?\}/);
    if (!match) throw new Error('JSON が見つかりません');

    const result = JSON.parse(match[0]);

    // バリデーション
    if (!['buy', 'sell', 'hold'].includes(result.action)) result.action = 'hold';
    result.amount_yen = Math.max(0, Math.min(500000, parseInt(result.amount_yen) || 0));
    result.fund   = String(result.fund   || '未指定').slice(0, 50);
    result.reason = String(result.reason || '').slice(0, 80);

    writeLog('trader', `提案: ${result.action} / ${result.fund} / ¥${result.amount_yen}`);
    return result;

  } catch (err) {
    writeError('trader', err);
    return null;
  }
}

module.exports = { recommend };
