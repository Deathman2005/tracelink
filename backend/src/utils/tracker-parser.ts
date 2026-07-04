import { Request } from 'express';
import useragent from 'useragent';
import geoip from 'geoip-country';

export interface VisitorDetails {
  browser: string;
  os: string;
  device: string;
  ip: string;
  country: string;
  referer: string;
}

export const parseRequestDetails = (req: Request): VisitorDetails => {
  const userAgentStr = req.headers['user-agent'] || '';
  const agent = useragent.parse(userAgentStr);

  const browser = agent.family && agent.family !== 'Other' ? agent.family : 'Unknown';
  const os = agent.os.family && agent.os.family !== 'Other' ? agent.os.family : 'Unknown';

  // Basic device type classification
  let device = 'Desktop';
  const uaLower = userAgentStr.toLowerCase();
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(uaLower)) {
    device = 'Mobile';
  } else if (/ipad|tablet|playbook|silk/i.test(uaLower)) {
    device = 'Tablet';
  }

  // Parse IP address from headers (reverse proxies like Cloudflare/Vercel/Render)
  let ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  if (ip.includes(',')) {
    ip = ip.split(',')[0].trim();
  }
  // Trim IPv6 loopback representation if local
  if (ip === '::1') {
    ip = '127.0.0.1';
  }

  const referer = (req.headers['referer'] as string) || 'Direct';

  // If running behind Cloudflare or Vercel, utilize country headers, otherwise use offline GeoIP lookup
  let country = (req.headers['cf-ipcountry'] as string) || (req.headers['x-vercel-ip-country'] as string);

  if (!country && ip) {
    let cleanIp = ip;
    if (cleanIp.startsWith('::ffff:')) {
      cleanIp = cleanIp.substring(7);
    }
    const geo = geoip.lookup(cleanIp);
    if (geo && geo.country) {
      country = geo.country;
    } else {
      // Check if private/local IP to default to India (user's location) for accurate local testing
      const isLocal =
        cleanIp === '127.0.0.1' ||
        cleanIp === 'localhost' ||
        cleanIp === '::1' ||
        cleanIp.startsWith('192.168.') ||
        cleanIp.startsWith('10.') ||
        cleanIp.startsWith('172.16.') ||
        cleanIp.startsWith('172.17.') ||
        cleanIp.startsWith('172.18.') ||
        cleanIp.startsWith('172.19.') ||
        cleanIp.startsWith('172.20.') ||
        cleanIp.startsWith('172.21.') ||
        cleanIp.startsWith('172.22.') ||
        cleanIp.startsWith('172.23.') ||
        cleanIp.startsWith('172.24.') ||
        cleanIp.startsWith('172.25.') ||
        cleanIp.startsWith('172.26.') ||
        cleanIp.startsWith('172.27.') ||
        cleanIp.startsWith('172.28.') ||
        cleanIp.startsWith('172.29.') ||
        cleanIp.startsWith('172.30.') ||
        cleanIp.startsWith('172.31.');

      if (isLocal) {
        country = 'IN';
      }
    }
  }

  if (!country) {
    country = 'IN';
  }

  return {
    browser,
    os,
    device,
    ip,
    country,
    referer,
  };
};
