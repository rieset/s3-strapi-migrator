"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.heating = void 0;
const migrator_1 = require("./migrator");
const heating = () => __awaiter(void 0, void 0, void 0, function* () {
    const deployer = new migrator_1.Migrator();
    yield deployer.prepare();
    // await deployer.process()
    //   .then((r) => {
    //     return r;
    //   })
    //   .catch((r) => {
    //     process.exit(1)
    //     return r;
    //   })
    yield deployer.components()
        .then((r) => {
        return r;
    })
        .catch((r) => {
        console.log('r', r);
        process.exit(1);
        return r;
    });
    // return await deployer.articles()
    //   .then((r) => {
    //     process.exit(0)
    //     return r;
    //   })
    //   .catch((r) => {
    //     process.exit(1)
    //     return r;
    //   })
    return true;
});
exports.heating = heating;
