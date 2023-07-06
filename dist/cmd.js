"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("./common");
const [node, script, url] = process.argv;
(0, common_1.heating)()
    .then((contracts) => {
    console.log(contracts);
})
    .catch((error) => {
    console.error('Unexpected error', error);
});
