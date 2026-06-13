const fs = require('fs');
const path = require('path');

const directory = path.join(__dirname, 'src');

// Map of tailwind classes to replace
const replacements = {
  // Slate background to surface
  'bg-slate-950': 'bg-surface-container-lowest',
  'bg-slate-900': 'bg-surface-container-high',
  'bg-slate-800': 'bg-surface-container',
  'bg-slate-700': 'bg-surface-variant',
  
  // Slate text to on-surface / outline
  'text-slate-100': 'text-on-surface',
  'text-slate-200': 'text-tertiary-fixed',
  'text-slate-300': 'text-tertiary-fixed-dim',
  'text-slate-400': 'text-outline',
  'text-slate-500': 'text-outline-variant',
  'text-slate-600': 'text-on-surface-variant',
  'placeholder-slate-500': 'placeholder-outline-variant',

  // Borders
  'border-white/5': 'border-outline-variant/20',
  'border-white/10': 'border-outline-variant/40',
  'border-white/20': 'border-outline-variant/60',

  // Primary (Violet)
  'violet-700': 'primary-container',
  'violet-600': 'primary',
  'violet-500': 'primary-fixed-dim',
  'violet-400': 'primary-fixed',
  'violet-900': 'on-primary-container',

  // Secondary (Blue/Emerald)
  'blue-600': 'secondary',
  'blue-500': 'secondary-fixed-dim',
  'blue-400': 'secondary-fixed',
  
  'emerald-400': 'secondary',
  'emerald-500': 'secondary-container',

  // Error (Rose)
  'rose-400': 'error',
  'rose-500': 'error-container',
  'rose-300': 'error',

  // Specific text overrides
  'text-white': 'text-on-surface',
};

function processFile(filePath) {
  if (!filePath.endsWith('.jsx')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Replace each mapping
  for (const [oldClass, newClass] of Object.entries(replacements)) {
    // We use a regex to match the class exactly (accounting for arbitrary prefix/suffix like focus:, /50, etc)
    // Actually, simple replaceAll on the substrings is safer for Tailwind because of opacity modifiers like bg-slate-950/60
    // If we replace 'slate-950' with 'surface-container-lowest', it correctly becomes bg-surface-container-lowest/60
    const regex = new RegExp(oldClass, 'g');
    content = content.replace(regex, newClass);
  }

  // Also replace some specific full classes that were composed
  content = content.replace(/text-on-surface font-extrabold/g, 'text-primary-fixed-dim font-extrabold drop-shadow-[0_0_10px_rgba(208,188,255,0.4)]');
  content = content.replace(/bg-gradient-to-tr from-primary-container to-secondary-fixed-dim/g, 'bg-gradient-to-tr from-primary-container to-secondary neon-border');
  content = content.replace(/bg-gradient-to-br from-primary to-secondary/g, 'bg-gradient-to-br from-primary to-secondary neon-border');
  content = content.replace(/glass-card/g, 'glass-panel');
  content = content.replace(/glass-card-dark/g, 'glass-panel');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

function traverseDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverseDir(fullPath);
    } else {
      processFile(fullPath);
    }
  }
}

traverseDir(directory);
console.log('Refactoring complete.');
