import Anthropic from '@anthropic-ai/sdk'

export async function POST(request) {
  try {
    const body = await request.json()
    const { prompt, images = [] } = body

    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })

    const content = []

    for (const img of images) {
      if (img?.data) {
        content.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/jpeg',
            data: img.data.split(',')[1],
          },
        })
      }
    }

    content.push({ type: 'text', text: prompt })

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content }],
    })

    return Response.json({ result: message.content[0].text })
  } catch (error) {
    console.error('AI error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
