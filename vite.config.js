import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import {fileURLToPath} from 'node:url';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({ resolve:{alias:{'@':fileURLToPath(new URL('./src',import.meta.url))}}, plugins: [react(), tailwindcss()], server: {host:'0.0.0.0'} });
