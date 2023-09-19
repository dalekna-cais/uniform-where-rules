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
  _eq: (fieldValue: any, conditionValue: any) => fieldValue === conditionValue,
  _neq: (fieldValue: any, conditionValue: any) => fieldValue !== conditionValue,
  _lt: (fieldValue: any, conditionValue: any) => !(fieldValue < conditionValue),
  _lte: (fieldValue: any, conditionValue: any) =>
    !(fieldValue <= conditionValue),
  _gt: (fieldValue: any, conditionValue: any) => !(fieldValue > conditionValue),
  _gte: (fieldValue: any, conditionValue: any) =>
    !(fieldValue >= conditionValue),
  _in: (fieldValue: any, conditionValue: any) =>
    !conditionValue.includes(fieldValue),
  _nin: (fieldValue: any, conditionValue: any) =>
    conditionValue.includes(fieldValue),
  _is_null: (fieldValue: any, conditionValue: any) => fieldValue !== null,
  _like: (fieldValue: any, conditionValue: any) =>
    !new RegExp(conditionValue).test(fieldValue),
  _ilike: (fieldValue: any, conditionValue: any) =>
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
  _and?: WhereCondition<FieldIdentifiers>[];
  _or?: WhereCondition<FieldIdentifiers>[];
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
    // TODO: fix this, currently invalid, need to reverse result
    const result = where._not.map((condition) =>
      evaluateWhereFilters(condition, data)
    );
    return {
      messages: result.flatMap((r) => r.messages),
      allPassed: result.flatMap((r) => r.allPassed).every(Boolean),
    };
  }

  // TODO: all other that starts with _

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

  return { messages, allPassed: messages.every(Boolean) };
}
