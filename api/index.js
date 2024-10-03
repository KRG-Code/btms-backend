const app = require('../server'); // Adjust the path according to your folder structure

module.exports = (req, res) => {
  // Use the express app
  app(req, res);
};