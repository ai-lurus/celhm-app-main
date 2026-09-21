import { buildCreateUserPayload, buildUpdateMemberPayload } from './memberPayloads'

describe('member payloads never carry the legacy commissionRate', () => {
  it('Edit User: sends role, branch and plan, and no commissionRate key at all', () => {
    const payload = buildUpdateMemberPayload(4, { role: 'ADMINISTRADOR', branchId: '2', commissionPlanId: '5' })

    expect(payload).toEqual({ id: 4, role: 'ADMINISTRADOR', branchId: 2, commissionPlanId: 5 })
    expect(Object.keys(payload)).not.toContain('commissionRate')
  })

  it('Edit User: an empty branch or plan clears it, as before', () => {
    expect(buildUpdateMemberPayload(4, { role: 'VENDEDOR', branchId: '', commissionPlanId: '' })).toEqual({
      id: 4,
      role: 'VENDEDOR',
      branchId: null,
      commissionPlanId: null,
    })
  })

  it('Create User: sends the account fields, and no commissionRate key even if the form state was polluted', () => {
    const polluted = { name: 'Ana', email: 'ana@acme-repair.com', role: 'VENDEDOR', branchId: '3', commissionRate: '10' } as any

    const payload = buildCreateUserPayload(polluted, 1)

    expect(payload).toEqual({ name: 'Ana', email: 'ana@acme-repair.com', role: 'VENDEDOR', organizationId: 1, branchId: 3 })
    expect(Object.keys(payload)).not.toContain('commissionRate')
  })

  it('Create User: no branch means the key is undefined, so it is dropped from the JSON body', () => {
    const payload = buildCreateUserPayload({ name: 'Ana', email: 'a@b.c', role: 'VENDEDOR', branchId: '' }, 1)
    expect(JSON.parse(JSON.stringify(payload))).not.toHaveProperty('branchId')
  })
})
