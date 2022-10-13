module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: [
    "<rootDir>/src",
    "<rootDir>/tests",
  ],
  moduleDirectories: [
    "node_modules",
    "src",
  ],
  moduleNameMapper: {
    '^@tests(.*)$': "<rootDir>tests/$1",
  },
  clearMocks: true,
};
