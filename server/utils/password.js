const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12;

const hashPassword = async (password) => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

const generateRandomToken = () => {
  return require('crypto').randomBytes(32).toString('hex');
};

module.exports = {
  hashPassword,
  comparePassword,
  generateRandomToken
}; 