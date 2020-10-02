// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
import * as React from "react";
import * as ReactDOM from "react-dom";
import * as globals from "../globals";
import * as R from "../resources";

import { EventSubscription } from "../../core";
import { Actions, DragData } from "../actions";
import { SVGImageIcon, ToolButton } from "../components";
import { ContextedComponent } from "../context_component";
import { PopupView } from "../controllers";

import { classNames } from "../utils";
import { LinkCreationPanel } from "./panels/link_creator";
import { LegendCreationPanel } from "./panels/legend_creator";
import { AppStore } from "../stores";

export class Toolbar extends ContextedComponent<
  {
    layout: "vertical" | "horizontal";
  },
  {}
> {
  public token: EventSubscription;

  private theLastRowsCount: number = 0;
  private itemsCount: number = 0;

  public componentDidMount() {
    this.token = this.store.addListener(AppStore.EVENT_CURRENT_TOOL, () => {
      this.forceUpdate();
    });
  }

  public componentWillUnmount() {
    this.token.remove();
  }

  private getToolItems(labels: boolean = true) {
    const buckets = [];

    buckets.push(
      <>
        {labels && (
          <span
            className={
              this.props.layout === "vertical"
                ? "chartaccent__toolbar-vertical-label"
                : "chartaccent__toolbar-label"
            }
          >
            Marks
          </span>
        )}
        <MultiObjectButton
          compact={this.props.layout === "vertical"}
          tools={[
            {
              classID: "mark.rect",
              title: "Rectangle",
              icon: "mark/rect",
              options: '{"shape":"rectangle"}',
            },
            {
              classID: "mark.rect",
              title: "Ellipse",
              icon: "mark/ellipse",
              options: '{"shape":"ellipse"}',
            },
            {
              classID: "mark.rect",
              title: "Triangle",
              icon: "mark/triangle",
              options: '{"shape":"triangle"}',
            },
          ]}
        />
        <ObjectButton classID="mark.symbol" title="Symbol" icon="mark/symbol" />
        <ObjectButton classID="mark.line" title="Line" icon="mark/line" />
        <MultiObjectButton
          compact={this.props.layout === "vertical"}
          tools={[
            {
              classID: "mark.text",
              title: "Text",
              icon: "mark/text",
            },
            {
              classID: "mark.textbox",
              title: "Textbox",
              icon: "mark/textbox",
            },
          ]}
        />
        <MultiObjectButton
          compact={this.props.layout === "vertical"}
          tools={[
            {
              classID: "mark.icon",
              title: "Icon",
              icon: "mark/icon",
            },
            {
              classID: "mark.image",
              title: "Image",
              icon: "mark/image",
            },
          ]}
        />
      </>
    );

    buckets.push(
      <>
        <ObjectButton
          classID="mark.data-axis"
          title="Data Axis"
          icon="mark/data-axis"
        />
        <ObjectButton
          classID="mark.nested-chart"
          title="Nested Chart"
          icon="mark/nested-chart"
        />
      </>
    );

    buckets.push(
      <>
        <LegendButton />
      </>
    );

    buckets.push(
      <>
        {labels && (
          <span
            className={
              this.props.layout === "vertical"
                ? "chartaccent__toolbar-vertical-label"
                : "chartaccent__toolbar-label"
            }
          >
            Links
          </span>
        )}
        <LinkButton />
      </>
    );

    buckets.push(
      <>
        {labels && (
          <span
            className={
              this.props.layout === "vertical"
                ? "chartaccent__toolbar-vertical-label"
                : "chartaccent__toolbar-label"
            }
          >
            Guides
          </span>
        )}
        <ObjectButton
          classID="guide-y"
          title="Guide Y"
          icon="guide/x"
          noDragging={true}
        />
        <ObjectButton
          classID="guide-x"
          title="Guide X"
          icon="guide/y"
          noDragging={true}
        />
        <ObjectButton
          classID="guide-coordinator-y"
          title="Guide Y"
          icon="guide/coordinator-x"
          noDragging={true}
        />
        <ObjectButton
          classID="guide-coordinator-x"
          title="Guide Y"
          icon="guide/coordinator-y"
          noDragging={true}
        />
      </>
    );

    buckets.push(
      <>
        {labels && (
          <>
            <span
              className={
                this.props.layout === "vertical"
                  ? "chartaccent__toolbar-vertical-separator"
                  : "chartaccent__toolbar-separator"
              }
            />
            <span
              className={
                this.props.layout === "vertical"
                  ? "chartaccent__toolbar-vertical-label"
                  : "chartaccent__toolbar-label"
              }
            >
              {this.props.layout === "vertical" ? "Plot" : "Plot Segments"}
            </span>
          </>
        )}
        <ObjectButton
          classID="plot-segment.cartesian"
          title="2D Region"
          icon="plot/region"
          noDragging={true}
        />
        <ObjectButton
          classID="plot-segment.line"
          title="Line"
          icon="plot/line"
          noDragging={true}
        />
      </>
    );

    buckets.push(
      <>
        {labels && (
          <span
            className={
              this.props.layout === "vertical"
                ? "chartaccent__toolbar-vertical-label"
                : "chartaccent__toolbar-label"
            }
          >
            Scaffolds
          </span>
        )}
        <ScaffoldButton
          type="cartesian-x"
          title="Horizontal Line"
          icon="scaffold/cartesian-x"
          currentTool={this.store.currentTool}
        />
        <ScaffoldButton
          type="cartesian-y"
          title="Vertical Line"
          icon="scaffold/cartesian-y"
          currentTool={this.store.currentTool}
        />
        <ScaffoldButton
          type="polar"
          title="Polar"
          icon="scaffold/circle"
          currentTool={this.store.currentTool}
        />
        <ScaffoldButton
          type="curve"
          title="Custom Curve"
          icon="scaffold/curve"
          currentTool={this.store.currentTool}
        />
      </>
    );

    return buckets;
  }

  public render() {
    const toolItems = this.getToolItems(this.props.layout === "horizontal");
    return (
      <div
        className={
          this.props.layout === "vertical"
            ? "chartaccent__toolbar-vertical"
            : "chartaccent__toolbar-horizontal"
        }
      >
        {toolItems.map((item, index) => {
          return (
            <>
              <div
                key={index}
                className={
                  this.props.layout === "vertical"
                    ? "chartaccent__toolbar-vertical-group"
                    : "chartaccent__toolbar-horizontal-group"
                }
              >
                {item}
              </div>
              <span
                className={
                  this.props.layout === "vertical"
                    ? "chartaccent__toolbar-vertical-separator"
                    : "chartaccent__toolbar-horizontal-separator"
                }
              />
            </>
          );
        })}
        {/* <ScaffoldButton type="map" title="Map" icon="scaffold/map" currentTool={this.props.store.currentTool} /> */}
      </div>
    );
  }
}

export interface ObjectButtonProps {
  title: string;
  classID: string;
  icon: string;
  options?: string;
  noDragging?: boolean;
  onClick?: () => void;
  compact?: boolean;
}

export class ObjectButton extends ContextedComponent<ObjectButtonProps, {}> {
  public token: EventSubscription;

  public getIsActive() {
    return (
      this.store.currentTool == this.props.classID &&
      this.store.currentToolOptions == this.props.options
    );
  }

  public componentDidMount() {
    this.token = this.context.store.addListener(
      AppStore.EVENT_CURRENT_TOOL,
      () => {
        this.forceUpdate();
      }
    );
  }

  public componentWillUnmount() {
    this.token.remove();
  }

  public render() {
    return (
      <ToolButton
        icon={R.getSVGIcon(this.props.icon)}
        active={this.getIsActive()}
        title={this.props.title}
        compact={this.props.compact}
        onClick={() => {
          this.dispatch(
            new Actions.SetCurrentTool(this.props.classID, this.props.options)
          );
          if (this.props.onClick) {
            this.props.onClick();
          }
        }}
        dragData={
          this.props.noDragging
            ? null
            : () => {
                return new DragData.ObjectType(
                  this.props.classID,
                  this.props.options
                );
              }
        }
      />
    );
  }
}

export class MultiObjectButton extends ContextedComponent<
  {
    compact?: boolean;
    tools: ObjectButtonProps[];
  },
  {
    currentSelection: {
      classID: string;
      options: string;
    };
  }
> {
  public state = {
    currentSelection: {
      classID: this.props.tools[0].classID,
      options: this.props.tools[0].options,
    },
  };
  private refButton: ObjectButton;
  public token: EventSubscription;

  public isActive() {
    const store = this.store;
    for (const item of this.props.tools) {
      if (
        item.classID == store.currentTool &&
        item.options == store.currentToolOptions
      ) {
        return true;
      }
    }
    return false;
  }
  public getSelectedTool() {
    for (const item of this.props.tools) {
      if (
        item.classID == this.state.currentSelection.classID &&
        item.options == this.state.currentSelection.options
      ) {
        return item;
      }
    }
    return this.props.tools[0];
  }

  public componentDidMount() {
    this.token = this.store.addListener(AppStore.EVENT_CURRENT_TOOL, () => {
      for (const item of this.props.tools) {
        // If the tool is within the tools defined here, we update the current selection
        if (
          this.store.currentTool == item.classID &&
          this.store.currentToolOptions == item.options
        ) {
          this.setState({
            currentSelection: {
              classID: item.classID,
              options: item.options,
            },
          });
          break;
        }
      }
      this.forceUpdate();
    });
  }

  public componentWillUnmount() {
    this.token.remove();
  }

  public render() {
    const onClick = () => {
      if (!this.props.compact) {
        return;
      }
      globals.popupController.popupAt(
        (context) => {
          return (
            <PopupView context={context}>
              {this.props.tools.map((tool, index) => (
                <div
                  key={index}
                  className="charticulator__button-multi-tool-dropdown"
                >
                  <ObjectButton
                    {...tool}
                    noDragging={true}
                    onClick={() => context.close()}
                  />
                </div>
              ))}
            </PopupView>
          );
        },
        {
          anchor: ReactDOM.findDOMNode(this.refButton) as Element,
          alignX: "end-outer",
          alignY: "start-inner",
        }
      );
    };

    return (
      <div
        className={classNames("charticulator__button-multi-tool", [
          "is-active",
          this.isActive(),
        ])}
      >
        <ObjectButton
          ref={(e) => (this.refButton = e)}
          {...this.getSelectedTool()}
          onClick={onClick}
          compact={this.props.compact}
        />
        <span
          className="el-dropdown"
          ref={(e) => {
            if (this.props.compact) {
              return;
            }
            this.refButton = e as any;
          }}
          onClick={() => {}}
        >
          {this.props.compact ? null : (
            <SVGImageIcon url={R.getSVGIcon("general/dropdown")} />
          )}
        </span>
      </div>
    );
  }
}

export class ScaffoldButton extends ContextedComponent<
  {
    currentTool: string;
    title: string;
    type: string;
    icon: string;
  },
  {}
> {
  public render() {
    return (
      <ToolButton
        icon={R.getSVGIcon(this.props.icon)}
        active={this.props.currentTool == this.props.type}
        title={this.props.title}
        onClick={() => {
          // this.dispatch(new Actions.SetCurrentTool(this.props.type));
        }}
        dragData={() => {
          return new DragData.ScaffoldType(this.props.type);
        }}
      />
    );
  }
}

export class LinkButton extends ContextedComponent<{}, {}> {
  public container: HTMLSpanElement;

  public render() {
    return (
      <span ref={(e) => (this.container = e)}>
        <ToolButton
          title="Link"
          icon={R.getSVGIcon("link/tool")}
          active={this.store.currentTool == "link"}
          onClick={() => {
            globals.popupController.popupAt(
              (context) => (
                <PopupView context={context}>
                  <LinkCreationPanel onFinish={() => context.close()} />
                </PopupView>
              ),
              { anchor: this.container }
            );
          }}
        />
      </span>
    );
  }
}

export class LegendButton extends ContextedComponent<{}, {}> {
  public container: HTMLSpanElement;

  public render() {
    return (
      <span ref={(e) => (this.container = e)}>
        <ToolButton
          title="Link"
          icon={R.getSVGIcon("legend/legend")}
          active={this.store.currentTool == "legend"}
          onClick={() => {
            globals.popupController.popupAt(
              (context) => (
                <PopupView context={context}>
                  <LegendCreationPanel onFinish={() => context.close()} />
                </PopupView>
              ),
              { anchor: this.container }
            );
          }}
        />
      </span>
    );
  }
}

export class CheckboxButton extends React.Component<
  {
    value: boolean;
    text?: string;
    onChange?: (v: boolean) => void;
  },
  {}
> {
  public render() {
    return (
      <span
        className="chartaccent__toolbar-checkbox"
        onClick={() => {
          const nv = !this.props.value;
          if (this.props.onChange) {
            this.props.onChange(nv);
          }
        }}
      >
        <SVGImageIcon
          url={R.getSVGIcon(
            this.props.value ? "checkbox/checked" : "checkbox/empty"
          )}
        />
        <span className="el-label">{this.props.text}</span>
      </span>
    );
  }
}
