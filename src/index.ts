import { pathOr } from "./utils";

type UniformAny = any;

type Message = { key: string; message?: string };
function startMessage(key: string, operator: Operators) {
  const defaultMessage = `Validation failed for field "${key}" with operator ${operator}`;

  return (condition: boolean, message?: string): Message | undefined => {
    if (!condition) {
      return { key, message: message ?? defaultMessage };
    }
    return undefined;
  };
}

type Operators =
  | "_eq"
  | "_neq"
  | "_lt"
  | "_lte"
  | "_gt"
  | "_gte"
  | "_in"
  | "_nin"
  | "_is_null"
  | "_like"
  | "_ilike"
  | "_null"
  | "_not_null"
  | "_contains"
  | "_starts_with"
  | "_ends_with";

type NestedOperators = "_and" | "_or" | "_not";

const operatorsFns: Record<
  Operators,
  (fieldValue: UniformAny, conditionValue: UniformAny) => boolean
> = {
  // Checks if the field value is equal to the condition value
  _eq: (fieldValue, conditionValue) => fieldValue === conditionValue,
  // Checks if the field value is not equal to the condition value
  _neq: (fieldValue, conditionValue) => fieldValue !== conditionValue,
  // Checks if the field value is less than the condition value
  _lt: (fieldValue, conditionValue) => fieldValue < conditionValue,
  // Checks if the field value is less than or equal to the condition value
  _lte: (fieldValue, conditionValue) => fieldValue <= conditionValue,
  // Checks if the field value is greater than the condition value
  _gt: (fieldValue, conditionValue) => fieldValue > conditionValue,
  // Checks if the field value is greater than or equal to the condition value
  _gte: (fieldValue, conditionValue) => fieldValue >= conditionValue,
  // Checks if the field value is included in the condition value
  _in: (fieldValue, conditionValue) => conditionValue.includes(fieldValue),
  // Checks if the field value is not included in the condition value
  _nin: (fieldValue, conditionValue) => !conditionValue.includes(fieldValue),
  // Checks if the field value is null
  _is_null: (fieldValue, conditionValue) => fieldValue === null,
  // Checks if the field value matches the regular expression provided in the condition value
  _like: (fieldValue, conditionValue) =>
    new RegExp(conditionValue).test(fieldValue),
  // Checks if the field value matches the case-insensitive regular expression provided in the condition value
  _ilike: (fieldValue, conditionValue) =>
    new RegExp(conditionValue, "i").test(fieldValue),
  // Checks if the field value is null
  _null: (fieldValue) => fieldValue === null,
  // Checks if the field value is not null
  _not_null: (fieldValue) => fieldValue !== null,
  // Checks if the field value contains the condition value
  _contains: (fieldValue, conditionValue) =>
    fieldValue.includes(conditionValue),
  // Checks if the field value starts with the condition value
  _starts_with: (fieldValue, conditionValue) =>
    fieldValue.startsWith(conditionValue),
  // Checks if the field value ends with the condition value
  _ends_with: (fieldValue, conditionValue) =>
    fieldValue.endsWith(conditionValue),
};

type ConditionValue = {
  value: UniformAny;
  message?: string;
};

export type WhereOperators = Partial<Record<Operators, ConditionValue>>;

type NestedWhereOperators<TPossibleEntries extends keyof any> = Partial<
  Record<
    NestedOperators,
    Array<
      WhereOperators &
        NestedWhereOperators<TPossibleEntries> &
        Partial<Record<TPossibleEntries, WhereOperators>>
    >
  >
>;

export type WhereInput<TPossibleEntries extends keyof any> =
  NestedWhereOperators<TPossibleEntries> &
    WhereOperators &
    Partial<Record<TPossibleEntries, WhereOperators>>;

export function evaluateWhereFilters<TPossibleEntries extends keyof any>(
  where: WhereInput<TPossibleEntries>,
  data: Record<string, UniformAny>,
  key: string = ""
): { messages: (Message | undefined)[]; allPassed: boolean } {
  if (where._and) {
    const result = where._and.map((condition) =>
      evaluateWhereFilters(condition, data)
    );
    return {
      messages: result.flatMap((r) => r.messages),
      allPassed: result.flatMap((r) => r.allPassed).every(Boolean),
    };
  }
  if (where._or) {
    const result = where._or.map((condition) =>
      evaluateWhereFilters(condition, data)
    );
    return {
      messages: result.flatMap((r) => r.messages),
      allPassed: result.flatMap((r) => r.allPassed).some(Boolean),
    };
  }
  if (where._not) {
    const result = where._not.map((condition) =>
      evaluateWhereFilters(condition, data)
    );
    return {
      messages: result.flatMap((r) => r.messages),
      allPassed: result.flatMap((r) => r.allPassed).every((passed) => !passed),
    };
  }

  const messages: (Message | undefined)[] = [];
  const fieldKeys = Object.keys(where).filter((key) => !key.startsWith("_"));

  for (const key of fieldKeys) {
    const whereQuery = where as Record<
      string,
      Partial<Record<Operators, ConditionValue>>
    >;
    const fieldConditions = whereQuery[key];
    if (fieldConditions) {
      const fieldValue = pathOr("", key.split("."), data);
      const operatorKeys = Object.keys(fieldConditions) as Operators[];

      for (const operator of operatorKeys) {
        const condition = fieldConditions[operator];
        if (!condition) break;
        const conditionValue = condition.value;
        const operatorFn = operatorsFns[operator];
        const evaluateMessage = startMessage(key, operator);
        const message = evaluateMessage(
          operatorFn(fieldValue, conditionValue),
          condition.message
        );
        messages.push(message);
      }
    }
  }

  const fieldOperators = Object.keys(where).filter((key) =>
    key.startsWith("_")
  );

  for (const operator of fieldOperators) {
    const whereQuery = where as Record<Operators, ConditionValue>;
    const fieldConditions = whereQuery[operator as Operators];
    const condition = fieldConditions;
    const conditionValue = condition.value;
    const operatorFn = operatorsFns[operator as Operators];
    const fieldValue = pathOr("", key.split("."), data);
    const evaluateMessage = startMessage(key, operator as Operators);
    const message = evaluateMessage(
      operatorFn(fieldValue, conditionValue),
      condition.message
    );
    messages.push(message);
  }

  return { messages, allPassed: messages.filter(Boolean).length === 0 };
}

type Stuff = {
  hello: string;
  goodbye: string;
};

const test: WhereInput<keyof Stuff> = {
  _and: [{ _and: [{ _eq: { value: "test", message: "asdasdas" } }] }],
  _lt: { value: "test", message: "test" },
  _or: [{ _eq: { value: "test", message: "asd" } }],
  goodbye: { _contains: { value: "test" } },
};
