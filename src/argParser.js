const commander = require('commander');

module.exports = {
  parseInt(value) {
    const parsed = parseInt(value, 10);
    if (!isFinite(parsed)) {
      throw new commander.InvalidArgumentError('not a valid int');
    }
    return parsed;
  },
};
