// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { ConstraintSolver, ConstraintStrength, Variable } from "../../solver";
import * as Specification from "../../specification";
import { ChartElementClass } from "../chart_element";
import {
  AttributeDescription,
  Handles,
  SnappingGuides,
  Controls,
  TemplateParameters,
  LinkAnchor,
  isType,
} from "../common";
import { ObjectClassMetadata } from "../index";
import { RectangleGlyph } from "../glyphs";
import { RectangleChart } from "../charts";

export type GuideAxis = "x" | "y";

export enum GuideAttributeNames {
  value = "value",
  computedBaselineValue = "computedBaselineValue",
}

export interface GuideAttributes extends Specification.AttributeMap {
  value: number;
  computedBaselineValue: number;
}

interface GuideAttributeDescription extends AttributeDescription {
  name: GuideAttributeNames;
}

export enum GuidePropertyNames {
  axis = "axis",
  baseline = "baseline",
}

export interface GuideProperties extends Specification.AttributeMap {
  axis: GuideAxis;
  baseline: Specification.baselineH | Specification.baselineV;
}

export class GuideClass extends ChartElementClass<
  GuideProperties,
  GuideAttributes
> {
  public static classID = "guide.guide";
  public static type = "guide";

  public static metadata: ObjectClassMetadata = {
    displayName: "Guide",
    iconPath: "guide/x",
  };

  public static defaultProperties: Partial<GuideProperties> = {
    baseline: null,
  };

  public attributeNames: GuideAttributeNames[] = [
    GuideAttributeNames.value,
    GuideAttributeNames.computedBaselineValue,
  ];
  public attributes: {
    [name in GuideAttributeNames]: GuideAttributeDescription
  } = {
    value: {
      name: GuideAttributeNames.value,
      type: Specification.AttributeType.Number,
    },
    computedBaselineValue: {
      name: GuideAttributeNames.computedBaselineValue,
      type: Specification.AttributeType.Number,
    },
  };

  public initializeState() {
    this.state.attributes.value = 0;
    this.state.attributes.computedBaselineValue = 0;
  }

  private getAxis() {
    return this.object.properties.axis;
  }

  private getParentType() {
    const { classID } = this.parent.object;
    const rectGlyph = isType(classID, RectangleGlyph.classID);
    const rectChart = isType(classID, RectangleChart.classID);
    return { rectChart, rectGlyph };
  }

  public buildConstraints(solver: ConstraintSolver) {
    const { rectGlyph, rectChart } = this.getParentType();
    if (rectGlyph) {
      switch (this.object.properties.baseline) {
        case "center":
        case "middle": {
          const [, computedBaselineValue] = solver.attrs(
            this.state.attributes,
            [
              GuideAttributeNames.value,
              GuideAttributeNames.computedBaselineValue,
            ]
          );
          solver.addLinear(
            ConstraintStrength.HARD,
            this.state.attributes.value,
            [[-1, computedBaselineValue]]
          );
          break;
        }
        case "left": {
          this.computeBaselineFromParentAttribute(
            solver,
            ["width"],
            ([width], value) => [[-0.5, width], [+1, value]]
          );
          break;
        }
        case "right": {
          this.computeBaselineFromParentAttribute(
            solver,
            ["width"],
            ([width], value) => [[+0.5, width], [+1, value]]
          );
          break;
        }
        case "top": {
          this.computeBaselineFromParentAttribute(
            solver,
            ["height"],
            ([height], value) => [[+0.5, height], [+1, value]]
          );
          break;
        }
        case "bottom": {
          this.computeBaselineFromParentAttribute(
            solver,
            ["height"],
            ([height], value) => [[-0.5, height], [+1, value]]
          );
          break;
        }
      }
    } else if (rectChart) {
      switch (this.object.properties.baseline) {
        case "center": {
          this.computeBaselineFromParentAttribute(
            solver,
            ["cx"],
            ([cx], value) => [[+1, cx], [+1, value]]
          );
          break;
        }
        case "middle": {
          this.computeBaselineFromParentAttribute(
            solver,
            ["cy"],
            ([cy], value) => [[+1, cy], [+1, value]]
          );
          break;
        }
        case "left": {
          this.computeBaselineFromParentAttribute(
            solver,
            ["width", "marginLeft"],
            ([width, marginLeft], value) => [
              [-0.5, width],
              [+1, marginLeft],
              [+1, value],
            ]
          );
          break;
        }
        case "right": {
          this.computeBaselineFromParentAttribute(
            solver,
            ["width", "marginRight"],
            ([width, marginRight], value) => [
              [+0.5, width],
              [-1, marginRight],
              [+1, value],
            ]
          );
          break;
        }
        case "top": {
          this.computeBaselineFromParentAttribute(
            solver,
            ["height", "marginTop"],
            ([height, marginTop], value) => [
              [+0.5, height],
              [-1, marginTop],
              [+1, value],
            ]
          );
          break;
        }
        case "bottom": {
          this.computeBaselineFromParentAttribute(
            solver,
            ["height", "marginBottom"],
            ([height, marginBottom], value) => [
              [-0.5, height],
              [+1, marginBottom],
              [+1, value],
            ]
          );
          break;
        }
      }
    }
  }

  private computeBaselineFromParentAttribute(
    solver: ConstraintSolver,
    parentAttributeNames: string[],
    rhsFn: (
      parentAttributeVariables: Variable[],
      value: Variable
    ) => Array<[number, Variable]>
  ) {
    const parentAttrs = this.parent.state.attributes;
    const parentAttributeVariables = solver.attrs(
      parentAttrs,
      parentAttributeNames
    );
    // parentAttributeNames.forEach(parentAttributeName => solver.makeConstant(parentAttrs, parentAttributeName));

    const [value, computedBaselineValue] = solver.attrs(this.state.attributes, [
      GuideAttributeNames.value,
      GuideAttributeNames.computedBaselineValue,
    ]);
    solver.makeConstant(this.state.attributes, GuideAttributeNames.value);

    solver.addLinear(
      ConstraintStrength.HARD,
      0,
      [[1, computedBaselineValue]],
      rhsFn(parentAttributeVariables, value)
    );
  }

  public getLinkAnchors(): LinkAnchor.Description[] {
    return [];
  }

  /** Get handles given current state */
  public getHandles(): Handles.Description[] {
    const inf = [-1000, 1000];
    const { value } = this.state.attributes;
    const { axis, baseline } = this.object.properties;
    const { rectChart, rectGlyph } = this.getParentType();
    const handleLine = () => {
      return [
        {
          type: "line",
          axis,
          actions: [
            { type: "attribute", attribute: GuideAttributeNames.value },
          ],
          value,
          span: inf,
        },
      ] as Handles.Line[];
    };
    const handleRelativeLine = (reference: number) => {
      return [
        {
          type: "relative-line",
          axis,
          actions: [
            { type: "attribute", attribute: GuideAttributeNames.value },
          ],
          reference,
          sign: 1,
          value,
          span: inf,
        },
      ] as Handles.RelativeLine[];
    };
    const parentAttrs = this.parent.state.attributes;
    if (rectGlyph) {
      switch (baseline) {
        case "center":
        case "middle": {
          return handleLine();
        }
        case "left": {
          return handleRelativeLine(+parentAttrs.ix1);
        }
        case "right": {
          return handleRelativeLine(+parentAttrs.ix2);
        }
        case "top": {
          return handleRelativeLine(+parentAttrs.iy2);
        }
        case "bottom": {
          return handleRelativeLine(+parentAttrs.iy1);
        }
      }
    } else if (rectChart) {
      switch (baseline) {
        case "center": {
          return handleRelativeLine(+parentAttrs.cx);
        }
        case "middle": {
          return handleRelativeLine(+parentAttrs.cy);
        }
        case "left": {
          return handleRelativeLine(+parentAttrs.x1);
        }
        case "right": {
          return handleRelativeLine(+parentAttrs.x2);
        }
        case "top": {
          return handleRelativeLine(+parentAttrs.y2);
        }
        case "bottom": {
          return handleRelativeLine(+parentAttrs.y1);
        }
      }
    }
  }

  public getSnappingGuides(): SnappingGuides.Description[] {
    const snappingGuideAxis = (
      attribute: string,
      value: Specification.AttributeValue
    ) => {
      return {
        type: this.getAxis(),
        value,
        attribute,
        visible: true,
      } as SnappingGuides.Axis;
    };
    const r = [
      snappingGuideAxis(
        GuideAttributeNames.computedBaselineValue,
        this.state.attributes.computedBaselineValue
      ),
    ];
    return r;
  }

  public getAttributePanelWidgets(
    manager: Controls.WidgetManager
  ): Controls.Widget[] {
    const widgets: Controls.Widget[] = [manager.sectionHeader("Guide")];

    let labels: string[];
    let options: string[];
    let icons: string[];
    if (this.object.properties.axis === "x") {
      const hOptions: Specification.baselineH[] = ["left", "center", "right"];
      options = hOptions;
      labels = ["Left", "Center", "Right"];

      icons = ["align/left", "align/x-middle", "align/right"];
    } else {
      const vOptions: Specification.baselineV[] = ["top", "middle", "bottom"];
      options = vOptions;
      labels = ["Top", "Middle", "Bottom"];
      icons = ["align/top", "align/y-middle", "align/bottom"];
    }
    widgets.push(
      manager.row(
        "Baseline",
        manager.inputSelect(
          { property: GuidePropertyNames.baseline },
          {
            type: "dropdown",
            showLabel: true,
            labels,
            options,
            icons,
          }
        )
      )
    );

    widgets.push(
      manager.mappingEditor("Value", GuideAttributeNames.value, {
        defaultValue: this.state.attributes.value,
      })
    );

    return widgets;
  }

  public getTemplateParameters(): TemplateParameters {
    return {
      properties: [
        {
          objectID: this.object._id,
          target: {
            attribute: GuidePropertyNames.baseline,
          },
          type: Specification.AttributeType.Enum,
          default: this.object.properties.baseline,
        },
        {
          objectID: this.object._id,
          target: {
            attribute: GuideAttributeNames.value,
          },
          type: Specification.AttributeType.Number,
          default: this.state.attributes.value as number,
        },
        {
          objectID: this.object._id,
          target: {
            attribute: GuideAttributeNames.computedBaselineValue,
          },
          type: Specification.AttributeType.Number,
          default: this.state.attributes.computedBaselineValue,
        },
      ],
    };
  }
}
