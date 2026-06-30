import path from 'path'

process.loadEnvFile(path.join(__dirname, '../.env.example'))

require('./scripts/setup-phase2.js')
require('./scripts/setup-phase3.js')
require('./scripts/setup-phase4.js')
require('./scripts/setup-phase5.js')
