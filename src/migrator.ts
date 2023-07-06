import { Document } from 'bson';

require('dotenv').config();
let EasyYandexS3 = require('easy-yandex-s3').default;
const { MongoClient } = require('mongodb');
const axios = require('axios');

export class Migrator {

  // Yandex Cloud S3
  private readonly ycAccessKeyId = process.env.YANDEX_ACCESS_KEY_ID;
  private readonly ycSecretAccessKey = process.env.YANDEX_SECRET_ACCESS_KEY;
  private readonly ycBucketName = process.env.YANDEX_BUCKET_NAME;

  // MongoDB
  private readonly mongoUri = process.env.MONGO_URI;
  private readonly mongoDbName = process.env.MONGO_DB_NAME;
  private readonly mongoCollectionName = process.env.MONGO_COLLECTION_NAME;

  private readonly ycS3 = new EasyYandexS3({
    auth: {
      accessKeyId: this.ycAccessKeyId,
      secretAccessKey: this.ycSecretAccessKey
    },
    Bucket: this.ycBucketName,
    debug: false,
  });

  private currentList = {};
  private client: any;
  private db: any;

  constructor () {}

  async prepare() {
    this.currentList = await this.ycS3.GetList("/", )
      .catch((error) => {
        console.log('List is not available', error);
        return Promise.resolve(null);
      })
      .then((data) => {
        const files = data && data?.Contents && data?.Contents.length > 0 ? data?.Contents?.reduce((acc, item) => {
          return {
            ...acc,
            [item.Key]: item
          }
        }, {}) : {};
        console.log('List files in S3 is available', 'Count: ', data && data?.Contents ? data?.Contents?.length : 0, 'Uniq: ', Object.values(files).length);

        return files;
    })
  }

  async getClient() {
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
    } as any);

    this.client.connect().catch((error) => {
      console.log('Error connecting to MongoDB', error);
    })
    this.db = this.client.db(this.mongoDbName)
    return this.db;
  }

  async connect(name): Promise<Document> {
    const db = await this.getClient();
    return await db.collection(name)
  }

  public async process() {
    try {
      const collection = await this.connect(this.mongoCollectionName)
      const list = await collection.find().toArray();

      for await (const fileRecord of list) {
        if (fileRecord?.formats && fileRecord?.formats?.thumbnail) {
          fileRecord.formats.thumbnail.url = await this.moveFile(fileRecord?.formats?.thumbnail);
          if (!fileRecord.formats.thumbnail.url) {
            fileRecord.formats.thumbnail = null;
          }
        }
        if (fileRecord?.formats && fileRecord?.formats?.large) {
          fileRecord.formats.large.url = await this.moveFile(fileRecord?.formats?.large);
          if (!fileRecord.formats.large.url) {
            fileRecord.formats.large = null
          }
        }
        if (fileRecord?.formats && fileRecord?.formats?.medium) {
          fileRecord.formats.medium.url = await this.moveFile(fileRecord?.formats?.medium);
          if(!fileRecord.formats.medium.url) {
            fileRecord.formats.medium = null
          }
        }
        if (fileRecord?.formats && fileRecord?.formats?.small) {
          fileRecord.formats.small.url = await this.moveFile(fileRecord?.formats?.small);
          if(!fileRecord.formats.small.url) {
            fileRecord.formats.small = null
          }
        }

        if (!fileRecord?.formats?.small && !fileRecord?.formats?.medium && !fileRecord?.formats?.large && !fileRecord?.formats?.thumbnail) {
          fileRecord.formats = null;
        }

        fileRecord.url = await this.moveFile(fileRecord);
        const id = fileRecord._id;

        delete fileRecord._id;
        delete fileRecord.__y;

        await collection.updateOne({
          _id: id
        }, { $set: fileRecord }, (error, result) => {
          if (error) {
            console.error('Произошла ошибка при записи в БД:', error);
          } else {
            console.log('Запись успешно обновлена в MongoDB.');
          }
        }).catch((error) => {
          console.log('Error', error)
        }).then((data) => {
          console.log('Save data', data?.modifiedCount);
        })
      }

      console.log('Файл успешно перенесен из AWS S3 в Yandex.Cloud S3');
      return true;
    } catch (error) {
      console.error('Произошла ошибка:', error);
      throw new Error(error)
    }
  }

  public async components() {
    const db = await this.getClient();
    const collections = await db.listCollections().toArray()

    if (!collections) {
      console.error('Error retrieving collections:');
      return;
    }

    for await (const collection of collections) {
      const col = await this.connect(collection.name);
      const list = await col.find().toArray();
      await this.componetsList(list, col, collection.name + '::');
    }
  }

  private async componetsList(list, collection, collectionName) {
    for await (const cmp of list) {
      await this.checkField(collection, cmp, 'content', collectionName);
      await this.checkField(collection, cmp, 'content_html', collectionName);
      await this.checkField(collection, cmp, 'previewImageUrl', collectionName);
      await this.checkField(collection, cmp, 'value', collectionName);
      await this.checkField(collection, cmp, 'title', collectionName);
      await this.checkField(collection, cmp, 'title_html', collectionName);
      await this.checkField(collection, cmp, 'title_htmlinline', collectionName);

      const id = cmp._id;

      delete cmp._id;
      delete cmp.__y;

      await collection.updateOne({
        _id: id
      }, { $set: cmp }, (error, result) => {
        if (error) {
          console.error('Произошла ошибка при записи в БД:', error);
        } else {
          console.log('Запись успешно обновлена в MongoDB.');
        }
      }).catch((error) => {
        console.log('Error', error)
      }).then((data) => {
        console.log('Save data', data?.modifiedCount);
      })
    }
  }



  public async articles() {
    const collection = await this.connect('articles');
    const list = await collection.find().toArray();

    for await (const article of list) {
      await this.checkField(collection, article, 'content', 'articles::');
      await this.checkField(collection, article, 'content_html', 'articles::');
      await this.checkField(collection, article, 'previewImageUrl', 'articles::');

      const id = article._id;

      delete article._id;
      delete article.__y;

      await collection.updateOne({
        _id: id
      }, { $set: article }, (error, result) => {
        if (error) {
          console.error('Произошла ошибка при записи в БД:', error);
        } else {
          console.log('Запись успешно обновлена в MongoDB.');
        }
      }).catch((error) => {
        console.log('Error', error)
      }).then((data) => {
        console.log('Save data', data?.modifiedCount);
      })
    }
  }

  private async checkField(collection, record, fieldName, prefix) {
    if (!record[fieldName]) {
      // console.log(`Record ${record?.title} (${record?.slug}) no have `, fieldName);
      return null;
    }

    const links = this.linkFinder(record[fieldName]).filter((link) => {
      // console.log(`Link ${link} is not inside amazon`);
      return  link.startsWith('https://s3.eu-central-1.amazonaws.com/');
    })

    for await (const link of links) {
      const file = await this.getFile(link);

      if (!file) {
        console.log('\n\nВ записи ', record?.id, `( ${prefix}${record?.slug} ) нет файла\n`, link);
      } else {
        const newFile = await this.moveFile({url: link, mimetype: file.mimetype});

        if (!newFile) {
          console.log('\n\nВ записи ', record?.id, `( ${prefix}${record?.slug} ) файл не смог быть перемещен\n`, newFile);
          return null;
        } else {
          console.log(`Файл ${newFile} в записи ${record?.id} - перенесен`)
        }

        record[fieldName] = record[fieldName].replace(link, newFile);
      }
    }
  }

  async moveFile(fileRecord: any) {
    if (!fileRecord?.url) {
      console.log('Нет ссылки на файл');
      return null;
    }

    const name = fileRecord?.url
      .replace(/^.+?\/([^\/]+$)/, '$1')

    if (!this.currentList[name]) {
      const f = await this.getFile(fileRecord?.url)

      if (!f) {
        console.log('Нет файла', name);
        return null;
      }

      const fileBuffer = f.buffer;
      const mimetype = f.mimetype

      const file = Uint8Array.from(fileBuffer);
      return await this.ycS3.Upload({
        name: name,
        buffer: file,
        mimetype: mimetype,
      } as any, "/")
        .then((data: any) => {
          return data?.Location;
        })
        .catch((error) => {
          console.log('Ошибка при аплоуде файла ', name, error);
          return fileRecord?.url
        })
    } else {
      return `https://storage.yandexcloud.net/${this.ycBucketName}/` + name
    }
  }

  async getFile(file) {
    return await axios.get(file, { responseType: 'arraybuffer' })
      .then((response) => {
        const buffer = Buffer.from(response.data, 'binary');
        console.log('Файл успешно загружен в Buffer:', file, response?.headers['content-type']);
        return {
          buffer,
          mimetype: response?.headers['content-type']
        };
      })
      .catch((error) => {
        if (!error.code) {
          console.error('Произошла ошибка при загрузке файла:', file, error.code, error);
        }
        return null;
      });
  }

  linkFinder(content: string) {
    const linkRegex = /(?:(?:https?|ftp):\/\/)?[\w/\-?=%.]+\.[\w/\-?=%.]+/g;
    const matches = content ? content.match(linkRegex) : null;
    return matches ? matches : [];
  }
}
