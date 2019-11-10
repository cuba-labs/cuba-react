export enum PermissionType {
  // noinspection JSUnusedGlobalSymbols
  SCREEN = "SCREEN",
  ENTITY_OP = "ENTITY_OP",
  ENTITY_ATTR = "ENTITY_ATTR",
  SPECIFIC = "SPECIFIC",
  UI = "UI"
}

export enum PermissionValue {
  // noinspection JSUnusedGlobalSymbols
  ALLOW = "ALLOW",
  DENY = "DENY"
}

export type Permission = {
  type: PermissionType
  target: string
  value: PermissionValue
  intValue: number
}

export function isFieldAllowed(entity: string, field: string, perms: Permission[]): boolean {

  if (perms.some(p =>
    p.type === PermissionType.ENTITY_ATTR
    && p.target === `${entity}:${field}`
    && p.value === PermissionValue.DENY)) {
    return false;
  }

  return true;
}