const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = new S3Client({ region: process.env.AWS_DEFAULT_REGION });

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const imageData = Buffer.from(body.image, 'base64');
    const key = `${Date.now()}.png`;

    const command = new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: key,
      Body: imageData,
      ContentType: 'image/png',
      StorageClass: 'GLACIER_IR'
    });

    await s3Client.send(command);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: `https://${process.env.CLOUDFRONT_DOMAIN}/${key}`
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'An error occurred while processing your request.' })
    };
  }
};