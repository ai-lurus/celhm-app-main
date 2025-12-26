// Simple webpack loader that returns an empty module for Storybook files
module.exports = function ignoreLoader() {
  return 'module.exports = {};';
};

