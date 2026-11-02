import { describe, expect, it } from 'vitest';
import { DEFAULT_ASSISTS } from '../drive/assists';
import { sanitizeAssists } from './assistStore';

describe('sanitizeAssists', () => {
  it('bozuk girdide varsayılanlara döner', () => {
    expect(sanitizeAssists(null)).toEqual(DEFAULT_ASSISTS);
    expect(sanitizeAssists({ abs: 'yes', tractionControl: 1 })).toEqual(DEFAULT_ASSISTS);
  });
  it('geçerli değerleri korur', () => {
    expect(sanitizeAssists({ abs: false, tractionControl: true, steeringAssist: false })).toEqual({
      abs: false,
      tractionControl: true,
      steeringAssist: false,
    });
  });
});
