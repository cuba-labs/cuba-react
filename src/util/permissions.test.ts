import {isFieldAllowed, Permission} from './permissions';
import perms from '../../fixtures/permissions/mechanic-perms.json';

describe('permissions util', () => {

  it('should return false if field denied in perms', () => {
    expect(isFieldAllowed('', '', perms as Permission[])).toBe(true);
    expect(isFieldAllowed('scr$Car', 'maxPassengers', perms as Permission[])).toBe(false);
    expect(isFieldAllowed('scr$Car', 'maxPassengers', [])).toBe(true);
  });

});