import * as http from 'http';
import * as https from 'https';
import { URL } from 'url';

// Node's global fetch() (undici) sends this particular server a request it
// responds to with a generic "request failed" — a plain http/https request
// (same as curl) works correctly, so we use that instead of fetch here.
export function postJson(
  targetUrl: string,
  payload: unknown,
  timeoutMs: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = new URL(targetUrl);
    const client = url.protocol === 'https:' ? https : http;
    const body = JSON.stringify(payload);

    const request = client.request(
      {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: `${url.pathname}${url.search}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
        timeout: timeoutMs,
      },
      (response) => {
        let data = '';
        response.setEncoding('utf8');
        response.on('data', (chunk: string) => {
          data += chunk;
        });
        response.on('end', () => {
          const status = response.statusCode ?? 0;
          if (status < 200 || status >= 300) {
            reject(new Error(`responded with status ${status}`));
            return;
          }
          resolve(data);
        });
      },
    );

    request.on('timeout', () =>
      request.destroy(new Error('request timed out')),
    );
    request.on('error', reject);
    request.write(body);
    request.end();
  });
}

export function getRaw(targetUrl: string, timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = new URL(targetUrl);
    const client = url.protocol === 'https:' ? https : http;

    const request = client.request(
      {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: `${url.pathname}${url.search}`,
        method: 'GET',
        timeout: timeoutMs,
      },
      (response) => {
        let data = '';
        response.setEncoding('utf8');
        response.on('data', (chunk: string) => {
          data += chunk;
        });
        response.on('end', () => {
          const status = response.statusCode ?? 0;
          if (status < 200 || status >= 300) {
            reject(new Error(`responded with status ${status}`));
            return;
          }
          resolve(data);
        });
      },
    );

    request.on('timeout', () =>
      request.destroy(new Error('request timed out')),
    );
    request.on('error', reject);
    request.end();
  });
}
