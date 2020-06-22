'use strict';
const config = require('./app.config.json');
const fs = require('fs');
const { getPublicIP } = require('./utils/get-ip');
const { logger } = require('./utils/logger');

const replaceIPAddress = (content, oldIP, newIP) => {
  return content.replace(new RegExp(oldIP, 'g'), newIP);
}

(async () => {
  try {
    const ipAddress = await getPublicIP();
    logger.info(`Public IP address: ${ipAddress}`);
   
    /**
     * update ip address in qtest.config file
     */
    const ipAddressToBeReplaced = config.ip_address_to_be_replaced.trim();
    if (ipAddress == ipAddressToBeReplaced) {
      logger.info(`IP address to be replaced is the same with the current public IP address. Exit now.`);
      return;
    }

    const envConfig = config.env[config.env.name];
    const qtestConfigFilePath = envConfig.qtest_config_file_path;
    const content = fs.readFileSync(qtestConfigFilePath, { encoding: 'utf8', flag: 'r' });
    const newContent = replaceIPAddress(content, `//${ipAddressToBeReplaced}`, `//${ipAddress}`);
    fs.writeFileSync(qtestConfigFilePath, newContent, { encoding: 'utf8' });

    /**
     * update ip address in qtest database
     */
    const { Pool } = require('pg')
    const pool = new Pool({
      host: envConfig.database.host,
      port: envConfig.database.port,
      database: envConfig.database.name,
      user: envConfig.database.user,
      password: envConfig.database.password
    });
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // replace Insights URL in client_ext table with id = 2
      //
      const insightUrlId = 2;
      const { rows } = await client.query('SELECT id, opinsighturl FROM client_ext WHERE id = $1', [insightUrlId]);
      if (rows && rows.length == 1 && rows[0].opinsighturl != null && rows[0].opinsighturl.trim() != '') {
        let currentUrl = rows[0].opinsighturl.trim();
        if (currentUrl.indexOf(ipAddressToBeReplaced) > 0) {
          // found insights url, replace the ip address in the url with new ip
          let newUrl = replaceIPAddress(currentUrl, ipAddressToBeReplaced, ipAddress);
          await client.query('UPDATE client_ext SET opinsighturl = $1 WHERE id = 2', [`${newUrl}`]);
          logger.info(`Successfully replaced Insights URL. New URL: ${newUrl}`);
        } else {
          logger.info(`Insights URL does not include IP address to be replaced. Current URL is ${currentUrl}`);
        }
      } else {
        logger.info(`Insights URL not found with id ${insightUrlId} in client_ext table`);
      }

      // replace other app URLs with new IP address in setting_checklist table
      //
      const names = ['Server Url', 'Pulse URL Onpremise', 'eXplorer Api Url OnPremise', 'Launch URL', 'Parameters URL Onpremise'];
      for(let i = 0; i < names.length; i++) {
        let name = names[i];
        const result = await client.query('SELECT name, value FROM setting_checklist WHERE (LOWER(name) = LOWER($1))', [name]);
        if (result && result.rowCount == 1 && result.rows[0].value != null) {
          let currentUrl = result.rows[0].value.trim();
          if (currentUrl.indexOf(ipAddressToBeReplaced) > 0) {
            // found app url, replace the ip address in the url with new ip
            let newUrl = replaceIPAddress(currentUrl, ipAddressToBeReplaced, ipAddress);
            await client.query('UPDATE setting_checklist SET value = $1 WHERE LOWER(name) = LOWER($2)', [newUrl, result.rows[0].name]);
            logger.info(`Successfully replaced ${name}. New URL: ${newUrl}`);
          } else {
            logger.info(`${name}'s Url does not include IP address to be replaced. Current URL is ${currentUrl}`);
          }
        } else {
          logger.info(`${name} not found in setting_checklist table`);
        }
      };
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (e) {
    console.log(e);
    logger.error(e);
  }
})();