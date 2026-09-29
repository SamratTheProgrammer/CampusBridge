const fs = require('fs');

async function testFixAndCapture() {
  const targetsRes = await fetch('http://127.0.0.1:9222/json');
  const targets = await targetsRes.json();
  const page = targets.find(t => t.type === 'page' && t.url.includes('5173'));
  
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let msgId = 1;
  const send = (method, params = {}) => {
    return new Promise((resolve) => {
      const id = msgId++;
      const handler = (event) => {
        const data = JSON.parse(event.data);
        if (data.id === id) {
          ws.removeEventListener('message', handler);
          resolve(data.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });
  };

  ws.onopen = async () => {
    console.log('Testing style fix on body...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        document.body.style.backgroundColor = '';
        document.body.style.color = '';
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
        localStorage.setItem('campusbridge-theme', 'light');

        const style = document.createElement('style');
        style.id = 'theme-body-fix';
        style.innerHTML = \`
          body {
            background-color: hsl(var(--background)) !important;
            color: hsl(var(--foreground)) !important;
          }
        \`;
        document.head.appendChild(style);
        window.scrollTo({ top: 0, behavior: 'instant' });
      })()`,
      returnByValue: true
    });

    await new Promise(r => setTimeout(r, 600));

    // Capture hero in light mode
    const shotHero = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('c:/Users/VICTUS/.gemini/antigravity-ide/brain/78c32c18-684b-45c7-8df1-5979a359a565/light_mode_hero_fixed.png', Buffer.from(shotHero.data, 'base64'));
    console.log('Saved light_mode_hero_fixed.png');

    // Scroll down to check middle sections
    await send('Runtime.evaluate', {
      expression: `window.scrollTo({ top: 1200, behavior: 'instant' })`
    });
    await new Promise(r => setTimeout(r, 600));

    const shotMid = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('c:/Users/VICTUS/.gemini/antigravity-ide/brain/78c32c18-684b-45c7-8df1-5979a359a565/light_mode_mid_fixed.png', Buffer.from(shotMid.data, 'base64'));
    console.log('Saved light_mode_mid_fixed.png');

    // Scroll to bottom
    await send('Runtime.evaluate', {
      expression: `window.scrollTo({ top: 3000, behavior: 'instant' })`
    });
    await new Promise(r => setTimeout(r, 600));

    const shotBottom = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('c:/Users/VICTUS/.gemini/antigravity-ide/brain/78c32c18-684b-45c7-8df1-5979a359a565/light_mode_bottom_fixed.png', Buffer.from(shotBottom.data, 'base64'));
    console.log('Saved light_mode_bottom_fixed.png');

    process.exit(0);
  };
}

testFixAndCapture().catch(console.error);
