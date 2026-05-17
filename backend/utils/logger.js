const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const levels = { error: 0, warn: 1, info: 2, debug: 3 };
const currentLevel = levels[LOG_LEVEL] ?? 2;

function format(level, msg, meta) {
  const ts = new Date().toISOString();
  const base = `[${ts}] [${level.toUpperCase()}] ${msg}`;
  return meta ? `${base} ${JSON.stringify(meta)}` : base;
}

const logger = {
  error: (msg, meta) => currentLevel >= 0 && console.error(format('error', msg, meta)),
  warn: (msg, meta) => currentLevel >= 1 && console.warn(format('warn', msg, meta)),
  info: (msg, meta) => currentLevel >= 2 && console.log(format('info', msg, meta)),
  debug: (msg, meta) => currentLevel >= 3 && console.log(format('debug', msg, meta)),
};

module.exports = logger;
