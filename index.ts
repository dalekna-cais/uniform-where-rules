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

type WhereCondition<FormValues extends Record<string, any>> = Partial<
  Record<keyof FormValues, Partial<Record<Operators, ConditionValue>>>
>;

type NestedWhereFilters<FormValues extends Record<string, any>> = {
  _and?: WhereCondition<FormValues>[];
  _or?: WhereCondition<FormValues>[];
  _not?: WhereCondition<FormValues>;
};

type WhereInput<FormValues extends Record<string, any>> =
  NestedWhereFilters<FormValues> & WhereCondition<FormValues>;

function evaluateWhereFilters<FormValues extends Record<string, any>>(
  where: WhereInput<FormValues>,
  data: Record<string, any>
): boolean | string {
  if (where._and) {
    return where._and.every((condition) =>
      evaluateWhereFilters(condition, data)
    );
  }

  if (where._or) {
    return where._or.some((condition) => evaluateWhereFilters(condition, data));
  }

  if (where._not) {
    return !evaluateWhereFilters(where._not, data);
  }

  const result = Object.entries(input).map(([fieldId, where]) => {
    for (const fieldId in where) {
      if (fieldId.startsWith("_")) continue;

      const whereFilters = where[fieldId];

      for (const operator in whereFilters) {
        const { value, errorMessage } = whereFilters[operator];

        switch (operator) {
          case "_eq":
            if (data[fieldId] !== value) return errorMessage || false;
            break;
          case "_neq":
            if (data[fieldId] === value) return errorMessage || false;
            break;
          case "_lt":
            if (data[fieldId] >= value) return errorMessage || false;
            break;
          case "_lte":
            if (data[fieldId] > value) return errorMessage || false;
            break;
          case "_gt":
            if (data[fieldId] <= value) return errorMessage || false;
            break;
          case "_gte":
            if (data[fieldId] < value) return errorMessage || false;
            break;
          case "_in":
            if (!value.includes(data[fieldId])) return errorMessage || false;
            break;
          case "_nin":
            if (value.includes(data[fieldId])) return errorMessage || false;
            break;
          case "_is_null":
            if ((value && data[fieldId]) || (!value && data[fieldId]))
              return errorMessage || false;
            break;
          case "_like":
            if (!data[fieldId].includes(value)) return errorMessage || false;
            break;
          case "_ilike":
            if (!data[fieldId].toLowerCase().includes(value.toLowerCase()))
              return errorMessage || false;
            break;
          default:
            throw new Error(`Unknown operator: ${operator}`);
        }
      }
    }

    return true;
  });

  return result.every(Boolean);
}

const whereFilters: WhereInput<{ age: string; name: string }> = {
  age: { _gte: { value: 30, message: "" }, _lte: { value: 50, message: "" } },
  name: { _ilike: { value: "John%", message: "" } },
};

const data = {
  age: 35,
  name: "John Doe",
};

const result = evaluateWhereFilters(whereFilters, data);

console.log(result); // Output: true
