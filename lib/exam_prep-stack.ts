import * as cdk from 'aws-cdk-lib';
import { LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { PartitionKey } from 'aws-cdk-lib/aws-appsync';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Subscription, SubscriptionProtocol, Topic } from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class ExamPrepStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

  const errorTable = new Table (this, 'ErrorTable', {
    partitionKey: {
        name: 'id',
        type: AttributeType.STRING
    },
    billingMode: BillingMode.PAY_PER_REQUEST,
    timeToLiveAttribute: 'ttl'
  });

  const errorTopic = new Topic(this, 'ErrorTopic',{
    topicName: 'ErrorTopic'
  });
  
  const processFunction = new NodejsFunction(this,'processFunction',{
    runtime: Runtime.NODEJS_20_X,
    handler: 'handler',
    entry: '${__dirname}/../src/processFunction.ts',
    environment: {
      TABLE_NAME: errorTable.tableName,
      TOPIC_ARN: errorTopic.topicArn
    }
  });
  
    errorTopic.grantPublish(processFunction);
    errorTable.grantReadWriteData(processFunction);


  const api = new RestApi(this, 'ProcessorApi');
  const resource = api.root.addResource('processJSON');
  resource.addMethod('POST', new  LambdaIntegration(processFunction));

  new Subscription(this, 'ErrorSubscription', {
    topic: errorTopic,
    protocol: SubscriptionProtocol.EMAIL,
    endpoint: 'petkoff83@gmail.com'
  })

  new cdk.CfnOutput(this, 'RestApiEndpoint',{
    value: `https://${api.restApiId}.execute-api.eu-central-1.amazonaws.com/prod/processJSON`
  })
  }
}
