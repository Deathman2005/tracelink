import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { LOCAL_UPLOAD_DIR, BASE_URL } from '../config/constants';

export interface UserStorageConfig {
  accessKeyId?: string;
  secretAccessKey?: string;
  bucketName?: string;
  endpoint?: string;
}

class StorageService {
  constructor() {
    // Ensure the upload directory exists
    if (!fs.existsSync(LOCAL_UPLOAD_DIR)) {
      fs.mkdirSync(LOCAL_UPLOAD_DIR, { recursive: true });
    }
  }

  /**
   * Saves a file to local disk or S3/R2 dynamically
   * @param file Multer file object
   * @param shortCode Uniquely generated asset short code
   * @param userConfig User storage override configuration (optional)
   */
  public async saveFile(
    file: Express.Multer.File,
    shortCode: string,
    userConfig?: UserStorageConfig
  ): Promise<{ s3Key: string; fileUrl: string }> {
    const fileExtension = path.extname(file.originalname);
    const fileName = `${shortCode}${fileExtension}`;

    // 1. Check for User Custom R2 override
    if (
      userConfig &&
      userConfig.accessKeyId &&
      userConfig.secretAccessKey &&
      userConfig.bucketName &&
      userConfig.endpoint
    ) {
      try {
        const client = new S3Client({
          region: 'auto',
          endpoint: userConfig.endpoint,
          credentials: {
            accessKeyId: userConfig.accessKeyId,
            secretAccessKey: userConfig.secretAccessKey,
          },
        });

        await client.send(
          new PutObjectCommand({
            Bucket: userConfig.bucketName,
            Key: fileName,
            Body: file.buffer,
            ContentType: file.mimetype,
          })
        );

        let fileUrl = `${userConfig.endpoint}/${userConfig.bucketName}/${fileName}`;
        if (userConfig.endpoint.endsWith('/')) {
          fileUrl = `${userConfig.endpoint}${userConfig.bucketName}/${fileName}`;
        }
        return { s3Key: fileName, fileUrl };
      } catch (err) {
        console.error('Custom user R2 upload failed, falling back to local storage', err);
      }
    }

    // 2. Check for Platform Operator Central R2
    const adminAccessKey = process.env.S3_ACCESS_KEY_ID;
    const adminSecretKey = process.env.S3_SECRET_ACCESS_KEY;
    const adminEndpoint = process.env.S3_ENDPOINT;
    const adminBucket = process.env.S3_BUCKET_NAME;

    if (adminAccessKey && adminSecretKey && adminEndpoint && adminBucket) {
      try {
        const client = new S3Client({
          region: 'auto',
          endpoint: adminEndpoint,
          credentials: {
            accessKeyId: adminAccessKey,
            secretAccessKey: adminSecretKey,
          },
        });

        await client.send(
          new PutObjectCommand({
            Bucket: adminBucket,
            Key: fileName,
            Body: file.buffer,
            ContentType: file.mimetype,
          })
        );

        let fileUrl = `${adminEndpoint}/${adminBucket}/${fileName}`;
        if (adminEndpoint.endsWith('/')) {
          fileUrl = `${adminEndpoint}${adminBucket}/${fileName}`;
        }
        return { s3Key: `central:${fileName}`, fileUrl };
      } catch (err) {
        console.error('Central platform S3 upload failed, falling back to local storage', err);
      }
    }

    // 3. Fallback: Save file to local server directory
    const destinationPath = path.join(LOCAL_UPLOAD_DIR, fileName);
    await fs.promises.writeFile(destinationPath, file.buffer);

    const fileUrl = `${BASE_URL}/uploads/${fileName}`;
    return { s3Key: `local:${fileName}`, fileUrl };
  }

  /**
   * Deletes a file from local storage or S3/R2
   * @param s3Key Name/key of the file stored
   * @param userConfig User storage override configuration (optional)
   */
  public async deleteFile(s3Key: string, userConfig?: UserStorageConfig): Promise<void> {
    if (s3Key.startsWith('local:')) {
      const fileName = s3Key.replace('local:', '');
      const filePath = path.join(LOCAL_UPLOAD_DIR, fileName);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
      return;
    }

    if (s3Key.startsWith('central:')) {
      const fileName = s3Key.replace('central:', '');
      const adminAccessKey = process.env.S3_ACCESS_KEY_ID;
      const adminSecretKey = process.env.S3_SECRET_ACCESS_KEY;
      const adminEndpoint = process.env.S3_ENDPOINT;
      const adminBucket = process.env.S3_BUCKET_NAME;

      if (adminAccessKey && adminSecretKey && adminEndpoint && adminBucket) {
        try {
          const client = new S3Client({
            region: 'auto',
            endpoint: adminEndpoint,
            credentials: {
              accessKeyId: adminAccessKey,
              secretAccessKey: adminSecretKey,
            },
          });
          await client.send(
            new DeleteObjectCommand({
              Bucket: adminBucket,
              Key: fileName,
            })
          );
        } catch (err) {
          console.error('Failed to delete file from central S3 bucket', err);
        }
      }
      return;
    }

    // User Private Bucket upload
    if (
      userConfig &&
      userConfig.accessKeyId &&
      userConfig.secretAccessKey &&
      userConfig.bucketName &&
      userConfig.endpoint
    ) {
      try {
        const client = new S3Client({
          region: 'auto',
          endpoint: userConfig.endpoint,
          credentials: {
            accessKeyId: userConfig.accessKeyId,
            secretAccessKey: userConfig.secretAccessKey,
          },
        });
        await client.send(
          new DeleteObjectCommand({
            Bucket: userConfig.bucketName,
            Key: s3Key,
          })
        );
      } catch (err) {
        console.error('Failed to delete file from user custom R2 bucket', err);
      }
    } else {
      // Compatibility fallback for old non-prefixed local files
      const filePath = path.join(LOCAL_UPLOAD_DIR, s3Key);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    }
  }
}

export default new StorageService();
