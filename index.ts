import { pathOr } from "./utils";

type Message = { key: string; message: string };
function startMessage(messages: Message[], key: string, operator: Operators) {
  const defaultMessage = `Validation failed for field "${key}" with operator ${operator}`;
  return (condition: boolean, message?: string) => {
    if (condition) {
      messages.push({ key, message: message ?? defaultMessage });
      return false;
    } else {
      //
      return true;
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

function executeStuff<FieldIdentifiers extends Record<string, any>>(
  where: WhereInput<FieldIdentifiers>,
  data: Record<string, any>
) {
  const messages: Message[] = [];

  function evaluateWhereFilters<FieldIdentifiers extends Record<string, any>>(
    where: WhereInput<FieldIdentifiers>,
    data: Record<string, any>
  ): boolean {
    if (where._and) {
      return where._and.every((condition) =>
        evaluateWhereFilters(condition, data)
      );
    }
    if (where._or) {
      return where._or.some((condition) =>
        evaluateWhereFilters(condition, data)
      );
    }
    if (where._not) {
      return where._not.every((condition) =>
        evaluateWhereFilters(condition, data)
      );
    }

    // TODO: all other that starts with _

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
          const evaluateMessage = startMessage(messages, key, operator);
          return evaluateMessage(
            operatorFn(fieldValue, conditionValue),
            condition.message
          );
        }
      }
    }

    return false;
  }

  const allPassed = evaluateWhereFilters(where, data);

  return { allPassed, messages };
}

const whereFilters: WhereInput = {
  age: { _gte: { value: 30 }, _lte: { value: 50 } },
  name: { _ilike: { value: "Kobra%" } },
};

const data = {
  age: 34,
  name: "John Doe",
};

const result = executeStuff(whereFilters, data);

console.log(result); // Output: true
