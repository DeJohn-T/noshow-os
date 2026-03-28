// lib/pdfParser.js
// Uses pdfjs-dist for reliable PDF text extraction

import * as pdfjsLib from 'pdfjs-dist'

// Point worker to the CDN so we don't need to bundle it
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`

export async function extractTextFromPDF(file) {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const textParts = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items.map(item => item.str).join(' ')
    textParts.push(pageText)
  }

  return textParts.join('\n')
}
