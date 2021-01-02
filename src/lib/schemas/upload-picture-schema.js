// https://json-schema.org/
const schema = {
  properties: {
    body: {
      type: 'string',
      minLength: 1,

      // ensuring that body ends with a '=' in the body
      pattern: '\=$'
    },
  },
  required: [
    'body',
  ]
};

export default schema;
