// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as React from "react";
import * as ReactDOM from "react-dom";

import * as globals from "../../../globals";
import * as R from "../../../resources";

import {
  Color,
  ColorGradient,
  EventSubscription,
  getField,
  Point,
  Prototypes,
  Specification,
  uniqueID,
  refineColumnName,
  EventEmitter,
  getById,
} from "../../../../core";
import { Actions, DragData } from "../../../actions";
import { ButtonRaised, GradientPicker } from "../../../components";
import { SVGImageIcon } from "../../../components/icons";
import { PopupView } from "../../../controllers";
import {
  DragContext,
  DragModifiers,
  Droppable,
} from "../../../controllers/drag_controller";

import { AppStore } from "../../../stores";
import {
  classNames,
  showOpenFileDialog,
  readFileAsString,
  getAligntment,
} from "../../../utils/index";
import { DataFieldSelector } from "../../dataset/data_field_selector";
import { ReorderListView } from "../object_list_editor";
import {
  Button,
  InputColorGradient,
  InputImage,
  InputImageProperty,
  FluentComboBoxFontFamily,
} from "./controls";
import { FilterEditor } from "./filter_editor";
import { GroupByEditor } from "./groupby_editor";
import { ChartTemplate } from "../../../../container";
import {
  TextExpression,
  FunctionCall,
  Variable,
} from "../../../../core/expression";
import { getDateFormat } from "../../../../core/dataset/datetime";
import { ScaleMapping } from "../../../../core/specification";
import { ScaleValueSelector } from "../scale_value_selector";

import {
  IconButton,
  TextField,
  DatePicker,
  DefaultButton,
  DayOfWeek,
  Checkbox,
  Label,
  ComboBox,
  Dropdown,
  IDropdownOption,
} from "@fluentui/react";
import { FluentMappingEditor } from "./fluent_mapping_editor";
import { CharticulatorPropertyAccessors } from "./manager";
import { FluentInputColor } from "./controls/fluentui_input_color";
import { FluentInputExpression } from "./controls/fluentui_input_expression";

import { Icon } from "@fluentui/react/lib/Icon";
import { FluentButton } from "./controls/fluentui_buttons";
import { FluentInputNumber } from "./controls/fluentui_input_number";
import { InputFontComboboxOptions } from "../../../../core/prototypes/controls";

export type OnEditMappingHandler = (
  attribute: string,
  mapping: Specification.Mapping
) => void;
export type OnMapDataHandler = (
  attribute: string,
  data: DragData.DataExpression,
  hints: Prototypes.DataMappingHints
) => void;
export type OnSetPropertyHandler = (
  property: string,
  field: string,
  value: Specification.AttributeValue
) => void;

export class FluentUIWidgetManager
  implements Prototypes.Controls.WidgetManager, CharticulatorPropertyAccessors {
  constructor(
    public store: AppStore,
    public objectClass: Prototypes.ObjectClass
  ) {}

  public onMapDataHandler: OnMapDataHandler;
  public onEditMappingHandler: OnEditMappingHandler;

  public mappingEditor(
    name: string,
    attribute: string,
    options: Prototypes.Controls.MappingEditorOptions
  ): JSX.Element {
    const objectClass = this.objectClass;
    const info = objectClass.attributes[attribute];
    if (options.defaultValue == null) {
      options.defaultValue = info.defaultValue;
    }

    const openMapping =
      options.openMapping || attribute === this.store.currentAttributeFocus;
    if (openMapping) {
      setTimeout(() => {
        this.store.dispatcher.dispatch(new Actions.FocusToMarkAttribute(null));
      }, 0);
    }

    return this.row(
      name,
      <FluentMappingEditor
        store={this.store}
        parent={this}
        attribute={attribute}
        type={info.type}
        options={{
          ...options,
          openMapping,
        }}
      />
    );
  }

  public getAttributeMapping(attribute: string) {
    return this.objectClass.object.mappings[attribute];
  }

  public getPropertyValue(property: Prototypes.Controls.Property) {
    const prop = this.objectClass.object.properties[property.property];
    let value: Specification.AttributeValue;
    if (property.field != null) {
      value = getField(prop, property.field);
    } else {
      value = prop;
    }
    return value;
  }

  private getDateFormat(property: Prototypes.Controls.Property) {
    try {
      const prop = this.objectClass.object.properties[property.property] as any;
      const expressionString: string = prop.expression;
      const expression = TextExpression.Parse(`\$\{${expressionString}\}`);
      // const table = this.store.chartManager.dataflow.getTable((this.objectClass.object as any).table);
      const functionCallpart = expression.parts.find((part) => {
        if (part.expression instanceof FunctionCall) {
          return part.expression.args.find(
            (arg) => arg instanceof Variable
          ) as any;
        }
      }).expression as FunctionCall;
      if (functionCallpart) {
        const variable = functionCallpart.args.find(
          (arg) => arg instanceof Variable
        ) as Variable;
        const columnName = variable.name;
        const tableName = (this.objectClass.object as any).table;
        const table = this.store.dataset.tables.find(
          (table) => table.name === tableName
        );
        const column = table.columns.find(
          (column) => column.name === columnName
        );
        if (column.metadata.format) {
          return column.metadata.format;
        }
        const rawColumnName = column.metadata.rawColumnName;
        if (
          rawColumnName &&
          (column.metadata.kind === Specification.DataKind.Temporal ||
            column.type === Specification.DataType.Boolean)
        ) {
          const value = (
            table.rows[0][rawColumnName] || refineColumnName(rawColumnName)
          ).toString();
          return getDateFormat(value);
        }
      }
    } catch (ex) {
      console.warn(ex);
      return null;
    }

    return null;
  }

  public emitSetProperty(
    property: Prototypes.Controls.Property,
    value: Specification.AttributeValue
  ) {
    new Actions.SetObjectProperty(
      this.objectClass.object,
      property.property,
      property.field,
      value,
      property.noUpdateState,
      property.noComputeLayout
    ).dispatch(this.store.dispatcher);
  }

  public inputNumber(
    property: Prototypes.Controls.Property,
    options: Prototypes.Controls.InputNumberOptions = {}
  ) {
    const value = this.getPropertyValue(property) as number;
    return (
      <FluentInputNumber
        {...options}
        defaultValue={value}
        onEnter={(value) => {
          if (value == null) {
            this.emitSetProperty(property, null);
            return true;
          } else {
            this.emitSetProperty(property, value);
            return true;
          }
        }}
      />
    );
  }

  public inputDate(
    property: Prototypes.Controls.Property,
    options: Prototypes.Controls.InputDateOptions = {}
  ) {
    const value = this.getPropertyValue(property) as number;
    const format = this.getDateFormat(property) as string;

    return (
      <DatePicker
        firstDayOfWeek={DayOfWeek.Sunday}
        placeholder="Select a date..."
        ariaLabel="Select a date"
        defaultValue={format}
        // value={value}
        onSelectDate={(value: Date) => {
          if (value == null) {
            this.emitSetProperty(property, null);
            return true;
          } else {
            this.emitSetProperty(property, value as any);
            return true;
          }
        }}
      />
    );
  }

  public inputText(
    property: Prototypes.Controls.Property,
    placeholder?: string
  ) {
    return (
      <TextField
        defaultValue={this.getPropertyValue(property) as string}
        placeholder={placeholder}
        onChange={(event, value) => {
          this.emitSetProperty(property, value);
        }}
        type="text"
      />
    );
  }

  public inputFontFamily(
    property: Prototypes.Controls.Property,
    options: InputFontComboboxOptions
  ) {
    return (
      <FluentComboBoxFontFamily
        label={options.label}
        defaultValue={this.getPropertyValue(property) as string}
        onEnter={(value) => {
          this.emitSetProperty(property, value);
          return true;
        }}
      />
    );
  }

  public inputComboBox(
    property: Prototypes.Controls.Property,
    options: Prototypes.Controls.InputComboboxOptions
  ) {
    return (
      <ComboBox
        selectedKey={this.getPropertyValue(property) as string}
        label={options.label}
        autoComplete="on"
        options={options.defaultRange.map((rangeValue) => {
          return {
            key: rangeValue,
            text: rangeValue,
          };
        })}
        onChange={(event, value) => {
          this.emitSetProperty(property, value.key);
          return true;
        }}
      />
    );
  }

  public inputSelect(
    property: Prototypes.Controls.Property,
    options: Prototypes.Controls.InputSelectOptions
  ) {
    if (options.type == "dropdown") {
      const iconStyles = { marginRight: "8px" };

      const onRenderOption = (option: IDropdownOption): JSX.Element => {
        return (
          <>
            {option.data && option.data.icon && (
              <Icon
                style={iconStyles}
                iconName={option.data.icon}
                aria-hidden="true"
                title={option.data.icon}
              />
            )}
            <span>{option.text}</span>
          </>
        );
      };

      const onRenderTitle = (options: IDropdownOption[]): JSX.Element => {
        const option = options[0];

        return (
          <div>
            {option.data && option.data.icon && (
              <Icon
                style={iconStyles}
                iconName={option.data.icon}
                aria-hidden="true"
                title={option.data.icon}
              />
            )}
            <span>{option.text}</span>
          </div>
        );
      };

      return (
        <Dropdown
          selectedKey={this.getPropertyValue(property) as string}
          label={options.label}
          onRenderOption={onRenderOption}
          onRenderTitle={onRenderTitle}
          options={options.options.map((rangeValue, index) => {
            return {
              key: rangeValue,
              text: options.labels[index],
              data: {
                icon: options.icons?.[index],
              },
            };
          })}
          onChange={(event, value) => {
            this.emitSetProperty(property, value.key);
            return true;
          }}
        />
      );
    } else {
      return (
        <>
          {options.options.map((option, index) => {
            return (
              <IconButton
                iconProps={{
                  iconName: options.icons[index],
                }}
                title={options.labels[index]}
                checked={option === (this.getPropertyValue(property) as string)}
                onClick={() => {
                  this.emitSetProperty(property, option);
                }}
              />
            );
          })}
        </>
      );
    }
  }
  public inputBoolean(
    property: Prototypes.Controls.Property,
    options: Prototypes.Controls.InputBooleanOptions
  ) {
    switch (options.type) {
      case "checkbox-fill-width":
      case "checkbox": {
        return (
          <Checkbox
            label={options.label}
            onChange={(event, v) => {
              this.emitSetProperty(property, v);
            }}
          />
        );
      }
      case "highlight": {
        return (
          <IconButton
            iconProps={{
              iconName: options.icon,
            }}
            title={options.label}
            label={options.label}
            text={options.label}
            ariaLabel={options.label}
            checked={this.getPropertyValue(property) as boolean}
            onClick={() => {
              const v = this.getPropertyValue(property) as boolean;
              this.emitSetProperty(property, !v);
            }}
          />
        );
      }
    }
  }

  public inputExpression(
    property: Prototypes.Controls.Property,
    options: Prototypes.Controls.InputExpressionOptions = {}
  ) {
    return (
      <FluentInputExpression
        label={options.label}
        defaultValue={this.getPropertyValue(property) as string}
        validate={(value) => {
          if (value && value.trim() !== "") {
            return this.store.verifyUserExpressionWithTable(
              value,
              options.table
            );
          }
          return {
            pass: true,
          };
        }}
        placeholder="(none)"
        onEnter={(value) => {
          if (!value || value.trim() == "") {
            this.emitSetProperty(property, null);
          } else {
            this.emitSetProperty(property, value);
          }
          return true;
        }}
      />
    );
  }
  public inputColor(
    property: Prototypes.Controls.Property,
    options: Prototypes.Controls.InputColorOptions = {}
  ): JSX.Element {
    const color = this.getPropertyValue(property) as Color;
    return (
      <FluentInputColor
        store={this.store}
        defaultValue={color}
        allowNull={options.allowNull}
        onEnter={(value) => {
          this.emitSetProperty(property, value);
          return true;
        }}
      />
    );
  }
  public inputColorGradient(
    property: Prototypes.Controls.Property,
    inline: boolean = false
  ): JSX.Element {
    const gradient = (this.getPropertyValue(property) as any) as ColorGradient;
    if (inline) {
      return (
        <span className="charticulator__widget-control-input-color-gradient-inline">
          <GradientPicker
            defaultValue={gradient}
            onPick={(value: any) => {
              this.emitSetProperty(property, value);
            }}
          />
        </span>
      );
    } else {
      return (
        <InputColorGradient
          defaultValue={gradient}
          onEnter={(value: any) => {
            this.emitSetProperty(property, value);
            return true;
          }}
        />
      );
    }
  }
  public inputImage(property: Prototypes.Controls.Property) {
    return (
      <InputImage
        value={this.getPropertyValue(property) as Specification.Types.Image}
        onChange={(image) => {
          this.emitSetProperty(property, image as Specification.Types.Image);
          return true;
        }}
      />
    );
  }
  public inputImageProperty(property: Prototypes.Controls.Property) {
    return (
      <InputImageProperty
        value={this.getPropertyValue(property) as Specification.Types.Image}
        onChange={(image) => {
          this.emitSetProperty(property, image as Specification.Types.Image);
          return true;
        }}
      />
    );
  }

  public clearButton(property: Prototypes.Controls.Property, icon?: string) {
    return (
      <FluentButton>
        <DefaultButton
          iconProps={{
            iconName: "EraseTool",
          }}
        />
      </FluentButton>
    );
  }

  public setButton(
    property: Prototypes.Controls.Property,
    value: Specification.AttributeValue,
    icon?: string,
    text?: string
  ) {
    return (
      // <Button
      //   text={text}
      //   icon={icon}
      //   onClick={() => {
      //     this.emitSetProperty(property, value);
      //   }}
      // />
      <DefaultButton
        iconProps={{
          iconName: icon,
        }}
        text={text}
        onClick={() => {
          this.emitSetProperty(property, value);
        }}
      />
    );
  }

  public scaleEditor(attribute: string, text: string) {
    let mappingButton: Element = null;

    const objectClass = this.objectClass;
    const mapping = objectClass.object.mappings[attribute] as ScaleMapping;

    const scaleObject = getById(this.store.chart.scales, mapping.scale);

    const scale = mapping.scale;

    const parent = {
      updateEvents: new EventEmitter(),
    };

    return (
      <Button
        ref={(e) => (mappingButton = ReactDOM.findDOMNode(e) as Element)}
        text={text}
        // icon={icon}
        onClick={() => {
          const options = {
            allowSelectValue: true,
          };
          // const mapping = this.getAttributeMapping(attribute);
          globals.popupController.popupAt(
            (context) => {
              return (
                <PopupView context={context}>
                  {/* <DataMappAndScaleEditor
                    attribute={attribute}
                    parent={parent as any}
                    defaultMapping={mapping}
                    options={options}
                    onClose={() => context.close()}
                  /> */}
                  <ScaleValueSelector
                    scale={scaleObject}
                    scaleMapping={mapping}
                    store={this.store}
                  />
                </PopupView>
              );
            },
            { anchor: mappingButton }
          );
        }}
      />
    );
  }

  public orderByWidget(
    property: Prototypes.Controls.Property,
    options: Prototypes.Controls.OrderWidgetOptions
  ) {
    let ref: DropZoneView;
    return (
      <DropZoneView
        filter={(data) => data instanceof DragData.DataExpression}
        onDrop={(data: DragData.DataExpression) => {
          this.emitSetProperty(property, { expression: data.expression });
        }}
        ref={(e) => (ref = e)}
        className={classNames("charticulator__widget-control-order-widget", [
          "is-active",
          this.getPropertyValue(property) != null,
        ])}
        onClick={() => {
          globals.popupController.popupAt(
            (context) => {
              let fieldSelector: DataFieldSelector;
              let currentExpression: string = null;
              const currentSortBy = this.getPropertyValue(
                property
              ) as Specification.Types.SortBy;
              if (currentSortBy != null) {
                currentExpression = currentSortBy.expression;
              }
              return (
                <PopupView context={context}>
                  <div className="charticulator__widget-popup-order-widget">
                    <div className="el-row">
                      <DataFieldSelector
                        ref={(e) => (fieldSelector = e)}
                        nullDescription="(default order)"
                        datasetStore={this.store}
                        useAggregation={true}
                        defaultValue={
                          currentExpression
                            ? {
                                table: options.table,
                                expression: currentExpression,
                              }
                            : null
                        }
                        onChange={(value) => {
                          if (value != null) {
                            this.emitSetProperty(property, {
                              expression: value.expression,
                            });
                          } else {
                            this.emitSetProperty(property, null);
                          }
                          context.close();
                        }}
                      />
                    </div>
                  </div>
                </PopupView>
              );
            },
            { anchor: ref.dropContainer }
          );
        }}
      >
        <SVGImageIcon url={R.getSVGIcon("general/sort")} />
        <SVGImageIcon url={R.getSVGIcon("general/dropdown")} />
      </DropZoneView>
    );
  }

  public reorderWidget(
    property: Prototypes.Controls.Property,
    allowReset: boolean
  ): JSX.Element {
    let container: HTMLSpanElement;
    return (
      <span ref={(e) => (container = e)}>
        <Button
          icon={"general/sort"}
          active={false}
          onClick={() => {
            globals.popupController.popupAt(
              (context) => {
                const items = this.getPropertyValue(property) as string[];
                return (
                  <PopupView context={context}>
                    <ReorderStringsValue
                      items={items}
                      onConfirm={(items) => {
                        this.emitSetProperty(property, items);
                        context.close();
                      }}
                      onReset={() => {
                        const axisDataBinding = {
                          ...(this.objectClass.object.properties[
                            property.property
                          ] as any),
                        };

                        axisDataBinding.table = this.store.chartManager.getTable(
                          (this.objectClass.object as any).table
                        );
                        axisDataBinding.metadata = {
                          kind: axisDataBinding.dataKind,
                          orderMode: "order",
                        };

                        const groupBy: Specification.Types.GroupBy = this.store.getGroupingExpression(
                          this.objectClass.object
                        );
                        const values = this.store.chartManager.getGroupedExpressionVector(
                          (this.objectClass.object as any).table,
                          groupBy,
                          axisDataBinding.expression
                        );

                        return this.store.getCategoriesForDataBinding(
                          axisDataBinding.metadata,
                          values
                        );
                      }}
                      allowReset={allowReset}
                    />
                  </PopupView>
                );
              },
              { anchor: container }
            );
          }}
        />
      </span>
    );
  }

  public arrayWidget(
    property: Prototypes.Controls.Property,
    renderItem: (item: Prototypes.Controls.Property) => JSX.Element,
    options: Prototypes.Controls.ArrayWidgetOptions = {
      allowDelete: true,
      allowReorder: true,
    }
  ): JSX.Element {
    const items = (this.getPropertyValue(property) as any[]).slice();
    return (
      <div className="charticulator__widget-array-view">
        <ReorderListView
          enabled={options.allowReorder}
          onReorder={(dragIndex, dropIndex) => {
            ReorderListView.ReorderArray(items, dragIndex, dropIndex);
            this.emitSetProperty(property, items);
          }}
        >
          {items.map((item, index) => {
            return (
              <div
                key={index}
                className="charticulator__widget-array-view-item"
              >
                {options.allowReorder ? (
                  <span className="charticulator__widget-array-view-control charticulator__widget-array-view-order">
                    <SVGImageIcon url={R.getSVGIcon("general/order")} />
                  </span>
                ) : null}
                <span className="charticulator__widget-array-view-content">
                  {renderItem({
                    property: property.property,
                    field: property.field
                      ? property.field instanceof Array
                        ? [...property.field, index]
                        : [property.field, index]
                      : index,
                  })}
                </span>
                {options.allowDelete ? (
                  <span className="charticulator__widget-array-view-control">
                    <Button
                      icon="general/cross"
                      onClick={() => {
                        items.splice(index, 1);
                        this.emitSetProperty(property, items);
                      }}
                    />
                  </span>
                ) : null}
              </div>
            );
          })}
        </ReorderListView>
      </div>
    );
  }

  public dropTarget(
    options: Prototypes.Controls.DropTargetOptions,
    widget: JSX.Element
  ) {
    return (
      <DropZoneView
        filter={(data) => data instanceof DragData.DataExpression}
        onDrop={(data: DragData.DataExpression) => {
          this.emitSetProperty(options.property, {
            expression: data.expression,
          });
        }}
        className={classNames("charticulator__widget-control-drop-target")}
        draggingHint={() => (
          <span className="el-dropzone-hint">{options.label}</span>
        )}
      >
        {widget}
      </DropZoneView>
    );
  }

  // Label and text
  public icon(icon: string) {
    return (
      <span className="charticulator__widget-label">
        <SVGImageIcon url={R.getSVGIcon(icon)} />
      </span>
    );
  }
  public label(title: string) {
    // return <span className="charticulator__widget-label">{title}</span>;
    return <Label>{title}</Label>;
  }
  public text(title: string, align: "left" | "center" | "right" = "left") {
    return (
      <span className="charticulator__widget-text" style={{ textAlign: align }}>
        {title}
      </span>
    );
  }
  public sep() {
    return <span className="charticulator__widget-sep" />;
  }

  // Layout elements
  public sectionHeader(
    title: string,
    widget?: JSX.Element,
    options: Prototypes.Controls.RowOptions = {}
  ) {
    if (options.dropzone && options.dropzone.type == "axis-data-binding") {
      let refButton: Element;
      const current = this.getPropertyValue({
        property: options.dropzone.property,
      }) as Specification.Types.AxisDataBinding;
      return (
        <DropZoneView
          filter={(data) => data instanceof DragData.DataExpression}
          onDrop={(data: DragData.DataExpression) => {
            new Actions.BindDataToAxis(
              this.objectClass.object as Specification.PlotSegment,
              options.dropzone.property,
              null,
              data
            ).dispatch(this.store.dispatcher);
          }}
          className="charticulator__widget-section-header charticulator__widget-section-header-dropzone"
          draggingHint={() => (
            <span className="el-dropzone-hint">{options.dropzone.prompt}</span>
          )}
        >
          {/* <span className="charticulator__widget-section-header-title">
            {title}
          </span> */}
          <Label>{title}</Label>
          {widget}
          <Button
            icon={"general/bind-data"}
            ref={(e) => (refButton = ReactDOM.findDOMNode(e) as Element)}
            onClick={() => {
              globals.popupController.popupAt(
                (context) => {
                  return (
                    <PopupView context={context}>
                      <DataFieldSelector
                        datasetStore={this.store}
                        defaultValue={
                          current && current.expression
                            ? { table: null, expression: current.expression }
                            : null
                        }
                        useAggregation={true}
                        nullDescription={"(none)"}
                        nullNotHighlightable={true}
                        onChange={(value) => {
                          if (!value) {
                            this.emitSetProperty(
                              { property: options.dropzone.property },
                              null
                            );
                          } else {
                            const data = new DragData.DataExpression(
                              this.store.getTable(value.table),
                              value.expression,
                              value.type,
                              value.metadata,
                              value.rawExpression
                            );
                            new Actions.BindDataToAxis(
                              this.objectClass
                                .object as Specification.PlotSegment,
                              options.dropzone.property,
                              null,
                              data
                            ).dispatch(this.store.dispatcher);
                          }
                        }}
                      />
                    </PopupView>
                  );
                },
                { anchor: refButton }
              );
            }}
            active={false}
          />
        </DropZoneView>
      );
    } else {
      return (
        <div className="charticulator__widget-section-header">
          <Label>{title}</Label>
          {/* <span className="charticulator__widget-section-header-title">
            {title}
          </span> */}
          {widget}
        </div>
      );
    }
  }

  public horizontal(cols: number[], ...widgets: JSX.Element[]) {
    return (
      <div className="charticulator__widget-horizontal">
        {widgets.map((x, id) => (
          <span
            className={`el-layout-item el-layout-item-col-${cols[id]}`}
            key={id}
          >
            {x}
          </span>
        ))}
      </div>
    );
  }

  public detailsButton(...widgets: JSX.Element[]): JSX.Element {
    return <DetailsButton widgets={widgets} manager={this} />;
  }

  public filterEditor(
    options: Prototypes.Controls.FilterEditorOptions
  ): JSX.Element {
    switch (options.mode) {
      case "button":
        let button: Button;
        let text = "Filter by...";
        if (options.value) {
          if (options.value.categories) {
            text = "Filter by " + options.value.categories.expression;
          }
          if (options.value.expression) {
            text = "Filter by " + options.value.expression;
          }
        }
        return (
          <Button
            text={text}
            ref={(e) => (button = e)}
            onClick={() => {
              globals.popupController.popupAt(
                (context) => {
                  return (
                    <PopupView context={context}>
                      <FilterEditor
                        manager={this}
                        value={options.value}
                        options={options}
                      />
                    </PopupView>
                  );
                },
                { anchor: ReactDOM.findDOMNode(button) as Element }
              );
            }}
          />
        );
      case "panel":
        return (
          <FilterEditor
            manager={this}
            value={options.value}
            options={options}
          />
        );
    }
  }

  public groupByEditor(
    options: Prototypes.Controls.GroupByEditorOptions
  ): JSX.Element {
    switch (options.mode) {
      case "button":
        let button: Button;
        let text = "Group by...";
        if (options.value) {
          if (options.value.expression) {
            text = "Group by " + options.value.expression;
          }
        }
        return (
          <Button
            text={text}
            ref={(e) => (button = e)}
            onClick={() => {
              globals.popupController.popupAt(
                (context) => {
                  return (
                    <PopupView context={context}>
                      <GroupByEditor
                        manager={this}
                        value={options.value}
                        options={options}
                      />
                    </PopupView>
                  );
                },
                { anchor: ReactDOM.findDOMNode(button) as Element }
              );
            }}
          />
        );
      case "panel":
        return (
          <GroupByEditor
            manager={this}
            value={options.value}
            options={options}
          />
        );
    }
  }

  public nestedChartEditor(
    property: Prototypes.Controls.Property,
    options: Prototypes.Controls.NestedChartEditorOptions
  ) {
    return this.row(
      "",
      this.vertical(
        <ButtonRaised
          text="Edit Nested Chart..."
          onClick={() => {
            const editorID = uniqueID();
            const newWindow = window.open(
              "index.html#!nestedEditor=" + editorID,
              "nested_chart_" + options.specification._id
            );
            const listener = (e: MessageEvent) => {
              if (e.origin == document.location.origin) {
                const data = e.data;
                if (data.id == editorID) {
                  switch (data.type) {
                    case "initialized":
                      {
                        newWindow.postMessage(
                          {
                            id: editorID,
                            type: "load",
                            specification: options.specification,
                            dataset: options.dataset,
                            width: options.width,
                            height: options.height,
                            filterCondition: options.filterCondition,
                          },
                          document.location.origin
                        );
                      }
                      break;
                    case "save":
                      {
                        this.emitSetProperty(property, data.specification);
                      }
                      break;
                  }
                }
              }
            };
            window.addEventListener("message", listener);
          }}
        />,
        <div style={{ marginTop: "5px" }}>
          <ButtonRaised
            text="Import Template..."
            onClick={async () => {
              const file = await showOpenFileDialog(["tmplt"]);
              const str = await readFileAsString(file);
              const data = JSON.parse(str);
              const template = new ChartTemplate(data);
              for (const table of options.dataset.tables) {
                const tTable = template.getDatasetSchema()[0];
                template.assignTable(tTable.name, table.name);
                for (const column of tTable.columns) {
                  template.assignColumn(tTable.name, column.name, column.name);
                }
              }
              const instance = template.instantiate(
                options.dataset,
                false // no scale inference
              );
              this.emitSetProperty(property, instance.chart as any);
            }}
          />
        </div>
      )
    );
  }

  public row(title?: string, widget?: JSX.Element) {
    return (
      <div className="charticulator__widget-row">
        {title != null ? (
          <span className="charticulator__widget-row-label el-layout-item">
            {title}
          </span>
        ) : // <Label>{title}</Label>
        null}
        {widget}
      </div>
    );
  }

  public vertical(...widgets: JSX.Element[]) {
    return (
      <div className="charticulator__widget-vertical">
        {widgets.map((x, id) => (
          <span className="el-layout-item" key={id}>
            {x}
          </span>
        ))}
      </div>
    );
  }

  public table(
    rows: JSX.Element[][],
    options: Prototypes.Controls.TableOptions
  ): JSX.Element {
    return (
      <table className="charticulator__widget-table">
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {row.map((x, i) => (
                <td key={i}>
                  <span className="el-layout-item">{x}</span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  public scrollList(
    widgets: Prototypes.Controls.Widget[],
    options: Prototypes.Controls.ScrollListOptions = {}
  ): JSX.Element {
    return (
      <div
        className="charticulator__widget-scroll-list"
        style={{
          maxHeight: options.maxHeight ? options.maxHeight + "px" : undefined,
          height: options.height ? options.height + "px" : undefined,
        }}
      >
        {widgets.map((widget, i) => (
          <div className="charticulator__widget-scroll-list-item" key={i}>
            {widget}
          </div>
        ))}
      </div>
    );
  }
}

export interface DropZoneViewProps {
  /** Determine whether the data is acceptable */
  filter: (x: any) => boolean;
  /** The user dropped the thing */
  onDrop: (data: any, point: Point, modifiers: DragModifiers) => void;
  /** className of the root div element */
  className: string;
  onClick?: () => void;
  /** Display this instead when dragging (normally we show what's in this view) */
  draggingHint?: () => JSX.Element;
}

export interface DropZoneViewState {
  isInSession: boolean;
  isDraggingOver: boolean;
  data: any;
}

export class DropZoneView
  extends React.Component<DropZoneViewProps, DropZoneViewState>
  implements Droppable {
  public dropContainer: HTMLDivElement;
  public tokens: EventSubscription[];

  constructor(props: DropZoneViewProps) {
    super(props);
    this.state = {
      isInSession: false,
      isDraggingOver: false,
      data: null,
    };
  }

  public componentDidMount() {
    globals.dragController.registerDroppable(this, this.dropContainer);
    this.tokens = [
      globals.dragController.addListener("sessionstart", () => {
        const session = globals.dragController.getSession();
        if (this.props.filter(session.data)) {
          this.setState({
            isInSession: true,
          });
        }
      }),
      globals.dragController.addListener("sessionend", () => {
        this.setState({
          isInSession: false,
        });
      }),
    ];
  }

  public componentWillUnmount() {
    globals.dragController.unregisterDroppable(this);
    this.tokens.forEach((x) => x.remove());
  }

  public onDragEnter(ctx: DragContext) {
    const data = ctx.data;
    const judge = this.props.filter(data);
    if (judge) {
      this.setState({
        isDraggingOver: true,
        data,
      });
      ctx.onLeave(() => {
        this.setState({
          isDraggingOver: false,
          data: null,
        });
      });
      ctx.onDrop((point: Point, modifiers: DragModifiers) => {
        this.props.onDrop(data, point, modifiers);
      });
      return true;
    }
  }

  public render() {
    return (
      <div
        className={classNames(
          this.props.className,
          ["is-in-session", this.state.isInSession],
          ["is-dragging-over", this.state.isDraggingOver]
        )}
        onClick={this.props.onClick}
        ref={(e) => (this.dropContainer = e)}
      >
        {this.props.draggingHint == null
          ? this.props.children
          : this.state.isInSession
          ? this.props.draggingHint()
          : this.props.children}
      </div>
    );
  }
}

export class ReorderStringsValue extends React.Component<
  {
    items: string[];
    onConfirm: (items: string[]) => void;
    allowReset?: boolean;
    onReset?: () => string[];
  },
  { items: string[] }
> {
  public state: { items: string[] } = {
    items: this.props.items.slice(),
  };

  public render() {
    const items = this.state.items.slice();
    return (
      <div className="charticulator__widget-popup-reorder-widget">
        <div className="el-row el-list-view">
          <ReorderListView
            enabled={true}
            onReorder={(a, b) => {
              ReorderListView.ReorderArray(items, a, b);
              this.setState({ items });
            }}
          >
            {items.map((x) => (
              <div key={x} className="el-item">
                {x}
              </div>
            ))}
          </ReorderListView>
        </div>
        <div className="el-row">
          <Button
            icon={"general/order-reversed"}
            text="Reverse"
            onClick={() => {
              this.setState({ items: this.state.items.reverse() });
            }}
          />{" "}
          <Button
            icon={"general/sort"}
            text="Sort"
            onClick={() => {
              this.setState({ items: this.state.items.sort() });
            }}
          />
          {this.props.allowReset && (
            <>
              {" "}
              <Button
                icon={"general/clear"}
                text="Reset"
                onClick={() => {
                  if (this.props.onReset) {
                    const items = this.props.onReset();
                    this.setState({ items });
                  }
                }}
              />
            </>
          )}
        </div>
        <div className="el-row">
          <ButtonRaised
            text="OK"
            onClick={() => {
              this.props.onConfirm(this.state.items);
            }}
          />
        </div>
      </div>
    );
  }
}

export class DetailsButton extends React.Component<
  {
    widgets: JSX.Element[];
    manager: Prototypes.Controls.WidgetManager;
  },
  {}
> {
  public inner: DetailsButtonInner;
  public componentDidUpdate() {
    if (this.inner) {
      this.inner.forceUpdate();
    }
  }

  public render() {
    let btn: Element;
    return (
      <Button
        icon={"general/more-horizontal"}
        ref={(e) => (btn = ReactDOM.findDOMNode(e) as Element)}
        onClick={() => {
          globals.popupController.popupAt(
            (context) => {
              return (
                <PopupView context={context}>
                  <DetailsButtonInner
                    parent={this}
                    ref={(e) => (this.inner = e)}
                  />
                </PopupView>
              );
            },
            {
              anchor: btn,
              alignX: getAligntment(btn).alignX,
            }
          );
        }}
      />
    );
  }
}

export class DetailsButtonInner extends React.Component<
  { parent: DetailsButton },
  {}
> {
  public render() {
    const parent = this.props.parent;
    return (
      <div className="charticulator__widget-popup-details">
        {parent.props.manager.vertical(...parent.props.widgets)}
      </div>
    );
  }
}
