const { networkInterfaces } = require('os');

module.exports = {
  PATHS: {
    zones: '/etc/named.conf',
    hosts: (name) => `/var/named/${name}.hosts`,
  },
  defaultHost: `
$ttl 38400
@	IN	SOA	dns.estig.pt. mail.as.com. (
            1165190726 ;serial
            10800 ;refresh
            3600 ; retry
            604800 ; expire
            38400 ; minimum
            )
  IN	NS	dns.estig.pt.`,
  getLocalIp: () => {
    const nets = networkInterfaces();
    const results = Object.create(null); // or just '{}', an empty object

    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        // skip over non-ipv4 and internal (i.e. 127.0.0.1) addresses
        if (net.family === 'IPv4' && !net.internal) {
          if (!results[name]) {
            results[name] = [];
          }

          results[name].push(net.address);
        }
      }
    }
    return results
  }
}