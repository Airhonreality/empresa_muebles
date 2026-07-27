import { describe, expect, it } from 'vitest'
import { resolveAgnosticRoute } from '../resolver'

const schema = {
  id: 'schema-products',
  context: 'schema_definitions',
  data: {
    name: 'products',
    fields: [{ key: 'name', type: 'text' }],
  },
}

const route = {
  id: 'route-product-detail',
  context: 'page_routes',
  data: {
    path: '/products/:id',
    blocks: [
      {
        id: 'block-product-form',
        type: 'form',
        context: 'products',
        schema_id: 'products',
      },
    ],
  },
}

describe('resolveAgnosticRoute characterization', () => {
  it('keeps schema, block context and record namespace aligned', async () => {
    const product = {
      id: 'product-1',
      context: 'products',
      data: { name: 'Desk' },
    }

    const result = await resolveAgnosticRoute(['products', 'product-1'], {
      schema_definitions: [schema],
      page_routes: [route],
      products: [product],
    })

    expect(result.route).toBe(route)
    expect(result.context).toBe(schema.data.name)
    expect(result.blocks[0]).toMatchObject({
      id: 'block-product-form',
      type: 'form',
      context: schema.data.name,
      schema_id: schema.id,
      schema: schema.data,
    })
    expect(result.activeRecord).toBe(product)
    expect(result.intent).toBe('edit')
    expect(result.allContexts).toEqual(['products'])
  })

  it('preserves the related context and selects create intent without a matching record', async () => {
    const result = await resolveAgnosticRoute(['products', 'new-product'], {
      schema_definitions: [schema],
      page_routes: [route],
      products: [],
    })

    expect(result.context).toBe('products')
    expect(result.activeRecord).toBeNull()
    expect(result.intent).toBe('create')
    expect(result.allContexts).toEqual(['products'])
  })

  it('returns the stable empty resolution when no route matches', async () => {
    await expect(resolveAgnosticRoute('unknown', {
      schema_definitions: [schema],
      page_routes: [route],
    })).resolves.toEqual({
      route: null,
      blocks: [],
      activeRecord: null,
      path: '/unknown',
      context: 'system',
      intent: 'list',
      allContexts: [],
    })
  })
})
