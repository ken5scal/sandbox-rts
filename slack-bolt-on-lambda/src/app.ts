import { App, ExpressReceiver, LogLevel, AwsLambdaReceiver } from '@slack/bolt';
import { AwsEvent, AwsCallback } from '@slack/bolt/dist/receivers/AwsLambdaReceiver';
import { ConsoleLogger } from '@slack/logger';

let logLevel: LogLevel = LogLevel.INFO;
if (process.env.ENV === 'local' || process.env.DEBUG === 'true') {
    require('dotenv').config();
    logLevel = LogLevel.DEBUG;
}

const logger = new ConsoleLogger();
logger.setLevel(logLevel);
logger.setName('slack-bolt-on-lambda');
logger.info(`running in ${process.env.ENV}`)

if (process.env.SLACK_SIGNING_SECRET === '' || process.env.Slash_BOT_TOKEN === '') {
    logger.error('SLACK_SIGNING_SECRET or SLACK_BOT_TOKEN is not set');
    process.exit(1);
}

const awsLambdaReceiver = new AwsLambdaReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET || '',
})

const expressReceiver = new ExpressReceiver({
    signingSecret: process.env.SLACK_SIGNING_SECRET || '',
    processBeforeResponse: true,
});

const app = new App({
    logLevel: logLevel,
    port: parseInt(process.env.PORT || '3000', 10),
    token: process.env.SLACK_BOT_TOKEN,
    receiver: process.env.WORKLOAD !== 'lambda' ? expressReceiver : awsLambdaReceiver,
});

if (process.env.WORKLOAD !== 'lambda') {
    (async () => {
        logger.info('⚡️ Bolt app is running!');
        await app.start(process.env.PORT || 3000);
    })().catch((error) => console.error(error));
}

expressReceiver.app.get('/hc', (req, res) => {
  res.status(200).send('OK');
});

app.event('app_mention', async ({ event, say }) => {
    console.log(event);
    await say({ 
        text: `Hello world`,
        thread_ts: event.event_ts
    });
})

module.exports.handler = async (event: AwsEvent, context: any, callback: AwsCallback) => {
    logger.info('invoked lambda handler')
    logger.debug(`Event: ${JSON.stringify(event, null, 2)}`);
    logger.debug(`Context: ${JSON.stringify(context, null, 2)}`);
    
    const handler = await awsLambdaReceiver.start();
    return handler(event, context, callback);
};
