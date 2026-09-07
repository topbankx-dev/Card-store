import { createServerClient } from '@/lib/supabase'
import { headers } from 'next/headers'

const adminDb = createServerClient()

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'VIEW'
  | 'LOGIN'
  | 'LOGOUT'
  | 'STATUS_CHANGE'
  | 'ROLE_CHANGE'
  | 'REFUND'
  | 'BULK_UPDATE'

export type EntityType =
  | 'Product'
  | 'Order'
  | 'User'
  | 'Event'
  | 'PromoCode'
  | 'OrderNote'
  | 'CustomerNote'
  | 'AuditLog'
  | 'Session'

interface AuditLogEntry {
  userId: string
  action: AuditAction
  entityType: EntityType
  entityId?: string
  details?: Record<string, unknown>
  ipAddress?: string
}

/**
 * Log an audit event
 */
export async function logAudit({
  userId,
  action,
  entityType,
  entityId,
  details,
  ipAddress,
}: AuditLogEntry): Promise<void> {
  try {
    // Try to get IP from headers if not provided
    if (!ipAddress) {
      try {
        const headersList = await headers()
        ipAddress = headersList.get('x-forwarded-for')?.split(',')[0] ||
                    headersList.get('x-real-ip') ||
                    'unknown'
      } catch {
        ipAddress = 'unknown'
      }
    }

    await adminDb.from('AuditLog').insert({
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details: details || {},
      ip_address: ipAddress,
    })
  } catch (error) {
    // Log to console but don't throw - audit logging should never break main operations
    console.error('Failed to log audit event:', error)
  }
}

/**
 * Create audit log entry with common patterns
 */
export const audit = {
  create: (userId: string, entityType: EntityType, entityId: string, details?: Record<string, unknown>) =>
    logAudit({ userId, action: 'CREATE', entityType, entityId, details }),

  update: (userId: string, entityType: EntityType, entityId: string, details?: Record<string, unknown>) =>
    logAudit({ userId, action: 'UPDATE', entityType, entityId, details }),

  delete: (userId: string, entityType: EntityType, entityId: string, details?: Record<string, unknown>) =>
    logAudit({ userId, action: 'DELETE', entityType, entityId, details }),

  view: (userId: string, entityType: EntityType, entityId: string) =>
    logAudit({ userId, action: 'VIEW', entityType, entityId }),

  login: (userId: string, details?: Record<string, unknown>) =>
    logAudit({ userId, action: 'LOGIN', entityType: 'Session', details }),

  logout: (userId: string) =>
    logAudit({ userId, action: 'LOGOUT', entityType: 'Session' }),

  statusChange: (userId: string, entityType: EntityType, entityId: string, oldStatus: string, newStatus: string) =>
    logAudit({ userId, action: 'STATUS_CHANGE', entityType, entityId, details: { oldStatus, newStatus } }),

  roleChange: (userId: string, targetUserId: string, oldRole: string, newRole: string) =>
    logAudit({ userId, action: 'ROLE_CHANGE', entityType: 'User', entityId: targetUserId, details: { oldRole, newRole } }),

  refund: (userId: string, orderId: string, amount: number, reason?: string) =>
    logAudit({ userId, action: 'REFUND', entityType: 'Order', entityId: orderId, details: { amount, reason } }),

  bulkUpdate: (userId: string, entityType: EntityType, count: number, details?: Record<string, unknown>) =>
    logAudit({ userId, action: 'BULK_UPDATE', entityType, details: { count, ...details } }),
}
