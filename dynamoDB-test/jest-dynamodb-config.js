module.exports = {
  tables: [
    {
      TableName: `mdm-reviews`,
      KeySchema: [
        {AttributeName: 'draftId', KeyType: 'HASH'},
        {AttributeName: 'reviewerId', KeyType: 'RANGE'},
      ],
      AttributeDefinitions: [
        {AttributeName: 'draftId', AttributeType: 'S'},
        {AttributeName: 'reviewerId', AttributeType: 'S'},
      ],
      ProvisionedThroughput: {ReadCapacityUnits: 1, WriteCapacityUnits: 1},
    },
    // etc
  ],
};