// https://json-schema.org/
const schema = {
  properties: {
    body: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
        },
      },
      required: ['title'],
    },
  },
  required: [
    'body',
  ]
};

export default schema;
