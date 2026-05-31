'use strict';

const DEPT_ICON = {
  'マーケット分析部':     '📊',
  'ポートフォリオ管理部': '💼',
  'リスク管理部':         '⚠️',
  '反対意見部':           '🔴',
  '監査部':               '🔍',
};

/**
 * 観測チャンネルへのライブフィード関数を生成する
 * @param {TextChannel|null} channel
 * @returns {Function|null}
 */
function make(channel) {
  if (!channel) return null;

  const sec = ms => (ms / 1000).toFixed(1) + 's';

  return async (type, data = {}) => {
    let text;

    switch (type) {
      case 'start':
        text = `⏳ \`${data.taskId}\` 処理開始\n> ${data.instruction.slice(0, 120)}`;
        break;

      case 'data':
        text = `📡 データ取得完了 (${sec(data.elapsedMs)})`;
        break;

      case 'briefing':
        text = `📋 タスク分解完了 (${sec(data.elapsedMs)})\n> ${data.briefing.slice(0, 200)}`;
        break;

      case 'agent': {
        const icon    = DEPT_ICON[data.dept] || '🏢';
        const verdict = data.verdict ? ` → 判定: **${data.verdict}**` : '';
        text = `${icon} **${data.dept}** (${sec(data.elapsedMs)})${verdict}\n${data.content.slice(0, 800)}`;
        break;
      }

      case 'done':
        text = `✅ \`${data.taskId}\` 全エージェント完了\n${'─'.repeat(20)}`;
        break;
    }

    if (text) await channel.send(text.slice(0, 1900)).catch(() => {});
  };
}

module.exports = { make };
