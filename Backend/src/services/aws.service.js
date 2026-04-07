import {
  PutObjectCommand,
  HeadObjectCommand,
  S3Client,
  DeleteObjectCommand,
  CopyObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import path from "node:path";

const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const region = process.env.AWS_REGION || "ap-south-1(mumbai)";
const bucketName = process.env.AWS_BUCKET_NAME;
const presignedUrlExpiry = parseInt(
  process.env.AWS_PRESIGNED_URL_EXPIRY || 5 * 60,
);

const s3Client = new S3Client({
  credentials: { accessKeyId, secretAccessKey },
});

// presigned url to create object
export const createObjectPresignedUrl = async (
  objectName,
  objectSize,
  objectType,
) => {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: objectName,
    ContentLength: objectSize,
    ContentType: objectType,
  });

  const signedUrl = await getSignedUrl(s3Client, command, {
    expiresIn: presignedUrlExpiry,
    signableHeaders: new Set(["content-length", "content-type"]),
  });

  return signedUrl;
};

// get the size of the given object
export const getObjectSize = async (objectKey) => {
  const command = new HeadObjectCommand({ Bucket: bucketName, Key: objectKey });

  const res = await s3Client.send(command);
  return res.ContentLength;
};

// delete the given object
export const deleteObject = async (objectKey) => {
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: objectKey,
  });

  const {
    $metadata: { httpStatusCode },
  } = await s3Client.send(command);
  return httpStatusCode < 300 && httpStatusCode >= 200;
};

// rename an object with copy+delete ops
export const renameObject = async (objectKey, newName) => {
  // copy the object to the destination first
  await s3Client.send(
    new CopyObjectCommand({
      Bucket: bucketName,
      Key: newName,
      CopySource: `${bucketName}/${objectKey}`,
    }),
  );

  // delete the source object
  await deleteObject(objectKey);
};

// presigned url to get object
export const getObjectPresignedUrl = async (
  objectKey,
  fileName,
  download = false,
  renderAsText = false,
) => {
  const settings = {};
  if (download)
    settings.ResponseContentDisposition = `attachment; filename=${fileName}`;
  if (renderAsText) settings.ResponseContentType = "text/plain; charset=utf-8";

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: objectKey,
    ...settings,
  });

  return await getSignedUrl(s3Client, command, {
    expiresIn: presignedUrlExpiry,
  });
};
