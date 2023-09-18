export function pathOr<TExpected = any, TDefault = TExpected>(
  defaultValue: TDefault,
  path: (string | number)[],
  thing: unknown | unknown[]
): TExpected | TDefault {
  if (path.length === 0) {
    return defaultValue;
  }

  let currentValue: any = thing;

  for (const key of path) {
    if (currentValue === null || currentValue === undefined) {
      return defaultValue;
    }

    currentValue = currentValue[key];
  }

  if (currentValue === undefined) {
    return defaultValue;
  }

  return currentValue;
}
