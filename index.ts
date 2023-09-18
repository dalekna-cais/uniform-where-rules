import { pathOr } from "./utils";

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

type ConditionValue = {
  value: any;
  message?: string;
};

type WhereCondition<FormValues extends Record<string, any>> =
  NestedWhereFilters<FormValues> &
    Partial<
      Record<keyof FormValues, Partial<Record<Operators, ConditionValue>>>
    >;

type NestedWhereFilters<FormValues extends Record<string, any>> = {
  _and?: WhereCondition<FormValues>[];
  _or?: WhereCondition<FormValues>[];
  _not?: WhereCondition<FormValues>;
};

type WhereInput<FormValues extends Record<string, any>> =
  NestedWhereFilters<FormValues> & WhereCondition<FormValues>;

function getStuff<FormValues extends Record<string, any>>(
  where: WhereInput<FormValues>,
  data: Record<string, any>
) {
  const messages: string[] = [];

  function evaluateWhereFilters<FormValues extends Record<string, any>>(
    where: WhereInput<FormValues>,
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
      return !evaluateWhereFilters(where._not, data);
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
          const defaultMessage = `Validation failed for field "${key}" with operator ${operator}`;

          switch (operator) {
            case "_eq":
              if (fieldValue !== conditionValue) {
                messages.push(condition.message ?? defaultMessage);
              }
              break;
            case "_neq":
              if (fieldValue === conditionValue) {
                messages.push(condition.message ?? defaultMessage);
              }
              break;
            case "_lt":
              if (!(fieldValue < conditionValue)) {
                messages.push(condition.message ?? defaultMessage);
              }
              break;
            case "_lte":
              if (!(fieldValue <= conditionValue)) {
                messages.push(condition.message ?? defaultMessage);
              }
              break;
            case "_gt":
              if (!(fieldValue > conditionValue)) {
                messages.push(condition.message ?? defaultMessage);
              }
              break;
            case "_gte":
              if (!(fieldValue >= conditionValue)) {
                messages.push(condition.message ?? defaultMessage);
              }
              break;
            case "_in":
              if (!conditionValue.includes(fieldValue)) {
                messages.push(condition.message ?? defaultMessage);
              }
              break;
            case "_nin":
              if (conditionValue.includes(fieldValue)) {
                messages.push(condition.message ?? defaultMessage);
              }
              break;
            case "_is_null":
              if (fieldValue !== null) {
                messages.push(condition.message ?? defaultMessage);
              }
              break;
            case "_like":
              if (!new RegExp(conditionValue).test(fieldValue)) {
                messages.push(condition.message ?? defaultMessage);
              }
              break;
            case "_ilike":
              if (!new RegExp(conditionValue, "i").test(fieldValue)) {
                messages.push(condition.message ?? defaultMessage);
              }
              break;
            default:
              break;
          }
        }
      }
    }

    return messages.every(Boolean);
  }

  evaluateWhereFilters(where, data);

  return messages;
}

const whereFilters: WhereInput<{ age: string; name: string }> = {
  age: { _gte: { value: 30 }, _lte: { value: 50 } },
  name: { _ilike: { value: "John%" } },
};

const data = {
  age: 34,
  name: "John Doe",
};

const result = getStuff(whereFilters, data);

console.log(result); // Output: true
