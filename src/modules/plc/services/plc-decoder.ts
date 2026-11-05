import { PlcDataType, PlcRegisterType, PlcWordOrder } from '@prisma/client';

/**
 * Turning raw Modbus words into the number a human recognises.
 *
 * Kept as plain functions with no PLC, database or Nest involved, because
 * this is where the mistakes actually happen. A wrong connection fails
 * loudly; a wrong decode returns a confident, plausible, wrong number —
 * 23.5°C read as 1120403456 — and the only way to be sure is to pin the
 * rules down in tests.
 */

/** How many consecutive registers one value occupies. */
export function registerCount(dataType: PlcDataType): number {
  switch (dataType) {
    case PlcDataType.INT32:
    case PlcDataType.UINT32:
    case PlcDataType.FLOAT32:
      return 2;
    default:
      return 1;
  }
}

/** Whether this address space holds single bits rather than 16-bit words. */
export function isBitType(registerType: PlcRegisterType): boolean {
  return (
    registerType === PlcRegisterType.COIL ||
    registerType === PlcRegisterType.DISCRETE_INPUT
  );
}

/**
 * Decodes the words belonging to one tag.
 *
 * `words` must already be the slice for this tag — see registerCount. The
 * byte order *within* a register is fixed by the Modbus specification as
 * big-endian and is never configurable; only the order of the two registers
 * of a 32-bit value varies between vendors, which is what wordOrder is for.
 */
export function decodeWords(
  words: number[],
  dataType: PlcDataType,
  wordOrder: PlcWordOrder,
): number {
  const first = words[0];
  if (first === undefined) {
    throw new Error('No register data to decode');
  }

  if (dataType === PlcDataType.BOOL) return first ? 1 : 0;
  if (dataType === PlcDataType.UINT16) return first & 0xffff;
  if (dataType === PlcDataType.INT16) {
    // Sign-extend: 0xFFFF is -1, not 65535.
    const value = first & 0xffff;
    return value > 0x7fff ? value - 0x10000 : value;
  }

  const second = words[1];
  if (second === undefined) {
    throw new Error(`${dataType} needs two registers, got one`);
  }

  const [high, low] =
    wordOrder === PlcWordOrder.BIG ? [first, second] : [second, first];

  const buffer = Buffer.alloc(4);
  buffer.writeUInt16BE(high & 0xffff, 0);
  buffer.writeUInt16BE(low & 0xffff, 2);

  switch (dataType) {
    case PlcDataType.FLOAT32:
      return buffer.readFloatBE(0);
    case PlcDataType.INT32:
      return buffer.readInt32BE(0);
    default:
      return buffer.readUInt32BE(0);
  }
}

/**
 * Applies the tag's multiplier.
 *
 * Rounded to six decimals because IEEE-754 turns 235 × 0.1 into
 * 23.500000000000004, and a value that changes shape like that would be
 * stored as a new reading on every poll.
 */
export function applyScale(raw: number, scale: number): number {
  const scaled = raw * (scale || 1);
  return Math.round(scaled * 1e6) / 1e6;
}

/** The largest block one request may cover, per the Modbus specification. */
export const MAX_REGISTERS_PER_READ = 125;
export const MAX_BITS_PER_READ = 2000;

/**
 * How far apart two tags may sit before they are read separately.
 *
 * Reading a gap costs nothing extra in the request itself, so a few unused
 * registers between two tags are cheaper to fetch than a second round trip
 * to the PLC. Past this, the span is wasted bandwidth.
 */
const MAX_GAP = 16;

export interface ReadBlock {
  start: number;
  /** Register or bit count, never beyond the protocol maximum. */
  length: number;
}

/**
 * Groups addresses into as few requests as possible.
 *
 * Fifty tags read one at a time is fifty round trips, which at a typical
 * 10-20ms each cannot fit in a one-second poll — and it is fifty times the
 * load on a PLC that is also busy running the machine.
 */
export function planBlocks(
  spans: { start: number; length: number }[],
  maxPerRead: number,
): ReadBlock[] {
  if (spans.length === 0) return [];

  const sorted = [...spans].sort((a, b) => a.start - b.start);
  const blocks: ReadBlock[] = [];

  let start = sorted[0]!.start;
  let end = start + sorted[0]!.length - 1;

  for (const span of sorted.slice(1)) {
    const spanEnd = span.start + span.length - 1;
    const wouldEnd = Math.max(end, spanEnd);
    const fits = wouldEnd - start + 1 <= maxPerRead;
    const near = span.start - end <= MAX_GAP;

    if (fits && near) {
      end = wouldEnd;
      continue;
    }

    blocks.push({ start, length: end - start + 1 });
    start = span.start;
    end = spanEnd;
  }

  blocks.push({ start, length: end - start + 1 });
  return blocks;
}
