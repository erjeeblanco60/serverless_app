import AWS from 'aws-sdk';
import middy from '@middy/core';
import commonMiddleware from '../lib/commonMiddleware';
import createError from 'http-errors';
import {getAuction, getAuctionById} from './getAuction'
import validator from '@middy/validator';
import placeBidSchema from '../lib/schemas/placeBidSchema'

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function placeBid(event, context) {
  
    const { id } = event.pathParameters;
    const { amount } = event.body;
    const {email} = event.requestContext.authorizer;
    const auction = await getAuctionById(id)

    //avoid double Bid
    if(email === auction.highestBid.bidder) { 
      throw new createError.Forbidden('You can bid once');
    }

    //Bid identity
    if(auction.seller === email) { 
      throw new createError.Forbidden('You cannot Bid');
    }

    //auction status validation
    if(auction.status !== 'OPEN') { 
      throw new createError.Forbidden(`You Cannot bid close auctions`);
    }

    //validate amount
    if (amount <= auction.highestBid.amount) { 
      throw new createError.Forbidden(`Your bid must be higher that ${auction.highestBid.amount}!`)
    }

    const params = { 
        TableName: process.env.AUCTIONS_TABLE_NAME,
        Key: { id },
        UpdateExpression: 'set highestBid.amount = :amount, highestBid.bidder = :bidder',
        ExpressionAttributeValues: { 
            ':amount': amount,
            ':bidder': email,
        },
        ReturnValues: 'ALL_NEW',
    };

  let updatedAuction;

    try { 
        const result = await dynamodb.update(params).promise();
        updatedAuction = result.Attributes;

    } catch (error) { 
           console.error(error)
           throw new createError.InternalServerError(error)
    }
  return {
    statusCode: 200,
    body: JSON.stringify(updatedAuction),
  };
}

//erjeeauth0
export const handler = commonMiddleware(placeBid).use(validator({inputSchema: placeBidSchema}));