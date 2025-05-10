import Cerebras from '@cerebras/cerebras_cloud_sdk';

const client = new Cerebras({
  apiKey: "csk-k29xmn65yj9d65rd8ykhykftc9n4r68xhm8e8fev96pnpvtn", // This is the default and can be omitted
});

async function main() {
  const completionCreateResponse = await client.chat.completions.create({
    messages: [{ role: 'user', content: 'Why is fast inference important?' }],
    model: 'llama-3.3-70b',
  });

  // Print the full response for debugging
  console.log('Full response:', JSON.stringify(completionCreateResponse, null, 2));
  
  // Print just the LLM's response content
  if (completionCreateResponse.choices && completionCreateResponse.choices[0] && completionCreateResponse.choices[0].message) {
    console.log('\nLLM Response:', completionCreateResponse.choices[0].message.content);
  }
}

main();