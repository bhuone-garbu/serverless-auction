import AWS from 'aws-sdk';
import commonMiddleware from '../../lib/common-middleware';
import createError from 'http-errors';

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function getAuctions(event, context) {

  let auctions = [];

  try {

    const result = await dynamodb.scan({ TableName: process.env.AUCTIONS_TABLE_NAME }).promise();
    auctions = result.Items;
    
  } catch (error) {
    console.error(error);
    throw new createError.InternalServerError(error)
  }
  
  return {
    statusCode: 200,
    body: JSON.stringify(auctions),
  };
}

exports.handler = commonMiddleware(getAuctions);
