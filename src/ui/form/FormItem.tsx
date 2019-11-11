import * as React from "react";
import {observer} from "mobx-react";
import {FormField} from "../FormField";
import {injectMainStore, MainStoreInjected} from "../../app/MainStore";
import {WithId} from "../../util/metadata";
import {DataCollectionStore} from "../../data/Collection";
import {Form} from "antd";
import {FormComponentProps, ValidationRule} from 'antd/lib/form';
import {GetFieldDecoratorOptions} from 'antd/lib/form/Form';
import {Msg} from '../Msg';

type Props = MainStoreInjected & FormComponentProps & {
  entityName: string
  propertyName: string
  valuePropName?: string
  rules?: ValidationRule[]
  optionsContainer?: DataCollectionStore<WithId>
}

// noinspection JSUnusedGlobalSymbols
export const FormItem = injectMainStore(observer((props: Props) => {

  const {getFieldDecorator} = props.form;

  const {entityName, propertyName, rules, optionsContainer, valuePropName} = props;
  let opts: GetFieldDecoratorOptions = {};
  if (rules) opts = {... opts, rules};
  if (valuePropName) opts = {... opts, valuePropName};

  return <Form.Item label={<Msg entityName={entityName} propertyName={propertyName}/>}
                    key={propertyName}
                    style={{marginBottom: "12px"}}>

    {getFieldDecorator(propertyName, opts)(
      <FormField entityName={entityName}
                 propertyName={propertyName}
                 optionsContainer={optionsContainer}
      />
    )}
  </Form.Item>

}));

