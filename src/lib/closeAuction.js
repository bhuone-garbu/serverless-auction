import AWS from 'aws-sdk';

const dynamodb = new AWS.DynamoDB.DocumentClient();
const sqs = new AWS.SQS();

export default async function(auction) {
  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    Key: { id: auction.id },
    UpdateExpression: 'set #status = :status',
    ExpressionAttributeValues: {
      ':status': 'CLOSED',
    },
    ExpressionAttributeNames: {
      '#status': 'status',
    }
  };

  await dynamodb.update(params).promise();
  
  const { title, seller, highestBid } = auction;
  const { amount, bidder } = highestBid;

  if (amount === 0) {
    await sqs.sendMessage({
      QueueUrl: process.env.MAIL_QUEUE_URL,
      MessageBody: JSON.stringify({
        subject: 'No bids on your auction items :(',
        recipient: seller,
        body: `Your item "${title}" did not get any bids.`
      })
    }).promise();
    return;
  }

  const notifySeller = sqs.sendMessage({
    QueueUrl: process.env.MAIL_QUEUE_URL,
    MessageBody: JSON.stringify({
      subject: 'Your itme has been sold',
      recipient: seller,
      body: `Your item "${title}" has been sold for "${amount}".`
    })
  }).promise();

  const notifyBidder = sqs.sendMessage({
    QueueUrl: process.env.MAIL_QUEUE_URL,
    MessageBody: JSON.stringify({
      subject: 'You have won the auction',
      recipient: bidder,
      body: `Your got yourself "${title}" for "${amount}".`
    })
  }).promise();

  return Promise.all([notifySeller, notifyBidder]);

}
