import { normalizeSkuToken, renderSkuMask } from './sku-mask'

describe('normalizeSkuToken', () => {
  it('uppercases and strips accents/symbols', () => {
    expect(normalizeSkuToken('Cables y Cargadores', 2)).toBe('CA')
  })

  it('does not pad when the source is shorter than length', () => {
    expect(normalizeSkuToken('A', 4)).toBe('A')
  })
})

describe('renderSkuMask', () => {
  it('matches the CAC0117 example from the mask mockup', () => {
    const result = renderSkuMask(
      [
        { type: 'category', length: 2 },
        { type: 'product', length: 1 },
        { type: 'sequence', digits: 4 },
      ],
      { root: 'Accesorios', category: 'Cables', product: 'Cable USB-C', seq: 117 },
    )
    expect(result).toBe('CAC0117')
  })

  it('includes literal segments verbatim', () => {
    const result = renderSkuMask(
      [
        { type: 'literal', value: '-' },
        { type: 'category', length: 2 },
        { type: 'sequence', digits: 2 },
      ],
      { root: '', category: 'Cables', product: '', seq: 3 },
    )
    expect(result).toBe('-CA03')
  })
})
