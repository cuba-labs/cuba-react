import * as React from "react";
import {observer} from 'mobx-react';
import {injectMainStore, MainStoreInjected} from "../../app/MainStore";
import {EntityAttrPermissionValue} from '@cuba-platform/rest';

type Props = MainStoreInjected & {
  entityName: string
  propertyName: string
  render: (isReadOnly: boolean) => React.ReactNode
}

export const FieldPermissionContainer = injectMainStore(observer((props: Props) => {

  if (!props.mainStore) return <></>;

  const {entityName, propertyName} = props;
  const {getAttributePermission} = props.mainStore;

  const perm: EntityAttrPermissionValue = getAttributePermission(entityName, propertyName);
  const isAllowed = perm === 'MODIFY';
  const isReadOnly = perm === 'VIEW';

  if (!isAllowed && !isReadOnly) return <></>;

  return <>{props.render(isReadOnly)}</>

}));
