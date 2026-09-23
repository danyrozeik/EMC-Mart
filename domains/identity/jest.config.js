/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: ".",
  testRegex: ".*\\.spec\\.ts$",
  transform: { "^.+\\.ts$": "ts-jest" },
  testPathIgnorePatterns: ["/node_modules/", "<rootDir>/generated/"],
  moduleNameMapper: {
    "^@rti/shared$": "<rootDir>/../../packages/shared/src/index.ts",
    "^@rti/auth-kit$": "<rootDir>/../../packages/auth-kit/src/index.ts",
  },
  testEnvironment: "node",
};
