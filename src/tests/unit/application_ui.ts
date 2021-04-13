// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
// Copyright (c) Microsoft Corporation. All rights reserved.

import { Browser, Page } from "puppeteer";

import { Application } from "../../app/index";
import { Actions } from "../../app/index";
import { ObjectItem } from "../../core/prototypes";
import {
  DataKind,
  DataType,
  ObjectProperties,
  PlotSegment,
} from "../../core/specification";
import { OrderMode } from "../../core/specification/types";
import { strings } from "../../strings";

import { DragData } from "../../app";
import { Dataset, Expression } from "../../core";
import { AppStore } from "../../app/stores";
import { loadJSON, shortTimeOut, longTimeOut } from "./utils";
import { expect } from "chai";

declare var window: any;

// Licensed under the MIT license.
const puppeteer = require("puppeteer");

describe("Charticulator application", () => {
  let browser: Browser;
  let page: Page;
  before(async () => {
    browser = await puppeteer.launch({ headless: false });
    page = await browser.newPage();
    page.setViewport({
      height: 1080,
      width: 1920,
    });
  });

  after(async () => {
    await browser.close();
  });
  it("application ui loaded", async () => {
    await page.goto("http://localhost:4000");
    await page.screenshot({ path: "example.png" });

    const isAppDefined = await page.evaluate(() => {
      return (window as any).application !== undefined;
    });
    const isDone = expect(isAppDefined).to.true;
  }).timeout(shortTimeOut);
  it("application loads bar chart", async () => {
    const chartFilePath = "bar-chart.json";
    const chartFile = await loadJSON(chartFilePath);
    await page.evaluateHandle((chartFile) => {
      const action: Actions.Load = new window.Charticulator.Actions.Load(
        chartFile.state
      );
      const application: Application = window.application;
      application.appStore.dispatcher.dispatch(action);
    }, chartFile);

    await page.click(".popup-container-modal .el-button-back");

    await page.screenshot({ path: "example.png" });
  }).timeout(longTimeOut);
});
