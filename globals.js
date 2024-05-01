const { networkInterfaces } = require("os");

ask = async (rl, msg, noInputMsg) => {
  return new Promise((resolve, reject) => {
    rl.question(msg, (data) => {
      if (!data) {
        console.log(noInputMsg);
        process.exit(0);
      }
      resolve(data);
    });
  });
};

getLocalIp = () => {
  const nets = networkInterfaces();
  const results = Object.create(null); // or just '{}', an empty object

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // skip over non-ipv4 and internal (i.e. 127.0.0.1) addresses
      if (net.family === "IPv4" && !net.internal) {
        if (!results[name]) {
          results[name] = [];
        }

        results[name].push(net.address);
      }
    }
  }
  return results["enp0s3"];
};

const defaultHost = `
$ttl 38400
@	IN	SOA	dns.estig.pt. mail.as.com. (
            1165190726 ;serial
            10800 ;refresh
            3600 ; retry
            604800 ; expire
            38400 ; minimum
            )
  IN	NS	dns.estig.pt.`;

const PATHS = {
  zones: "/etc/named.conf",
  hosts: (name) => `/var/named/${name}.hosts`,
  hostsDir: `/var/named/`,
  httpConf: "/etc/httpd/conf/httpd.conf",
  home: "/home",
  nfsExport: '/etc/exports',
  smbConf: '/etc/samba/smb.conf'
};

const reserveDirSmb = [
  '[global]',
  '[homes]',
  '[printers]',
  '[print$]',
]

const ipRegex =
  /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
const domainRegex = /^(?!:\/\/)([a-zA-Z0-9_-]+\.)+[a-zA-Z]{2,}$/;
const reverseZoneRegex = /\d+\.\d+\.\d+\.\d+\.in-addr\.arpa/;

module.exports = {
  PATHS,
  defaultHost,
  getLocalIp,
  ask,
  ipRegex,
  domainRegex,
  reverseZoneRegex,
  reserveDirSmb
};
