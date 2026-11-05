import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import ModbusRTU from 'modbus-serial';
import { PlcRegisterType } from '@prisma/client';

/** What a device is doing right now, for the dashboard's status pill. */
export interface PlcConnectionStatus {
  connected: boolean;
  /** The last failure, cleared on the next successful read. */
  lastError: string | null;
  lastSuccessAt: string | null;
}

interface Connection {
  client: ModbusRTU;
  /** Detects a device whose address or timeout was edited while connected. */
  signature: string;
  status: PlcConnectionStatus;
  /** Serialises requests — see run(). */
  queue: Promise<unknown>;
}

export interface PlcTarget {
  id: string;
  host: string;
  port: number;
  unitId: number;
  timeoutMs: number;
}

/**
 * Owns the Modbus sockets.
 *
 * One long-lived connection per device, never one per request: a PLC
 * accepts only a handful of concurrent connections — eight is typical, and
 * some Siemens CPUs fewer — and exhausting them does not just break this
 * app, it blocks the HMI and the engineer's laptop too.
 *
 * Reads only. Nothing here can write to a PLC, because a write to the wrong
 * address moves real machinery.
 */
@Injectable()
export class PlcConnectionService implements OnModuleDestroy {
  private readonly logger = new Logger(PlcConnectionService.name);
  private readonly connections = new Map<string, Connection>();

  /**
   * Reads one contiguous block.
   *
   * Returns numbers in both cases: a coil read gives 0/1 per bit, a
   * register read gives the raw 16-bit words, and the decoder takes it
   * from there.
   */
  async readBlock(
    target: PlcTarget,
    registerType: PlcRegisterType,
    start: number,
    length: number,
  ): Promise<number[]> {
    const connection = await this.connect(target);

    return this.run(connection, async () => {
      const client = connection.client;
      client.setID(target.unitId);

      try {
        const values = await readByType(client, registerType, start, length);
        connection.status.connected = true;
        connection.status.lastError = null;
        connection.status.lastSuccessAt = new Date().toISOString();
        return values;
      } catch (error) {
        // The socket is left in an unknown state after a failed exchange —
        // a timeout in particular can leave a late reply in the buffer that
        // would be read as the answer to the *next* request. Dropping the
        // connection is the only way to be sure the next value is not the
        // previous one shifted by a frame.
        this.fail(target.id, error);
        throw error;
      }
    });
  }

  status(deviceId: string): PlcConnectionStatus {
    return (
      this.connections.get(deviceId)?.status ?? {
        connected: false,
        lastError: null,
        lastSuccessAt: null,
      }
    );
  }

  /** Drops a device's socket — call after its settings change or it is removed. */
  close(deviceId: string): void {
    const connection = this.connections.get(deviceId);
    if (!connection) return;
    this.connections.delete(deviceId);
    safeClose(connection.client);
  }

  onModuleDestroy(): void {
    for (const deviceId of [...this.connections.keys()]) this.close(deviceId);
  }

  private async connect(target: PlcTarget): Promise<Connection> {
    const signature = `${target.host}:${target.port}:${target.timeoutMs}`;
    const existing = this.connections.get(target.id);

    if (existing) {
      // A device edited to a new address must not keep talking to the old
      // one, so the signature is checked rather than just isOpen.
      if (existing.signature === signature && existing.client.isOpen) {
        return existing;
      }
      this.close(target.id);
    }

    const client = new ModbusRTU();
    client.setTimeout(target.timeoutMs);

    const connection: Connection = {
      client,
      signature,
      status: { connected: false, lastError: null, lastSuccessAt: null },
      queue: Promise.resolve(),
    };
    this.connections.set(target.id, connection);

    try {
      await client.connectTCP(target.host, { port: target.port });
      connection.status.connected = true;
    } catch (error) {
      this.fail(target.id, error);
      throw error;
    }

    return connection;
  }

  /**
   * Runs one exchange at a time per device.
   *
   * Modbus TCP multiplexes on a transaction id, but a single socket shared
   * by overlapping reads is where mismatched replies come from — block A
   * answered with block B's words. Chaining keeps each device strictly
   * request-response; different devices still run in parallel.
   */
  private run<T>(connection: Connection, task: () => Promise<T>): Promise<T> {
    const result = connection.queue.then(task, task);
    // Swallowed on the chain only: the caller still sees the rejection, but
    // one failure must not poison every request queued behind it.
    connection.queue = result.catch(() => undefined);
    return result;
  }

  private fail(deviceId: string, error: unknown): void {
    const connection = this.connections.get(deviceId);
    if (connection) {
      connection.status.connected = false;
      connection.status.lastError = describe(error);
    }
    this.connections.delete(deviceId);
    if (connection) safeClose(connection.client);
    this.logger.debug(`PLC ${deviceId} read failed: ${describe(error)}`);
  }
}

function readByType(
  client: ModbusRTU,
  registerType: PlcRegisterType,
  start: number,
  length: number,
): Promise<number[]> {
  switch (registerType) {
    case PlcRegisterType.COIL:
      return client
        .readCoils(start, length)
        .then((r) => r.data.slice(0, length).map((bit) => (bit ? 1 : 0)));
    case PlcRegisterType.DISCRETE_INPUT:
      return client
        .readDiscreteInputs(start, length)
        .then((r) => r.data.slice(0, length).map((bit) => (bit ? 1 : 0)));
    case PlcRegisterType.INPUT_REGISTER:
      return client.readInputRegisters(start, length).then((r) => [...r.data]);
    default:
      return client
        .readHoldingRegisters(start, length)
        .then((r) => [...r.data]);
  }
}

function safeClose(client: ModbusRTU): void {
  try {
    client.close(() => undefined);
  } catch {
    // Already gone — nothing to release.
  }
}

/**
 * A message an operator can act on.
 *
 * The raw errors are unhelpful on their own: a wrong IP and a blocked port
 * both surface as "Timed out", and the first thing anyone asks is which of
 * the two it was.
 */
export function describe(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const code = (error as { errno?: string })?.errno ?? '';

  if (code === 'ECONNREFUSED' || message.includes('ECONNREFUSED')) {
    return 'Connection refused — the host is reachable but nothing is listening on that port';
  }
  if (code === 'EHOSTUNREACH' || message.includes('EHOSTUNREACH')) {
    return 'Host unreachable — check the IP address and the network route';
  }
  if (code === 'ETIMEDOUT' || /timed? ?out/i.test(message)) {
    return 'Timed out — no answer from the device (wrong IP, blocked port, or the unit id is not this one)';
  }
  if (/Illegal (data )?address/i.test(message)) {
    return 'Illegal data address — the device has no register at that address';
  }
  if (/Illegal function/i.test(message)) {
    return 'Illegal function — the device does not support that register type';
  }
  return message;
}
