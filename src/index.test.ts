import { evaluateWhereFilters } from "./index";

describe("executeStuff", () => {
  it("should return true", () => {
    const whereFilters = {
      age: { _gte: { value: 30 }, _lte: { value: 50 } },
      name: { _ilike: { value: "John" } },
    };

    const data = {
      age: 34,
      name: "John Doe",
    };

    const result = evaluateWhereFilters(whereFilters, data);

    expect(result).toMatchInlineSnapshot(`
{
  "allPassed": false,
  "messages": [
    undefined,
    undefined,
    undefined,
  ],
}
`);
  });
});
