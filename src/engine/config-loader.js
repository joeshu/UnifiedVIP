class SimpleConfigLoader {
  async load(configId) {
    const cached = Storage.readConfig(configId);

    if (cached) {
      try {
        const { t, d } = JSON.parse(cached);
        if ((Date.now() - t) < 24 * 60 * 60 * 1000) {
          return this._prepare(d);
        }
      } catch (e) {}
    }

    const url = `https://joeshu.github.io/UnifiedVIP/configs/${configId}.json?t=${Date.now()}`;
    
    try {
      const res = await HTTP.get(url);
      if (res.statusCode !== 200 || !res.body) {
        throw new Error('Fetch failed');
      }

      const fresh = Utils.safeJsonParse(res.body);
      
      Storage.writeConfig(configId, JSON.stringify({
        v: '1.0',
        t: Date.now(),
        d: fresh
      }));

      return this._prepare(fresh);

    } catch (e) {
      if (cached) {
        const { d } = JSON.parse(cached);
        return this._prepare(d);
      }
      throw e;
    }
  }

  _prepare(raw) {
    return raw;
  }
}
