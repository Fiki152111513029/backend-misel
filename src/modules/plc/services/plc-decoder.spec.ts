import {
  applyScale,
  decodeWords,
  planBlocks,
  registerCount,
} from './plc-decoder';

// A wrong decode does not throw — it returns a confident wrong number, and
// on a factory floor that reads as a real measurement. These pin down the
// two things vendors disagree about (sign and word order) with values taken
// by hand rather than from the implementation.

const BIG = 'BIG' as const;
const LITTLE = 'LITTLE' as const;

describe('decodeWords', () => {
  describe('16-bit', () => {
    it('reads an unsigned word as-is', () => {
      expect(decodeWords([1234], 'UINT16' as never, BIG)).toBe(1234);
    });

    it('reads 0xFFFF as 65535 when unsigned', () => {
      expect(decodeWords([0xffff], 'UINT16' as never, BIG)).toBe(65535);
    });

    // The one that bites: the same bits mean two different numbers, and
    // only the tag's dataType says which.
    it('reads 0xFFFF as -1 when signed', () => {
      expect(decodeWords([0xffff], 'INT16' as never, BIG)).toBe(-1);
    });

    it('leaves the largest positive signed value alone', () => {
      expect(decodeWords([0x7fff], 'INT16' as never, BIG)).toBe(32767);
    });

    it('reads the first negative value below it', () => {
      expect(decodeWords([0x8000], 'INT16' as never, BIG)).toBe(-32768);
    });

    it('treats any non-zero as true for BOOL', () => {
      expect(decodeWords([1], 'BOOL' as never, BIG)).toBe(1);
      expect(decodeWords([0], 'BOOL' as never, BIG)).toBe(0);
    });
  });

  describe('32-bit', () => {
    // 0x0001_86A0 = 100000.
    it('combines two words, high word first', () => {
      expect(decodeWords([0x0001, 0x86a0], 'UINT32' as never, BIG)).toBe(100000);
    });

    // The same two registers, swapped — the single most common cause of a
    // nonsense reading from a PLC that is otherwise answering fine.
    it('combines them the other way round when word-swapped', () => {
      expect(decodeWords([0x86a0, 0x0001], 'UINT32' as never, LITTLE)).toBe(
        100000,
      );
    });

    it('reads a negative INT32', () => {
      expect(decodeWords([0xffff, 0xffff], 'INT32' as never, BIG)).toBe(-1);
    });

    // 0x4248_0000 is 50.0 in IEEE-754 single precision.
    it('reads a float', () => {
      expect(decodeWords([0x4248, 0x0000], 'FLOAT32' as never, BIG)).toBe(50);
    });

    it('reads a word-swapped float', () => {
      expect(decodeWords([0x0000, 0x4248], 'FLOAT32' as never, LITTLE)).toBe(50);
    });

    it('refuses to guess when the second register is missing', () => {
      expect(() => decodeWords([1], 'UINT32' as never, BIG)).toThrow();
    });
  });
});

describe('registerCount', () => {
  it('gives one register to the 16-bit types', () => {
    expect(registerCount('UINT16' as never)).toBe(1);
    expect(registerCount('INT16' as never)).toBe(1);
    expect(registerCount('BOOL' as never)).toBe(1);
  });

  it('gives two to the 32-bit types', () => {
    expect(registerCount('UINT32' as never)).toBe(2);
    expect(registerCount('INT32' as never)).toBe(2);
    expect(registerCount('FLOAT32' as never)).toBe(2);
  });
});

describe('applyScale', () => {
  it('turns a PLC integer into its real-world decimal', () => {
    expect(applyScale(235, 0.1)).toBe(23.5);
  });

  // 235 * 0.1 is 23.500000000000004 in IEEE-754. Left unrounded, the value
  // would differ from the stored one every poll and log a change forever.
  it('does not leave floating-point dust behind', () => {
    expect(applyScale(235, 0.1).toString()).toBe('23.5');
  });

  it('treats a scale of zero as unset rather than zeroing the reading', () => {
    expect(applyScale(42, 0)).toBe(42);
  });
});

describe('planBlocks', () => {
  it('reads nothing when there are no tags', () => {
    expect(planBlocks([], 125)).toEqual([]);
  });

  it('covers neighbouring addresses with one request', () => {
    const blocks = planBlocks(
      [
        { start: 10, length: 1 },
        { start: 11, length: 1 },
        { start: 12, length: 2 },
      ],
      125,
    );
    expect(blocks).toEqual([{ start: 10, length: 4 }]);
  });

  it('bridges a small gap rather than paying for a second round trip', () => {
    const blocks = planBlocks(
      [
        { start: 0, length: 1 },
        { start: 8, length: 1 },
      ],
      125,
    );
    expect(blocks).toEqual([{ start: 0, length: 9 }]);
  });

  it('splits when the addresses are far apart', () => {
    const blocks = planBlocks(
      [
        { start: 0, length: 1 },
        { start: 500, length: 1 },
      ],
      125,
    );
    expect(blocks).toEqual([
      { start: 0, length: 1 },
      { start: 500, length: 1 },
    ]);
  });

  // The protocol caps one request at 125 registers; asking for more is
  // rejected by the PLC outright.
  it('never plans a block beyond the protocol maximum', () => {
    const spans = Array.from({ length: 200 }, (_, i) => ({
      start: i,
      length: 1,
    }));
    for (const block of planBlocks(spans, 125)) {
      expect(block.length).toBeLessThanOrEqual(125);
    }
  });

  it('still covers every address when it has to split', () => {
    const spans = Array.from({ length: 200 }, (_, i) => ({
      start: i,
      length: 1,
    }));
    const blocks = planBlocks(spans, 125);
    const covered = new Set<number>();
    for (const block of blocks) {
      for (let a = block.start; a < block.start + block.length; a += 1) {
        covered.add(a);
      }
    }
    for (let a = 0; a < 200; a += 1) expect(covered.has(a)).toBe(true);
  });

  it('does not care what order the tags were given in', () => {
    const blocks = planBlocks(
      [
        { start: 12, length: 1 },
        { start: 10, length: 1 },
        { start: 11, length: 1 },
      ],
      125,
    );
    expect(blocks).toEqual([{ start: 10, length: 3 }]);
  });
});
