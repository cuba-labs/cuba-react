import {isFieldAllowed} from './permissions';
import {IObservableArray} from 'mobx';
import {PermissionInfo} from '@cuba-platform/rest';

import perms from '../../fixtures/permissions/mechanic-perms.json';

describe('permissions util', () => {

  const permissions = perms as IObservableArray<PermissionInfo>;

  it('should return false if field denied in perms', () => {
    expect(isFieldAllowed('', '', permissions)).toBe(true);
    expect(isFieldAllowed('scr$Car', 'maxPassengers', permissions)).toBe(false);
    expect(isFieldAllowed('scr$Car', 'maxPassengers', [] as any)).toBe(true);
    expect(isFieldAllowed('scr$Car', 'maxPassengers', undefined)).toBe(false);
  });

});