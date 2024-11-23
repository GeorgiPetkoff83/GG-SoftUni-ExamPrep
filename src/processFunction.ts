import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { PublishCommand, SNSClient } from "@aws-sdk/client-sns"; 

const snsClient = new SNSClient({});
const dynamoDBClient = new DynamoDBClient({})


export const handler =async (event: any) =>{
    const tableName = process.env.TABLE_NAME;
    const topicArn = process.env.OPIC_ARN;


    console.log(event);

    const body = JSON.parse(event.body);

    console.log(body);
    

    if(!event || !body) {
        // Invalid JSON
        const ttl= Math.floor(Date.now()/1000)+ 30*60;
        await dynamoDBClient.send(new PutItemCommand(
            {
                TableName: tableName,
                Item: {
                    id: {
                        S: Math.random().toString(),
                    },
                    errorMessage: {
                        S: 'Something is wrong!',
                    },
                    ttl: {
                        N: ttl.toString(),
                    }
                }
            }
        ));
    }else{
        //Push to SNS
        await snsClient.send(new PublishCommand(    {
            TopicArn: topicArn,
            Message: `Valid JSON recieved: ${event.text}`,

        }
        ));
        console.log('Notifications sent!');
    }

    return {
        statusCode: 200,
        body: 'Hello from Lambda AWS!'
    }
} 