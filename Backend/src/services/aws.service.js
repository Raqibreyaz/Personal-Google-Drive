import ApiError from "../helpers/apiError.js";
import path from "node:path";
import {
  PutObjectCommand,
  S3Client,
  DeleteObjectCommand,
  CopyObjectCommand,
  DeleteObjectsCommand,
  HeadObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl as getS3SignedUrl } from "@aws-sdk/s3-request-presigner";
import { getSignedUrl as getCloudFrontSignedUrl } from "@aws-sdk/cloudfront-signer";
import {
  CloudFrontClient,
  CreateInvalidationCommand,
} from "@aws-sdk/client-cloudfront";

const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const region = process.env.AWS_REGION || "ap-south-1";
const bucketName = process.env.AWS_BUCKET_NAME;
const presignedUrlExpiry = parseInt(
  process.env.AWS_PRESIGNED_URL_EXPIRY || 5 * 60,
);
const cloudFrontId = process.env.AWS_CLOUDFRONT_ID;
const cloudFrontUrl = process.env.AWS_CLOUDFRONT_URL;
const cloudFrontKeyPairId = process.env.AWS_CLOUDFRONT_KEY_PAIR_ID;
const cloudFrontPrivateKey = process.env.AWS_CLOUDFRONT_PRIVATE_KEY;

const s3Client = new S3Client({
  credentials: { accessKeyId, secretAccessKey },
});

const toCfPath = (p) =>
  p.startsWith("/") ? p : `/${String(p).replace(/^\/+/, "")}`;

const encodeObjectKeyForUrl = (key) =>
  String(key).split("/").map(encodeURIComponent).join("/");

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
    StorageClass: "INTELLIGENT_TIERING",
  });

  const signedUrl = await getS3SignedUrl(s3Client, command, {
    expiresIn: presignedUrlExpiry,
    signableHeaders: new Set(["content-length", "content-type"]),
  });

  return signedUrl;
};

// get the size of the given object
export const getObjectSize = async (objectKey) => {
  const command = new HeadObjectCommand({
    Bucket: bucketName,
    Key: objectKey,
  });

  const res = await s3Client.send(command);
  return res.ContentLength;
};

// delete the given object and invalidate it's cache
export const deleteObject = async (objectKey) => {
  const deleteObjectCommand = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: objectKey,
  });

  await s3Client.send(deleteObjectCommand);

  return true;
};

// delete the given objects and invalidate cache
export const deleteObjects = async (objectKeys) => {
  const command = new DeleteObjectsCommand({
    Bucket: bucketName,
    Delete: { Objects: objectKeys, Quiet: true },
  });

  const result = await s3Client.send(command);

  if (result.Errors?.length) {
    throw new ApiError(
      500,
      `Failed to delete ${result.Errors.length} object(s)`,
    );
  }

  return true;
};

// rename an object with copy+delete ops and invalidate cache
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
  const deleted = await deleteObject(objectKey);
  if (!deleted) {
    throw new ApiError(500, "Copied object but failed to delete old object");
  }

  return true;
};

// presigned url to get object
// export const getObjectPresignedUrl = async (
//   objectKey,
//   fileName,
//   download = false,
//   renderAsText = false,
// ) => {
//   const encodedKey = encodeObjectKeyForUrl(objectKey);
//   const safeFilename = path.basename(fileName || objectKey);

//   const headers = [
//     {
//       key: "response-content-disposition",
//       value: `${download ? "attachment" : "inline"}; filename="${safeFilename}"`,
//     },
//   ];
//   if (renderAsText)
//     headers.push({
//       key: "response-content-type",
//       value: "text/plain; charset=utf-8",
//     });

//   const url = `${cloudFrontUrl}/${encodedKey}?${headers
//     .map((k) => `${k.key}=${encodeURIComponent(k.value)}`)
//     .join("&")}`;

//   const signedUrl = getCloudFrontSignedUrl({
//     url: url.toString(),
//     keyPairId: cloudFrontKeyPairId,
//     privateKey: cloudFrontPrivateKey,
//     dateLessThan: new Date(
//       Date.now() + 1000 * presignedUrlExpiry,
//     ).toISOString(),
//   });

//   return signedUrl;
// };
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

  return await getS3SignedUrl(s3Client, command, {
    expiresIn: presignedUrlExpiry,
  });
};
