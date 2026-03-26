
const Logger = (() => {
  const isDebug = false;
  
  if (!isDebug) {
    return {
      info: () => {},
      error: () => {},
      debug: () => {},
      warn: () => {}
    };
  }

  const now = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
  };

  return {
    info: (tag, msg) => console.log(`[UnifiedVIP][${now()}][INFO][${tag}] ${msg}`),
    error: (tag, msg) => console.log(`[UnifiedVIP][${now()}][ERROR][${tag}] ${msg}`),
    debug: (tag, msg) => console.log(`[UnifiedVIP][${now()}][DEBUG][${tag}] ${msg}`),
    warn: (tag, msg) => console.log(`[UnifiedVIP][${now()}][WARN][${tag}] ${msg}`)
  };
})();
