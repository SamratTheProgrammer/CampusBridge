const fs = require('fs');

async function inspectLightMode() {
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
    console.log('Setting theme to light...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        localStorage.setItem('campusbridge-theme', 'light');
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
        window.scrollTo({ top: 0, behavior: 'instant' });
      })()`,
      returnByValue: true
    });

    await new Promise(r => setTimeout(r, 600));

    // Capture screenshot
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('c:/Users/VICTUS/.gemini/antigravity-ide/brain/78c32c18-684b-45c7-8df1-5979a359a565/light_mode_home.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved light_mode_home.png');

    // Inspect styles of hero and body
    const styles = await send('Runtime.evaluate', {
      expression: `(() => {
        const html = document.documentElement;
        const body = document.body;
        const hero = document.querySelector('#home') || document.querySelector('main');
        const h1 = document.querySelector('h1');
        return {
          htmlClass: html.className,
          htmlBg: window.getComputedStyle(html).backgroundColor,
          bodyBg: window.getComputedStyle(body).backgroundColor,
          bodyColor: window.getComputedStyle(body).color,
          heroBg: hero ? window.getComputedStyle(hero).backgroundColor : 'no hero',
          h1Color: h1 ? window.getComputedStyle(h1).color : 'no h1',
          navBg: document.querySelector('nav') ? window.getComputedStyle(document.querySelector('nav')).backgroundColor : 'no nav'
        };
      })()`,
      returnByValue: true
    });

    console.log('Styles in light mode:\n', JSON.stringify(styles.result.value, null, 2));
    process.exit(0);
  };
}

inspectLightMode().catch(console.error);
