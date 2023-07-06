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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Migrator = void 0;
require('dotenv').config();
let EasyYandexS3 = require('easy-yandex-s3').default;
const { MongoClient } = require('mongodb');
const axios = require('axios');
class Migrator {
    constructor() {
        // Yandex Cloud S3
        this.ycAccessKeyId = process.env.YANDEX_ACCESS_KEY_ID;
        this.ycSecretAccessKey = process.env.YANDEX_SECRET_ACCESS_KEY;
        this.ycBucketName = process.env.YANDEX_BUCKET_NAME;
        // MongoDB
        this.mongoUri = process.env.MONGO_URI;
        this.mongoDbName = process.env.MONGO_DB_NAME;
        this.mongoCollectionName = process.env.MONGO_COLLECTION_NAME;
        this.ycS3 = new EasyYandexS3({
            auth: {
                accessKeyId: this.ycAccessKeyId,
                secretAccessKey: this.ycSecretAccessKey
            },
            Bucket: this.ycBucketName,
            debug: false,
        });
        this.currentList = {};
    }
    prepare() {
        return __awaiter(this, void 0, void 0, function* () {
            this.currentList = yield this.ycS3.GetList("/")
                .catch((error) => {
                console.log('List is not available', error);
                return Promise.resolve(null);
            })
                .then((data) => {
                var _a, _b;
                const files = data && (data === null || data === void 0 ? void 0 : data.Contents) && (data === null || data === void 0 ? void 0 : data.Contents.length) > 0 ? (_a = data === null || data === void 0 ? void 0 : data.Contents) === null || _a === void 0 ? void 0 : _a.reduce((acc, item) => {
                    return Object.assign(Object.assign({}, acc), { [item.Key]: item });
                }, {}) : {};
                console.log('List files in S3 is available', 'Count: ', data && (data === null || data === void 0 ? void 0 : data.Contents) ? (_b = data === null || data === void 0 ? void 0 : data.Contents) === null || _b === void 0 ? void 0 : _b.length : 0, 'Uniq: ', Object.values(files).length);
                return files;
            });
        });
    }
    getClient() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.db) {
                return this.db;
            }
            this.client = new MongoClient(this.mongoUri, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                tls: true,
                tlsCAFile: process.env.MONGO_CERT,
                authSource: process.env.MONGO_DB_NAME,
                tlsAllowInvalidCertificates: true,
            });
            this.client.connect().catch((error) => {
                console.log('Error connecting to MongoDB', error);
            });
            this.db = this.client.db(this.mongoDbName);
            return this.db;
        });
    }
    connect(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = yield this.getClient();
            return yield db.collection(name);
        });
    }
    process() {
        var _a, e_1, _b, _c;
        var _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const collection = yield this.connect(this.mongoCollectionName);
                const list = yield collection.find().toArray();
                try {
                    for (var _r = true, list_1 = __asyncValues(list), list_1_1; list_1_1 = yield list_1.next(), _a = list_1_1.done, !_a; _r = true) {
                        _c = list_1_1.value;
                        _r = false;
                        const fileRecord = _c;
                        if ((fileRecord === null || fileRecord === void 0 ? void 0 : fileRecord.formats) && ((_d = fileRecord === null || fileRecord === void 0 ? void 0 : fileRecord.formats) === null || _d === void 0 ? void 0 : _d.thumbnail)) {
                            fileRecord.formats.thumbnail.url = yield this.moveFile((_e = fileRecord === null || fileRecord === void 0 ? void 0 : fileRecord.formats) === null || _e === void 0 ? void 0 : _e.thumbnail);
                            if (!fileRecord.formats.thumbnail.url) {
                                fileRecord.formats.thumbnail = null;
                            }
                        }
                        if ((fileRecord === null || fileRecord === void 0 ? void 0 : fileRecord.formats) && ((_f = fileRecord === null || fileRecord === void 0 ? void 0 : fileRecord.formats) === null || _f === void 0 ? void 0 : _f.large)) {
                            fileRecord.formats.large.url = yield this.moveFile((_g = fileRecord === null || fileRecord === void 0 ? void 0 : fileRecord.formats) === null || _g === void 0 ? void 0 : _g.large);
                            if (!fileRecord.formats.large.url) {
                                fileRecord.formats.large = null;
                            }
                        }
                        if ((fileRecord === null || fileRecord === void 0 ? void 0 : fileRecord.formats) && ((_h = fileRecord === null || fileRecord === void 0 ? void 0 : fileRecord.formats) === null || _h === void 0 ? void 0 : _h.medium)) {
                            fileRecord.formats.medium.url = yield this.moveFile((_j = fileRecord === null || fileRecord === void 0 ? void 0 : fileRecord.formats) === null || _j === void 0 ? void 0 : _j.medium);
                            if (!fileRecord.formats.medium.url) {
                                fileRecord.formats.medium = null;
                            }
                        }
                        if ((fileRecord === null || fileRecord === void 0 ? void 0 : fileRecord.formats) && ((_k = fileRecord === null || fileRecord === void 0 ? void 0 : fileRecord.formats) === null || _k === void 0 ? void 0 : _k.small)) {
                            fileRecord.formats.small.url = yield this.moveFile((_l = fileRecord === null || fileRecord === void 0 ? void 0 : fileRecord.formats) === null || _l === void 0 ? void 0 : _l.small);
                            if (!fileRecord.formats.small.url) {
                                fileRecord.formats.small = null;
                            }
                        }
                        if (!((_m = fileRecord === null || fileRecord === void 0 ? void 0 : fileRecord.formats) === null || _m === void 0 ? void 0 : _m.small) && !((_o = fileRecord === null || fileRecord === void 0 ? void 0 : fileRecord.formats) === null || _o === void 0 ? void 0 : _o.medium) && !((_p = fileRecord === null || fileRecord === void 0 ? void 0 : fileRecord.formats) === null || _p === void 0 ? void 0 : _p.large) && !((_q = fileRecord === null || fileRecord === void 0 ? void 0 : fileRecord.formats) === null || _q === void 0 ? void 0 : _q.thumbnail)) {
                            fileRecord.formats = null;
                        }
                        fileRecord.url = yield this.moveFile(fileRecord);
                        const id = fileRecord._id;
                        delete fileRecord._id;
                        delete fileRecord.__y;
                        yield collection.updateOne({
                            _id: id
                        }, { $set: fileRecord }, (error, result) => {
                            if (error) {
                                console.error('Произошла ошибка при записи в БД:', error);
                            }
                            else {
                                console.log('Запись успешно обновлена в MongoDB.');
                            }
                        }).catch((error) => {
                            console.log('Error', error);
                        }).then((data) => {
                            console.log('Save data', data === null || data === void 0 ? void 0 : data.modifiedCount);
                        });
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (!_r && !_a && (_b = list_1.return)) yield _b.call(list_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                console.log('Файл успешно перенесен из AWS S3 в Yandex.Cloud S3');
                return true;
            }
            catch (error) {
                console.error('Произошла ошибка:', error);
                throw new Error(error);
            }
        });
    }
    components() {
        var _a, e_2, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            const db = yield this.getClient();
            const collections = yield db.listCollections().toArray();
            if (!collections) {
                console.error('Error retrieving collections:');
                return;
            }
            try {
                for (var _d = true, collections_1 = __asyncValues(collections), collections_1_1; collections_1_1 = yield collections_1.next(), _a = collections_1_1.done, !_a; _d = true) {
                    _c = collections_1_1.value;
                    _d = false;
                    const collection = _c;
                    const col = yield this.connect(collection.name);
                    const list = yield col.find().toArray();
                    yield this.componetsList(list, col, collection.name + '::');
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (!_d && !_a && (_b = collections_1.return)) yield _b.call(collections_1);
                }
                finally { if (e_2) throw e_2.error; }
            }
        });
    }
    componetsList(list, collection, collectionName) {
        var _a, list_2, list_2_1;
        var _b, e_3, _c, _d;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                for (_a = true, list_2 = __asyncValues(list); list_2_1 = yield list_2.next(), _b = list_2_1.done, !_b; _a = true) {
                    _d = list_2_1.value;
                    _a = false;
                    const cmp = _d;
                    yield this.checkField(collection, cmp, 'content', collectionName);
                    yield this.checkField(collection, cmp, 'content_html', collectionName);
                    yield this.checkField(collection, cmp, 'previewImageUrl', collectionName);
                    yield this.checkField(collection, cmp, 'value', collectionName);
                    yield this.checkField(collection, cmp, 'title', collectionName);
                    yield this.checkField(collection, cmp, 'title_html', collectionName);
                    yield this.checkField(collection, cmp, 'title_htmlinline', collectionName);
                    const id = cmp._id;
                    delete cmp._id;
                    delete cmp.__y;
                    yield collection.updateOne({
                        _id: id
                    }, { $set: cmp }, (error, result) => {
                        if (error) {
                            console.error('Произошла ошибка при записи в БД:', error);
                        }
                        else {
                            console.log('Запись успешно обновлена в MongoDB.');
                        }
                    }).catch((error) => {
                        console.log('Error', error);
                    }).then((data) => {
                        console.log('Save data', data === null || data === void 0 ? void 0 : data.modifiedCount);
                    });
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (!_a && !_b && (_c = list_2.return)) yield _c.call(list_2);
                }
                finally { if (e_3) throw e_3.error; }
            }
        });
    }
    articles() {
        var _a, e_4, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            const collection = yield this.connect('articles');
            const list = yield collection.find().toArray();
            try {
                for (var _d = true, list_3 = __asyncValues(list), list_3_1; list_3_1 = yield list_3.next(), _a = list_3_1.done, !_a; _d = true) {
                    _c = list_3_1.value;
                    _d = false;
                    const article = _c;
                    yield this.checkField(collection, article, 'content', 'https://web3tech.ru/media/');
                    yield this.checkField(collection, article, 'content_html', 'https://web3tech.ru/media/');
                    yield this.checkField(collection, article, 'previewImageUrl', 'https://web3tech.ru/media/');
                    const id = article._id;
                    delete article._id;
                    delete article.__y;
                    yield collection.updateOne({
                        _id: id
                    }, { $set: article }, (error, result) => {
                        if (error) {
                            console.error('Произошла ошибка при записи в БД:', error);
                        }
                        else {
                            console.log('Запись успешно обновлена в MongoDB.');
                        }
                    }).catch((error) => {
                        console.log('Error', error);
                    }).then((data) => {
                        console.log('Save data', data === null || data === void 0 ? void 0 : data.modifiedCount);
                    });
                }
            }
            catch (e_4_1) { e_4 = { error: e_4_1 }; }
            finally {
                try {
                    if (!_d && !_a && (_b = list_3.return)) yield _b.call(list_3);
                }
                finally { if (e_4) throw e_4.error; }
            }
        });
    }
    checkField(collection, record, fieldName, prefix) {
        var _a, e_5, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            if (!record[fieldName]) {
                // console.log(`Record ${record?.title} (${record?.slug}) no have `, fieldName);
                return null;
            }
            const links = this.linkFinder(record[fieldName]).filter((link) => {
                // console.log(`Link ${link} is not inside amazon`);
                return link.startsWith('https://s3.eu-central-1.amazonaws.com/');
            });
            try {
                for (var _d = true, links_1 = __asyncValues(links), links_1_1; links_1_1 = yield links_1.next(), _a = links_1_1.done, !_a; _d = true) {
                    _c = links_1_1.value;
                    _d = false;
                    const link = _c;
                    const file = yield this.getFile(link);
                    if (!file) {
                        console.log('\n\nВ записи ', record === null || record === void 0 ? void 0 : record.title, `( ${prefix}${record === null || record === void 0 ? void 0 : record.slug} ) нет файла\n`, link);
                    }
                    else {
                        const newFile = yield this.moveFile({ url: link, mimetype: file.mimetype });
                        if (!newFile) {
                            console.log('\n\nВ записи ', record === null || record === void 0 ? void 0 : record.title, `( ${prefix}${record === null || record === void 0 ? void 0 : record.slug} ) файл не смог быть перемещен\n`, newFile);
                            return null;
                        }
                        else {
                            console.log(`Файл ${newFile} в записи ${record === null || record === void 0 ? void 0 : record.title} - перенесен`);
                        }
                        record[fieldName] = record[fieldName].replace(link, newFile);
                    }
                }
            }
            catch (e_5_1) { e_5 = { error: e_5_1 }; }
            finally {
                try {
                    if (!_d && !_a && (_b = links_1.return)) yield _b.call(links_1);
                }
                finally { if (e_5) throw e_5.error; }
            }
        });
    }
    moveFile(fileRecord) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(fileRecord === null || fileRecord === void 0 ? void 0 : fileRecord.url)) {
                console.log('Нет ссылки на файл');
                return null;
            }
            const name = fileRecord === null || fileRecord === void 0 ? void 0 : fileRecord.url.replace(/^.+?\/([^\/]+$)/, '$1');
            if (!this.currentList[name]) {
                const f = yield this.getFile(fileRecord === null || fileRecord === void 0 ? void 0 : fileRecord.url);
                if (!f) {
                    console.log('Нет файла', name);
                    return null;
                }
                const fileBuffer = f.buffer;
                const mimetype = f.mimetype;
                const file = Uint8Array.from(fileBuffer);
                return yield this.ycS3.Upload({
                    name: name,
                    buffer: file,
                    mimetype: mimetype,
                }, "/")
                    .then((data) => {
                    return data === null || data === void 0 ? void 0 : data.Location;
                })
                    .catch((error) => {
                    console.log('Ошибка при аплоуде файла ', name, error);
                    return fileRecord === null || fileRecord === void 0 ? void 0 : fileRecord.url;
                });
            }
            else {
                return `https://storage.yandexcloud.net/${this.ycBucketName}/` + name;
            }
        });
    }
    getFile(file) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield axios.get(file, { responseType: 'arraybuffer' })
                .then((response) => {
                const buffer = Buffer.from(response.data, 'binary');
                console.log('Файл успешно загружен в Buffer:', file, response === null || response === void 0 ? void 0 : response.headers['content-type']);
                return {
                    buffer,
                    mimetype: response === null || response === void 0 ? void 0 : response.headers['content-type']
                };
            })
                .catch((error) => {
                if (!error.code) {
                    console.error('Произошла ошибка при загрузке файла:', file, error.code, error);
                }
                return null;
            });
        });
    }
    linkFinder(content) {
        const linkRegex = /(?:(?:https?|ftp):\/\/)?[\w/\-?=%.]+\.[\w/\-?=%.]+/g;
        const matches = content ? content.match(linkRegex) : null;
        return matches ? matches : [];
    }
}
exports.Migrator = Migrator;
