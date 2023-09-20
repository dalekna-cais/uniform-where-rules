import { WhereInput, evaluateWhereFilters } from "./index";

describe("evaluateWhereFilters", () => {
  it("should return true", () => {
    const where = {
      age: { _gte: { value: 30 }, _lte: { value: 50 } },
      name: { _ilike: { value: "John" } },
    };
    const data = {
      age: 34,
      name: "John Doe",
    };
    const result = evaluateWhereFilters(where, data);
    expect(result.allPassed).toBe(true);
  });

  it("should return true for _eq operator if field value is equal to the condition value", () => {
    const where = {
      field: {
        _eq: { value: 10 },
      },
    };
    const result = evaluateWhereFilters(where, {
      field: 10,
    });
    expect(result.allPassed).toBe(true);
  });

  it("should return true for _neq operator if field value is not equal to the condition value", () => {
    const where = {
      field: {
        _neq: { value: 10 },
      },
    };

    const data = {
      field: 20,
    };

    const result = evaluateWhereFilters(where, data);
    expect(result.allPassed).toBe(true);
  });

  it("should return true for _lt operator if field value is less than the condition value", () => {
    const where = {
      field: {
        _lt: { value: 10 },
      },
    };

    const data = {
      field: 5,
    };

    const result = evaluateWhereFilters(where, data);
    expect(result.allPassed).toBe(true);
  });

  it("should return true for _lte operator if field value is less than or equal to the condition value", () => {
    const where = {
      field: {
        _lte: { value: 10 },
      },
    };

    const data = {
      field: 10,
    };

    const result = evaluateWhereFilters(where, data);
    expect(result.allPassed).toBe(true);
  });

  it("should return true for _gt operator if field value is greater than the condition value", () => {
    const where = {
      field: {
        _gt: { value: 10 },
      },
    };

    const data = {
      field: 20,
    };

    const result = evaluateWhereFilters(where, data);
    expect(result.allPassed).toBe(true);
  });

  it("should return true for _gte operator if field value is greater than or equal to the condition value", () => {
    const where = {
      field: {
        _gte: { value: 10 },
      },
    };

    const data = {
      field: 10,
    };

    const result = evaluateWhereFilters(where, data);
    expect(result.allPassed).toBe(true);
  });

  it("should return true for _in operator if field value is in the condition value array", () => {
    const where = {
      field: {
        _in: { value: [1, 2, 3] },
      },
    };

    const data = {
      field: 2,
    };

    const result = evaluateWhereFilters(where, data);
    expect(result.allPassed).toBe(true);
  });

  it("should return true for _nin operator if field value is not in the condition value array", () => {
    const where = {
      field: {
        _nin: { value: [1, 2, 3] },
      },
    };

    const data = {
      field: 4,
    };

    const result = evaluateWhereFilters(where, data);
    expect(result.allPassed).toBe(true);
  });

  it("should return false for _is_null operator if field value is not null", () => {
    const where = {
      field: {
        _is_null: { value: null },
      },
    };

    const data = {
      field: "value",
    };

    const result = evaluateWhereFilters(where, data);
    expect(result.allPassed).toBe(false);
  });

  it("should return false for _like operator if field value does not match the condition value regex", () => {
    const where = {
      field: {
        _like: { value: "^abc" },
      },
    };

    const data = {
      field: "def",
    };

    const result = evaluateWhereFilters(where, data);
    expect(result.allPassed).toBe(false);
  });

  it("should return false for _ilike operator if field value does not match the condition value regex case-insensitively", () => {
    const where = {
      field: {
        _ilike: { value: "^abc" },
      },
    };

    const data = {
      field: "DEF",
    };

    const result = evaluateWhereFilters(where, data);
    expect(result.allPassed).toBe(false);
  });

  it("should return true for nested _and condition if both conditions are true", () => {
    const where: WhereInput<keyof { field1: string; field2: string }> = {
      _and: [
        {
          field1: {
            _eq: { value: 10 },
          },
        },
        {
          field2: {
            _gt: { value: 20 },
          },
        },
      ],
    };

    const data = {
      field1: 10,
      field2: 30,
    };

    const result = evaluateWhereFilters(where, data);
    expect(result.allPassed).toBe(true);
  });

  it("should return true for nested _or condition if any one condition is true", () => {
    const where: WhereInput<keyof { field1: string; field2: string }> = {
      _or: [
        {
          field1: {
            _eq: { value: 10 },
          },
        },
        {
          field2: {
            _gt: { value: 21 },
          },
        },
      ],
    };

    const data = {
      field1: 20,
      field2: 22,
    };

    const result = evaluateWhereFilters(where, data);
    expect(result.allPassed).toBe(true);
  });

  it("should return true for nested _not condition if the inner condition is false", () => {
    const where = {
      _not: [
        {
          field: {
            _eq: { value: 10 },
          },
        },
      ],
    };

    const data = {
      field: 20,
    };

    const result = evaluateWhereFilters(where, data);
    expect(result.allPassed).toBe(true);
  });

  it("should return false for _eq operator if field value is not equal to the condition value", () => {
    const where = {
      field: {
        _eq: { value: 10 },
      },
    };

    const data = {
      field: 20,
    };

    const result = evaluateWhereFilters(where, data);
    expect(result.allPassed).toBe(false);
  });

  it("should return false for _neq operator if field value is equal to the condition value", () => {
    const where = {
      field: {
        _neq: { value: 10 },
      },
    };

    const data = {
      field: 10,
    };

    const result = evaluateWhereFilters(where, data);
    expect(result.allPassed).toBe(false);
  });

  it("should return false for _lt operator if field value is not less than the condition value", () => {
    const where = {
      field: {
        _lt: { value: 10 },
      },
    };

    const data = {
      field: 20,
    };

    const result = evaluateWhereFilters(where, data);
    expect(result.allPassed).toBe(false);
  });

  it("should return false for _lte operator if field value is not less than or equal to the condition value", () => {
    const where = {
      field: {
        _lte: { value: 10 },
      },
    };

    const data = {
      field: 20,
    };

    const result = evaluateWhereFilters(where, data);
    expect(result.allPassed).toBe(false);
  });

  it("should return false for _gt operator if field value is not greater than the condition value", () => {
    const where = {
      field: {
        _gt: { value: 10 },
      },
    };

    const data = {
      field: 5,
    };

    const result = evaluateWhereFilters(where, data);
    expect(result.allPassed).toBe(false);
  });
});
