declare namespace tsquery {
  export interface TsqueryOptions {
    word?: RegExp; // regex for a word. It must contain named captures: word (required), quote (optional), phrase (optional), negated (optional)
    negated?: RegExp; // regex to detect if the expression following an operator is negated, this is useful for example with 'foo!bar', you can parse it as foo&!bar by adding the negation as part of and
    quotedWordSep?: RegExp; // regex for word delimiters inside quotes
    or?: RegExp; // regex for `or` operator
    and?: RegExp; // regex for `and` operator
    followedBy?: RegExp; // regex for `followedBy` operator
    parStart?: RegExp; // regex for start of parenthesized group
    parEnd?: RegExp; // regex for  end of parenthesized group
    prefix?: RegExp; // regex for detecting `prefix` operator (placed at the end of a word to match words starting like it)
    tailOp?: string; // default operator to use with tail (unparsed suffix of the query, if any)
    singleQuoteReplacement?: string; // should not be a reserved word like <()|&!]|:\*
  }

  interface BaseNode<T extends string | undefined> {
    readonly type: T;
    readonly negated: boolean | undefined;
    readonly left: TsqueryNode | undefined;
    readonly right: TsqueryNode | undefined;
    readonly value: string | undefined;
    readonly prefix: string | undefined;
    readonly quoted: boolean | undefined;
    toString(): string;
  }

  export interface AndNode extends BaseNode<"&"> {
    readonly left: TsqueryNode;
    readonly right: TsqueryNode;
    readonly value: undefined;
    readonly prefix: undefined;
    readonly quoted: undefined;
  }

  export interface OrNode extends BaseNode<"|"> {
    readonly left: TsqueryNode;
    readonly right: TsqueryNode;
    readonly value: undefined;
    readonly prefix: undefined;
    readonly quoted: undefined;
  }

  export interface FollowedByNode extends BaseNode<`<${"-" | number}>`> {
    readonly left: WordNode;
    readonly right: WordNode;
    readonly value: undefined;
    readonly prefix: undefined;
    readonly quoted: undefined;
  }

  export interface WordNode extends BaseNode<undefined> {
    readonly value: string;
    readonly left: undefined;
    readonly right: undefined;
    readonly quoted: boolean;
  }

  export type TsqueryNode = AndNode | OrNode | FollowedByNode | WordNode;

  export class Tsquery {
    constructor(options?: TsqueryOptions);
    parseAndStringify(str: string): string;
    parse(str: string): TsqueryNode | undefined;
  }
}

declare function tsquery(options?: tsquery.TsqueryOptions): (str: string) => string;

interface tsquery {
  (options?: tsquery.TsqueryOptions): (str: string) => string;
  Tsquery: tsquery.Tsquery;
  Node: tsquery.TsqueryNode;
}

export = tsquery;
