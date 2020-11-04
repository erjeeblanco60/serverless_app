import {v4 as uuid} from 'uuid';
import AWS from 'aws-sdk';

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function createAuction(event, context) {
  const {title} = JSON.parse(event.body);
  const now = new Date();
 
  const aution = {
    id: uuid(),
    title,
    status: 'OPEN',
    createdAt: now.toISOString()
  };

  await dynamodb.put({
    TableName: process.env.AUCTIONS_TABLE_NAME,
    Item: aution,
  }).promise();

  return {
    statusCode: 201,
    body: JSON.stringify(aution),
  };
}

export const handler = createAuction;


