from playwright.sync_api import sync_playwright
import time

url = 'file:///C:/Users/FoxOS_User/Developer/ghost-operator/index.html'
out = r'C:/Users/FoxOS_User/Developer/ghost-operator/'

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 1560, 'height': 940}, device_scale_factor=1.5)
    errs = []
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(url)
    pg.wait_for_selector('#startSilent', timeout=20000)
    time.sleep(1)
    pg.screenshot(path=out + 'shot-1-intro.png')
    pg.click('#startSilent')
    pg.click('.cbtn.spd[data-s="4"]')
    time.sleep(14)
    pg.screenshot(path=out + 'shot-2-working.png')
    time.sleep(26)
    pg.screenshot(path=out + 'shot-3-later.png')
    tasks = pg.inner_text('#stTasks')
    lines = pg.eval_on_selector_all('#console .cline', 'els => els.length')
    print('tasks done:', tasks, '| console lines:', lines)

    # pause / take control
    pg.click('#pauseBtn')
    time.sleep(1.5)
    print('paused label:', pg.inner_text('#pauseBtn'))
    pg.click('#pauseBtn')

    # the "it sees you" moment: wiggle the pointer a lot
    for i in range(60):
        pg.mouse.move(400 + (i % 17) * 23, 300 + (i % 11) * 19)
        time.sleep(0.02)
    time.sleep(2)
    seen = pg.eval_on_selector_all('#console .cline.verdict p', 'els => els.map(e=>e.textContent)')
    print('seen-you fired:', any('I can see your cursor' in s for s in seen))

    print('desktop errors:', errs if errs else 'none')

    # mobile pass
    m = b.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True)
    merr = []
    m.on('pageerror', lambda e: merr.append(str(e)))
    m.goto(url)
    m.wait_for_selector('#startSilent', timeout=20000)
    m.click('#startSilent')
    time.sleep(18)
    m.screenshot(path=out + 'shot-4-mobile.png')
    print('mobile tasks:', m.inner_text('#stTasks'), '| mobile errors:', merr if merr else 'none')
    b.close()
print('OK')
