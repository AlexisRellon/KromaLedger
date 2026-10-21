export function evaluateNumpad(expression: string): number {
  if (!expression.trim() || expression.length > 128) throw new SyntaxError("Enter a short arithmetic expression");
  let index = 0;
  const skipSpaces = () => { while (/\s/.test(expression[index] ?? "")) index += 1; };
  const take = (char: string) => { skipSpaces(); if (expression[index] !== char) return false; index += 1; return true; };
  const primary = (): number => {
    skipSpaces();
    if (take("(")) {
      const value = additive();
      if (!take(")")) throw new SyntaxError("Missing closing parenthesis");
      return value;
    }
    skipSpaces();
    const match = /^(?:\d+(?:\.\d*)?|\.\d+)/.exec(expression.slice(index));
    if (!match) throw new SyntaxError("Expected a number");
    index += match[0].length;
    const value = Number(match[0]);
    if (!Number.isFinite(value)) throw new RangeError("Number is outside the supported range");
    return value;
  };
  const unary = (): number => take("+") ? unary() : take("-") ? -unary() : primary();
  const multiplicative = (): number => {
    let value = unary();
    while (true) {
      if (take("*")) value *= unary();
      else if (take("/")) { const divisor = unary(); if (divisor === 0) throw new RangeError("Cannot divide by zero"); value /= divisor; }
      else return finite(value);
    }
  };
  const additive = (): number => {
    let value = multiplicative();
    while (true) {
      if (take("+")) value += multiplicative();
      else if (take("-")) value -= multiplicative();
      else return finite(value);
    }
  };
  const finite = (value: number) => { if (!Number.isFinite(value)) throw new RangeError("Result is outside the supported range"); return value; };
  const result = additive();
  skipSpaces();
  if (index !== expression.length) throw new SyntaxError("Unexpected character in expression");
  return finite(result);
}
