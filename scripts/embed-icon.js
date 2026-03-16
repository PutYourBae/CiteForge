// scripts/embed-icon.js
// Embeds the multi-size icon.ico into the CiteForge.exe
const rcedit = require('rcedit')
const path = require('path')

const exe  = path.join(__dirname, '..', 'release', 'win-unpacked', 'CiteForge.exe')
const icon = path.join(__dirname, '..', 'assets', 'icon.ico')

console.log('Embedding icon...')
console.log('  EXE :', exe)
console.log('  ICO :', icon)

rcedit(exe, { icon }).then(() => {
  console.log('✅ Icon embedded successfully!')
}).catch(err => {
  console.error('❌ Error:', err.message)
  process.exit(1)
})
