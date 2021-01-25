// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

export enum MessageType {
  GeneralError,
  ParsingDataError,
  ConstraintSolvingError,
  LinkGuideCreatingError,
  InvalidLinksData,
  NoID,
  NoSourceOrTargetID,
}

export const messageTypes = Object.values(MessageType);

export const LinkSourceKeyColumn = "source_id";

export const LinkTargetKeyColumn = "target_id";

export const KeyColumn = "id";


export const fontList = [
  "Arial Black",
  "Arial",
  "Comic Sans MS",
  "Consolas",
  "Courier New",
  "Geneva",
  "Georgia",
  "Helvetica",
  "Impact",
  "Inconsolata",
  "Lato",
  "Lucida Console",
  "Lucida Grande",
  "Palatino",
  "Tahoma",
  "Times",
  "Trebuchet MS",
  "Verdana",
];
