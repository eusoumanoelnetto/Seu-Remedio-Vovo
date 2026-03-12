'use server';
/**
 * @fileOverview A flow to convert text to speech using Gemini TTS.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/google-genai';
import wav from 'wav';

/**
 * Converte texto em áudio para a vovó ouvir.
 * @param text O texto que será lido em voz alta.
 */
export async function textToSpeech(text: string): Promise<{ media: string }> {
  const { media } = await ai.generate({
    model: googleAI.model('gemini-2.5-flash-preview-tts'),
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Algenib' },
        },
      },
    },
    prompt: `Leia com calma e clareza para uma pessoa idosa: ${text}`,
  });

  if (!media) {
    throw new Error('Não foi possível gerar o áudio.');
  }

  const audioBuffer = Buffer.from(
    media.url.substring(media.url.indexOf(',') + 1),
    'base64'
  );

  const wavBase64 = await new Promise<string>((resolve, reject) => {
    const writer = new wav.Writer({
      channels: 1,
      sampleRate: 24000,
      bitDepth: 16,
    });

    let bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', (d) => bufs.push(d));
    writer.on('end', () => resolve(Buffer.concat(bufs).toString('base64')));

    writer.write(audioBuffer);
    writer.end();
  });

  return {
    media: 'data:audio/wav;base64,' + wavBase64,
  };
}
