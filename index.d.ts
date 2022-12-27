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

export default function (options?: TsqueryOptions): (str: string) => string;
