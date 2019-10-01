import React, {FormEvent, ReactNode} from 'react';
import {Button, DatePicker, Divider, Form, Input, InputNumber, message, Select, Spin, TimePicker} from 'antd';
import {FormComponentProps} from 'antd/es/form';
import {FilterDropdownProps} from 'antd/es/table';
import {observer} from 'mobx-react';
import {MetaClassInfo, MetaPropertyInfo, OperatorType, PropertyType} from '@cuba-platform/rest';
import {action, computed, observable} from 'mobx';
import moment, {Moment} from 'moment';
import {DataTableListEditor} from './DataTableListEditor';
import {DataTableIntervalEditor} from './DataTableIntervalEditor';
import './DataTableCustomFilter.css';
import {getCubaREST} from '../../app/CubaAppProvider';
import {injectMainStore, MainStoreInjected, } from '../../app/MainStore';
import {getPropertyInfo, WithId} from '../../util/metadata';
import {GetFieldDecoratorOptions} from 'antd/es/form/Form';

export interface CaptionValuePair {
  caption: string;
  value: string | number | undefined;
}

export interface DataTableCustomFilterProps extends FormComponentProps, MainStoreInjected {
  entityName: string,
  entityProperty: string,
  filterProps: FilterDropdownProps,
  operatorsByProperty: Record<string, ComparisonType>;
  valuesByProperty: Record<string, any>;
  ref: (instance: React.Component<DataTableCustomFilterProps>) => void,
}

export type ComparisonType = OperatorType | 'inInterval';

enum OperatorGroup {
  SINGLE_VALUE = 'singleValue',
  LIST_VALUE = 'listValue',
  LOGICAL_VALUE = 'logicalValue',
  INTERVAL_VALUE = 'intervalValue',
}

@injectMainStore
@observer
class DataTableCustomFilter<E extends WithId> extends React.Component<DataTableCustomFilterProps> {

  @observable nestedEntityOptions: CaptionValuePair[] = [];
  @observable loading = true;

  readonly VALIDATION_REQUIRED_MSG = 'Required field'; // TODO i18n
  // tslint:disable-next-line:ban-types
  getFieldDecorator!: <T extends Object = {}>(id: keyof T, options?: GetFieldDecoratorOptions | undefined) => (node: ReactNode) => ReactNode;

  set operator(operator: ComparisonType) {
    this.props.operatorsByProperty[this.props.entityProperty] = operator;
  }

  get operator(): ComparisonType {
    return this.props.operatorsByProperty[this.props.entityProperty] || this.getDefaultOperator();
  }

  set value(value: any) {
    this.props.valuesByProperty[this.props.entityProperty] = value;
  }

  get value(): any {
    return this.props.valuesByProperty[this.props.entityProperty]
  }

  constructor(props: DataTableCustomFilterProps) {
    super(props);

    this.setDefaultYesNoDropdown();
  }

  componentDidMount(): void {
    const propertyInfo: MetaPropertyInfo = this.propertyInfoNN;
    const metaClassInfo: MetaClassInfo | undefined = this.props.mainStore!.metadata!.find((classInfo: MetaClassInfo) => {
      return classInfo.entityName === propertyInfo.type;
    });

    if (metaClassInfo) {
      // This is a nested entity column. Fetch select options.
      getCubaREST()!.loadEntities<E>(metaClassInfo.entityName, {view: '_minimal'})
        .then(
          (resp) => {
            resp.forEach((instance) => {
              this.nestedEntityOptions.push({
                caption: instance._instanceName,
                value: instance.id
              });
            });
            this.loading = false;
          }
        )
        .catch(
          () => {
            message.error('Failed to load nested entities list');
            this.loading = false;
          }
        );
    } else {
      this.loading = false;
    }
  }

  @computed get propertyCaption(): string {
    return this.props.mainStore!.messages![this.props.entityName + '.' + this.props.entityProperty];
  }

  @computed get propertyInfoNN(): MetaPropertyInfo {
    const propertyInfo: MetaPropertyInfo | null = getPropertyInfo(
      this.props.mainStore!.metadata!,
      this.props.entityName,
      this.props.entityProperty);

    if (!propertyInfo) {
      throw new Error('Cannot find MetaPropertyInfo for property ' + this.props.entityProperty);
    }

    return propertyInfo;
  }

  @action
  handleSubmit = (e: FormEvent): void => {
    e.preventDefault();

    this.props.form.validateFields((err) => {
       if (!err) {
         this.props.filterProps.setSelectedKeys!(
           [
             JSON.stringify({
               operator: this.operator,
               value: this.value
             })
           ]
         );
         this.props.filterProps.confirm!();
       }
    });
  };

  @action
  resetFilter = (): void => {
    this.value = null;

    this.props.form.resetFields();
    this.operator = this.getDefaultOperator();

    this.props.filterProps.clearFilters!(this.props.filterProps.selectedKeys!);
    this.props.filterProps.confirm!();
  };

  @action
  changeOperator = (newOperator: ComparisonType): void => {
    const oldOperator: ComparisonType = this.operator;

    const oldOperatorGroup: OperatorGroup = determineOperatorGroup(oldOperator);
    const newOperatorGroup: OperatorGroup = determineOperatorGroup(newOperator);

    if (oldOperatorGroup !== newOperatorGroup) {
      this.props.form.resetFields();
      this.value = null;
    }

    this.operator = newOperator;

    this.setDefaultYesNoDropdown();
  };

  @action
  setDefaultYesNoDropdown = (): void => {
    if (!this.value &&
      (this.operator === 'notEmpty' || this.propertyInfoNN.type === 'boolean')
    ) {
      this.value = 'true';
    }
  };

  @action
  onTextInputChange = (event: any): void => {
    this.value = event.target.value;
  };

  @action
  onDatePickerChange = (_date: Moment | null, dateString: string): void => {
    this.value = dateString;
  };

  @action
  onTimePickerChange = (time: Moment | null, _timeString: string): void => {
    if (time) {
      this.value = time.format('HH:mm:ss.mmm');
    }
  };

  @action
  onDateTimePickerChange = (dateTime: Moment, _timeString: string): void => {
    if (dateTime) {
      this.value = dateTime.format('YYYY-MM-DD HH:mm:ss.000');
    }
  };

  @action
  setValue = (value: any): void => {
    this.value = value;
  };

  render() {
    this.getFieldDecorator = this.props.form.getFieldDecorator;

    if (this.loading) {
      return (
        <Spin
          tip='Loading...'
          style={{margin: '12px'}}
        />
      );
    }

    return (
      <Form layout='inline' onSubmit={this.handleSubmit}>
        <div>
          <div className={'data-table-custom-filter'}>
            <div className={'data-table-custom-filter-form-item-group'}>
              <Form.Item style={{whiteSpace: 'nowrap'}} className={'data-table-custom-filter-form-item'}>
                {this.propertyCaption}
              </Form.Item>
              <Form.Item className={'data-table-custom-filter-form-item'}>
                {this.getFieldDecorator(
                  `${this.props.entityProperty}.operatorsDropdown`,
                  {initialValue: this.getDefaultOperator()})(
                  <Select
                    dropdownMatchSelectWidth={false}
                    onChange={(operator: ComparisonType) => this.changeOperator(operator)}>
                    {this.operatorTypeOptions}
                  </Select>
                )}
              </Form.Item>
              {this.simpleFilterEditor}
            </div>
            {this.complexFilterEditor}
          </div>
          <Divider style={{margin: '0'}} />
          <div style={{display: 'flex', justifyContent: 'left'}}>
            <Button htmlType='submit'
                style={{marginRight: '12px'}}
                type='link'>
              OK
            </Button>
            <Button className='entity-filter-ui__element'
                htmlType='button'
                type='link'
                onClick={this.resetFilter}>
              Reset
            </Button>
          </div>
        </div>
      </Form>
    );
  }

  getDefaultOperator(): ComparisonType {
    const propertyInfo: MetaPropertyInfo = this.propertyInfoNN;

    switch (propertyInfo.attributeType) {
      case 'ENUM':
      case 'ASSOCIATION':
      case 'COMPOSITION':
        return '=';
    }

    switch (propertyInfo.type as PropertyType) {
      case 'boolean':
        return '=';
      case 'date':
      case 'time':
      case 'dateTime':
        return '=';
      case 'int':
      case 'double':
      case 'decimal':
        return '=';
      case 'string':
        return 'contains';
      default:
        throw new Error(`Unexpected property type ${propertyInfo.type}`)
    }
  }

  @computed
  get operatorTypeOptions(): ReactNode {
    const propertyInfo: MetaPropertyInfo = this.propertyInfoNN;

    const availableOperators: ComparisonType[] = getAvailableOperators(propertyInfo);

    return availableOperators.map((operator: ComparisonType) => {
      return <Select.Option key={`${this.props.entityProperty}.${operator}`}
               value={operator}>
        {this.getOperatorCaption(operator)}
      </Select.Option>;
    });
  }

  getOperatorCaption = (operator: ComparisonType): string => {
    // TODO Mock. Where to get localized captions for operators?
    switch (operator) {
      case '=':
      case '>':
      case '>=':
      case '<':
      case '<=':
      case '<>':
        return operator;
      case 'startsWith':
        return 'starts with'; // TODO mock
      case 'endsWith':
        return 'ends with'; // TODO mock
      case 'contains':
        return 'contains'; // TODO mock
      case 'doesNotContain':
        return "doesn't contain"; // TODO mock
      case 'in':
        return 'in'; // TODO mock
      case 'notIn':
        return 'not in'; // TODO mock
      case 'notEmpty':
        return 'is set'; // TODO mock
      case 'inInterval':
        return 'in interval'; // TODO mock
      default:
        throw new Error(`Unexpected ComparisonType ${operator}`);
    }
  };

  @computed
  get simpleFilterEditor(): ReactNode {
    return isComplexOperator(this.operator) ? null : this.conditionInput;
  }

  @computed
  get complexFilterEditor(): ReactNode {
    return isComplexOperator(this.operator) ? this.conditionInput : null;
  }

  @computed
  get conditionInput(): ReactNode {
    const propertyInfo: MetaPropertyInfo = this.propertyInfoNN;

    switch (propertyInfo.attributeType) {
      // In case of enum generic filter will not be rendered, enum filter will be rendered instead
      case 'ASSOCIATION':
      case 'COMPOSITION':
        switch (this.operator) {
          case '=':
          case '<>':
            return this.selectField;
          case 'in':
          case 'notIn':
            return this.listEditor;
          case 'notEmpty':
            return this.yesNoSelectField;
        }
    }

    switch (propertyInfo.type as PropertyType) {
      case 'boolean':
        return this.yesNoSelectField;

      case 'dateTime':
        switch (this.operator) {
          case '=':
          case '<>':
          case '>':
          case '>=':
          case '<':
          case '<=':
            return this.dateTimePickerField;
          case 'in':
          case 'notIn':
            return this.listEditor;
          case 'notEmpty':
            return this.yesNoSelectField;
          case 'inInterval':
            return this.intervalEditor;
        }
        throw new Error(`Unexpected combination of property type ${propertyInfo.type} and condition operator ${this.operator}`);

      case 'date':
        switch (this.operator) {
          case '=':
          case '<>':
          case '>':
          case '>=':
          case '<':
          case '<=':
            return this.datePickerField;
          case 'in':
          case 'notIn':
            return this.listEditor;
          case 'notEmpty':
            return this.yesNoSelectField;
          case 'inInterval':
            return this.intervalEditor;
        }
        throw new Error(`Unexpected combination of property type ${propertyInfo.type} and condition operator ${this.operator}`);

      case 'time':
        switch (this.operator) {
          case '=':
          case '<>':
          case '>':
          case '>=':
          case '<':
          case '<=':
            return this.timePickerField;
          case 'in':
          case 'notIn':
            return this.listEditor;
          case 'notEmpty':
            return this.yesNoSelectField;
        }
        throw new Error(`Unexpected combination of property type ${propertyInfo.type} and condition operator ${this.operator}`);

      case 'int':
      case 'double':
      case 'decimal':
        switch (this.operator) {
          case '=':
          case '<>':
          case '>':
          case '>=':
          case '<':
          case '<=':
            return this.numberInputField;
          case 'in':
          case 'notIn':
            return this.listEditor;
          case 'notEmpty':
            return this.yesNoSelectField;
        }
        throw new Error(`Unexpected combination of property type ${propertyInfo.type} and condition operator ${this.operator}`);

      case 'string':
        switch (this.operator) {
          case 'contains':
          case 'doesNotContain':
          case '=':
          case '<>':
          case 'startsWith':
          case 'endsWith':
            return this.textInputField;
          case 'in':
          case 'notIn':
            return this.listEditor;
          case 'notEmpty':
            return this.yesNoSelectField;
        }
        throw new Error(`Unexpected combination of property type ${propertyInfo.type} and condition operator ${this.operator}`);

      default:
        throw new Error(`Unexpected combination of property type ${propertyInfo.type} and condition operator ${this.operator}`);
    }
  }

  // TODO i18n for validation messages for all form elements
  @computed
  get textInputField(): ReactNode {
    return (
      <Form.Item hasFeedback={true} className={'data-table-custom-filter-form-item'}>
        {this.getFieldDecorator(`${this.props.entityProperty}.input`, { initialValue: null, rules: [{required: true, message: this.VALIDATION_REQUIRED_MSG}] })(
          <Input onChange={this.onTextInputChange}/>
        )}
      </Form.Item>
    );
  }

  @computed
  get numberInputField(): ReactNode {
    return (
      <Form.Item hasFeedback={true} className={'data-table-custom-filter-form-item'}>
        {this.getFieldDecorator(`${this.props.entityProperty}.input`, { initialValue: null, rules: [{required: true, message: this.VALIDATION_REQUIRED_MSG}] })(
          <InputNumber onChange={this.setValue}/>
        )}
      </Form.Item>
    );
  }

  @computed
  get selectField(): ReactNode {
    return (
      <Form.Item className={'data-table-custom-filter-form-item'}>
        {this.getFieldDecorator(`${this.props.entityProperty}.input`, {initialValue: null, rules: [{required: true, message: this.VALIDATION_REQUIRED_MSG}]})(
          <Select dropdownMatchSelectWidth={false}
              style={{ minWidth: '60px' }}
              onSelect={this.setValue}>
            {this.selectFieldOptions}
          </Select>
        )}
      </Form.Item>
    );
  }

  @computed
  get selectFieldOptions(): ReactNode {
    return this.nestedEntityOptions.map((option) => {
      return (
        <Select.Option title={option.caption} value={option.value} key={option.value}>
          {option.caption}
        </Select.Option>
      );
    })
  }

  // TODO get localized captions
  @computed
  get yesNoSelectField(): ReactNode {
    return (
      <Form.Item className={'data-table-custom-filter-form-item'}>
        {this.getFieldDecorator(`${this.props.entityProperty}.input`, {initialValue: 'true', rules: [{required: true}]})(
          <Select dropdownMatchSelectWidth={false}
              style={{ minWidth: '60px' }}
              onSelect={this.setValue}>
            <Select.Option value='true'>Yes</Select.Option>
            <Select.Option value='false'>No</Select.Option>
          </Select>
        )}
      </Form.Item>
    );
  }

  @computed
  get listEditor(): ReactNode {
    return (
      <Form.Item className={'data-table-custom-filter-form-item'} style={{marginRight: 0}}>
        <DataTableListEditor onChange={(value: any) => this.value = value}
                             id={this.props.entityProperty}
                             propertyInfo={this.propertyInfoNN}
                             getFieldDecorator={this.props.form.getFieldDecorator}
                             nestedEntityOptions={this.nestedEntityOptions}
        />
      </Form.Item>
    );
  }

  @computed
  get intervalEditor(): ReactNode {
    return (
      <Form.Item className={'data-table-custom-filter-form-item'} style={{marginRight: 0}}>
        <DataTableIntervalEditor onChange={(value: any) => this.value = value}
                                 id={this.props.entityProperty}
                                 getFieldDecorator={this.props.form.getFieldDecorator}
        />
      </Form.Item>
    );
  };

  @computed
  get datePickerField(): ReactNode {
    return (
      <Form.Item hasFeedback={true} className={'data-table-custom-filter-form-item'}>
        {this.getFieldDecorator(`${this.props.entityProperty}.input`, { initialValue: null, rules: [{required: true, message: this.VALIDATION_REQUIRED_MSG}] })(
          <DatePicker placeholder='YYYY-MM-DD' onChange={this.onDatePickerChange}/>
        )}
      </Form.Item>
    );
  }

  @computed
  get timePickerField(): ReactNode {
    return (
      <Form.Item hasFeedback={true} className={'data-table-custom-filter-form-item'}>
        {this.getFieldDecorator(`${this.props.entityProperty}.input`, { initialValue: null, rules: [{required: true, message: this.VALIDATION_REQUIRED_MSG}] })(
          <TimePicker placeholder='HH:mm:ss'
                defaultOpenValue={moment('00:00:00', 'HH:mm:ss')}
                onChange={this.onTimePickerChange}/>
        )}
      </Form.Item>
    );
  }

  @computed
  get dateTimePickerField(): ReactNode {
    return (
      <Form.Item hasFeedback={true} className={'data-table-custom-filter-form-item'}>
        <div className={'data-table-custom-filter-form-item-group'}>
          <Form.Item hasFeedback={true} className={'data-table-custom-filter-form-item'}>
            {this.getFieldDecorator(`${this.props.entityProperty}.input`, { initialValue: null, rules: [{required: true, message: this.VALIDATION_REQUIRED_MSG}] })(
              <DatePicker placeholder='YYYY-MM-DD'/>
            )}
          </Form.Item>
          <Form.Item hasFeedback={true} className={'data-table-custom-filter-form-item'}>
            {this.getFieldDecorator(`${this.props.entityProperty}.input`, { initialValue: null, rules: [{required: true, message: this.VALIDATION_REQUIRED_MSG}] })(
              <TimePicker placeholder='HH:mm:ss'
                    defaultOpenValue={moment('00:00:00', 'HH:mm:ss')}
                    onChange={this.onDateTimePickerChange}/>
            )}
          </Form.Item>
        </div>
      </Form.Item>
    );
  }

}

export default Form.create<DataTableCustomFilterProps>()(DataTableCustomFilter);

function determineOperatorGroup(operator: ComparisonType): OperatorGroup {
  switch (operator) {
    case '=':
    case '>':
    case '>=':
    case '<':
    case '<=':
    case '<>':
    case 'startsWith':
    case 'endsWith':
    case 'contains':
    case 'doesNotContain':
      return OperatorGroup.SINGLE_VALUE;
    case 'in':
    case 'notIn':
      return OperatorGroup.LIST_VALUE;
    case 'notEmpty':
      return OperatorGroup.LOGICAL_VALUE;
    case 'inInterval':
      return OperatorGroup.INTERVAL_VALUE;
    default:
      throw new Error(`Unexpected ComparisonType ${operator}`);
  }
}

function getAvailableOperators(propertyInfo: MetaPropertyInfo): ComparisonType[] {
  switch (propertyInfo.attributeType) {
    case 'ENUM':
    case 'ASSOCIATION':
    case 'COMPOSITION':
      return ['=', '<>', 'in', 'notIn', 'notEmpty'];
  }

  switch (propertyInfo.type as PropertyType) {
    case 'boolean':
      return ['=', '<>', 'notEmpty'];
    case 'date':
    case 'dateTime':
      return ['=', 'in', 'notIn', '<>', '>', '>=', '<', '<=', 'notEmpty', 'inInterval'];
    case 'time':
      return ['=', 'in', 'notIn', '<>', '>', '>=', '<', '<=', 'notEmpty'];
    case 'int':
    case 'double':
    case 'decimal':
      return ['=', 'in', 'notIn', '<>', '>', '>=', '<', '<=', 'notEmpty'];
    case 'string':
      return ['contains', '=', 'in', 'notIn', '<>', 'doesNotContain', 'notEmpty', 'startsWith', 'endsWith'];
    default:
      throw new Error(`Unexpected property type ${propertyInfo.type}`)
  }
}

function isComplexOperator(operator: ComparisonType): boolean {
  const complexOperators: string[] = ['in', 'notIn', 'inInterval'];
  return complexOperators.includes(operator);
}
