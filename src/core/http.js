const HTTP = {
  get: (url, timeout = 10000) => new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timeout')), timeout);
    
    const callback = (error, response, body) => {
      clearTimeout(timer);
      if (error) {
        reject(new Error(String(error)));
      } else {
        resolve({
          body: body || '',
          statusCode: typeof response === 'object' ? (response.statusCode || 200) : 200
        });
      }
    };

    if (Platform.isQX) {
      $task.fetch({ url, method: 'GET', timeout: Math.ceil(timeout / 1000) })
        .then(res => callback(null, { statusCode: res.statusCode }, res.body))
        .catch(err => callback(err, null, null));
    } else {
      callback(new Error('No HTTP client'));
    }
  })
};
