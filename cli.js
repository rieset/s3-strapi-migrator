#!/usr/bin/env node
const yargs = require('yargs')
.usage(`
Usage: $0 url
`)
.options({})
.describe({})
.boolean([])
.help()
.alias('h', 'help');

const argv = yargs.argv;

process(argv._[0]);

function process(value) {
  const module = require('./dist/common.js');

  module.heating(value).then((data) => {
    console.log(data)
  })
}
