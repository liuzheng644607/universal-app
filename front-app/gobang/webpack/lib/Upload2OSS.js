const fs = require('fs');
const path = require('path');
const Minio = require('minio');
const mime = require('mime-types');

const Bucket = process.env.OSS_BUCKET;

function uploadCDNResource(outputDirPath, currentPath, appId, filter, dir = '') {
  const minioClient = new Minio.Client({
    endPoint: process.env.OSS_END_POINT,
    accessKey: process.env.OSS_ACCESS_KEY,
    secretKey: process.env.OSS_SECRET_KEY,
    useSSL: process.env.OSS_USE_SSL === 'true',
  });

  if (!fs.existsSync(currentPath)) {
    return;
  }

  return Promise.all(
    fs
      .readdirSync(currentPath)
      .filter(filter)
      // 将 index.html 放到最后上传
      .sort((a, b) => {
        if (/index\.html$/.test(b)) {
          return -1;
        }
      })
      .map((file) => {
        const filePath = path.resolve(currentPath, file);
        // 支持上传嵌套的目录
        if (fs.statSync(filePath).isDirectory()) {
          return uploadCDNResource(outputDirPath, filePath, appId, filter, file);
        }
        const p = path.join(appId, filePath.replace(path.resolve(outputDirPath), ''));
        const contentType = mime.lookup(filePath);
        return minioClient
          .putObject(Bucket, p, fs.createReadStream(filePath), {
            'Content-Type': contentType,
          })
          .then(() => {
            console.log('上传成功', p);
          });
      }),
  );
}

/**
 * 上传到OSS
 */
class Upload2OSS {
  constructor(options) {
    this.options = options;
  }

  apply(compiler) {
    const {
      appId,
      filter = (file) => true, //! file.endsWith('.map'), // 上传前进行过滤
      des = '',
    } = this.options;
    const publicPath = compiler.options.output.publicPath;
    compiler.hooks.done.tapPromise('Upload2OSS', async () => {
      const res = await uploadCDNResource(compiler.options.output.path, compiler.options.output.path, appId, filter);
      console.info('Upload2OSS', `QA环境上传${des}资源到QA环境Minio: ${publicPath}`);
      return res;
    });
  }
}

module.exports = Upload2OSS;
