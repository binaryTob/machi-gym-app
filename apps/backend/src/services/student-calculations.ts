const { PrismaClient } = require('@prisma/client')
const { calculateWindowSize } = require('./student-calculations')

function calculateWindowSize(weeklyFrequency) {
  if (![3, 5].includes(weeklyFrequency)) {
    throw new Error('Weekly frequency must be 3 or 5')
  }
  return weeklyFrequency * 2
}

module.exports = {
  calculateWindowSize
}
