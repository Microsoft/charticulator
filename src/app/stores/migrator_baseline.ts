// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { AppStoreState } from "./app_store";
import {
  ChartElementState,
  ParentMapping,
  PlotSegment,
  PlotSegmentState,
  ValueMapping
} from "../../core/specification";
import {
  GuideAxis,
  GuideClass,
  GuideAttributeNames
} from "../../core/prototypes/guides";
import { Specification, uniqueID } from "../../core";
import { isType } from "../../core/prototypes";
import {
  NestedChartElementClass,
  NestedChartElementProperties
} from "../../core/prototypes/marks/nested_chart";

type Chart = Specification.Chart<Specification.ObjectProperties>;
type ChartState = Specification.ChartState<Specification.AttributeMap>;
type Element = Specification.ChartElement<Specification.ObjectProperties>;
type ElementState = Specification.ChartElementState<Specification.AttributeMap>;
type Mark = Specification.Element<Specification.ObjectProperties>;

interface ElementRef {
  element: Element;
  index: number;
  state: ElementState;
}

/** Upgrade old versions of chart spec and state to newer version */

export function upgradeGuidesToBaseline(appStoreState: AppStoreState) {
  upgradeScope(appStoreState.chart, appStoreState.chartState);
  // TODO are nested charts scopes ?

  return appStoreState;
}

function upgradeScope(parentElement: Chart, parentState: ChartState) {
  upgradeChartGuides(parentElement, parentState);
  upgradeGlyphGuides(parentElement, parentState);
}

function upgradeChartGuides(parentElement: Chart, parentState: ChartState) {
  // get chart guides
  const chartGuideRefs = find(
    parentElement.elements,
    parentState.elements,
    element => element.classID === GuideClass.classID
  );

  chartGuideRefs.forEach(ref => {
    const { element, state } = ref;

    // convert mappings to actual values
    const valueMapping = element.mappings.value as ParentMapping;
    if (valueMapping && valueMapping.type === "parent") {
      const { parentAttribute } = valueMapping;
      // set value to actual mapped attr value
      state.attributes.value = parentState.attributes[parentAttribute];
      // remove the mapping
      delete element.mappings.value;
    } else {
      // guides should not be mapped to anything other than parent
      // Notify user?
    }

    // find other elements constrained to this chartElementItem
    parentElement.constraints.forEach(constraint => {
      if (
        constraint.type === "snap" &&
        constraint.attributes.targetElement === element._id
      ) {
        changeConstraintTarget(
          element,
          constraint,
          +state.attributes.value,
          parentElement.elements,
          parentState.elements
        );
      }
    });

    // add new properties
    addNewGuideProperties(element, state);

    // remove deleted properties / attributes
    removeOldGuideProperties(element, state);
  });
}

function upgradeGlyphGuides(
  parentElement: Chart,
  parentState: ChartState,
  nested = false
) {
  parentElement.glyphs.forEach(glyph => {
    // collect and separate marks from guides
    const guides: { [id: string]: Mark } = {};
    glyph.marks.forEach(mark => {
      if (isType(mark.classID, GuideClass.classID)) {
        guides[mark._id] = mark;
      } else if (isType(mark.classID, NestedChartElementClass.classID)) {
        const nc = mark as Specification.Element<NestedChartElementProperties>;
        upgradeGlyphGuides(nc.properties.specification, null, true); // nested charts do not store in ChartState
      }
    });
    // get element which uses this glyph
    const related = find(
      parentElement.elements,
      parentState && parentState.elements,
      element => {
        const ps = element as PlotSegment;
        return ps.glyph === glyph._id;
      }
    );
    // look at constraints
    glyph.constraints.forEach(constraint => {
      if (constraint.type === "snap") {
        const id = constraint.attributes.targetElement as string;
        const guide = guides[id];
        if (guide && constraint.attributes.targetAttribute === "value2") {
          // make a new guide
          const newGuide = createGuide(
            guide.properties.axis as GuideAxis,
            guide,
            +guide.properties.value + +guide.properties.gap
          );
          // add new guide
          glyph.marks.push(newGuide.element);
          // add state instances
          related.forEach(ref => {
            const s = ref.state as PlotSegmentState;
            if (s && s.glyphs) {
              s.glyphs.forEach(glyphState => {
                glyphState.marks.push(newGuide.state);
              });
            }
          });
          if (nested) {
            // nested charts store in mappings
            const valueMapping: ValueMapping = {
              type: "value",
              value: newGuide.state.attributes.value
            };
            newGuide.element.mappings.value = valueMapping;
          }
          // point to new guide
          constraint.attributes.targetElement = newGuide.element._id;
          constraint.attributes.targetAttribute =
            GuideAttributeNames.computedBaselineValue;
        }
      }
    });

    // if (guide.mappings) {
    // TODO guides should not be mapped!
    // }

    for (const _id in guides) {
      const guide = guides[_id];
      // add new properties to guide
      addNewGuideProperties(guide);
      // delete old properties
      removeOldGuideProperties(guide);
      // modify all state instances
      related.forEach(ref => {
        const s = ref.state as PlotSegmentState;
        if (s && s.glyphs) {
          s.glyphs.forEach(glyphState => {
            glyphState.marks.forEach(markState => {
              // add new properties to guide
              addNewGuideProperties(null, markState);
              // delete old properties
              removeOldGuideProperties(null, markState);
            });
          });
        }
      });
    }
  });
}

function find(
  elements: Element[],
  states: ElementState[],
  predicate: (element: Element) => boolean
) {
  const refs: ElementRef[] = [];
  elements.forEach((element, index) => {
    if (predicate(element)) {
      const state = states && states[index];
      refs.push({ element, index, state });
    }
  });
  return refs;
}

function changeConstraintTarget(
  element: Element,
  constraint: Specification.Constraint,
  guideValue: number,
  elementCollection: Element[],
  stateCollection: ElementState[]
) {
  if (!element) {
    throw new Error("constraint bound to unknown element");
  }
  if (!element.properties) {
    throw new Error("constraint target element has no properties");
  }
  const gap = +element.properties.gap;
  if (constraint.attributes.targetAttribute === "value2" && gap) {
    // create a 2nd guide to insert, based on gap property of first
    const axis = element.properties.axis as GuideAxis;
    const value = guideValue + gap;
    const newGuide = createGuide(axis, element, value);
    elementCollection.push(newGuide.element);
    stateCollection.push(newGuide.state);

    constraint.attributes.targetElement = newGuide.element._id;

    // find constraint object and make value attribute match
    const constrained = find(
      elementCollection,
      stateCollection,
      element => element._id === constraint.attributes.element
    );
    constrained.forEach(ref => {
      const name = constraint.attributes.attribute as string;
      ref.state.attributes[name] = value;
    });
  }
  constraint.attributes.targetAttribute = "computedBaselineValue";
}

function addNewGuideProperties(
  element?: Specification.ChartElement<Specification.ObjectProperties>,
  state?: Specification.ChartElementState<Specification.AttributeMap>
) {
  if (element) {
    element.properties.baseline = "center";
  }
  if (state) {
    state.attributes.computedBaselineValue = state.attributes.value;
  }
}

function removeOldGuideProperties(element?: Element, state?: ElementState) {
  if (element) {
    delete element.properties.gap;
    delete element.properties.value; // unused property in original schema
    delete element.properties.value2; // unused property in original schema
  }
  if (state) {
    delete state.attributes.value2;
  }
}

function createGuide(axis: GuideAxis, originalGuide: Element, value: number) {
  const element: Element = {
    _id: uniqueID(),
    classID: "guide.guide",
    properties: {
      baseline: axis === "y" ? "middle" : "center",
      name: `${originalGuide.properties.name} gap`,
      axis
    },
    mappings: {}
  };
  const state: ChartElementState = {
    attributes: {
      value,
      computedBaselineValue: value
    }
  };
  return { element, state };
}