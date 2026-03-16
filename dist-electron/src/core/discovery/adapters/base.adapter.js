"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseAdapter = void 0;
const axios_1 = __importDefault(require("axios"));
class BaseAdapter {
    constructor(timeoutMs = 8000) {
        this.http = axios_1.default.create({
            timeout: timeoutMs,
            headers: { 'User-Agent': 'CiteForge/1.0 (academic research, non-commercial)' },
        });
    }
    cleanTitle(raw) {
        const s = Array.isArray(raw) ? raw[0] : raw;
        return (s ?? 'Untitled').trim().replace(/\s+/g, ' ');
    }
    safeYear(raw) {
        const n = parseInt(String(raw));
        const currentYear = new Date().getFullYear();
        return n >= 1000 && n <= currentYear + 1 ? n : undefined;
    }
    normalizeDoi(raw) {
        if (!raw)
            return undefined;
        return raw.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').trim().toLowerCase();
    }
    reconstructAbstract(invertedIndex) {
        if (!invertedIndex)
            return '';
        const arr = [];
        for (const [word, positions] of Object.entries(invertedIndex)) {
            for (const pos of positions)
                arr[pos] = word;
        }
        return arr.filter(Boolean).join(' ');
    }
    truncate(text, maxLen = 800) {
        return text.length > maxLen ? text.substring(0, maxLen) + '…' : text;
    }
}
exports.BaseAdapter = BaseAdapter;
