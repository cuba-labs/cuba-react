import {IObservableArray} from 'mobx';
import {PermissionInfo} from '@cuba-platform/rest';

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

export function isFieldAllowed(entity: string, field: string, perms: IObservableArray<PermissionInfo> | undefined): boolean {

  if (!perms) return false;

  if (perms.some(p =>
    p.type === PermissionType.ENTITY_ATTR
    && p.target === `${entity}:${field}`
    && p.value === PermissionValue.DENY)) {
    return false;
  }

  return true;
}