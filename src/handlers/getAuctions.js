import AWS from 'aws-sdk';
import createError from 'http-errors';
import validator from '@middy/validator';

import getAuctionSchema from '../lib/schemas/get-auction-schema';
import commonMiddleware from '../lib/common-middleware';

const dynamodb = new AWS.DynamoDB.DocumentClient();


async function getAuctions(event, context) {
  const { status } = event.queryStringParameters;

  let auctions;

  try {

    const params = {
      TableName: process.env.AUCTIONS_TABLE_NAME,
      IndexName: 'statusAndEndDate',
      KeyConditionExpression: '#status = :status',
      ExpressionAttributeValues: {
        ':status': status
      },
      ExpressionAttributeNames: {
        '#status': 'status'
      },
    };

    const result = await dynamodb.query(params).promise();
    auctions = result.Items;
    
  } catch (error) {
    console.error(error);
    throw new createError.InternalServerError(error);
  }
  
  return {
    statusCode: 200,
    body: JSON.stringify(auctions),
  };
}

exports.handler = commonMiddleware(getAuctions)
  .use(validator({
    inputSchema: getAuctionSchema,
    useDefaults: true
  }));
