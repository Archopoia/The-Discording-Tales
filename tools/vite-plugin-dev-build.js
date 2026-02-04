/**
 * Vite plugin for development: watches source files and runs build scripts automatically.
 * 
 * Watches:
 *   - index.template.html, partials/** -> build_html.js + build_i18n.js
 *   - css/*.css -> build_css.js
 *   - locales/*.json -> build_i18n.js
 *   - reference/TTRPG_DRD/**/ZINE_*.md -> build_zine.js + build_html.js + build_i18n.js
 *   - reference/TTRPG_DRD/** (other) -> build_rules_lore.js
 * 
 * Usage: import and add to vite.config.ts plugins array (only runs in dev mode)
 */
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

/** Run a node script and return a promise */
function runScript(scriptName) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(ROOT, 'tools', scriptName);
    console.log(`\x1b[36m[dev-build]\x1b[0m Running ${scriptName}...`);
    
    const child = spawn('node', [scriptPath], {
      cwd: ROOT,
      stdio: 'inherit',
      shell: true,
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        console.error(`\x1b[31m[dev-build]\x1b[0m ${scriptName} exited with code ${code}`);
        resolve(); // Don't reject - we still want to continue watching
      }
    });
    
    child.on('error', (err) => {
      console.error(`\x1b[31m[dev-build]\x1b[0m Error running ${scriptName}:`, err.message);
      resolve(); // Don't reject
    });
  });
}

/** Run multiple scripts in sequence */
async function runScripts(scripts) {
  for (const script of scripts) {
    await runScript(script);
  }
}

/** Determine which scripts to run based on changed file path */
function getScriptsForFile(filePath) {
  const relative = path.relative(ROOT, filePath).replace(/\\/g, '/');
  
  // CSS files
  if (relative.startsWith('css/') && relative.endsWith('.css')) {
    return ['build_css.js'];
  }
  
  // Locale files
  if (relative.startsWith('locales/') && relative.endsWith('.json')) {
    return ['build_i18n.js'];
  }
  
  // Zine markdown files
  if (relative.includes('ZINE_') && relative.endsWith('.md')) {
    return ['build_zine.js', 'build_html.js', 'build_i18n.js'];
  }
  
  // Other reference files (rules/lore)
  if (relative.startsWith('reference/TTRPG_DRD/')) {
    return ['build_rules_lore.js'];
  }
  
  // Template or partials
  if (relative === 'index.template.html' || relative.startsWith('partials/')) {
    return ['build_html.js', 'build_i18n.js'];
  }
  
  return null;
}

export default function devBuildPlugin() {
  let server = null;
  let buildTimeout = null;
  let pendingScripts = new Set();
  
  return {
    name: 'dev-build',
    apply: 'serve', // Only run in dev mode
    
    async buildStart() {
      // Run all build scripts on startup (initial build)
      console.log('\x1b[36m[dev-build]\x1b[0m Running initial builds...');
      await runScripts([
        'build_rules_lore.js',
        'build_zine.js',
        'build_html.js',
        'build_css.js',
        'build_i18n.js',
      ]);
      console.log('\x1b[32m[dev-build]\x1b[0m Initial builds complete.');
    },
    
    configureServer(viteServer) {
      server = viteServer;
      
      // Watch additional directories that Vite doesn't watch by default
      const watchPaths = [
        path.join(ROOT, 'index.template.html'),
        path.join(ROOT, 'partials'),
        path.join(ROOT, 'css'),
        path.join(ROOT, 'locales'),
        path.join(ROOT, 'reference', 'TTRPG_DRD'),
      ];
      
      for (const watchPath of watchPaths) {
        server.watcher.add(watchPath);
      }
      
      // Handle file changes
      server.watcher.on('change', (filePath) => {
        const scripts = getScriptsForFile(filePath);
        if (!scripts) return;
        
        // Add scripts to pending set
        for (const script of scripts) {
          pendingScripts.add(script);
        }
        
        // Debounce: wait a bit for multiple rapid changes
        if (buildTimeout) {
          clearTimeout(buildTimeout);
        }
        
        buildTimeout = setTimeout(async () => {
          const scriptsToRun = Array.from(pendingScripts);
          pendingScripts.clear();
          
          // Sort scripts to run in correct order
          const order = [
            'build_rules_lore.js',
            'build_zine.js',
            'build_html.js',
            'build_css.js',
            'build_i18n.js',
          ];
          scriptsToRun.sort((a, b) => order.indexOf(a) - order.indexOf(b));
          
          console.log(`\x1b[36m[dev-build]\x1b[0m File changed: ${path.relative(ROOT, filePath)}`);
          await runScripts(scriptsToRun);
          
          // Trigger full page reload
          server.ws.send({ type: 'full-reload' });
          console.log('\x1b[32m[dev-build]\x1b[0m Rebuild complete, page reloaded.');
        }, 100);
      });
      
      // Also handle new files
      server.watcher.on('add', (filePath) => {
        const scripts = getScriptsForFile(filePath);
        if (scripts) {
          server.watcher.emit('change', filePath);
        }
      });
    },
  };
}
