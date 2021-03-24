// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
import { Prototypes } from "../../core";
import { Chart } from "../../core/specification";

export function closeStartMenuPanel() {
  document
    .querySelector<HTMLElement>(".popup-container-modal .el-button-back")
    .click();
}

export function getChartCanvas() {
  return document.querySelector<SVGRectElement>("rect.canvas-region");
}

export function* findElementsByClassID(chart: Chart, classID: string) {
  for (const item of Prototypes.forEachObject(chart)) {
    if (Prototypes.isType(item.object.classID, classID)) {
      yield item;
    }
  }
}
