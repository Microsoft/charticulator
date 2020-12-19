// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { MainTabs } from "./app/views/file_view";
import { DataType } from "./core/specification";

export const strings = {
  app: {
    name: "Microsoft Charticulator",
    nestedChartTitle: "Nested Chart | Charticulator",
    working: "Working...",
  },
  about: {
    version: (version: string, url: string) =>
      `Version: ${version}, URL: ${url}`,
    license: "Show License",
  },
  button: {
    no: "No",
    yes: "Yes",
  },
  canvas: {
    markContainer: "To edit this glyph, please create a plot segment with it.",
    newGlyph: "New glyph",
    zoomAuto: "Auto zoom",
    zoomIn: "Zoom in",
    zoomOut: "Zoom out",
  },
  dataset: {
    dimensions: (rows: number, columns: number) =>
      `${rows} rows, ${columns} columns`,
    months: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
    replaceWithCSV: "Replace data with CSV file",
    showDataValues: "Show data values",
    showDerivedFields: "Show derived fields",
    tableTitleColumns: "Columns",
    tableTitleLinks: "Links",
    weekday: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  },
  defaultDataset: {
    city: "City",
    month: "Month",
    temperature: "Temperature",
    value: "Value",
  },
  dialog: {
    resetConfirm: "Are you really willing to reset the chart?",
  },
  error: {
    imageLoad: (url: string) => `failed to retrieve map image at url ${url}`,
    notImplemented: "Not implemented yet",
    storeNotFound: (componentName: string) =>
      `store not found in component ${componentName}`,
  },
  fileExport: {
    asHTML: "Export as HTML",
    asImage: "Export as Image",
    inferAxisMin: (objectName: string, inferenceAxisProperty: string) =>
      `Auto axis min range for ${objectName}/${inferenceAxisProperty}`,
    inferAxisMax: (objectName: string, inferenceAxisProperty: string) =>
      `Auto axis max range for ${objectName}/${inferenceAxisProperty}`,
    inferScaleMin: (objectName: string) =>
      `Auto min domain and range for ${objectName}`,
    inferScaleMax: (objectName: string) =>
      `Auto max domain and range for ${objectName}`,
    imageDPI: "DPI (for PNG/JPEG)",
    labelAxesAndScales: "Axes and Scales",
    labelExposedObjects: "Exposed Objects",
    labelProperties: (exportKind: string) => `${exportKind} Properties`,
    labelSlots: "Data Mapping Slots",
    slotColumnExample: (columnName: string) => `${columnName} examples`,
    slotColumnName: (columnName: string) => `${columnName} name`,
    typeHTML: "HTML",
    typeJPEG: "JPEG",
    typePNG: "PNG",
    typeSVG: "SVG",
  },
  fileImport: {
    doneButtonText: "Done",
    doneButtonTitle: "Finish importing data",
    fileUpload: "Open or Drop File",
    loadSample: "Load Sample Dataset...",
    links: "Links",
    messageNoID: (keyColumn: string) =>
      `No ${keyColumn} colum are specified in main table`,
    messageNoSourceOrTargetID: (
      linkSourceKeyColumn: string,
      linkTargetKeyColumn: string
    ) =>
      `No ${linkSourceKeyColumn} or ${linkTargetKeyColumn} colums are specified in links table`,
    removeButtonText: "Remove",
    removeButtonTitle: "Remove this table",
  },
  handles: {
    drawSpiral: "Draw Spiral",
    startAngle: "Start Angle",
    windings: "Windings",
  },
  help: {
    contact: "Contact Us",
    gallery: "Example Gallery",
    gettingStarted: "Getting Started",
    home: "Charticulator Home",
    issues: "Report an Issue",
    version: (version: string) => `Version: ${version}`,
  },
  mainTabs: {
    about: "About",
    export: "Export",
    new: "New",
    open: "Open",
    options: "Options",
    save: "Save As",
  } as { [key in MainTabs]: string },
  mainView: {
    attributesPaneltitle: "Attributes",
    datasetPanelTitle: "Dataset",
    errorsPanelTitle: "Errors",
    glyphPaneltitle: "Glyph",
    layersPanelTitle: "Layers",
    scalesPanelTitle: "Scales",
  },
  menuBar: {
    defaultTemplateName: "Charticulator Template",
    export: "Export",
    exportTemplate: "Export template",
    help: "Help",
    home: "Open file menu",
    importTemplate: "Import template",
    new: "New (Ctrl-N)",
    open: "Open (Ctrl-O)",
    redo: "Redo (Ctrl-Y)",
    reset: "Reset",
    save: "Save (Ctrl-S)",
    saveButton: "Save",
    saveNested: "Save Nested Chart",
    undo: "Undo (Ctrl-Z)",
  },
  toolbar: {
    symbol: "Symbol",
    marks: "Marks",
    curve: "Custom Curve",
    dataAxis: "Data Axis",
    ellipse: "Ellipse",
    icon: "Icon",
    image: "Image",
    guides: "Guides",
    guidePolar: "Guide polar",
    guideX: "Guide X",
    guideY: "Guide Y",
    legend: "Legend",
    line: "Line",
    lineH: "Horizontal Line",
    lineV: "Vertical Line",
    link: "Link",
    links: "Links",
    nestedChart: "Nested Chart",
    plot: "Plot",
    plotSegments: "Plot Segments",
    polar: "Polar",
    rectangle: "Rectangle",
    region2D: "2D Region",
    scaffolds: "Scaffolds",
    text: "Text",
    textbox: "Textbox",
    triangle: "Triangle",
  },
  typeDisplayNames: {
    boolean: "Boolean",
    date: "Date",
    number: "Number",
    string: "String",
  } as { [key in DataType]: string },
};
