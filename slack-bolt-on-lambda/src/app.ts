import { Context, APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';

// lambda handler. Only used when called specifically as a lambda function.
export const handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
    console.log('hogehoghohgeogheo')
    console.log(context)
    console.log('Context')
    console.log(`Event: ${JSON.stringify(event, null, 2)}`);
    console.log(`Context: ${JSON.stringify(context, null, 2)}`);
    console.log('hogehoghohgeogheo')
    return {
        statusCode: 200,
        body: JSON.stringify({
            message: 'hello world',
        }),
    };
};

if (process.env.WORKLOAD !== 'lambda') {
    (async () => {
        console.log('⚡️ Bolt app is running!');
    })().catch((error) => console.error(error));
}
