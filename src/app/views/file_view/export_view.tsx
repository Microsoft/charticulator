/*
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT license.
*/
import * as React from "react";
import * as FileSaver from "file-saver";

import * as R from "../../resources";
import { Actions } from "../../actions";
import { ContextedComponent } from "../../context_component";
import { CurrentChartView } from ".";
import { ButtonRaised, SVGImageIcon } from "../../components";
import { classNames } from "../../utils";
import { Specification, deepClone, getById } from "../../../core";
import { ExportTemplateTarget } from "../../template";
import { findObjectById } from "../../../core/prototypes";

export interface FileViewExportState {
  exportMode: string;
}

export class FileViewExport extends ContextedComponent<
  {
    onClose: () => void;
  },
  FileViewExportState
> {
  public state: FileViewExportState = {
    exportMode: "image"
  };

  public renderExportImage() {
    return (
      <div className="el-horizontal-layout-item is-fix-width">
        <CurrentChartView store={this.mainStore} />
        <div className="buttons">
          <ButtonRaised
            text="PNG"
            url={R.getSVGIcon("toolbar/export")}
            onClick={() => {
              this.dispatch(new Actions.Export("png"));
            }}
          />{" "}
          <ButtonRaised
            text="SVG"
            url={R.getSVGIcon("toolbar/export")}
            onClick={() => {
              this.dispatch(new Actions.Export("svg"));
            }}
          />
        </div>
      </div>
    );
  }
  public renderExportTemplate() {
    return (
      <div className="el-horizontal-layout-item is-fix-width">
        <CurrentChartView store={this.mainStore} />
        <ExportTemplateView exportKind={this.state.exportMode} />
      </div>
    );
  }
  public render() {
    return (
      <div className="charticulator__file-view-content">
        <h1>Export</h1>
        <div className="el-horizontal-layout">
          <div className="el-horizontal-layout-item">
            <div className="charticulator__list-view">
              <div
                className={classNames("el-item", [
                  "is-active",
                  this.state.exportMode == "image"
                ])}
                onClick={() => this.setState({ exportMode: "image" })}
              >
                <SVGImageIcon url={R.getSVGIcon("toolbar/export")} />
                <span className="el-text">Export as Image</span>
              </div>
              {this.mainStore.listExportTemplateTargets().map(name => (
                <div
                  key={name}
                  className={classNames("el-item", [
                    "is-active",
                    this.state.exportMode == name
                  ])}
                  onClick={() => this.setState({ exportMode: name })}
                >
                  <SVGImageIcon url={R.getSVGIcon("toolbar/export")} />
                  <span className="el-text">{name}</span>
                </div>
              ))}
            </div>
          </div>
          {this.state.exportMode == "image"
            ? this.renderExportImage()
            : this.renderExportTemplate()}
        </div>
      </div>
    );
  }
}

export interface ExportTemplateViewState {
  template: Specification.Template.ChartTemplate;
  target: ExportTemplateTarget;
  targetProperties: { [name: string]: string };
}

export class ExportTemplateView extends ContextedComponent<
  { exportKind: string },
  {}
> {
  public state = this.getDefaultState(this.props.exportKind);

  public getDefaultState(kind: string): ExportTemplateViewState {
    const template = deepClone(this.chartStore.buildChartTemplate());
    const target = this.mainStore.createExportTemplateTarget(kind, template);
    const targetProperties: { [name: string]: string } = {};
    for (const property of target.getProperties()) {
      targetProperties[property.name] = property.default;
    }
    return {
      template,
      target,
      targetProperties
    };
  }

  public componentWillReceiveProps(newProps: { exportKind: string }) {
    this.setState(this.getDefaultState(newProps.exportKind));
  }

  public renderInput(
    label: string,
    value: string,
    onChange: (value: string) => void
  ) {
    let ref: HTMLInputElement;
    return (
      <div className="form-group">
        <input
          ref={e => (ref = e)}
          type="text"
          required={true}
          value={value || ""}
          onChange={e => {
            onChange(ref.value);
          }}
        />
        <label>{label}</label>
        <i className="bar" />
      </div>
    );
  }

  public renderTargetProperties() {
    return this.state.target.getProperties().map(property => {
      return (
        <div key={property.name}>
          {this.renderInput(
            property.displayName,
            this.state.targetProperties[property.name],
            value => {
              this.state.targetProperties[property.name] = value;
              this.setState({
                targetProperties: this.state.targetProperties
              });
            }
          )}
        </div>
      );
    });
  }

  public renderSlots() {
    if (this.state.template.tables.length == 0) {
      return <p>(none)</p>;
    }
    return this.state.template.tables.map(table => (
      <div key={table.name}>
        {table.columns.map(column => (
          <div key={table.name}>
            {this.renderInput(column.name, column.displayName, value => {
              column.displayName = value;
              this.setState({
                template: this.state.template
              });
            })}
          </div>
        ))}
      </div>
    ));
  }

  public renderExposedProperties() {
    const getItemById = (id: string) => {
      const r =
        getById(this.state.template.specification.glyphs, id) ||
        getById(this.state.template.specification.elements, id) ||
        getById(this.state.template.specification.scales, id);
      if (r) {
        return r;
      }
      for (const glyph of this.state.template.specification.glyphs) {
        const r = getById(glyph.marks, id);
        if (r) {
          return r;
        }
      }
      if (this.state.template.specification._id == id) {
        return this.state.template.specification;
      }
    };
    const result: JSX.Element[] = [];
    for (const p of this.state.template.properties) {
      const id = p.objectID;
      const obj = findObjectById(this.state.template.specification, id);
      if (p.target.attribute) {
        result.push(
          <div key={id + p.target.attribute}>
            {this.renderInput(
              obj.properties.name + "/" + p.target.attribute,
              p.displayName,
              value => {
                p.displayName = value;
                this.setState({
                  template: this.state.template
                });
              }
            )}
          </div>
        );
      }
      if (p.target.property) {
        const pf = p.target.property;
        let pfstr = null;
        if (typeof pf == "string") {
          pfstr = pf;
        } else {
          pfstr =
            pf.property +
            "/" +
            (typeof pf.field == "string" || typeof pf.field == "number"
              ? pf.field
              : new Array(pf.field).join("."));
        }
        result.push(
          <div key={id + pf}>
            {this.renderInput(
              obj.properties.name + "/" + pfstr,
              p.displayName,
              value => {
                p.displayName = value;
                this.setState({
                  template: this.state.template
                });
              }
            )}
          </div>
        );
      }
    }
    return result;
  }

  public render() {
    return (
      <div>
        <h2>Data Mapping Slots</h2>
        {this.renderSlots()}
        <h2>Exposed Properties</h2>
        {this.renderExposedProperties()}
        <h2>{this.props.exportKind} Properties</h2>
        {this.renderTargetProperties()}
        <div className="buttons">
          <ButtonRaised
            text={this.props.exportKind}
            url={R.getSVGIcon("toolbar/export")}
            onClick={() => {
              this.state.target
                .generate(this.state.targetProperties)
                .then(base64 => {
                  const byteCharacters = atob(base64);
                  const byteNumbers = new Array(byteCharacters.length);
                  for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                  }
                  const byteArray = new Uint8Array(byteNumbers);

                  const blob = new Blob([byteArray], {
                    type: "application/x-binary"
                  });
                  FileSaver.saveAs(
                    blob,
                    "charticulator." + this.state.target.getFileExtension()
                  );
                });
            }}
          />
        </div>
      </div>
    );
  }
}
