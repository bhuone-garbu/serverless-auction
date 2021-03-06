import AWS from 'aws-sdk';
import createError from 'http-errors';
import validator from '@middy/validator';

import placeBidSchema from '../lib/schemas/place-bid-schema';
import commonMiddleware from '../lib/commonMiddleware';
import { getAuctionById } from './getAuction';
import cors from '@middy/http-cors';

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function placeBid(event, context) {
  const { id } = event.pathParameters;
  const { amount } = event.body;
  const { email: bidder } = event.requestContext.authorizer;

  const auction = await getAuctionById(id);

  if (auction.seller === bidder) {
    throw new createError.Forbidden(`You cannot bid on your own auction!`);
  }
  
  // to prevent double bidding
  if (auction.highestBid.bidder === bidder) {
    throw new createError.Forbidden(`You are already the highest bidder!`);
  }

  if (auction.status !== 'OPEN'){
    throw new createError.Forbidden(`You cannot bid on closed auctions!`);
  }


  if (amount <= auction.highestBid.amount) {
    throw new createError.Forbidden(`Your bid must be higher than ${auction.highestBid.amount}!`);
  }


  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    Key: { id },
    UpdateExpression: 'set highestBid.amount = :amount, highestBid.bidder = :bidder',
    ExpressionAttributeValues: {
      ':amount': amount,
      ':bidder': bidder,
    },
    ReturnValues: 'ALL_NEW',
  };

  let updatedAuction;

  try {
    const result = await dynamodb.update(params).promise();
    updatedAuction = result.Attributes;

  } catch (error) {
    console.error(error);
    throw new createError.InternalServerError(error);
  }


  return {
    statusCode: 200,
    body: JSON.stringify(updatedAuction),
  };
}

exports.handler = commonMiddleware(placeBid)
  .use(cors())
  .use(validator({
    inputSchema: placeBidSchema
  }));
