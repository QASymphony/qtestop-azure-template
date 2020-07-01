exports.getPublicIP = async () => {
  return new Promise((resolve, reject) => {
    const isWin = process.platform == "win32";
    if (!isWin) {
      try {
        const ip = require('child_process').execSync('dig +short myip.opendns.com @resolver1.opendns.com').toString().replace('\n', '');
        resolve(ip.trim());
      } catch (e) {
        return reject(new Error(e.message));
      }
    }
    else {
      const req = require('https').get('https://checkip.amazonaws.com', (res) => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          return reject(new Error(`status code: ${res.statusCode}`));
        }
        const data = [];
        res.on('data', chunk => {
          data.push(chunk);
        });
        res.on('end', () => resolve(Buffer.concat(data).toString().replace('\n', '').trim()));
      });

      req.on('error', reject);
      req.end();
    }
  });
}