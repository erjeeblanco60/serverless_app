import {v4 as uuid} from 'uuid';
import AWS from 'aws-sdk';
import middy from '@middy/core';
import validator from '@middy/validator';
import createAuctionSchema from '../lib/schemas/createAuctionSchema'
import commonMiddleware from '../lib/commonMiddleware';
import createError from 'http-errors';

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function createAuction(event, context) {
  const {title} = event.body;
  const {email} = event.requestContext.authorizer;
  const now = new Date();
  const endDate = new Date();
  endDate.setHours(now.getHours() + 1);

  const aution = {
    id: uuid(),
    title,
    status: 'OPEN',
    createdAt: now.toISOString(),
    endingAt: endDate.toISOString(),
    highestBid: { 
      amount: 0,
    },
    seller: email,
  };

  try { 
    await dynamodb.put({
      TableName: process.env.AUCTIONS_TABLE_NAME,
      Item: aution,
    }).promise();
  } catch (error) { 
    console.error(error);
    throw new createError.InternalServerError(error);
  }



  return {
    statusCode: 201,
    body: JSON.stringify(aution),
  };
}

export const handler = commonMiddleware(createAuction).use(validator({ inputSchema: createAuctionSchema}));