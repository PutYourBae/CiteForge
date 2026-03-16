"use strict";
// src/core/ai/pdf/extractor.ts
// PDF text extraction using pdfjs-dist bundled in Electron
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDFExtractor = void 0;
class PDFExtractor {
    async extract(url) {
        // Dynamically import pdfjs-dist only when needed
        const pdfjsLib = await Promise.resolve().then(() => __importStar(require('pdfjs-dist')));
        // Set worker path (bundled by Vite/Electron)
        pdfjsLib.GlobalWorkerOptions.workerSrc = ''; // disabled for Node.js context
        const response = await fetch(url, {
            headers: { 'User-Agent': 'CiteForge/1.0' },
            signal: AbortSignal.timeout(15000),
        });
        if (!response.ok)
            throw new Error(`Failed to fetch PDF: ${response.status}`);
        const buffer = await response.arrayBuffer();
        const data = new Uint8Array(buffer);
        const pdf = await pdfjsLib.getDocument({ data }).promise;
        const totalPages = pdf.numPages;
        // For large PDFs (>30 pages), only extract key sections
        const pagesToExtract = totalPages > 30
            ? this.getKeyPageIndices(totalPages)
            : Array.from({ length: totalPages }, (_, i) => i + 1);
        const pageTexts = [];
        for (const pageNum of pagesToExtract) {
            try {
                const page = await pdf.getPage(pageNum);
                const content = await page.getTextContent();
                const text = content.items
                    .map((item) => item.str)
                    .join(' ')
                    .replace(/\s+/g, ' ')
                    .trim();
                pageTexts.push(text);
            }
            catch {
                // Skip unreadable pages
            }
        }
        const fullText = pageTexts.join('\n\n');
        const sections = this.detectSections(fullText);
        const wordCount = fullText.split(/\s+/).length;
        const chunks = this.chunkText(fullText, 1500);
        return { fullText, sections, pageCount: totalPages, wordCount, chunks };
    }
    getKeyPageIndices(total) {
        // First 3 + last 2 pages (abstract + intro + conclusion)
        const indices = [1, 2, 3, total - 1, total].filter(n => n >= 1 && n <= total);
        return [...new Set(indices)].sort((a, b) => a - b);
    }
    detectSections(text) {
        const lower = text.toLowerCase();
        const sections = {};
        const markers = {
            abstract: /\babstract\b/i,
            introduction: /\b(1\.?\s*introduction|introduction)\b/i,
            methodology: /\b(methodology|methods|materials and methods|approach)\b/i,
            results: /\b(results|findings|experiments)\b/i,
            conclusion: /\b(conclusion|conclusions|discussion)\b/i,
        };
        for (const [section, regex] of Object.entries(markers)) {
            const matchIdx = lower.search(regex);
            if (matchIdx === -1)
                continue;
            // Extract up to 2000 chars from that section
            const sectionText = text.substring(matchIdx, matchIdx + 2000)
                .replace(/^.*?(abstract|introduction|methodology|methods|results|conclusion)/i, '')
                .trim();
            sections[section] = sectionText.substring(0, 1200);
        }
        return sections;
    }
    chunkText(text, chunkSize) {
        const words = text.split(/\s+/);
        const chunks = [];
        for (let i = 0; i < words.length; i += chunkSize) {
            chunks.push(words.slice(i, i + chunkSize).join(' '));
        }
        return chunks;
    }
}
exports.PDFExtractor = PDFExtractor;
