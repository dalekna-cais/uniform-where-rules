import { pathOr } from "./utils";

type Message = { key: string; message?: string; passed: boolean };
function startMessage(key: string, operator: Operators) {
  const defaultMessage = `Validation failed for field "${key}" with operator ${operator}`;

  return (condition: boolean, message?: string): Message | undefined => {
    if (condition) {
      return { key, message: message ?? defaultMessage, passed: false };
    }
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
  | "_ilike";

const operatorsFns: Record<
  Operators,
  (fieldValue: any, conditionValue: any) => boolean
> = {
  // Checks if the field value is equal to the condition value
  _eq: (fieldValue, conditionValue) => fieldValue === conditionValue,
  // Checks if the field value is not equal to the condition value
  _neq: (fieldValue, conditionValue) => fieldValue !== conditionValue,
  // Checks if the field value is not less than the condition value
  _lt: (fieldValue, conditionValue) => !(fieldValue < conditionValue),
  // Checks if the field value is not less than or equal to the condition value
  _lte: (fieldValue, conditionValue) => !(fieldValue <= conditionValue),
  // Checks if the field value is not greater than the condition value
  _gt: (fieldValue, conditionValue) => !(fieldValue > conditionValue),
  // Checks if the field value is not greater than or equal to the condition value
  _gte: (fieldValue, conditionValue) => !(fieldValue >= conditionValue),
  // Checks if the field value is not included in the condition value
  _in: (fieldValue, conditionValue) => !conditionValue.includes(fieldValue),
  // Checks if the field value is included in the condition value
  _nin: (fieldValue, conditionValue) => conditionValue.includes(fieldValue),
  // Checks if the field value is not null
  _is_null: (fieldValue, conditionValue) => fieldValue !== null,
  // Checks if the field value does not match the regular expression provided in the condition value
  _like: (fieldValue, conditionValue) =>
    !new RegExp(conditionValue).test(fieldValue),
  // Checks if the field value does not match the case-insensitive regular expression provided in the condition value
  _ilike: (fieldValue, conditionValue) =>
    !new RegExp(conditionValue, "i").test(fieldValue),
};

type ConditionValue = {
  value: any;
  message?: string;
};

type WhereCondition<FieldIdentifiers extends Record<string, any>> =
  NestedWhereFilters<FieldIdentifiers> &
    Partial<
      Record<keyof FieldIdentifiers, Partial<Record<Operators, ConditionValue>>>
    >;

type NestedWhereFilters<FieldIdentifiers extends Record<string, any>> = {
  /** Defines an array of nested conditions where all conditions must evaluate to true. */
  _and?: WhereCondition<FieldIdentifiers>[];
  /** Defines an array of nested conditions where at least one condition must evaluate to true. */
  _or?: WhereCondition<FieldIdentifiers>[];
  /** Defines an array of nested conditions where all conditions must evaluate to false. */
  _not?: WhereCondition<FieldIdentifiers>[];
};

type WhereInput<
  FieldIdentifiers extends Record<string, any> = Record<string, any>
> = NestedWhereFilters<FieldIdentifiers> & WhereCondition<FieldIdentifiers>;

export function evaluateWhereFilters<
  FieldIdentifiers extends Record<string, any>
>(
  where: WhereInput<FieldIdentifiers>,
  data: Record<string, any>
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
    const fieldConditions = where[key];
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

  return { messages, allPassed: messages.filter(Boolean).length === 0 };
}
