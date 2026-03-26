const Storage = (() => {
  const KEY = 'vip_v22_data';
  
  const qx = {
    read: (k) => $prefs.valueForKey(k),
    write: (k, v) => $prefs.setValueForKey(v, k)
  };

  return {
    readConfig: (configId) => {
      const raw = qx.read(KEY);
      if (!raw) return null;
      try {
        const all = JSON.parse(raw);
        const item = all[configId];
        if (item && (Date.now() - item.t) < 24 * 60 * 60 * 1000) {
          return JSON.stringify(item);
        }
      } catch (e) {}
      return null;
    },
    
    writeConfig: (configId, value) => {
      let all = {};
      const raw = qx.read(KEY);
      if (raw) {
        try { all = JSON.parse(raw); } catch (e) {}
      }
      
      const parsed = JSON.parse(value);
      all[configId] = { v: parsed.v, t: Date.now(), d: parsed.d };
      
      let str = JSON.stringify(all);
      
      if (Platform.isQX && str.length > 500000) {
        const sorted = Object.entries(all)
          .sort((a, b) => (b[1].t || 0) - (a[1].t || 0))
          .slice(0, 3);
        str = JSON.stringify(Object.fromEntries(sorted));
      }
      
      qx.write(KEY, str);
    }
  };
})();
