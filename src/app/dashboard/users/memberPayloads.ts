import type { Role } from '@celhm/types'

export interface EditMemberFormState {
  role: Role
  branchId: string
  commissionPlanId: string
}

export interface NewUserFormState {
  name: string
  email: string
  role: Role
  branchId: string
}

/**
 * Payloads pick their fields explicitly and never include the legacy flat commissionRate.
 * The server treats an omitted key as "no change", so saving a user cannot wipe a stored
 * rate. (Empty-string form values still mean "clear it" for branch and plan.)
 */
export function buildUpdateMemberPayload(memberId: number, form: EditMemberFormState) {
  return {
    id: memberId,
    role: form.role,
    branchId: form.branchId ? parseInt(form.branchId) : null,
    commissionPlanId: form.commissionPlanId ? parseInt(form.commissionPlanId) : null,
  }
}

export function buildCreateUserPayload(form: NewUserFormState, organizationId: number) {
  return {
    name: form.name,
    email: form.email,
    role: form.role,
    organizationId,
    branchId: form.branchId ? parseInt(form.branchId) : undefined,
  }
}
