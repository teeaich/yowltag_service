/**
 * Created by ht3597 on 08.06.2017.
 */
const argv = require('yargs').argv;

const getHandlerPath = () => {
  switch (argv.offline) {
    case 'enable':
      return 'src';
    case 'disable':
      return 'build';
    default:
      return 'build';
  }
};
module.exports.handlerPath = getHandlerPath;
