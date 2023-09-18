function evaluateWhereFilters(where, data) {
    for (var column in where) {
        for (var operator in where[column]) {
            var value = where[column][operator];
            switch (operator) {
                case "_eq":
                    if (data[column] !== value)
                        return false;
                    break;
                case "_neq":
                    if (data[column] === value)
                        return false;
                    break;
                case "_lt":
                    if (data[column] >= value)
                        return false;
                    break;
                case "_lte":
                    if (data[column] > value)
                        return false;
                    break;
                case "_gt":
                    if (data[column] <= value)
                        return false;
                    break;
                case "_gte":
                    if (data[column] < value)
                        return false;
                    break;
                case "_in":
                    if (!value.includes(data[column]))
                        return false;
                    break;
                case "_nin":
                    if (value.includes(data[column]))
                        return false;
                    break;
                case "_is_null":
                    if ((value && !data[column]) || (!value && data[column]))
                        return false;
                    break;
                case "_like":
                    if (!data[column].includes(value))
                        return false;
                    break;
                case "_ilike":
                    if (!data[column].toLowerCase().includes(value.toLowerCase()))
                        return false;
                    break;
                // Add more cases for other operators if needed
                default:
                    // Handle unknown operators if needed
                    break;
            }
        }
    }
    return true;
}
var whereFilters = {
    age: { _gte: 30, _lte: 50 },
    name: { _ilike: "John%" },
};
var data = {
    age: 35,
    name: "John Doe",
};
var result = evaluateWhereFilters(whereFilters, data);
console.log(result); // Output: true
