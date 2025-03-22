class BitUtils {
  static setBit(value: number, position: number, bitValue: boolean): number {
    if (bitValue) {
      return value | (1 << position);
    } else {
      return value & ~(1 << position);
    }
  }

  static getBit(value: number, position: number): boolean {
    return (value & (1 << position)) !== 0;
  }
}
