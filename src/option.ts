import {
    FxBoundStepsLoopCallback,
    FxEventType,
    FxNode,
    FxNodeCloseType,
    FxNodeAdapter,
    FxNodeParserAllowNodeNotCloseOption,
    FxNodeType,
    FxParseContext,
    FxParseOptions,
    FxParseOptionsKeys,
    FxTryStep,
    FxWrong,
    FxNodeTryStep,
    FxBoundaryPosition,
    FxCursorPosition,
    FxOptionChecker,
    FxAllowNearTagBoundarySpace,
    FxAllowTagNameHasSpace,
} from "./types";
import {
    createNodeByNodeStartStep,
    isFunc,
    setContextMaxCursor,
    setNodeLocationByCursor,
} from "./util";
import { FxBoundaryPositionMap, FxNodeCloseTypeMap } from "./enum-map";
export const boundStepsToContext = (
    steps: FxTryStep[],
    context?: FxParseContext,
    loopCallback?: FxBoundStepsLoopCallback
): FxNode[] => {
    let noContext;
    if (!context) {
        noContext = true;
        context = {} as FxParseContext;
    }
    const nodes: FxNode[] = [];
    let eventNode: FxNode = context.currentNode;
    for (let index = 0, len = steps.length; index < len; index++) {
        const currentStepItem = steps[index] as FxNodeTryStep;
        context && context.steps.push(currentStepItem);
        currentStepItem.target = eventNode;
        const { step, cursor, data } = currentStepItem;
        setContextMaxCursor(context, cursor);
        if (step === FxEventType.nodeStart) {
            const { nodeType } = data as FxNodeAdapter;
            const node = createNodeByNodeStartStep(currentStepItem);
            currentStepItem.target = node;
            node.steps.push(currentStepItem);
            if (context.currentNode) {
                node.parent = context.currentNode;
                if (nodeType === FxNodeType.attr) {
                    if (!context.currentNode.attrs) {
                        context.currentNode.attrs = [];
                    }
                    context.currentNode.attrs.push(node);
                    if (!context.currentNode.locationInfo.attrs) {
                        context.currentNode.locationInfo.attrs = [];
                    }
                    context.currentNode.locationInfo.attrs.push(node.locationInfo);
                } else {
                    if (!context.currentNode.children) {
                        context.currentNode.children = [];
                    }
                    context.currentNode.children.push(node);
                }
            } else {
                nodes.push(node);
                context.nodes && context.nodes.push(node);
            }
            context.currentNode = node;
            eventNode = node;
        } else if (step === FxEventType.startTagStart) {
            if (context.currentNode) {
                context.currentNode.steps.push(currentStepItem);
                context.currentNode.locationInfo.startTag = {
                    startLineNumber: cursor.lineNumber,
                    startColumn: cursor.column,
                    startOffset: cursor.offset,
                };
            }
        } else if (step === FxEventType.nodeNameStart) {
            if (context.currentNode) {
                context.currentNode.steps.push(currentStepItem);
                if (
                    context.currentNode.locationInfo.startTag &&
                    !context.currentNode.locationInfo.startTag.name
                ) {
                    context.currentNode.locationInfo.startTag.name = {
                        startLineNumber: cursor.lineNumber,
                        startColumn: cursor.column,
                        startOffset: cursor.offset,
                    };
                } else if (context.currentNode.locationInfo.endTag) {
                    context.currentNode.locationInfo.endTag.name = {
                        startLineNumber: cursor.lineNumber,
                        startColumn: cursor.column,
                        startOffset: cursor.offset,
                    };
                } else if (!context.currentNode.locationInfo.name) {
                    context.currentNode.locationInfo.name = {
                        startLineNumber: cursor.lineNumber,
                        startColumn: cursor.column,
                        startOffset: cursor.offset,
                    };
                }
            }
        } else if (step === FxEventType.nodeNameEnd) {
            if (context.currentNode) {
                context.currentNode.steps.push(currentStepItem);
                context.currentNode.name = data as string;
                if (
                    context.currentNode.locationInfo.startTag &&
                    !context.currentNode.locationInfo.startTag.name.endLineNumber
                ) {
                    setNodeLocationByCursor(context.currentNode.locationInfo.startTag.name, cursor);
                } else if (context.currentNode.locationInfo.endTag) {
                    setNodeLocationByCursor(context.currentNode.locationInfo.endTag.name, cursor);
                } else if (context.currentNode.locationInfo.name) {
                    setNodeLocationByCursor(context.currentNode.locationInfo.name, cursor);
                }
            }
        } else if (step === FxEventType.attrEqual) {
            if (context.currentNode) {
                context.currentNode.steps.push(currentStepItem);
                if (!context.currentNode.equalCount) {
                    context.currentNode.equalCount = 0;
                }
                context.currentNode.equalCount++;
            }
        } else if (step === FxEventType.attrLeftBoundary) {
            if (data && context.currentNode) {
                context.currentNode.steps.push(currentStepItem);
                context.currentNode.boundaryChar = [data as string];
                context.currentNode.locationInfo.leftBoundary = {
                    ...cursor,
                };
            }
        } else if (step === FxEventType.attrRightBoundary) {
            if (data && context.currentNode) {
                if (!context.currentNode.content) {
                    context.currentNode.content = "";
                }
                context.currentNode.steps.push(currentStepItem);
                context.currentNode.boundaryChar.push(data as string);
                context.currentNode.locationInfo.rightBoundary = {
                    ...cursor,
                };
            }
        } else if (step === FxEventType.startTagEnd) {
            if (context.currentNode) {
                if (Array.isArray(data) && FxNodeCloseTypeMap[data[1] as FxNodeCloseType]) {
                    context.currentNode.closeType = data[1] as FxNodeCloseType;
                }
                context.currentNode.steps.push(currentStepItem);
                setNodeLocationByCursor(context.currentNode.locationInfo, cursor, "startTag");
            }
        } else if (step === FxEventType.nodeContentStart) {
            if (context.currentNode) {
                context.currentNode.steps.push(currentStepItem);
                context.currentNode.locationInfo.content = {
                    startLineNumber: cursor.lineNumber,
                    startColumn: cursor.column,
                    startOffset: cursor.offset,
                };
            }
        } else if (step === FxEventType.nodeContentEnd) {
            if (context.currentNode) {
                context.currentNode.steps.push(currentStepItem);
                if (data) {
                    context.currentNode.content = data as string;
                }
                setNodeLocationByCursor(context.currentNode.locationInfo.content, cursor);
            }
        } else if (step === FxEventType.endTagStart) {
            if (context.currentNode) {
                context.currentNode.steps.push(currentStepItem);
                context.currentNode.locationInfo.endTag = {
                    startLineNumber: cursor.lineNumber,
                    startColumn: cursor.column,
                    startOffset: cursor.offset,
                };
            }
        } else if (step === FxEventType.endTagEnd) {
            if (context.currentNode) {
                context.currentNode.steps.push(currentStepItem);
                setNodeLocationByCursor(context.currentNode.locationInfo, cursor, "endTag");
            }
        } else if (step === FxEventType.nodeEnd) {
            if (context.currentNode) {
                setNodeLocationByCursor(context.currentNode.locationInfo, cursor);
                if (
                    Array.isArray(data) &&
                    data[1] &&
                    FxNodeCloseTypeMap[data[1] as FxNodeCloseType]
                ) {
                    if (
                        !(
                            context.currentNode.closeType === FxNodeCloseType.startTagClosed &&
                            (data[1] as FxNodeCloseType) === FxNodeCloseType.notClosed
                        )
                    ) {
                        context.currentNode.closeType = data[1] as FxNodeCloseType;
                    }
                }
                context.currentNode.steps.push(currentStepItem);
                if (context.currentNode.parent) {
                    context.currentNode = context.currentNode.parent;
                } else {
                    delete context.currentNode;
                }
            }
        } else {
            context.currentNode && context.currentNode.steps.push(currentStepItem);
        }
        if (!noContext) {
            Object.assign(context, cursor);
            if (step === FxEventType.error) {
                fireEvent(step, context, data as FxWrong);
                throw data;
            } else {
                fireEvent(step, context, eventNode);
                if (step === FxEventType.nodeEnd) {
                    eventNode = context.currentNode;
                }
            }
        }
        if (loopCallback && loopCallback(currentStepItem, index)) {
            break;
        }
    }
    return nodes;
};

export const fireEvent = (type: FxEventType, context: FxParseContext, data: FxNode | FxWrong) => {
    context.options &&
        typeof context.options.onEvent === "function" &&
        context.options.onEvent(type, context, data);
};
export function isTrueOption(prop: FxParseOptionsKeys, options?: FxParseOptions): boolean {
    return !!(options && options[prop]);
}

export function equalOption<P extends keyof FxParseOptions>(
    prop: P,
    value: FxParseOptions[P],
    options?: FxParseOptions,
    defaultValue?: FxParseOptions[P]
): boolean {
    if (options) {
        if (options[prop]) {
            return options[prop] === value;
        }
        return value === defaultValue;
    }
    return value === defaultValue;
}

export const checkCommonOption = <T extends keyof FxParseOptions>(
    options: FxParseOptions,
    optionName: T,
    defaultValue: FxParseOptions[T],
    xml: string,
    cursor: FxCursorPosition,
    adapter: FxNodeAdapter,
    steps: FxTryStep[]
): boolean => {
    const optionValue = optionName in options ? options[optionName] : defaultValue;
    if (isFunc(optionValue)) {
        return (optionValue as FxOptionChecker)(xml, cursor, adapter, steps);
    }
    return !!optionValue;
};

export const checkTagBoundaryNearSpace = <
    T extends "allowStartTagBoundaryNearSpace" | "allowEndTagBoundaryNearSpace"
>(
    options: FxParseOptions,
    optionName: T,
    defaultValue: FxParseOptions[T],
    xml: string,
    cursor: FxCursorPosition,
    adapter: FxNodeAdapter,
    tagName?: string,
    spacePosition?: FxBoundaryPosition,
    steps?: FxTryStep[]
): boolean => {
    const optionValue = optionName in options ? options[optionName] : defaultValue;
    if (isFunc(optionValue)) {
        const res = (optionValue as FxAllowNearTagBoundarySpace)(
            xml,
            cursor,
            adapter,
            tagName,
            spacePosition,
            steps
        );
        if (FxBoundaryPositionMap[res as FxBoundaryPosition]) {
            return res === spacePosition;
        }
        return !!res;
    }
    if (optionValue instanceof RegExp) {
        return optionValue.test(tagName);
    }
    if (FxBoundaryPositionMap[optionValue as FxBoundaryPosition]) {
        return optionValue === spacePosition;
    }
    return !!optionValue;
};

export const checkAllowTagNameHasSpace = <T extends "allowTagNameHasSpace">(
    options: FxParseOptions,
    defaultValue: FxParseOptions[T],
    xml: string,
    cursor: FxCursorPosition,
    adapter: FxNodeAdapter,
    tagName: string
): boolean => {
    const optionName = "allowTagNameHasSpace";
    const optionValue = optionName in options ? options[optionName] : defaultValue;
    if (isFunc(optionValue)) {
        const res = (optionValue as FxAllowTagNameHasSpace)(xml, cursor, adapter, tagName);
        return !!res;
    }
    if (optionValue instanceof RegExp) {
        return optionValue.test(tagName);
    }
    return !!optionValue;
};

export const checkOptionAllow = <
    T extends keyof FxParseOptions,
    CV = FxParseOptions[T] extends Function ? never : FxParseOptions[T]
>(
    options: FxParseOptions,
    optionName: T,
    defaultOptionValue: CV,
    testValue: string,
    ...optionCheckerArgs: any[]
): boolean => {
    if (!options || !(optionName in options)) {
        if (defaultOptionValue instanceof RegExp) {
            return (defaultOptionValue as RegExp).test(testValue);
        }
        return !!defaultOptionValue;
    }
    if (isFunc(options[optionName])) {
        return (options[optionName] as Function).apply(null, optionCheckerArgs);
    }
    if (options[optionName] instanceof RegExp) {
        return (options[optionName] as RegExp).test(testValue);
    }
    if (
        optionName === "allowStartTagBoundaryNearSpace" &&
        FxBoundaryPositionMap[options[optionName] as string] &&
        FxBoundaryPositionMap[optionCheckerArgs[optionCheckerArgs.length - 1] as string]
    ) {
        return optionCheckerArgs[optionCheckerArgs.length - 1] === options[optionName];
    }
    return !!options[optionName];
};

export const computeOption = <
    T extends keyof FxParseOptions,
    CV = FxParseOptions[T] extends Function ? never : FxParseOptions[T]
>(
    options: FxParseOptions,
    optionName: T,
    defaultOptionValue: CV,
    ...args: any[]
): CV => {
    if (!options || !(optionName in options)) {
        return defaultOptionValue;
    }
    if (isFunc(options[optionName])) {
        return (options[optionName] as Function).apply(null, args);
    }
    return (options[optionName] as unknown) as CV;
};

export const checkAllowNodeNotClose = (
    onlyAnteriorNode: FxNode,
    context: FxParseContext,
    adapter: FxNodeAdapter,
    nodeNmae?: string,
    options?: FxParseOptions,
    xml?: string,
    cursor?: FxCursorPosition,
    steps?: FxTryStep[]
) => {
    if (adapter.allowNodeNotClose === FxNodeParserAllowNodeNotCloseOption.allow) {
        return true;
    }
    if (adapter.allowNodeNotClose === FxNodeParserAllowNodeNotCloseOption.notAllow) {
        return false;
    }
    if (typeof adapter.allowNodeNotClose === "function") {
        if (onlyAnteriorNode) {
            return adapter.allowNodeNotClose(onlyAnteriorNode, context, adapter);
        }
        return adapter.allowNodeNotClose(xml, cursor, adapter, steps, nodeNmae);
    }
    options = options || context.options;
    if (!options || !options.allowNodeNotClose) {
        return false;
    }
    if ((onlyAnteriorNode || nodeNmae) && options.allowNodeNotClose instanceof RegExp) {
        return options.allowNodeNotClose.test(onlyAnteriorNode ? onlyAnteriorNode.name : nodeNmae);
    }
    if (typeof options.allowNodeNotClose === "function") {
        if (onlyAnteriorNode) {
            return options.allowNodeNotClose(onlyAnteriorNode, context, adapter);
        }
        return options.allowNodeNotClose(xml, cursor, adapter, steps, nodeNmae);
    }
    return !!options.allowNodeNotClose;
};
