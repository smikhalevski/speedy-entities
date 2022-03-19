// This enum isn't imported in compiled code.
export const enum CharCode {

  // An enum member cannot have a numeric name but not for const enums.
  // @ts-ignore
  '0' = 48, '9' = 57,

  '#' = 35,
  ';' = 59,
  'x' = 120,
  'X' = 88,
  'a' = 97,
  'f' = 102,
  'A' = 65,
  'F' = 70,
}
