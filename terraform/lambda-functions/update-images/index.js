const { S3Client, ListObjectsV2Command, PutObjectCommand } = require('@aws-sdk/client-s3');
const { CloudFront } = require('@aws-sdk/client-cloudfront');

const s3Client = new S3Client({ region: process.env.AWS_DEFAULT_REGION });

exports.handler = async (event) => {
  const imageBucket = process.env.IMAGE_BUCKET;
  const fileName = process.env.IMAGES_JSON_FILENAME_PATH;

  try {
    const listObjectsCommand = new ListObjectsV2Command({ Bucket: imageBucket });
    const listObjectsResponse = await s3Client.send(listObjectsCommand);
    const fileNames = listObjectsResponse.Contents.map(object => object.Key);
    console.log(fileNames);

    const jsonData = JSON.stringify(fileNames, null, 2);
    console.log(jsonData);

    const putObjectCommand = new PutObjectCommand({
      Bucket: imageBucket,
      Key: fileName,
      Body: jsonData,
      ContentType: 'application/json',
    });

    await s3Client.send(putObjectCommand);
    console.log("/"+fileName)

    const client = new CloudFront();
    await client.createInvalidation({
      DistributionId: process.env.DISTRIBUTION_ID,
      InvalidationBatch: {
        CallerReference: new Date().toISOString(),
        Paths: {
          Quantity: 1,
          Items: ["/" + fileName]
        }
      }
    });
    return {
      statusCode: 200,
      body: 'images.json saved successfully!',
    };
  } catch (error) {
    console.error('Error processing S3 event', error);
    return {
      statusCode: 500,
      body: 'Error processing S3 event',
    };
  }
};