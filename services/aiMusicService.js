import axios from 'axios'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Single-file configuration: put your keys here
// WARNING: Storing keys in client code exposes them to users. Use only if acceptable.
const GEMINI_API_KEY = 'AIzaSyCMT8W4Z8HWYgJoFNRekF9IfgqimuOTfNU'
const MUSIC_GPT_API_KEY = '8S5qdYk5Xwy1kk0zsc1tQ5rO26iOTtfod92jmEI4sBEj8a1xxNYAeZi821NWBfHElFU6UTxJtyjSGhrgsEZFvQ' // TODO: paste your MusicGPT API key

const MUSIC_GPT_ENDPOINT = 'https://api.musicgpt.com/api/public/v1'

async function generateLyricsFromDescription(description) {
  if (!GEMINI_API_KEY) {
    // Fallback lyrics if no Gemini key is provided
    return `Title: Untitled\n\n[Verse 1]\n${description}\n\n[Chorus]\n${description}\n\n[Verse 2]\n${description}`
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
  // Using gemini-2.5-flash - latest stable version (released June 2025)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const prompt = [
    'You are a professional songwriter. Based on the following description, write full song lyrics.',
    'Include sections like [Verse], [Chorus], [Bridge] where appropriate.',
    'Return only the lyrics text, no extra commentary, just only short demo.',
    `Description: ${description}`
  ].join('\n')

  const result = await model.generateContent(prompt)
  const response = await result.response
  return response.text()
}

async function requestMusicGeneration({ prompt, music_style, lyrics, make_instrumental = false, vocal_only = false, voice_id, webhook_url }) {
  if (!MUSIC_GPT_API_KEY) throw new Error('MUSIC_GPT_API_KEY is empty')

  const url = `${MUSIC_GPT_ENDPOINT}/MusicAI`
  const payload = {
    prompt: prompt || '',
    music_style: music_style || '',
    lyrics: lyrics || '',
    make_instrumental: Boolean(make_instrumental),
    vocal_only: Boolean(vocal_only),
    voice_id: voice_id || '',
    webhook_url: webhook_url || ''
  }

  const { data } = await axios.post(url, payload, {
    headers: {
      Authorization: MUSIC_GPT_API_KEY,
      'Content-Type': 'application/json'
    }
  })
  return data
}

async function getConversionById(id, idType = 'conversion_id') {
  if (!MUSIC_GPT_API_KEY) throw new Error('MUSIC_GPT_API_KEY is empty')
  if (!id) throw new Error('Conversion ID is required')

  // According to API docs: conversionType is required, and either task_id OR conversion_id (not both)
  const paramName = idType === 'task_id' ? 'task_id' : 'conversion_id'
  const url = `${MUSIC_GPT_ENDPOINT}/byId?conversionType=MUSIC_AI&${paramName}=${encodeURIComponent(id)}`

  try {
    const { data } = await axios.get(url, {
      headers: { Authorization: MUSIC_GPT_API_KEY }
    })
    console.log('[aiMusicService][getConversionById] Success, id=', id, 'type=', idType, 'response=', data)
    return data
  } catch (error) {
    console.error('[aiMusicService][getConversionById] Error, id=', id, 'type=', idType, 'status=', error.response?.status, 'data=', error.response?.data)
    throw error
  }
}

async function generateSongFlow({ description, prompt, music_style, make_instrumental = false, vocal_only = false, voice_id, webhook_url }) {
  const lyrics = await generateLyricsFromDescription(description)
  const requestResponse = await requestMusicGeneration({
    prompt: prompt || description || '',
    music_style,
    lyrics,
    make_instrumental,
    vocal_only,
    voice_id,
    webhook_url
  })
  return { lyrics, requestResponse }
}

const aiMusicService = {
  generateLyricsFromDescription,
  requestMusicGeneration,
  getConversionById,
  generateSongFlow
}

export default aiMusicService


