function buildS3Url(key) {
  if (!key) return null;
  const bucket = process.env.AWS_S3_BUCKET;
  const region = process.env.AWS_REGION;
  if (!bucket || !region) return null;
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

function isVegFromCategory(category) {
  if (!category) return false;
  return category.toLowerCase() === 'veg';
}

module.exports = { buildS3Url, isVegFromCategory };
