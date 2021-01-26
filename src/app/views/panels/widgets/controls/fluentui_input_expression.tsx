// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
import * as React from "react";
import {
  Expression,
  replaceNewLineBySymbol,
  replaceSymbolByTab,
  replaceSymbolByNewLine,
  replaceTabBySymbol,
} from "../../../../../core";
import { classNames } from "../../../../utils";

import { ITextField, TextField } from "@fluentui/react";

export interface InputExpressionProps {
  validate?: (value: string) => Expression.VerifyUserExpressionReport;
  defaultValue?: string;
  placeholder?: string;
  onEnter?: (value: string) => boolean;
  onCancel?: () => void;
  textExpression?: boolean;
  allowNull?: boolean;
  label?: string;
}

export interface InputExpressionState {
  errorMessage?: string;
  errorIndicator: boolean;
  value?: string;
}

export const FluentInputExpression: React.FC<InputExpressionProps> = (
  props: InputExpressionProps
) => {
  const [value, setValue] = React.useState(props.defaultValue);
  const [errorIndicator, setErrorIndicator] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState(null);

  let textComponent: ITextField;

  const doEnter = React.useCallback(() => {
    if (props.allowNull && textComponent.value.trim() == "") {
      setValue("");
      setErrorIndicator(false);
      setErrorMessage(null);
      props.onEnter?.(null);
    } else {
      const result = props.validate(
        replaceTabBySymbol(replaceNewLineBySymbol(textComponent.value))
      );
      if (result.pass) {
        setValue(result.formatted);
        setErrorIndicator(false);
        setErrorMessage(null);
        props.onEnter?.(result.formatted);
      } else {
        setErrorIndicator(true);
        setErrorMessage(result.error);
      }
    }
  }, [
    props.allowNull,
    props.onEnter,
    setValue,
    setErrorIndicator,
    setErrorMessage,
  ]);

  const doCancel = React.useCallback(() => {
    setValue(props.defaultValue || "");
    setErrorIndicator(false);
    setErrorMessage(null);
    props.onCancel?.();
  }, [
    props.onCancel,
    props.defaultValue,
    setValue,
    setErrorIndicator,
    setErrorMessage,
  ]);

  return (
    <span className="charticulator__widget-control-input-expression">
      {/* <input
          className={classNames(
            "charticulator__widget-control-input-expression-input",
            ["is-error", errorIndicator]
          )}
          type="text"
          ref={refInput}
        /> */}
      <TextField
        label={props.label}
        componentRef={component => textComponent = component}
        placeholder={props.placeholder}
        type="text"
        onGetErrorMessage={() => {
          if (!props.validate?.(value)) {
            return errorMessage;
          }
        }}
        // defaultValue={props.defaultValue}
        value={replaceSymbolByTab(replaceSymbolByNewLine(value))}
        onChange={(event, newValue) => {
          // Check for parse errors while input
          if (props.allowNull && newValue.trim() == "") {
            setValue(newValue);
            setErrorIndicator(false);
          } else {
            const result = Expression.verifyUserExpression(
              replaceTabBySymbol(replaceNewLineBySymbol(newValue)),
              {
                textExpression: props.textExpression,
              }
            );
            setValue(textComponent.value);
            setErrorIndicator(!result.pass);
          }
        }}
        onBlur={() => {
          doEnter();
        }}
        onFocus={(e) => {
          // refInput.current.select();
          e.target.select();
        }}
        onKeyDown={(e) => {
          if (e.key == "Enter") {
            doEnter();
          }
          if (e.key == "Escape") {
            doCancel();
          }
        }}
      />
      {/* {errorMessage != null ? (
          <span className="charticulator__widget-control-input-expression-error">
            {errorMessage}
          </span>
        ) : null} */}
    </span>
  );
};
